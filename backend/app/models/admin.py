from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False, index=True)

    admin = relationship("User", foreign_keys=[admin_id])
