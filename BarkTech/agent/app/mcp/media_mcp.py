"""Media MCP for S3/R2 file operations.

Provides presigned URLs for uploads and public URL generation.
Supports AWS S3 and Cloudflare R2 via boto3.
"""

import os
import logging
import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)

# Configuration from environment
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")  # For R2: https://<account_id>.r2.cloudflarestorage.com
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "")
S3_BUCKET = os.getenv("S3_BUCKET", "bark-media")
S3_REGION = os.getenv("S3_REGION", "auto")
S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL", "")  # e.g. https://media.barktechnologies.in


def _get_s3_client():
    """Create an S3/R2 client."""
    kwargs = {"region_name": S3_REGION}
    if S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = S3_ENDPOINT_URL
    if S3_ACCESS_KEY and S3_SECRET_KEY:
        kwargs["aws_access_key_id"] = S3_ACCESS_KEY
        kwargs["aws_secret_access_key"] = S3_SECRET_KEY
    kwargs["config"] = Config(signature_version="s3v4")

    return boto3.client("s3", **kwargs)


def _build_public_url(key: str) -> str:
    """Build the public URL for a file."""
    if S3_PUBLIC_BASE_URL:
        return f"{S3_PUBLIC_BASE_URL}/{key}"
    if S3_ENDPOINT_URL:
        # R2 public URL pattern
        account_id = S3_ENDPOINT_URL.split("//")[1].split(".")[0]
        return f"https://{S3_BUCKET}.{account_id}.r2.dev/{key}"
    return f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"


async def presign_upload(key: str, content_type: str) -> dict:
    """Generate a presigned upload URL for direct browser uploads.

    Args:
        key: S3 object key (e.g. "products/my-image.png").
        content_type: MIME type of the file (e.g. "image/png").

    Returns:
        dict with keys: success (bool), upload_url (str), public_url (str), key (str), error (str).
    """
    try:
        client = _get_s3_client()
        upload_url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=3600,  # 1 hour
        )
        public_url = _build_public_url(key)
        logger.info(f"Generated presigned upload URL for {key}")
        return {
            "success": True,
            "upload_url": upload_url,
            "public_url": public_url,
            "key": key,
        }
    except Exception as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return {"success": False, "error": str(e)}


async def get_public_url(key: str) -> dict:
    """Get the public URL for a file.

    Args:
        key: S3 object key.

    Returns:
        dict with keys: success (bool), public_url (str), key (str), error (str).
    """
    try:
        # Optionally verify the file exists
        client = _get_s3_client()
        client.head_object(Bucket=S3_BUCKET, Key=key)
        public_url = _build_public_url(key)
        return {
            "success": True,
            "public_url": public_url,
            "key": key,
        }
    except client.exceptions.ClientError as e:
        if e.response["Error"]["Code"] == "404":
            return {"success": False, "error": f"File not found: {key}"}
        logger.error(f"Failed to get public URL: {e}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Failed to get public URL: {e}")
        return {"success": False, "error": str(e)}


async def delete_file(key: str) -> dict:
    """Delete a file from S3/R2.

    Args:
        key: S3 object key to delete.

    Returns:
        dict with keys: success (bool), error (str).
    """
    try:
        client = _get_s3_client()
        client.delete_object(Bucket=S3_BUCKET, Key=key)
        logger.info(f"Deleted file: {key}")
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to delete file: {e}")
        return {"success": False, "error": str(e)}
