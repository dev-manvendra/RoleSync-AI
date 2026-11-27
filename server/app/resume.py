import io
import re

from fastapi import HTTPException

from .config import settings


def extract_text(filename: str | None, data: bytes) -> str:
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"That file is over {settings.max_upload_mb} MB. Paste the text instead.")
    name = (filename or "").lower()
    try:
        if name.endswith(".pdf"):
            from pypdf import PdfReader
            text = "\n".join((p.extract_text() or "") for p in PdfReader(io.BytesIO(data)).pages[:10])
        elif name.endswith(".docx"):
            from docx import Document
            text = "\n".join(p.text for p in Document(io.BytesIO(data)).paragraphs)
        elif name.endswith((".txt", ".md")):
            text = data.decode("utf-8", "ignore")
        else:
            raise HTTPException(415, "Upload a PDF, DOCX, TXT or MD file, or paste the text.")
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise HTTPException(422, "We couldn't open that file. Paste the text instead.") from e

    text = re.sub(r"[ \t]+", " ", text).strip()
    if len(text) < 50:
        raise HTTPException(422, "We couldn't read any text from that file. If it's a scanned PDF, paste the text instead.")
    return text[: settings.max_resume_chars]
