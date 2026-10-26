import os
import re
import json
import datetime
from typing import Dict, Any, Tuple
import pymupdf as fitz

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def extract_text_and_metadata_from_pdf(file_path: str) -> Tuple[str, Dict[str, Any]]:
    """Extracts raw text and PDF metadata using PyMuPDF."""
    text_content = []
    metadata = {}
    try:
        doc = fitz.open(file_path)
        metadata = {
            "page_count": len(doc),
            "format": doc.metadata.get("format", ""),
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "creator": doc.metadata.get("creator", ""),
            "producer": doc.metadata.get("producer", ""),
            "creation_date": doc.metadata.get("creationDate", ""),
            "mod_date": doc.metadata.get("modDate", "")
        }
        for page_num in range(len(doc)):
            page = doc[page_num]
            text_content.append(page.get_text())
        doc.close()
    except Exception as e:
        print(f"Error parsing PDF with PyMuPDF: {e}")
        text_content = [f"Text extraction failed: {str(e)}"]

    full_text = "\n".join(text_content)
    return full_text, metadata

def rule_based_extract_fields(text: str, doc_type: str) -> Dict[str, Any]:
    """Rule-based regex extractor for Indian technical education & legal documents."""
    fields: Dict[str, Any] = {}

    # 1. Institution Name extraction
    inst_match = re.search(r"Institution\s*Name\s*:\s*([^\n\r,]+)", text, re.IGNORECASE)
    if not inst_match:
        inst_match = re.search(r"(Apex\s+Institute\s+of\s+Technology|Bharat\s+Polytechnic|[A-Z][A-Za-z0-9\s]{4,40}(?:Institute|College|Academy|University)\s*(?:of\s+[A-Za-z\s]+)?)", text, re.IGNORECASE)
    if inst_match:
        fields["institution_name"] = inst_match.group(1).strip()

    # 2. Permanent ID
    perm_match = re.search(r"(?:Permanent\s*(?:Institute)?\s*ID|PID|AICTE\s*ID)\s*[:\-]?\s*([0-9A-Z\-]+)", text, re.IGNORECASE)
    if perm_match:
        fields["permanent_id"] = perm_match.group(1).strip()

    # 3. Stamp Paper Value
    stamp_match = re.search(r"(?:Rs\.?|INR|Rupees)\s*(\d{2,5})", text, re.IGNORECASE)
    if stamp_match:
        try:
            fields["stamp_paper_value"] = int(stamp_match.group(1))
        except ValueError:
            pass

    # 4. Document / Order / Ref Number
    doc_no_match = re.search(r"(?:NOC\s*No\.?|Certificate\s*No\.?|Order\s*No\.?|Ref\s*No\.?|Resolution\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9\-_/]+)", text, re.IGNORECASE)
    if doc_no_match:
        fields["document_number"] = doc_no_match.group(1).strip()

    # 5. Issue Date & Expiry Date
    # Match patterns like: 2026-05-15, 15/05/2026, 15-05-2026, 15 March 2026
    date_patterns = re.findall(r"(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}-\d{2}-\d{2})", text)
    if date_patterns:
        fields["detected_dates"] = date_patterns
        # Contextual date search
        issue_match = re.search(r"(?:Issue(?:d)?\s*Date|Date\s*of\s*Issue|Dated)\s*[:\-]?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}-\d{2}-\d{2})", text, re.IGNORECASE)
        if issue_match:
            fields["issue_date"] = issue_match.group(1).strip()
        elif date_patterns:
            fields["issue_date"] = date_patterns[0]

        expiry_match = re.search(r"(?:Expiry\s*Date|Valid\s*(?:Till|Upto|Until)|Valid\s*Through)\s*[:\-]?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}-\d{2}-\d{2})", text, re.IGNORECASE)
        if expiry_match:
            fields["expiry_date"] = expiry_match.group(1).strip()
        elif len(date_patterns) > 1:
            fields["expiry_date"] = date_patterns[-1]

    # 6. Issuing Authority
    auth_match = re.search(r"(Anna\s+University|Delhi\s+Technological\s+University|Directorate\s+of\s+Fire\s+Services|Charity\s+Commissioner|AICTE|State\s+Board\s+of\s+Technical\s+Education)", text, re.IGNORECASE)
    if auth_match:
        fields["issuing_authority"] = auth_match.group(1).strip()

    # 7. Intake Figures
    intake_match = re.search(r"(?:Sanctioned|Approved|Current)\s*Intake\s*[:\-]?\s*(\d+)", text, re.IGNORECASE)
    if intake_match:
        fields["current_intake"] = int(intake_match.group(1))

    req_intake_match = re.search(r"(?:Requested|Proposed|Increased)\s*Intake\s*[:\-]?\s*(\d+)", text, re.IGNORECASE)
    if req_intake_match:
        fields["requested_intake"] = int(req_intake_match.group(1))

    # 8. Trust Name & Resolution
    trust_match = re.search(r"(?:Trust|Society)\s*Name\s*[:\-]?\s*([^\n\r,]+)", text, re.IGNORECASE)
    if trust_match:
        fields["trust_name"] = trust_match.group(1).strip()

    res_date_match = re.search(r"Resolution\s*Date\s*[:\-]?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}-\d{2}-\d{2})", text, re.IGNORECASE)
    if res_date_match:
        fields["resolution_date"] = res_date_match.group(1).strip()

    return fields

