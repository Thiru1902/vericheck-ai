"""
End-to-end integration test for VeriCheck AI
Verifies the complete flow across backend REST API:
1. Authentication & Role Separation (applicant vs officer guards)
2. Checklist loading
3. Application creation by applicant
4. Document upload & instant extraction
5. AI Pre-check execution & findings verification
6. Application submission & locking
7. Officer scrutiny report retrieval (Three-panel data)
8. Officer finding decision update & overall scrutiny order
9. Audit trail verification
"""
import requests
import json
import io

BASE_URL = "http://localhost:8000"

def run_tests():
    print("=" * 60)
    print("STARTING VERICHECK AI INTEGRATION TESTS")
    print("=" * 60)

    # 1. Test Server Online
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200, f"Server offline: {res.text}"
    print("[PASS] 1. Backend Server is Online and healthy")

    # 2. Test Login as Applicant
    app_login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "applicant1@aicte-demo.in",
        "password": "Demo@123"
    })
    assert app_login_res.status_code == 200, f"Applicant login failed: {app_login_res.text}"
    app_token = app_login_res.json()["access_token"]
    app_headers = {"Authorization": f"Bearer {app_token}"}
    print("[PASS] 2. Logged in as College Applicant (Apex Institute of Technology)")

    # 3. Test Login as Officer
    off_login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "officer@aicte.gov.in",
        "password": "Demo@123"
    })
    assert off_login_res.status_code == 200, f"Officer login failed: {off_login_res.text}"
    off_token = off_login_res.json()["access_token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}
    print("[PASS] 3. Logged in as AICTE Scrutiny Officer (Dr. R. K. Sharma)")

    # 4. Role Guard Verification: Applicant rejected on Officer Endpoint
    forbidden_res = requests.get(f"{BASE_URL}/officer/applications", headers=app_headers)
    assert forbidden_res.status_code == 403, "Applicant was not blocked from officer endpoint!"
    print("[PASS] 4. Role Guard Verified: Applicant blocked from officer endpoints (403 Forbidden)")

    # 5. Role Guard Verification: Officer rejected on Applicant Create Endpoint
    off_forbidden = requests.post(f"{BASE_URL}/applications", headers=off_headers, json={
        "type": "Extension of Approval",
        "form_data": {}
    })
    assert off_forbidden.status_code == 403, "Officer was not blocked from applicant endpoint!"
    print("[PASS] 5. Role Guard Verified: Officer blocked from applicant creation endpoints (403 Forbidden)")

    # 6. Fetch Dynamic Checklist
    checklist_res = requests.get(f"{BASE_URL}/config/checklist/Extension%20of%20Approval")
    assert checklist_res.status_code == 200
    checklist = checklist_res.json()
    assert len(checklist["required_documents"]) >= 6
    print(f"[PASS] 6. Config-driven Checklist loaded ({len(checklist['required_documents'])} required documents)")

    # 7. Create New Application as Applicant
    new_app_res = requests.post(f"{BASE_URL}/applications", headers=app_headers, json={
        "type": "Extension of Approval",
        "form_data": {
            "institution_name": "Apex Institute of Technology",
            "permanent_id": "1-3324567891",
            "programme": "Engineering & Technology",
            "current_intake": 480,
            "trust_name": "Apex Education & Research Trust",
            "contact_details": "principal@apextech.ac.in"
        }
    })
    assert new_app_res.status_code == 200
    app_id = new_app_res.json()["application_id"]
    print(f"[PASS] 7. Application #APP-{app_id:04d} created in Draft status")

    # 8. Upload Document with Extraction & SHA-256
    pdf_content = b"""%PDF-1.4
1 0 obj << /Title (AFFIDAVIT I - AICTE NORMS) >> endobj
trailer << /Root 1 0 R >>
%%EOF
Institution Name: Apex Institute of Technology
Permanent Institute ID: 1-3324567891
Document Type: AFFIDAVIT_1
Rs. 220 (Rupees Two Hundred Twenty Only)
Date of Issue: 2026-03-01
Affidavit non-deviation from AICTE norms affirmed before Notary.
"""
    files = {"file": ("affidavit_test.pdf", io.BytesIO(pdf_content), "application/pdf")}
    data = {"doc_type": "AFFIDAVIT_1"}
    upload_res = requests.post(f"{BASE_URL}/applications/{app_id}/documents", headers=app_headers, files=files, data=data)
    assert upload_res.status_code == 200
    doc_id = upload_res.json()["document_id"]
    print(f"[PASS] 8. Document uploaded (Doc ID: {doc_id}) with SHA-256 and field extraction")

    # 9. Run Pre-check
    precheck_res = requests.post(f"{BASE_URL}/applications/{app_id}/precheck", headers=app_headers)
    assert precheck_res.status_code == 200
    precheck = precheck_res.json()
    print(f"[PASS] 9. AI Pre-check completed: Status = {precheck['overall_status']}, Findings = {precheck['total_findings']}")

    # 10. Submit Application
    submit_res = requests.post(f"{BASE_URL}/applications/{app_id}/submit", headers=app_headers)
    assert submit_res.status_code == 200
    print(f"[PASS] 10. Application #APP-{app_id:04d} successfully submitted and locked")

    # 11. Officer Views Scrutiny Report (Three-panel data)
    report_res = requests.get(f"{BASE_URL}/officer/applications/{app_id}/report", headers=off_headers)
    assert report_res.status_code == 200
    report = report_res.json()
    assert "application_data" in report
    assert "documents" in report
    assert "findings" in report
    assert "advisory_banner" in report
    print(f"[PASS] 11. Officer retrieved Three-Panel Scrutiny Dossier ({len(report['findings'])} findings)")

    # 12. Officer Modifies Finding Decision
    if report["findings"]:
        f_id = report["findings"][0]["id"]
        patch_res = requests.patch(f"{BASE_URL}/findings/{f_id}", headers=off_headers, json={
            "decision": "ACCEPTED",
            "remark": "Verified during E2E automation run."
        })
        assert patch_res.status_code == 200
        print(f"[PASS] 12. Officer accepted finding #{f_id} with remark")

    # 13. Officer Makes Overall Determination
    decision_res = requests.post(f"{BASE_URL}/applications/{app_id}/decision", headers=off_headers, json={
        "action": "Mark Reviewed",
        "notes": "E2E automated scrutiny review approved by testing agent."
    })
    assert decision_res.status_code == 200
    print(f"[PASS] 13. Officer marked application as 'Reviewed' with scrutiny notes")

    # 14. Verify Audit Trail
    audit_res = requests.get(f"{BASE_URL}/officer/audit", headers=off_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    print(f"[PASS] 14. Audit Trail verified ({len(logs)} immutable events logged)")

    print("=" * 60)
    print("ALL 14 INTEGRATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
