# Strategy: No Downloadable Datasheets

## Status: IMPLEMENTED

## Objective

PDF datasheet per product; auto-generated from CMS where possible.

## Implementation Details

- Created `partials/document_downloads.html` — reusable downloads section
- Document icons by type (datasheet, manual, certificate, brochure)
- Download links with `download` attribute for direct file download
- Above-fold "Download Technical Datasheet (PDF)" CTA button on product detail
- Full downloads grid section below specs section
- `data-track-download` attributes for analytics tracking

## Files Created/Modified

- `app/templates/partials/document_downloads.html` — NEW: Download cards grid
- `app/templates/product_detail.html` — Added download CTA + includes document_downloads.html
- `app/static/css/theme.css` — Download card hover styles

## What Was Done

1. Above-fold download button for primary datasheet (if exists)
2. Full downloads section with icon per document type
3. Download tracking via `data-track-download` attribute
4. Works with existing `ProductDocument` model (doc_type, file_url, title)
5. Dark mode support for download cards

## How Documents Are Added

Documents are stored in `product_documents` table via admin CRUD:
- `doc_type`: datasheet | manual | certificate | brochure | cad
- `file_url`: relative path to PDF file
- `title`: display title for the download

## Remaining (Phase 1+ with production)

- Gated downloads (email required) for lead capture
- Auto PDF generation from template (Puppeteer/React-PDF)
- Download count tracking in database
- S3/R2 storage for documents

## Effort

**Low** (uploads) / **Medium** (auto-generate)
