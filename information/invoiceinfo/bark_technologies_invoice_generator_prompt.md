# Prompt: Build a "Bark Technologies" Tax Invoice Generator (Exact Format Replica)

Copy everything below the line into your AI coding tool (Claude Code, Cursor, v0, etc.) as the build instruction.

---

## GOAL

Build a single-page web app with two views:

1. **Form View** – a data-entry form to capture all invoice details.
2. **Invoice View** – renders the entered data into an **exact pixel-for-pixel replica** of the "BARK TECHNOLOGIES" tax invoice format shown in the reference PDF, and can be **exported/printed as a PDF** that matches the original layout precisely (same as printing the source PDF).

Use plain **HTML + CSS** (with vanilla JS or React, whichever the target stack prefers) so that the invoice view can be sent straight to the browser's print dialog ("Save as PDF") and come out identical to the reference document. Do not use any UI framework that alters spacing/borders unpredictably (no default Bootstrap tables) — hand-roll the table borders to match.

---

## 1. REFERENCE FORMAT — EXACT STRUCTURE (top to bottom)

### A. Header
- Centered company logo: a diamond/hexagon-shaped 3D cube icon (colors: navy blue, maroon/dark red, and tan/gold facets) positioned to the left of the wordmark.
- Wordmark text next to logo, two lines:
  - **"BARK TECHNOLOGIES"** — bold, large, dark navy/black serif or bold sans.
  - **"Machinery & Packaging Solutions"** — smaller, italic or regular weight, maroon/red color, directly under the company name.
- Below the logo block, centered: **"TAX INVOICE: {invoice_number}"** in bold, larger serif font (e.g., Times New Roman bold, ~16–18px), all caps.
  - On the blank template this reads just **"TAX INVOICE:"** with nothing after the colon until filled.

### B. Top Info Block (2-column table, no outer margin, full width, thin black borders on all cells)

**Left column (top cell): "BILL TO,"**
- Label bold underlined: `BILLTO,`
- Then bold underlined company name of the buyer (e.g., `SKYLINE PRINTPACK`)
- Then plain-text multi-line address (street/plot/survey number, area, city, district, state, PIN, country)
- `GSTIN:` + buyer's GST number
- `CONTACT N0.` + phone number
- `REF BY & ATTEND BY:` + reference person name

**Left column (bottom cell): "SHIP TO,"**
- Label bold: `SHIP TO,`
- Sub-label bold underlined: `FACTORY ADDRESS` followed by plain address text (can repeat bill-to address or be different)

**Right column (top cell): "FROM,"**
- Bold: `FROM,`
- Bold: `BARK TECHNOLOGIES` (seller name — fixed/hardcoded, not a form field, since seller never changes)
- `ADD:` seller address — fixed: `S .F-03 SHUSHANTAQUAPOLIS, GHAZIABAD U.P. 201009`
- `GST:` fixed: `09AAWFB1759R1ZC`
- `CONTACTNUMBER :` fixed: `07042245270/8810597980`
- `EMAIL:` fixed: `sales1barktechnologies@gmail.com`

**Right column (bottom cell): "DETAILS / MODE"**
- Bold underlined header: `DETAILS / MODE`
- `TAX INVOICE NUMBER:` + value
- `DATE OF INVOICE:` + value (format: `23rd June 2026` style — day with ordinal suffix, full month name, year)
- `MODE OF DELIVERY :` + value (e.g., `BY TRANSPORT`)
- `DISPATCH FROM :` + value (e.g., `MORBI`)
- (On blank template, an extra highlighted yellow-background red-bold word **`TRANSPORT:`** appears as a placeholder label — replicate as an optional highlighted note row, default empty.)

### C. Line-Items Table (full width, black borders on every cell)
Header row — **red/maroon background, white bold text**, columns:
| S.NO | DESCRIPTION | HSN CODE | RATE/PC | QTY | AMOUNT IN INR |

- S.NO centered, numeric, auto-incrementing (1, 2, 3…)
- DESCRIPTION left-aligned, wraps to multiple lines if long (e.g., "SJG 900W SERVO FILM WRAPPING MACHINE")
- HSN CODE centered numeric (e.g., `84224000`)
- RATE/PC right-aligned, Indian number format with 2 decimals (e.g., `3,15,000.00`)
- QTY centered integer
- AMOUNT IN INR right-aligned, Indian number format with 2 decimals, auto-calculated = RATE/PC × QTY

- Include several empty rows after the filled item rows (matches the padded blank-row look of the original — at least 3 blank rows minimum, or dynamically add via an "Add Item" button in the form).

