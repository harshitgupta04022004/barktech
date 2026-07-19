"""Input and output guardrails for agent safety.

Per architecture spec:
- Input guardrails: prompt injection detection, PII detection, rate limiting
- Output guardrails: content filtering, data leakage prevention, format validation
"""

import re
import logging

logger = logging.getLogger(__name__)

# ── PII patterns ────────────────────────────────────
PII_PATTERNS = {
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "phone": r'\b\d{10}\b',
    "aadhar": r'\b\d{4}\s?\d{4}\s?\d{4}\b',
    "credit_card": r'\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b',
}

# ── Prompt injection patterns ───────────────────────
INJECTION_PATTERNS = [
    r'ignore (?:all |previous |above )?(?:instructions|prompts)',
    r'you are now',
    r'pretend (?:you|to) (?:are|be)',
    r'(?:system|admin) prompt',
    r'ignore (?:all |previous )?(?:rules|guidelines)',
    r'bypass',
    r'override',
]


def check_input(message: str) -> dict:
    """Check input message for safety issues.

    Returns:
        dict with 'safe' bool, 'warnings' list, 'blocked' bool
    """
    warnings = []
    blocked = False

    # Check for prompt injection
    msg_lower = message.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, msg_lower):
            warnings.append(f"Potential prompt injection detected: '{pattern}'")
            # Don't block, but flag for monitoring
            break

    # Check for PII exposure
    pii_found = []
    for pii_type, pattern in PII_PATTERNS.items():
        if re.search(pattern, message):
            pii_found.append(pii_type)

    if pii_found:
        warnings.append(f"Potential PII detected: {', '.join(pii_found)}")

    # Check for excessive length
    if len(message) > 10000:
        warnings.append("Message exceeds maximum length (10000 chars)")
        blocked = True

    # Check for empty message
    if not message.strip():
        warnings.append("Empty message")
        blocked = True

    return {
        "safe": not blocked,
        "warnings": warnings,
        "blocked": blocked,
    }


def check_output(response: str) -> dict:
    """Check agent output for safety issues.

    Returns:
        dict with 'safe' bool, 'warnings' list, 'filtered' str
    """
    warnings = []

    # Check for sensitive data leakage
    sensitive_patterns = [
        (r'password[:\s]+\S+', "Potential password in response"),
        (r'api[_-]?key[:\s]+\S+', "Potential API key in response"),
        (r'secret[:\s]+\S+', "Potential secret in response"),
    ]

    filtered = response
    for pattern, warning in sensitive_patterns:
        if re.search(pattern, response, re.IGNORECASE):
            warnings.append(warning)
            # Filter out the sensitive content
            filtered = re.sub(pattern, '[REDACTED]', filtered, flags=re.IGNORECASE)

    # Check for excessive length
    if len(response) > 50000:
        warnings.append("Response exceeds maximum length")
        filtered = filtered[:50000] + "\n\n[Response truncated]"

    return {
        "safe": True,  # Don't block, just warn and filter
        "warnings": warnings,
        "filtered": filtered,
    }


def validate_tool_input(tool_name: str, tool_input: dict) -> dict:
    """Validate tool-specific inputs.

    Returns:
        dict with 'valid' bool and 'errors' list
    """
    errors = []

    # Product tools validation
    if tool_name in ("search_products", "get_product_specs"):
        if "query" in tool_input and len(str(tool_input["query"])) > 500:
            errors.append("Search query too long (max 500 chars)")

    # Invoice tools validation
    if tool_name == "create_invoice":
        if "items" in tool_input:
            items = tool_input["items"]
            if isinstance(items, list) and len(items) > 50:
                errors.append("Too many invoice items (max 50)")

    # Lead tools validation
    if tool_name == "update_lead_status":
        valid_statuses = ["new", "contacted", "qualified", "quoted", "won", "lost", "spam"]
        if "status" in tool_input and tool_input["status"] not in valid_statuses:
            errors.append(f"Invalid status. Valid: {', '.join(valid_statuses)}")

    return {"valid": len(errors) == 0, "errors": errors}
