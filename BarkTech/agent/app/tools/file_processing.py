"""File processing tools for the admin agent.

Handles images, PDFs, and text files uploaded through chat.
- Images: encoded to base64 for vision model analysis
- PDFs: text extracted using PyPDF2
- Text files: read directly
"""

import base64
import io
import logging
import mimetypes
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Supported file types
SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
SUPPORTED_DOCUMENT_TYPES = {"application/pdf", "text/plain", "text/csv", "text/markdown"}
SUPPORTED_TYPES = SUPPORTED_IMAGE_TYPES | SUPPORTED_DOCUMENT_TYPES

MAX_FILE_SIZE_MB = 20
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def get_mime_type(filename: str) -> str:
    """Get MIME type from filename."""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"


def is_image(mime_type: str) -> bool:
    """Check if the file is an image."""
    return mime_type in SUPPORTED_IMAGE_TYPES


def is_pdf(mime_type: str) -> bool:
    """Check if the file is a PDF."""
    return mime_type == "application/pdf"


def is_text(mime_type: str) -> bool:
    """Check if the file is a text-based file."""
    return mime_type in {"text/plain", "text/csv", "text/markdown"}


def process_image(file_bytes: bytes, filename: str) -> dict:
    """Process an image file for vision model analysis.

    Returns:
        dict with 'type': 'image', 'base64': str, 'mime_type': str, 'filename': str
    """
    mime_type = get_mime_type(filename)
    if mime_type not in SUPPORTED_IMAGE_TYPES:
        return {"error": f"Unsupported image type: {mime_type}. Supported: {', '.join(SUPPORTED_IMAGE_TYPES)}"}

    b64_data = base64.b64encode(file_bytes).decode("utf-8")
    return {
        "type": "image",
        "base64": b64_data,
        "mime_type": mime_type,
        "filename": filename,
        "size_bytes": len(file_bytes),
    }


def process_pdf(file_bytes: bytes, filename: str) -> dict:
    """Extract text from a PDF file.

    Returns:
        dict with 'type': 'document', 'text': str, 'filename': str, 'page_count': int
    """
    try:
        from PyPDF2 import PdfReader

        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        page_count = len(pdf_reader.pages)

        text_parts = []
        for i, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"--- Page {i + 1} ---\n{page_text}")

        full_text = "\n\n".join(text_parts)

        if not full_text.strip():
            return {
                "type": "document",
                "text": f"[PDF with {page_count} pages but no extractable text - may be scanned/image-based]",
                "filename": filename,
                "page_count": page_count,
                "warning": "No text could be extracted. The PDF may contain only images.",
            }

        return {
            "type": "document",
            "text": full_text,
            "filename": filename,
            "page_count": page_count,
            "size_bytes": len(file_bytes),
        }
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        return {"error": f"Failed to process PDF: {str(e)}"}


def process_text_file(file_bytes: bytes, filename: str) -> dict:
    """Read a text file.

    Returns:
        dict with 'type': 'document', 'text': str, 'filename': str
    """
    try:
        text = file_bytes.decode("utf-8")
        return {
            "type": "document",
            "text": text,
            "filename": filename,
            "size_bytes": len(file_bytes),
        }
    except UnicodeDecodeError:
        return {"error": f"Could not decode {filename} as UTF-8 text"}


def process_uploaded_file(file_bytes: bytes, filename: str) -> dict:
    """Process an uploaded file based on its type.

    Args:
        file_bytes: Raw file content
        filename: Original filename with extension

    Returns:
        dict with processed file data ready for the agent
    """
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return {"error": f"File too large ({len(file_bytes) / 1024 / 1024:.1f}MB). Maximum is {MAX_FILE_SIZE_MB}MB."}

    mime_type = get_mime_type(filename)

    if mime_type in SUPPORTED_IMAGE_TYPES:
        return process_image(file_bytes, filename)
    elif is_pdf(mime_type):
        return process_pdf(file_bytes, filename)
    elif is_text(mime_type):
        return process_text_file(file_bytes, filename)
    else:
        return {"error": f"Unsupported file type: {mime_type}. Supported: images (JPEG, PNG, GIF, WebP), PDF, TXT, CSV, Markdown."}


def format_file_context(files: list[dict]) -> str:
    """Format processed files into context text for the agent prompt.

    Args:
        files: List of processed file dicts from process_uploaded_file

    Returns:
        Formatted string to include in the agent's context
    """
    if not files:
        return ""

    parts = ["\n\n--- Attached Files ---"]
    for f in files:
        if "error" in f:
            parts.append(f"[Error processing {f.get('filename', 'unknown')}: {f['error']}]")
            continue

        if f["type"] == "image":
            parts.append(f"[Image: {f['filename']} ({f['mime_type']}, {f['size_bytes'] / 1024:.0f}KB) - analyze this image]")
        elif f["type"] == "document":
            text_preview = f["text"][:3000] if len(f["text"]) > 3000 else f["text"]
            parts.append(f"[Document: {f['filename']} - {f.get('page_count', 'N/A')} pages]\n{text_preview}")
            if len(f["text"]) > 3000:
                parts.append(f"[... truncated, showing 3000 of {len(f['text'])} chars]")

    return "\n".join(parts)


def build_multimodal_content(text: str, files: list[dict]) -> list | str:
    """Build multimodal message content for the LLM.

    For vision-capable models, images are sent as base64 data URLs.
    Document text is appended to the message text.

    Args:
        text: User's text message
        files: List of processed file dicts

    Returns:
        Either a plain string (no images) or a list of content parts (with images)
    """
    if not files:
        return text

    has_images = any(f.get("type") == "image" and "base64" in f for f in files)
    doc_text_parts = []

    for f in files:
        if "error" in f:
            continue
        if f["type"] == "document":
            text_preview = f["text"][:5000] if len(f["text"]) > 5000 else f["text"]
            doc_text_parts.append(f"[Document: {f['filename']}]\n{text_preview}")

    full_text = text
    if doc_text_parts:
        full_text = text + "\n\n" + "\n\n".join(doc_text_parts)

    if not has_images:
        return full_text

    # Build multimodal content with images
    content_parts = [{"type": "text", "text": full_text}]

    for f in files:
        if f.get("type") == "image" and "base64" in f:
            content_parts.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{f['mime_type']};base64,{f['base64']}",
                },
            })

    return content_parts
