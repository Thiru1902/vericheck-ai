import os
import datetime
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

import models
from services.auth import get_password_hash
from services.anomaly import calculate_sha256
from services.extractor import extract_text_and_metadata_from_pdf, extract_structured_fields

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "storage", "documents")
os.makedirs(STORAGE_DIR, exist_ok=True)

def generate_sample_pdf(
    file_path: str,
    doc_title: str,
    fields: dict,
    stamp_paper_val: int = None,
    custom_text: str = None,
    tampered_metadata: bool = False
):
    """Generates a professional regulatory PDF document with clean headers and text."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter

    # Decorative header banner
    c.setFillColor(colors.HexColor("#0f2b48"))
    c.rect(0, height - 70, width, 70, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2.0, height - 35, "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION")
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2.0, height - 52, "STATUTORY BODY UNDER MINISTRY OF EDUCATION, GOVT. OF INDIA")

    # Document Title Box
    c.setFillColor(colors.HexColor("#f1f5f9"))
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.rect(40, height - 125, width - 80, 40, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(width / 2.0, height - 100, doc_title.upper())

    # Stamp paper banner if applicable
    y = height - 145
    if stamp_paper_val:
        c.setFillColor(colors.HexColor("#ecfdf5"))
        c.setStrokeColor(colors.HexColor("#059669"))
        c.rect(40, y - 25, width - 80, 25, fill=1, stroke=1)
        c.setFillColor(colors.HexColor("#065f46"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(55, y - 17, f"NON-JUDICIAL STAMP PAPER: Rs. {stamp_paper_val} (INR {stamp_paper_val} ONLY)")
        y -= 35

    # Details table
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(45, y - 15, "DOCUMENT METADATA & PARTICULARS:")
    y -= 25

    c.setFont("Helvetica", 9)
    for key, val in fields.items():
        label = key.replace("_", " ").title()
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, y, f"{label}:")
        c.setFont("Helvetica", 9)
        c.drawString(190, y, str(val))
        y -= 18

    # Body text
    y -= 10
    c.setFont("Helvetica-Bold", 9)
    c.drawString(45, y, "DECLARATION / OFFICIAL STATUTE:")
    y -= 15
    c.setFont("Helvetica", 8.5)

    default_body = (
        "This regulatory document is submitted in compliance with AICTE Approval Process Handbook (APH 2026-27). "
        "The applicant institution hereby solemnly affirms and certifies that the information, building plans, "
        "faculty cadre ratios, student amenities, and affiliations satisfy AICTE statutory norms in entirety."
    )
    if custom_text:
        default_body = custom_text

    text_object = c.beginText(50, y)
    text_object.setFont("Helvetica", 8.5)
    for line in [default_body[i:i+80] for i in range(0, len(default_body), 80)]:
        text_object.textLine(line)
    c.drawText(text_object)

    # Official Seal and Signature Stamp
    c.setStrokeColor(colors.HexColor("#2563eb"))
    c.setFillColor(colors.HexColor("#eff6ff"))
    c.circle(width - 110, 100, 45, stroke=True, fill=True)
    c.setFillColor(colors.HexColor("#1e40af"))
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width - 110, 110, "SEAL OF")
    c.drawCentredString(width - 110, 98, "COMPETENT")
    c.drawCentredString(width - 110, 86, "AUTHORITY")

    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawString(45, 70, f"Generated Timestamp: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    c.drawString(45, 58, "Verification Portal: aicte-india.org | AICTE Smart Application Validator")

    if tampered_metadata:
        c.setTitle("TAMPERED_MODIFIED_DOCUMENT")
        c.setAuthor("SUSPICIOUS_EXTERNAL_EDITOR_V2")

    c.save()

def seed_all(db: Session):
    """Populates 12-15 synthetic applications, institutions, mock registries, and demo users."""
    print("Creating tables if not present...")
    from database import engine
    models.Base.metadata.create_all(bind=engine)

    print("Clearing old records...")
    db.query(models.AuditLog).delete()
    db.query(models.Finding).delete()
    db.query(models.Document).delete()
    db.query(models.Application).delete()
    db.query(models.User).delete()
    db.query(models.Institution).delete()
    db.query(models.MockRegistryRecord).delete()
    db.commit()

    # 1. Institutions
    inst1 = models.Institution(
        permanent_id="1-3324567891",
        name="Apex Institute of Technology",
        state="Maharashtra",
        address="Sector 12, Knowledge Park, Pune, Maharashtra 411028",
        contact_email="principal@apextech.ac.in",
        contact_phone="+91-9876543210"
    )
    inst2 = models.Institution(
        permanent_id="1-4456789123",
        name="Bharat Polytechnic & Engineering Academy",
        state="Karnataka",
        address="Ring Road, Electronic City, Bengaluru, Karnataka 560100",
        contact_email="director@bharatpoly.edu.in",
        contact_phone="+91-9845012345"
    )
    inst3 = models.Institution(
        permanent_id="1-5567891234",
        name="Chanakya College of Engineering",
        state="Tamil Nadu",
        address="GST Road, Tambaram, Chennai, Tamil Nadu 600045",
        contact_email="office@chanakyaengg.edu.in",
        contact_phone="+91-9444012345"
    )
    inst4 = models.Institution(
        permanent_id="1-6678912345",
        name="Delhi Horizon Institute of Science & Technology",
        state="Delhi",
        address="Institutional Area, Rohini, New Delhi 110085",
        contact_email="admin@delhihorizon.ac.in",
        contact_phone="+91-9811012345"
    )

    db.add_all([inst1, inst2, inst3, inst4])
    db.commit()

    # 2. Demo Users
    user_app1 = models.User(
        name="Dr. Arvind Kulkarni (Principal)",
        email="applicant1@aicte-demo.in",
        password_hash=get_password_hash("Demo@123"),
        role="applicant",
        institution_id=inst1.id
    )
    user_app2 = models.User(
        name="Prof. Sunita Rao (Registrar)",
        email="applicant2@aicte-demo.in",
        password_hash=get_password_hash("Demo@123"),
        role="applicant",
        institution_id=inst2.id
    )
    user_officer = models.User(
        name="Dr. R. K. Sharma (Senior Scrutiny Officer)",
        email="officer@aicte.gov.in",
        password_hash=get_password_hash("Demo@123"),
        role="officer",
        institution_id=None
    )
    db.add_all([user_app1, user_app2, user_officer])
    db.commit()

    # 3. Mock Issuing-Authority Registry Records
    mock_records = [
        # Active university NOCs
        models.MockRegistryRecord(
            registry_type="university_noc",
            document_number="UNIV/NOC/2026/8941",
            institution_name="Apex Institute of Technology",
            issue_date="2026-02-10",
            expiry_date="2027-06-30",
            status="VERIFIED",
            details={"affiliating_university": "Savitribai Phule Pune University", "courses": ["B.Tech CSE", "B.Tech ECE"]}
        ),
        models.MockRegistryRecord(
            registry_type="university_noc",
            document_number="UNIV/NOC/2026/4412",
            institution_name="Bharat Polytechnic & Engineering Academy",
            issue_date="2026-01-15",
            expiry_date="2027-06-30",
            status="VERIFIED",
            details={"affiliating_university": "Visvesvaraya Technological University", "courses": ["Diploma Mechanical", "B.Tech CSE"]}
        ),
        models.MockRegistryRecord(
            registry_type="university_noc",
            document_number="UNIV/NOC/EXPIRED/1099",
            institution_name="Chanakya College of Engineering",
            issue_date="2024-05-10",
            expiry_date="2025-06-30",
            status="EXPIRED",
            details={"affiliating_university": "Anna University", "note": "Renewal lapsed, not active in current cycle."}
        ),
        models.MockRegistryRecord(
            registry_type="university_noc",
            document_number="UNIV/NOC/MISMATCH/2022",
            institution_name="Global Institute of Management & Science",
            issue_date="2026-03-01",
            expiry_date="2027-06-30",
            status="MISMATCH_DETECTED",
            details={"affiliating_university": "Delhi Technological University", "note": "Issued to Global Institute, not Delhi Horizon"}
        ),
        models.MockRegistryRecord(
            registry_type="university_noc",
            document_number="UNIV/NOC/OFFLINE/503",
            institution_name="Delhi Horizon Institute of Science & Technology",
            issue_date="2026-02-20",
            expiry_date="2027-06-30",
            status="SOURCE_UNAVAILABLE",
            details={"reason": "State University database portal down for scheduled maintenance"}
        ),
        # Fire NOCs
        models.MockRegistryRecord(
            registry_type="fire_noc",
            document_number="FIRE/NOC/2026/0991",
            institution_name="Apex Institute of Technology",
            issue_date="2026-01-05",
            expiry_date="2028-01-04",
            status="VERIFIED",
            details={"fire_station": "Pune Central Fire Command", "building_height_meters": 18.5}
        ),
        models.MockRegistryRecord(
            registry_type="fire_noc",
            document_number="FIRE/NOC/2026/3310",
            institution_name="Bharat Polytechnic & Engineering Academy",
            issue_date="2026-02-18",
            expiry_date="2027-02-17",
            status="VERIFIED",
            details={"fire_station": "Bengaluru Electronic City Division"}
        ),
        # Trust records
        models.MockRegistryRecord(
            registry_type="trust_registry",
            document_number="TR/REG/PUNE/7821",
            institution_name="Apex Education & Research Trust",
            issue_date="2012-08-14",
            expiry_date="2035-12-31",
            status="VERIFIED",
            details={"trust_registration_no": "F-18923/Pune", "status": "Active Charitable Trust"}
        )
    ]
    db.add_all(mock_records)
    db.commit()

    # 4. Generate 14 Applications with PDFs and exact scenarios
    # Common shared PDF for duplicate file test
    shared_duplicate_path = os.path.join(STORAGE_DIR, "shared_affidavit_duplicate.pdf")
    generate_sample_pdf(
        shared_duplicate_path,
        "AFFIDAVIT I - NON-DEVIATION FROM AICTE NORMS",
        {
            "institution_name": "Apex Institute of Technology",
            "permanent_id": "1-3324567891",
            "stamp_paper_value": 220,
            "deponent_name": "Dr. Arvind Kulkarni",
            "date": "2026-03-15"
        },
        stamp_paper_val=220
    )

    apps_specs = [
        # --- 3 CLEAN APPLICATIONS ---
        {
            "id": 1,
            "inst": inst1,
            "type": "Extension of Approval",
            "status": "Submitted",
            "overall_status": "Clear",
            "submitted_at": datetime.datetime(2026, 3, 20, 10, 30),
            "form_data": {
                "institution_name": "Apex Institute of Technology",
                "permanent_id": "1-3324567891",
                "application_year": "2026-2027",
                "programme": "Engineering & Technology",
                "current_intake": 480,
                "requested_intake": 480,
                "trust_name": "Apex Education & Research Trust",
                "contact_details": "principal@apextech.ac.in, +91-9876543210"
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I (Rs. 220 Stamp Paper)", "stamp": 220, "doc_no": "AFF1-2026-01"},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II (Rs. 220 Stamp Paper)", "stamp": 220, "doc_no": "AFF2-2026-01"},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/8941", "exp": "2027-06-30", "auth": "Anna University"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04", "auth": "Directorate of Fire Services"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "doc_no": "AICTE/EOA/2025/1192", "intake": 480},
                {"code": "TRUST_RESOLUTION", "title": "Trust/Society Resolution", "doc_no": "TR/REG/PUNE/7821"}
            ]
        },
        {
            "id": 2,
            "inst": inst2,
            "type": "Extension of Approval",
            "status": "Submitted",
            "overall_status": "Clear",
            "submitted_at": datetime.datetime(2026, 3, 22, 14, 15),
            "form_data": {
                "institution_name": "Bharat Polytechnic & Engineering Academy",
                "permanent_id": "1-4456789123",
                "application_year": "2026-2027",
                "programme": "Engineering & Technology",
                "current_intake": 360,
                "requested_intake": 360,
                "trust_name": "Bharat Vidya Sansthan",
                "contact_details": "director@bharatpoly.edu.in"
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I (Rs. 220 Stamp Paper)", "stamp": 220, "doc_no": "AFF1-BP-2026"},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II (Rs. 220 Stamp Paper)", "stamp": 220, "doc_no": "AFF2-BP-2026"},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/4412", "exp": "2027-06-30", "auth": "Visvesvaraya Technological University"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/3310", "exp": "2027-02-17", "auth": "Directorate of Fire Services"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "doc_no": "AICTE/EOA/2025/4410", "intake": 360},
                {"code": "TRUST_RESOLUTION", "title": "Trust/Society Resolution", "doc_no": "TR/BP/2026/09"}
            ]
        },
        {
            "id": 3,
            "inst": inst1,
            "type": "Increase in Intake",
            "status": "Submitted",
            "overall_status": "Clear",
            "submitted_at": datetime.datetime(2026, 3, 25, 11, 0),
            "form_data": {
                "institution_name": "Apex Institute of Technology",
                "permanent_id": "1-3324567891",
                "application_year": "2026-2027",
                "programme": "Computer Science & Engineering",
                "current_intake": 120,
                "requested_intake": 180,
                "trust_name": "Apex Education & Research Trust",
                "contact_details": "principal@apextech.ac.in"
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I (Rs. 220 Stamp Paper)", "stamp": 220, "doc_no": "AFF1-INTAKE-01"},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II (Rs. 220 Stamp Paper)", "stamp": 220, "doc_no": "AFF2-INTAKE-01"},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University (with Intake details)", "doc_no": "UNIV/NOC/2026/8941", "exp": "2027-06-30", "auth": "Anna University"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "doc_no": "AICTE/EOA/2025/1192", "intake": 120},
                {"code": "ACCREDITATION_CERT", "title": "NBA / NAAC Accreditation Certificate", "doc_no": "NBA/2024/CSE-91", "exp": "2028-06-30"},
                {"code": "TRUST_RESOLUTION", "title": "Trust/Society Resolution for Expansion", "doc_no": "TR/REG/PUNE/7821"}
            ]
        },

        # --- FLAWED SCENARIOS REQUIRED ---
        # 4. Flawed Scenario 1: Expired NOC
        {
            "id": 4,
            "inst": inst3,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Deficient",
            "submitted_at": datetime.datetime(2026, 3, 26, 16, 0),
            "form_data": {
                "institution_name": "Chanakya College of Engineering",
                "permanent_id": "1-5567891234",
                "application_year": "2026-2027",
                "current_intake": 300,
                "requested_intake": 300
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I", "stamp": 220},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/EXPIRED/1099", "exp": "2025-06-30", "issue": "2024-05-10"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/3310", "exp": "2027-02-17"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 300},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 5. Flawed Scenario 2: Institution Name Mismatch
        {
            "id": 5,
            "inst": inst1,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Deficient",
            "submitted_at": datetime.datetime(2026, 3, 27, 9, 30),
            "form_data": {
                "institution_name": "Apex Institute of Technology",
                "permanent_id": "1-3324567891",
                "application_year": "2026-2027",
                "current_intake": 480
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I", "stamp": 220},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "inst_name_override": "Apex College of Global Engineering & Management", "doc_no": "UNIV/NOC/2026/8941", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 480},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 6. Flawed Scenario 3: Missing Affidavit II
        {
            "id": 6,
            "inst": inst2,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Deficient",
            "submitted_at": datetime.datetime(2026, 3, 28, 12, 0),
            "form_data": {
                "institution_name": "Bharat Polytechnic & Engineering Academy",
                "permanent_id": "1-4456789123",
                "application_year": "2026-2027",
                "current_intake": 360
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I", "stamp": 220},
                # Notice: AFFIDAVIT_2 missing intentionally!
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/4412", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/3310", "exp": "2027-02-17"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 360},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 7. Flawed Scenario 4: Cross-Application Duplicate SHA-256
        {
            "id": 7,
            "inst": inst3,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Deficient",
            "submitted_at": datetime.datetime(2026, 3, 29, 14, 0),
            "form_data": {
                "institution_name": "Chanakya College of Engineering",
                "permanent_id": "1-5567891234",
                "application_year": "2026-2027",
                "current_intake": 300
            },
            "use_shared_duplicate_doc": "AFFIDAVIT_1",
            "docs": [
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/8941", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/3310", "exp": "2027-02-17"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 300},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 8. Flawed Scenario 5: Stamp Paper below Rs. 220 (Rs. 100 detected)
        {
            "id": 8,
            "inst": inst4,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Deficient",
            "submitted_at": datetime.datetime(2026, 3, 30, 11, 20),
            "form_data": {
                "institution_name": "Delhi Horizon Institute of Science & Technology",
                "permanent_id": "1-6678912345",
                "application_year": "2026-2027",
                "current_intake": 240
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I (Rs. 100 Stamp Paper)", "stamp": 100},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/8941", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 240},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 9. Flawed Scenario 6: Delayed Submission (Submitted after deadline)
        {
            "id": 9,
            "inst": inst1,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Needs Manual Review",
            "submitted_at": datetime.datetime(2026, 10, 24, 18, 0),  # Deadline was 2026-10-15
            "form_data": {
                "institution_name": "Apex Institute of Technology",
                "permanent_id": "1-3324567891",
                "application_year": "2026-2027",
                "current_intake": 480
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I", "stamp": 220},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/8941", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 480},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 10. Flawed Scenario 7: Tampered Metadata PDF
        {
            "id": 10,
            "inst": inst2,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Needs Manual Review",
            "submitted_at": datetime.datetime(2026, 4, 2, 15, 45),
            "form_data": {
                "institution_name": "Bharat Polytechnic & Engineering Academy",
                "permanent_id": "1-4456789123",
                "application_year": "2026-2027",
                "current_intake": 360
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I (Tampered Metadata)", "stamp": 220, "tampered_meta": True},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/4412", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/3310", "exp": "2027-02-17"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 360},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 11. Flawed Scenario 8: Source Unavailable Case (Mock Gateway 503)
        {
            "id": 11,
            "inst": inst4,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Needs Manual Review",
            "submitted_at": datetime.datetime(2026, 4, 5, 10, 0),
            "form_data": {
                "institution_name": "Delhi Horizon Institute of Science & Technology",
                "permanent_id": "1-6678912345",
                "application_year": "2026-2027",
                "current_intake": 240
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I", "stamp": 220},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/OFFLINE/503", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 240},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 12. Flawed Scenario 9: Baseline Intake Mismatch in Increase in Intake
        {
            "id": 12,
            "inst": inst1,
            "type": "Increase in Intake",
            "status": "Needs Manual Review",
            "overall_status": "Deficient",
            "submitted_at": datetime.datetime(2026, 4, 8, 11, 30),
            "form_data": {
                "institution_name": "Apex Institute of Technology",
                "permanent_id": "1-3324567891",
                "application_year": "2026-2027",
                "programme": "Mechanical Engineering",
                "current_intake": 120,  # Claims 120 in form
                "requested_intake": 180
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I", "stamp": 220},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/8941", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 60},  # EoA was actually 60 seats!
                {"code": "ACCREDITATION_CERT", "title": "Accreditation Certificate", "exp": "2028-06-30"},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 13. Flawed Scenario 10: Same File Uploaded Under Two Types in Same Application
        {
            "id": 13,
            "inst": inst3,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Deficient",
            "submitted_at": datetime.datetime(2026, 4, 10, 14, 0),
            "form_data": {
                "institution_name": "Chanakya College of Engineering",
                "permanent_id": "1-5567891234",
                "application_year": "2026-2027",
                "current_intake": 300
            },
            "duplicate_within_app": True,
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/8941", "exp": "2027-06-30"},
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 300},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        },

        # 14. Flawed Scenario 11: Future Issue Date
        {
            "id": 14,
            "inst": inst4,
            "type": "Extension of Approval",
            "status": "Needs Manual Review",
            "overall_status": "Deficient",
            "submitted_at": datetime.datetime(2026, 4, 12, 16, 20),
            "form_data": {
                "institution_name": "Delhi Horizon Institute of Science & Technology",
                "permanent_id": "1-6678912345",
                "application_year": "2026-2027",
                "current_intake": 240
            },
            "docs": [
                {"code": "AFFIDAVIT_1", "title": "Affidavit I", "stamp": 220},
                {"code": "AFFIDAVIT_2", "title": "Affidavit II", "stamp": 220},
                {"code": "UNIVERSITY_NOC", "title": "NOC from Affiliating University", "doc_no": "UNIV/NOC/2026/8941", "issue": "2028-11-20", "exp": "2029-06-30"},  # Future date!
                {"code": "FIRE_SAFETY_NOC", "title": "Fire Safety NOC", "doc_no": "FIRE/NOC/2026/0991", "exp": "2028-01-04"},
                {"code": "PREV_EOA", "title": "Previous Year EoA Letter", "intake": 240},
                {"code": "TRUST_RESOLUTION", "title": "Trust Resolution"}
            ]
        }
    ]

    for spec in apps_specs:
        app = models.Application(
            id=spec["id"],
            institution_id=spec["inst"].id,
            type=spec["type"],
            status=spec["status"],
            overall_status=spec["overall_status"],
            form_data=spec["form_data"],
            submitted_at=spec["submitted_at"],
            deadline="2026-10-15T23:59:59Z"
        )
        db.add(app)
        db.commit()

        app_dir = os.path.join(STORAGE_DIR, str(app.id))
        os.makedirs(app_dir, exist_ok=True)

        # Handle shared duplicate document
        if spec.get("use_shared_duplicate_doc"):
            doc_code = spec["use_shared_duplicate_doc"]
            target_path = os.path.join(app_dir, f"{doc_code}_shared_affidavit.pdf")
            import shutil
            shutil.copyfile(shared_duplicate_path, target_path)

            with open(target_path, "rb") as f:
                content = f.read()
            extracted_text, metadata = extract_text_and_metadata_from_pdf(target_path)
            extracted_fields = extract_structured_fields(extracted_text, doc_code)

            db_doc = models.Document(
                application_id=app.id,
                doc_type=doc_code,
                file_name=f"{doc_code}_affidavit.pdf",
                file_path=target_path,
                sha256=calculate_sha256(content),
                file_size=len(content),
                extracted_text=extracted_text,
                extracted_fields=extracted_fields,
                metadata_info=metadata,
                status="Validated"
            )
            db.add(db_doc)

        first_created_doc_path = None
        first_created_doc_code = None

        for doc_item in spec.get("docs", []):
            code = doc_item["code"]
            file_name = f"{code}_{app.id}.pdf"
            file_path = os.path.join(app_dir, file_name)

            inst_name = doc_item.get("inst_name_override") or spec["form_data"].get("institution_name")
            perm_id = spec["form_data"].get("permanent_id")

            pdf_fields = {
                "institution_name": inst_name,
                "permanent_id": perm_id,
                "document_type": code
            }
            if "doc_no" in doc_item:
                pdf_fields["document_number"] = doc_item["doc_no"]
            if "stamp" in doc_item:
                pdf_fields["stamp_paper_value"] = doc_item["stamp"]
            if "issue" in doc_item:
                pdf_fields["issue_date"] = doc_item["issue"]
            if "exp" in doc_item:
                pdf_fields["expiry_date"] = doc_item["exp"]
            if "auth" in doc_item:
                pdf_fields["issuing_authority"] = doc_item["auth"]
            if "intake" in doc_item:
                pdf_fields["current_intake"] = doc_item["intake"]

            generate_sample_pdf(
                file_path=file_path,
                doc_title=doc_item.get("title", code),
                fields=pdf_fields,
                stamp_paper_val=doc_item.get("stamp"),
                tampered_metadata=doc_item.get("tampered_meta", False)
            )

            if not first_created_doc_path:
                first_created_doc_path = file_path
                first_created_doc_code = code

            with open(file_path, "rb") as f:
                content = f.read()

            extracted_text, metadata = extract_text_and_metadata_from_pdf(file_path)
            extracted_fields = extract_structured_fields(extracted_text, code)

            db_doc = models.Document(
                application_id=app.id,
                doc_type=code,
                file_name=file_name,
                file_path=file_path,
                sha256=calculate_sha256(content),
                file_size=len(content),
                extracted_text=extracted_text,
                extracted_fields=extracted_fields,
                metadata_info=metadata,
                status="Validated"
            )
            db.add(db_doc)

        # Duplicate within app case (same file uploaded under two different document types)
        if spec.get("duplicate_within_app") and first_created_doc_path:
            alt_code = "AFFIDAVIT_2"
            alt_path = os.path.join(app_dir, f"{alt_code}_duplicate.pdf")
            import shutil
            shutil.copyfile(first_created_doc_path, alt_path)
            with open(alt_path, "rb") as f:
                content = f.read()
            extracted_text, metadata = extract_text_and_metadata_from_pdf(alt_path)
            extracted_fields = extract_structured_fields(extracted_text, alt_code)

            db_doc = models.Document(
                application_id=app.id,
                doc_type=alt_code,
                file_name=f"{alt_code}_duplicate.pdf",
                file_path=alt_path,
                sha256=calculate_sha256(content),
                file_size=len(content),
                extracted_text=extracted_text,
                extracted_fields=extracted_fields,
                metadata_info=metadata,
                status="Validated"
            )
            db.add(db_doc)

        db.commit()

        # Run validation engine to populate explainable findings
        from services.validator import validate_application
        validate_application(db, app.id)

    # Initial audit records
    audits = [
        models.AuditLog(
            actor="SYSTEM_BOOTSTRAP",
            role="system",
            action="SEED_DATABASE_INITIALIZED",
            details={"applications_seeded": 14, "institutions": 4, "mock_registries": len(mock_records)}
        ),
        models.AuditLog(
            actor="Dr. Arvind Kulkarni (Principal)",
            role="applicant",
            action="APPLICATION_SUBMITTED",
            details={"application_id": 1, "type": "Extension of Approval", "status": "Submitted"}
        ),
        models.AuditLog(
            actor="Dr. R. K. Sharma (Senior Scrutiny Officer)",
            role="officer",
            action="OFFICER_REVIEW_STARTED",
            details={"review_cycle": "2026-27", "applications_pending": 14}
        )
    ]
    db.add_all(audits)
    db.commit()
    print("Seed data generation complete: 14 applications with PDFs and findings generated!")

if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    seed_all(db)
    db.close()
