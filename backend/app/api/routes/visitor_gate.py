from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import Visitor, GateEvent, Delivery, Notification, User, Unit
from app.schemas.visitor import (
    VisitorCreate, VisitorUpdate, VisitorOut, 
    GateEventCreate, GateEventOut,
    DeliveryCreate, DeliveryUpdate, DeliveryOut,
    NotificationOut
)

router = APIRouter(prefix="", tags=["Visitor, Delivery & Gate Operations"])

# --- VISITOR MANAGEMENT ---
@router.post("/visitors", response_model=VisitorOut, status_code=status.HTTP_201_CREATED)
def create_visitor(
    visitor_in: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER", "ASSOCIATION_ADMIN"]))
):
    """
    Schedules an expected visitor (Resident/Family Member).
    """
    visitor = Visitor(
        name=visitor_in.name,
        phone=visitor_in.phone,
        purpose=visitor_in.purpose,
        date=visitor_in.date,
        start_time=visitor_in.start_time,
        end_time=visitor_in.end_time,
        vehicle_details=visitor_in.vehicle_details,
        resident_id=current_user.id,
        unit_id=visitor_in.unit_id,
        status="EXPECTED"
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return visitor

@router.get("/visitors", response_model=List[VisitorOut])
def get_visitors(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get visitor passes. Residents see their own. Guards/Admins see all.
    """
    query = db.query(Visitor)
    roles = [r.name for r in current_user.roles]
    
    # Restrict to own invites if not admin/guard
    if "SECURITY_GUARD" not in roles and "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        query = query.filter(Visitor.resident_id == current_user.id)
        
    if status:
        query = query.filter(Visitor.status == status)
    if search:
        query = query.filter(Visitor.name.ilike(f"%{search}%"))
        
    return query.order_by(Visitor.date.desc(), Visitor.created_at.desc()).all()

@router.put("/visitors/{visitor_id}", response_model=VisitorOut)
def update_visitor_status(
    visitor_id: UUID,
    visitor_in: VisitorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SECURITY_GUARD", "ASSOCIATION_ADMIN"]))
):
    """
    Records gate check entry/exit (Guards only).
    """
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor pass not found")
        
    if visitor_in.status:
        visitor.status = visitor_in.status
        
        # Log gate event
        gate_event = GateEvent(
            visitor_id=visitor.id,
            guard_id=current_user.id,
            action="ENTRY" if visitor_in.status == "ENTERED" else "EXIT" if visitor_in.status == "EXITED" else "REJECT",
            notes=f"Status changed to {visitor_in.status}"
        )
        db.add(gate_event)
        
        # Update timings
        if visitor_in.status == "ENTERED":
            visitor.entry_time = datetime.now()
            # Send Notification to resident
            notif = Notification(
                user_id=visitor.resident_id,
                title="Visitor Entered",
                message=f"Your visitor {visitor.name} has entered the gate.",
                notification_type="VISITOR",
                reference_id=visitor.id,
                reference_type="visitor"
            )
            db.add(notif)
        elif visitor_in.status == "EXITED":
            visitor.exit_time = datetime.now()
            
    db.commit()
    db.refresh(visitor)
    return visitor

# --- DELIVERIES ---
@router.post("/deliveries", response_model=DeliveryOut, status_code=status.HTTP_201_CREATED)
def record_delivery(
    delivery_in: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SECURITY_GUARD", "ASSOCIATION_ADMIN"]))
):
    """
    Logs package arrival at the gate and triggers resident alert (Guards only).
    """
    # Resolve resident
    resident = db.query(User).filter(User.email == delivery_in.resident_email).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident email not found")
        
    # Resolve unit
    unit = db.query(Unit).filter(Unit.number == delivery_in.unit_number).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit number not found")

    delivery = Delivery(
        resident_id=resident.id,
        unit_id=unit.id,
        guard_id=current_user.id,
        company=delivery_in.company,
        tracking_number=delivery_in.tracking_number,
        status="ARRIVED",
        entry_time=datetime.now()
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    
    # Notify resident
    notif = Notification(
        user_id=resident.id,
        title="Package Arrived",
        message=f"A package from {delivery.company} has arrived at the gate.",
        notification_type="DELIVERY",
        reference_id=delivery.id,
        reference_type="delivery"
    )
    db.add(notif)
    db.commit()
    
    return delivery

@router.get("/deliveries", response_model=List[DeliveryOut])
def get_deliveries(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List courier records. Residents see their own. Guards see all.
    """
    query = db.query(Delivery)
    roles = [r.name for r in current_user.roles]
    
    if "SECURITY_GUARD" not in roles and "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        query = query.filter(Delivery.resident_id == current_user.id)
        
    if status:
        query = query.filter(Delivery.status == status)
        
    return query.order_by(Delivery.entry_time.desc()).all()

@router.put("/deliveries/{delivery_id}", response_model=DeliveryOut)
def update_delivery_status(
    delivery_id: UUID,
    delivery_in: DeliveryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Resident approves/rejects package or claims it collected.
    """
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found")
        
    # Security checks: resident can update only their deliveries
    roles = [r.name for r in current_user.roles]
    if "SECURITY_GUARD" not in roles and "ASSOCIATION_ADMIN" not in roles and delivery.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this delivery")
        
    delivery.status = delivery_in.status
    if delivery_in.status in ["COLLECTED", "REJECTED"]:
        delivery.exit_time = datetime.now()
        
    db.commit()
    db.refresh(delivery)
    return delivery

# --- NOTIFICATIONS ---
@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve user notifications from their drawer.
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
        
    return query.order_by(Notification.created_at.desc()).all()

@router.put("/notifications/{notif_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notif_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Marks a notification as read.
    """
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Marks all notifications for current user as read.
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id, 
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}