def classify_document(text: str, claimed_type: str) -> Dict[str, Any]:
    """Classifies if document content matches the claimed document type."""
    type_keywords = {
        "AFFIDAVIT_1": ["affidavit", "stamp paper", "notary", "deponent", "non-deviation", "solemnly affirm"],
        "AFFIDAVIT_2": ["affidavit", "stamp paper", "faculty", "pay scale", "deponent", "cadre ratio"],
        "UNIVERSITY_NOC": ["university", "affiliation", "no objection certificate", "continuation", "registrar"],
        "FIRE_SAFETY_NOC": ["fire", "safety", "rescue", "clearance certificate", "fire department", "extinguisher"],
        "PREV_EOA": ["extension of approval", "aicte", "academic year", "sanctioned intake", "permanent id"],
        "TRUST_RESOLUTION": ["resolution", "trust", "society", "trustee", "governing body", "meeting held on"],
        "ACCREDITATION_CERT": ["nba", "naac", "accreditation", "grade", "assessment and accreditation"]
    }

    keywords = type_keywords.get(claimed_type, [])
    lower_text = text.lower()
    matches = [kw for kw in keywords if kw in lower_text]
    match_ratio = len(matches) / max(len(keywords), 1)

    is_valid_type = match_ratio >= 0.3 or len(matches) >= 2
    detected_type = claimed_type if is_valid_type else "UNKNOWN_OR_MISMATCHED"

    return {
        "is_match": is_valid_type,
        "confidence": round(min(match_ratio * 1.5, 1.0), 2),
        "matched_keywords": matches,
        "claimed_type": claimed_type,
        "detected_type": detected_type
    }

def extract_structured_fields(text: str, doc_type: str) -> Dict[str, Any]:
    """Extracts structured fields using Gemini if configured, otherwise rule-based fallback."""
    # Check if Gemini API is available
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
You are an expert document parser for technical education regulatory applications (AICTE India).
Document Type claimed: {doc_type}
Document Content:
\"\"\"{text[:4000]}\"\"\"

Extract the following fields into valid JSON:
- institution_name: string or null
- permanent_id: string or null
- document_number: string or null
- issue_date: string (YYYY-MM-DD or DD/MM/YYYY) or null
- expiry_date: string (YYYY-MM-DD or DD/MM/YYYY) or null
- stamp_paper_value: integer (e.g. 220, 100) or null
- issuing_authority: string or null
- current_intake: integer or null
- requested_intake: integer or null
- trust_name: string or null
- resolution_date: string or null

Return ONLY raw JSON with no markdown wrapping or formatting.
"""
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```json|^```|```$", "", raw_text, flags=re.MULTILINE).strip()
            data = json.loads(raw_text)
            if isinstance(data, dict):
                data["extraction_method"] = "gemini_api"
                return data
        except Exception as e:
            print(f"Gemini API extraction failed, using fallback: {e}")

    # Fallback to rule-based regex
    fields = rule_based_extract_fields(text, doc_type)
    fields["extraction_method"] = "rule_based_fallback"
    return fields
