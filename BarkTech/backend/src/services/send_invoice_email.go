package email

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"mime"
	"net"
	"net/smtp"
	"os"
)

// ──────────────────────────────────────────────────────────────
// InvoiceData is the single source of truth for both the PDF
// generator and the email HTML template. Populate it once from
// your database/API response and pass it to both functions.
// ──────────────────────────────────────────────────────────────

type ItemRow struct {
	SNo        int     `json:"sno"`
	Description string `json:"description"`
	HSNCode    string  `json:"hsn_code"`
	Qty        float64 `json:"qty"`
	Unit       string  `json:"unit"`
	Rate       string  `json:"rate"`
	GSTPercent float64 `json:"gst_percent"`
	Amount     string  `json:"amount"`
}

type Term struct {
	Number int    `json:"number"`
	Text   string `json:"text"`
}

type BankDetails struct {
	AccountName string `json:"account_name"`
	AccountNo   string `json:"account_no"`
	IFSC        string `json:"ifsc"`
	BankName    string `json:"bank_name"`
}

type InvoiceData struct {
	// Company
	CompanyName    string `json:"company_name"`
	CompanyAddress string `json:"company_address"`
	CompanyGSTIN   string `json:"company_gstin"`
	CompanyLogoURL string `json:"company_logo_url"`

	// Invoice meta
	InvoiceNo     string `json:"invoice_no"`
	InvoiceDate   string `json:"invoice_date"`
	DueDate       string `json:"due_date"`
	PlaceOfSupply string `json:"place_of_supply"`
	StateCode     string `json:"state_code"`

	// Buyer
	BuyerName    string `json:"buyer_name"`
	BuyerAddress string `json:"buyer_address"`
	BuyerGSTIN   string `json:"buyer_gstin"`

	// Ship-to
	ShipToName    string `json:"ship_to_name"`
	ShipToAddress string `json:"ship_to_address"`

	// Items
	Items []ItemRow `json:"items"`

	// Totals (already formatted as ₹1,23,456.00)
	Subtotal      string `json:"subtotal"`
	CGST          string `json:"cgst"`
	SGST          string `json:"sgst"`
	IGST          string `json:"igst"`
	RoundOff      string `json:"round_off"`
	GrandTotal    string `json:"grand_total"`
	AmountInWords string `json:"amount_in_words"`

	// Bank
	Bank BankDetails `json:"bank"`

	// Terms
	Terms []Term `json:"terms"`

	// Signature
	AuthorizedSignatory string `json:"authorized_signatory"`
	CompanySealNote     string `json:"company_seal_note"`

	// Email-specific
	PDFDownloadURL string `json:"pdf_download_url"`
	BuyerEmail     string `json:"buyer_email"`

	// Support
	SupportEmail string `json:"support_email"`
	SupportPhone string `json:"support_phone"`
}

// SmtpConfig holds SMTP server credentials.
type SmtpConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
}

// RenderInvoiceEmail fills the HTML template with invoice data.
func RenderInvoiceEmail(data InvoiceData, templatePath string) (string, error) {
	tmplBytes, err := os.ReadFile(templatePath)
	if err != nil {
		return "", fmt.Errorf("read template: %w", err)
	}
	tmplStr := convertHandlebarsToGo(string(tmplBytes))

	type termData struct{ Number int; Text string }
	type itemData struct {
		SNo int; Description string; HSNCode string;
		Qty float64; Unit string; Rate string;
		GSTPercent float64; Amount string
	}

	tmplData := map[string]interface{}{
		"CompanyName":    data.CompanyName,
		"CompanyAddress": data.CompanyAddress,
		"CompanyGSTIN":   data.CompanyGSTIN,
		"CompanyLogoURL": data.CompanyLogoURL,
		"InvoiceNo":      data.InvoiceNo,
		"InvoiceDate":    data.InvoiceDate,
		"DueDate":        data.DueDate,
		"PlaceOfSupply":  data.PlaceOfSupply,
		"StateCode":      data.StateCode,
		"BuyerName":      data.BuyerName,
		"BuyerAddress":   data.BuyerAddress,
		"BuyerGSTIN":     data.BuyerGSTIN,
		"ShipToName":     data.ShipToName,
		"ShipToAddress":  data.ShipToAddress,
		"Subtotal":       data.Subtotal,
		"CGST":           data.CGST,
		"SGST":           data.SGST,
		"IGST":           data.IGST,
		"RoundOff":       data.RoundOff,
		"GrandTotal":     data.GrandTotal,
		"AmountInWords":  data.AmountInWords,
		"BankAccountName": data.Bank.AccountName,
		"BankAccountNo":  data.Bank.AccountNo,
		"BankIFSC":       data.Bank.IFSC,
		"BankName":       data.Bank.BankName,
		"AuthorizedSignatory": data.AuthorizedSignatory,
		"CompanySealNote":     data.CompanySealNote,
		"PDFDownloadURL": data.PDFDownloadURL,
		"SupportEmail":   data.SupportEmail,
		"SupportPhone":   data.SupportPhone,
		"Items":          data.Items,
		"Terms":          data.Terms,
	}

	// Simple template substitution (Handlebars-style {{variable}})
	result := tmplStr
	for k, v := range tmplData {
		switch val := v.(type) {
		case string:
			result = replaceAll(result, "{{"+k+"}}", val)
		}
	}

	// Handle conditional blocks: {{#if CGST}}...{{/if}}
	result = processConditionals(result, tmplData)

	// Handle {{#each Items}}...{{/each}}
	result = processItemLoop(result, data.Items)
	result = processTermLoop(result, data.Terms)

	return result, nil
}

