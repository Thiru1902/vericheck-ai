import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    permanent_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    contact_email = Column(String(150), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="institution")
    applications = relationship("Application", back_populates="institution")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'applicant' or 'officer'
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    institution = relationship("Institution", back_populates="users")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    type = Column(String(100), nullable=False)  # 'Extension of Approval', 'Increase in Intake'
    status = Column(String(50), default="Draft", index=True)  # 'Draft', 'Precheck Passed', 'Submitted', 'Under Review', 'Needs Manual Review', 'Deficient', 'Clear', 'Rectification Requested', 'Escalated'
    overall_status = Column(String(50), default="Needs Manual Review")  # 'Clear', 'Needs Manual Review', 'Deficient'
    form_data = Column(JSON, nullable=True)
    deadline = Column(String(50), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    officer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    institution = relationship("Institution", back_populates="applications")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="application", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    doc_type = Column(String(100), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    sha256 = Column(String(64), nullable=False, index=True)
    file_size = Column(Integer, default=0)
    extracted_text = Column(Text, nullable=True)
    extracted_fields = Column(JSON, nullable=True)
    metadata_info = Column(JSON, nullable=True)
    status = Column(String(50), default="Uploaded")  # 'Uploaded', 'Extracted', 'Validated', 'Anomaly Detected'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="documents")
    findings = relationship("Finding", back_populates="document")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    rule_id = Column(String(100), nullable=False, index=True)
    check_name = Column(String(200), nullable=False)
    status = Column(String(50), nullable=False)  # 'PASS', 'WARNING', 'FAIL', 'SOURCE_PENDING'
    severity = Column(String(20), nullable=False)  # 'LOW', 'MEDIUM', 'HIGH'
    reason = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=True)  # { extracted_val, expected_val, comparison_notes }
    officer_decision = Column(String(50), default="PENDING")  # 'PENDING', 'ACCEPTED', 'DISMISSED', 'CLARIFICATION_REQUESTED'
    officer_remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="findings")
    document = relationship("Document", back_populates="findings")

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    actor = Column(String(150), nullable=False)
    role = Column(String(50), nullable=False)
    action = Column(String(150), nullable=False, index=True)
    details = Column(JSON, nullable=True)

class MockRegistryRecord(Base):
    __tablename__ = "mock_registry_records"

    id = Column(Integer, primary_key=True, index=True)
    registry_type = Column(String(100), nullable=False, index=True)  # 'university_noc', 'fire_noc', 'trust_registry'
    document_number = Column(String(100), nullable=False, index=True)
    institution_name = Column(String(255), nullable=False)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False)  # 'VERIFIED', 'MISMATCH_DETECTED', 'EXPIRED', 'SOURCE_UNAVAILABLE', 'PENDING'
    details = Column(JSON, nullable=True)