**Totals block** (still inside the same table, right-aligned label + value cells spanning the right two columns):
- `TOTAL BEFORE TAX` — bold label, value = sum of all item amounts, right-aligned, Indian format
- `GSTIN 18%` — label bold, value = 18% of TOTAL BEFORE TAX, right-aligned
- `FACTORY DELIVERY` (used on filled invoice) OR `TRANSPORT TO PAY BASIS` (used on blank template) — label bold; middle cell shows `R/O` (fixed literal text, meaning "Rest Of / Freight to Pay"); make this an editable toggle/text field in the form
- `Grand Total` — bold label, value = TOTAL BEFORE TAX + GST, right-aligned, bold, larger font

### D. Amount-in-Words Banner
- Full-width horizontal bar, **solid red/maroon background**, white bold centered text, all caps.
- Content: amount spelled out in words followed by `ONLY` — e.g., `THREE LAKH SEVENTY ONE THOUSAND SEVEN HUNDRED RUPPEES ONLY` (note: original has the typo "RUPPEES" — decide whether to keep typo-faithful or correct to "RUPEES"; default to correct spelling "RUPEES" unless user wants literal replica including the typo).
- This must be **auto-generated from the Grand Total number** using an Indian numbering system (Lakh/Crore) number-to-words function — do not make it a manual text field, compute it.

### E. Bank / Signature Block (2-column table, no borders between the two big halves, but bordered rows inside the left table)

**Left column** — bordered key-value table, all fixed/hardcoded seller bank details:
| Field | Value |
|---|---|
| Beneficiary Name | BARK TECHNOLOGIES |
| Beneficiary Address | SF-03,LOCAL SHOPPING COMPLEX ,SHUSHANT AQUAPOLIS,GHAZIABAD UTTAR PRADESH 201009 |
| GST | 09AAWFB1759R1ZC |
| EMAILID | SALES1BARKTECHNOLOGIES@GMAIL.COM (as a mailto link, blue underlined) |
| Contact No. | 9893724078/8810597980 (as tel link, blue underlined) |
| Beneficiary Bank | ICICI BANK LTD |
| Bank Address | NOIDA132 |
| A/c No: | 157905003103 |
| Swift Code: | (blank cell) |
| IFSC Code:- | ICIC0001579 |

**Right column** (no border, right-aligned/centered text, blue bold font for some lines):
- `For an on Behalf of` **BARKTECHNOLOGIES** (bold, blue)
- Signature image placeholder (cursive signature graphic — leave as an `<img>` placeholder the user can optionally upload, or omit if not available)
- `For.` **BARK TECHNOLOGIES** (bold, blue, stylized)
- `Thanks & Regards` (bold, blue, centered, below signature)

### F. Footer
- Centered, small italic/plain text:
  `Note: This is computer generated tax invoice if needed original copy please inform to send`
- Page number line: `1 of 1`

---

## 2. FORM VIEW — FIELDS TO CAPTURE

Group the form to mirror the sections above:

**Invoice Meta**
- Invoice Number (auto-suggest pattern `BARK{FY}S{seq}` e.g. `BARK26-27S120`, but keep editable)
- Invoice Date (date picker, auto-format to "23rd June 2026" style on render)
- Mode of Delivery (text, default "BY TRANSPORT")
- Dispatch From (text, default "MORBI")

**Bill To**
- Company Name
- Address (multi-line textarea)
- GSTIN
- Contact Number
- Ref By & Attend By

**Ship To**
- Same as Bill To checkbox (auto-copies Bill To address)
- Factory Address (multi-line textarea)

**Line Items** (repeatable rows, "+ Add Item" / remove row buttons)
- Description
- HSN Code
- Rate/Pc (number)
- Qty (number)
- Amount (auto-calculated, read-only)

**Charges**
- GST % (default 18, editable in case rate changes)
- Delivery term label — dropdown: "FACTORY DELIVERY" / "TRANSPORT TO PAY BASIS" / custom text
- Delivery value — default text `R/O`, editable

**Buttons**
- "Create Invoice" → switches to Invoice View with entered data populated
- On Invoice View: "Download PDF" and "Print" and "Back to Edit" buttons (hidden during print via `@media print { .no-print { display: none; } }`)

---

## 3. CALCULATIONS (must be automatic, not manual entry)

