from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import MaintenanceTicket, MaintenanceTimeline, User, Unit, Notification
from app.schemas.maintenance import (
    MaintenanceTicketCreate, MaintenanceTicketUpdate, MaintenanceTicketOut
)

router = APIRouter(prefix="/maintenance", tags=["Maintenance Tickets Helpdesk"])

@router.post("/tickets", response_model=MaintenanceTicketOut, status_code=status.HTTP_201_CREATED)
def raise_ticket(
    ticket_in: MaintenanceTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER"]))
):
    """
    Creates a new maintenance ticket (Resident/Family Member).
    """
    if not current_user.unit_id:
        raise HTTPException(
            status_code=400, 
            detail="User must be associated with a unit to raise a ticket"
        )
        
    ticket = MaintenanceTicket(
        title=ticket_in.title,
        description=ticket_in.description,
        category=ticket_in.category,
        priority=ticket_in.priority,
        status="OPEN",
        resident_id=current_user.id,
        unit_id=current_user.unit_id,
        photo_url=ticket_in.photo_url,
        video_url=ticket_in.video_url
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Create initial timeline log
    timeline = MaintenanceTimeline(
        ticket_id=ticket.id,
        status="OPEN",
        notes="Ticket submitted successfully by resident.",
        changed_by_id=current_user.id
    )
    db.add(timeline)
    
    # Notify admin
    # Resolving admins
    admins = db.query(User).filter(User.roles.any(name="ASSOCIATION_ADMIN")).all()
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            title="New Maintenance Ticket",
            message=f"A new ticket '{ticket.title}' has been raised for Unit {current_user.unit.number if current_user.unit else ''}.",
            notification_type="MAINTENANCE",
            reference_id=ticket.id,
            reference_type="maintenance_ticket"
        )
        db.add(notif)
        
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/tickets", response_model=List[MaintenanceTicketOut])
def get_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List maintenance tickets. Residents see their own. Technicians see assigned. Admins see all.
    """
    query = db.query(MaintenanceTicket)
    roles = [r.name for r in current_user.roles]
    
    # Filtering based on role
    if "ASSOCIATION_ADMIN" in roles or "PLATFORM_ADMIN" in roles or "PROPERTY_MANAGER" in roles:
        # Admins see all
        pass
    elif "SERVICE_PROVIDER" in roles:
        # Technicians see assigned tickets
        query = query.filter(MaintenanceTicket.assigned_technician_id == current_user.id)
    else:
        # Residents see their own unit's tickets
        query = query.filter(MaintenanceTicket.resident_id == current_user.id)
        
    if status:
        query = query.filter(MaintenanceTicket.status == status)
    if priority:
        query = query.filter(MaintenanceTicket.priority == priority)
    if category:
        query = query.filter(MaintenanceTicket.category == category)
        
    return query.order_by(MaintenanceTicket.created_at.desc()).all()

@router.get("/tickets/{ticket_id}", response_model=MaintenanceTicketOut)
def get_ticket_details(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve specific ticket details along with full audit log timeline.
    """
    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Maintenance ticket not found")
        
    roles = [r.name for r in current_user.roles]
    if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles and "PROPERTY_MANAGER" not in roles:
        if ticket.resident_id != current_user.id and ticket.assigned_technician_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
            
    return ticket

@router.put("/tickets/{ticket_id}", response_model=MaintenanceTicketOut)
def update_ticket(
    ticket_id: UUID,
    ticket_in: MaintenanceTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates ticket status, priority, technician, or resolution details.
    """
    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    roles = [r.name for r in current_user.roles]
    
    # 1. Handle assignment (Admins only)
    if ticket_in.assigned_technician_id:
        if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles and "PROPERTY_MANAGER" not in roles:
            raise HTTPException(status_code=403, detail="Only admins can assign technicians")
            
        ticket.assigned_technician_id = ticket_in.assigned_technician_id
        ticket.status = "ASSIGNED"
        # 24h SLA default deadline
        ticket.sla_deadline = datetime.now() + timedelta(days=1)
        
        # Log to timeline
        timeline = MaintenanceTimeline(
            ticket_id=ticket.id,
            status="ASSIGNED",
            notes=f"Ticket assigned to technician. SLA set to 24 hours.",
            changed_by_id=current_user.id
        )
        db.add(timeline)
        
        # Notify technician
        notif_tech = Notification(
            user_id=ticket_in.assigned_technician_id,
            title="New Maintenance Assignment",
            message=f"You have been assigned to ticket '{ticket.title}'.",
            notification_type="MAINTENANCE",
            reference_id=ticket.id,
            reference_type="maintenance_ticket"
        )
        db.add(notif_tech)
        
    # 2. Handle general status update (technician or admin)
    elif ticket_in.status:
        # Check permissions: resident can close/approve resolution. Technician/Admin can set to IN_PROGRESS, RESOLVED.
        if ticket_in.status in ["IN_PROGRESS", "RESOLVED"]:
            if "SERVICE_PROVIDER" not in roles and "ASSOCIATION_ADMIN" not in roles:
                raise HTTPException(status_code=403, detail="Only technicians or admins can modify progress")
        elif ticket_in.status in ["CLOSED", "REOPENED"]:
            if ticket.resident_id != current_user.id and "ASSOCIATION_ADMIN" not in roles:
                raise HTTPException(status_code=403, detail="Only the resident can close or reopen their ticket")
                
        ticket.status = ticket_in.status
        
        # Log timeline
        timeline = MaintenanceTimeline(
            ticket_id=ticket.id,
            status=ticket_in.status,
            notes=ticket_in.notes or f"Ticket status changed to {ticket_in.status}.",
            changed_by_id=current_user.id
        )
        db.add(timeline)
        
        # Notify Resident on progress
        if ticket_in.status == "RESOLVED":
            notif_res = Notification(
                user_id=ticket.resident_id,
                title="Maintenance Resolved",
                message=f"Your ticket '{ticket.title}' has been resolved. Please review and close it.",
                notification_type="MAINTENANCE",
                reference_id=ticket.id,
                reference_type="maintenance_ticket"
            )
            db.add(notif_res)
            
    db.commit()
    db.refresh(ticket)
    return ticket