func replaceAll(s, old, new string) string {
	for {
		idx := indexOf(s, old)
		if idx == -1 {
			return s
		}
		s = s[:idx] + new + s[idx+len(old):]
	}
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}

func processConditionals(s string, data map[string]interface{}) {
	// Handle {{#if CGST}}...{{/if}} pattern
	for key := range data {
		startTag := "{{#if " + key + "}}"
		endTag := "{{/if}}"
		startIdx := indexOf(s, startTag)
		if startIdx == -1 {
			continue
		}
		endIdx := indexOf(s[startIdx+len(startTag):], endTag)
		if endIdx == -1 {
			continue
		}
		endIdx += startIdx + len(startTag)
		content := s[startIdx+len(startTag) : endIdx]

		val := data[key]
		shouldShow := false
		switch v := val.(type) {
		case string:
			shouldShow = v != ""
		case float64:
			shouldShow = v != 0
		}

		if shouldShow {
			s = s[:startIdx] + content + s[endIdx+len(endTag):]
		} else {
			s = s[:startIdx] + s[endIdx+len(endTag):]
		}
	}
	return s
}

func processItemLoop(s string, items []ItemRow) string {
	startTag := "{{#each item_rows}}"
	endTag := "{{/each}}"
	startIdx := indexOf(s, startTag)
	if startIdx == -1 {
		return s
	}
	endIdx := indexOf(s[startIdx+len(startTag):], endTag)
	if endIdx == -1 {
		return s
	}
	endIdx += startIdx + len(startTag)
	body := s[startIdx+len(startTag) : endIdx]

	var result string
	for i, item := range items {
		row := body
		row = replaceAll(row, "{{this.sno}}", fmt.Sprintf("%d", item.SNo))
		row = replaceAll(row, "{{this.description}}", item.Description)
		row = replaceAll(row, "{{this.hsn_code}}", item.HSNCode)
		row = replaceAll(row, "{{this.qty}}", fmt.Sprintf("%.0f", item.Qty))
		row = replaceAll(row, "{{this.unit}}", item.Unit)
		row = replaceAll(row, "{{this.rate}}", item.Rate)
		row = replaceAll(row, "{{this.gst_percent}}", fmt.Sprintf("%.0f", item.GSTPercent))
		row = replaceAll(row, "{{this.amount}}", item.Amount)
		// Zebra striping
		if i%2 == 0 {
			row = replaceAll(row, "{{#if @odd}}#fafafa{{else}}#ffffff{{/if}}", "#ffffff")
		} else {
			row = replaceAll(row, "{{#if @odd}}#fafafa{{else}}#ffffff{{/if}}", "#fafafa")
		}
		result += row
	}

	return s[:startIdx] + result + s[endIdx+len(endTag):]
}

func processTermLoop(s string, terms []Term) string {
	startTag := "{{#each terms}}"
	endTag := "{{/each}}"
	startIdx := indexOf(s, startTag)
	if startIdx == -1 {
		return s
	}
	endIdx := indexOf(s[startIdx+len(startTag):], endTag)
	if endIdx == -1 {
		return s
	}
	endIdx += startIdx + len(startTag)
	body := s[startIdx+len(startTag) : endIdx]

	var result string
	for _, term := range terms {
		row := body
		row = replaceAll(row, "{{this.number}}", fmt.Sprintf("%d", term.Number))
		row = replaceAll(row, "{{this.text}}", term.Text)
		result += row
	}

	return s[:startIdx] + result + s[endIdx+len(endTag):]
}

func convertHandlebarsToGo(s string) string {
	// Just keep Handlebars syntax — we do manual substitution above
	return s
}

// ──────────────────────────────────────────────────────────────
// SendInvoiceEmail sends the invoice email with PDF attached
// via SMTP (Brevo or any SMTP relay).
// ──────────────────────────────────────────────────────────────