```
amount_per_row   = rate_per_pc * qty
total_before_tax = sum(amount_per_row for all rows)
gst_amount       = total_before_tax * (gst_percent / 100)
grand_total      = total_before_tax + gst_amount
amount_in_words  = indianNumberToWords(grand_total) + " RUPEES ONLY"
```

All currency values must render in the **Indian digit grouping** format (e.g., `3,15,000.00`, not `315,000.00`). Write a small `formatINR(number)` helper — do not rely on a locale library unless `toLocaleString('en-IN')` is available in the target runtime (it is, in modern browsers/Node — use it).

---

## 4. HTML/CSS IMPLEMENTATION NOTES

- Wrap the whole invoice in a fixed-width container sized for **A4 print** (`width: 210mm; min-height: 297mm; margin: auto; padding: 10mm;` at `96dpi ≈ 794px x 1123px` for screen preview).
- Use `<table>` elements with `border-collapse: collapse;` and `border: 1px solid #000;` on `td`/`th` for every bordered block — do not fake borders with divs, since inconsistent div-borders are what usually breaks "exact replica" attempts.
- Font: use `"Times New Roman", Times, serif` throughout to match the original's typewriter/formal look; bold headers via `font-weight: 700`.
- Colors to define as CSS variables:
  ```css
  :root {
    --brand-navy: #1b2a5e;
    --brand-maroon: #8b1a1a;
    --brand-gold: #c9a15a;
    --table-header-red: #c0392b;
    --band-red: #b30000;
    --link-blue: #1155cc;
  }
  ```
- Table header row (`S.NO / DESCRIPTION / ...`) → `background: var(--table-header-red); color: #fff; font-weight: bold;`
- Amount-in-words banner → full-width `div`/`tr` with `background: var(--band-red); color: #fff; font-weight: bold; text-align: center; padding: 10px; font-size: 15px;`
- Add a **print stylesheet**:
  ```css
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
    .invoice-page { box-shadow: none; margin: 0; width: 210mm; min-height: 297mm; }
    @page { size: A4; margin: 10mm; }
  }
  ```
- For "Download PDF" without relying on the OS print dialog, use a client-side library like `html2pdf.js` or `jsPDF + html2canvas`, rendering the exact same `.invoice-page` DOM node so screen preview and PDF output match 1:1.

---

## 5. LOGO / IMAGE HANDLING (important — read carefully)

Both the logo and the cursive signature have already been extracted from the source PDF and are provided alongside this prompt as separate files:

- `bark_technologies_logo.png` — transparent-background PNG of the diamond/cube icon + "BARK TECHNOLOGIES / Machinery & Packaging Solutions" wordmark, extracted directly from the embedded image in the source PDF.
- `bark_technologies_signature.png` — transparent-background PNG of the cursive authorized-signatory signature, cropped from a high-resolution render of the source PDF page (the signature was drawn as vector/text content in the original, not a separate embedded image, so it was captured via page rasterization + crop instead).
- `bark_technologies_logo_original.jpg` / `bark_technologies_signature_original.jpg` — the raw, non-transparent versions of the above, kept as a fallback in case the transparency masking clips any strokes.

Place both PNGs in the project's `assets/` folder and reference them directly:
```html
<img src="assets/bark_technologies_logo.png" alt="Bark Technologies" class="logo" />
...
<img src="assets/bark_technologies_signature.png" alt="Authorized Signatory" class="signature" />
```
Do **not** attempt to recreate either graphic with CSS shapes, gradients, or a script font — use these extracted image files so the replica is pixel-accurate. If either PNG looks over-clipped by the transparency mask when tested, fall back to the `_original.jpg` version instead (opaque white background, still visually identical to the source).

---

## 6. ACCEPTANCE CRITERIA

- [ ] Filling the form and clicking "Create Invoice" renders a view that matches the reference invoice's layout, spacing, borders, colors, and field order exactly.
- [ ] All monetary values are calculated automatically and shown in Indian number format.
- [ ] Amount-in-words banner is auto-generated from Grand Total.
- [ ] Seller (FROM + bank details) fields are hardcoded/fixed since they don't change per invoice.
- [ ] Clicking "Download PDF" produces an A4 PDF visually identical to the on-screen invoice view (no cut-off tables, no reflowed columns).
- [ ] The empty/blank state of the invoice view (before any data is entered) matches the second reference file ("format_tax_invoice.pdf") exactly — same placeholders, same `TRANSPORT:` yellow-highlight note, same `+ ()` on Grand Total when total is zero.
- [ ] Logo and signature images are pulled from real extracted assets, not recreated approximations.

---

*End of prompt.*
