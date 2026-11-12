from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.admin import AdminAuditLog


def log_admin_action(
    db: Session,
    admin_id: int,
    action: str,
    target_type: str,
    target_id: str,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    commit: bool = True
) -> AdminAuditLog:
    """
    Permanently records an administrative action in the immutable admin_audit_logs table.
    If commit=False, adds the entry to the session without committing, enabling atomic transactions.
    """
    entry = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details=details or {},
        ip_address=ip_address
    )
    db.add(entry)
    if commit:
        db.commit()
        db.refresh(entry)
    return entry