func SendInvoiceEmail(cfg SmtpConfig, data InvoiceData, pdfReader io.Reader, pdfFileName string) error {
	// 1. Render HTML template
	htmlBody, err := RenderInvoiceEmail(data, "app/mcp/templates/invoice_email.html")
	if err != nil {
		return fmt.Errorf("render email template: %w", err)
	}

	// 2. Read PDF bytes
	pdfBytes, err := io.ReadAll(pdfReader)
	if err != nil {
		return fmt.Errorf("read PDF: %w", err)
	}

	const maxAttachSize = 25 * 1024 * 1024
	if len(pdfBytes) > maxAttachSize {
		return fmt.Errorf("PDF too large: %d bytes (max %d)", len(pdfBytes), maxAttachSize)
	}

	// 3. Build MIME multipart message
	var msg bytes.Buffer
	boundary := "==BOUNDARY_BARK_INVOICE=="

	msg.WriteString(fmt.Sprintf("From: %s <%s>\r\n", mime.QEncoding.Encode("utf-8", data.FromName), cfg.From))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", data.BuyerEmail))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", mime.QEncoding.Encode("utf-8", fmt.Sprintf("Tax Invoice %s — %s", data.InvoiceNo, data.CompanyName))))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=\"%s\"\r\n", boundary))
	msg.WriteString("\r\n")

	// HTML body
	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)
	msg.WriteString("\r\n")

	// PDF attachment
	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: application/pdf\r\n")
	msg.WriteString(fmt.Sprintf("Content-Disposition: attachment; filename=\"%s\"\r\n", pdfFileName))
	msg.WriteString("Content-Transfer-Encoding: base64\r\n")
	msg.WriteString("\r\n")

	// Base64 encode in 76-char lines
	b64 := base64EncodeBytes(pdfBytes)
	for i := 0; i < len(b64); i += 76 {
		end := i + 76
		if end > len(b64) {
			end = len(b64)
		}
		msg.Write(b64[i:end])
		msg.WriteString("\r\n")
	}

	msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary))

	// 4. Send via SMTP with STARTTLS
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)

	conn, err := net.DialTimeout("tcp", addr, 30e9)
	if err != nil {
		return fmt.Errorf("dial SMTP: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, cfg.Host)
	if err != nil {
		return fmt.Errorf("create SMTP client: %w", err)
	}
	defer client.Close()

	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{ServerName: cfg.Host}); err != nil {
			return fmt.Errorf("STARTTLS: %w", err)
		}
	}

	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP auth: %w", err)
	}
	if err := client.Mail(cfg.From); err != nil {
		return fmt.Errorf("MAIL FROM: %w", err)
	}
	if err := client.Rcpt(data.BuyerEmail); err != nil {
		return fmt.Errorf("RCPT TO: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("DATA: %w", err)
	}
	if _, err := w.Write(msg.Bytes()); err != nil {
		return fmt.Errorf("write: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("close: %w", err)
	}
	client.Quit()

	log.Printf("Invoice email sent: %s -> %s (PDF: %s, %d bytes)",
		data.InvoiceNo, data.BuyerEmail, pdfFileName, len(pdfBytes))
	return nil
}

func base64EncodeBytes(src []byte) []byte {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
	dst := make([]byte, ((len(src)+2)/3)*4)
	for i := 0; i < len(src); i += 3 {
		var b0, b1, b2 byte
		b0 = src[i]
		if i+1 < len(src) {
			b1 = src[i+1]
		}
		if i+2 < len(src) {
			b2 = src[i+2]
		}
		j := (int(b0) << 16) | (int(b1) << 8) | int(b2)
		dst[(i/3)*4] = chars[(j>>18)&0x3F]
		dst[(i/3)*4+1] = chars[(j>>12)&0x3F]
		if i+1 < len(src) {
			dst[(i/3)*4+2] = chars[(j>>6)&0x3F]
		} else {
			dst[(i/3)*4+2] = '='
		}
		if i+2 < len(src) {
			dst[(i/3)*4+3] = chars[j&0x3F]
		} else {
			dst[(i/3)*4+3] = '='
		}
	}
	return dst
}

func getEnvOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// Usage example:
//
//   cfg := SmtpConfig{
//       Host:     getEnvOrDefault("SMTP_HOST", "smtp-relay.brevo.com"),
//       Port:     587,
//       Username: getEnvOrDefault("SMTP_USER", ""),
//       Password: getEnvOrDefault("SMTP_PASS", ""),
//       From:     getEnvOrDefault("EMAIL_FROM", "invoices@barktechnologies.in"),
//       FromName: getEnvOrDefault("EMAIL_FROM_NAME", "Bark Technology"),
//   }
//   f, _ := os.Open("/path/to/generated.pdf")
//   defer f.Close()
//   err := SendInvoiceEmail(cfg, invoiceData, f, "Invoice_BARK-2026-001.pdf")
