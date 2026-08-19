from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import SupportTicket, SupportMessage, Report, User, MarketplaceListing
from app.schemas.support import (
    SupportTicketCreate, SupportTicketUpdate, SupportTicketOut,
    SupportMessageCreate, SupportMessageOut,
    ReportCreate, ReportUpdate, ReportOut
)

router = APIRouter(prefix="", tags=["Helpdesk Support & Moderation"])

# --- SUPPORT TICKETS ---
@router.post("/support/tickets", response_model=SupportTicketOut, status_code=status.HTTP_201_CREATED)
def raise_support_ticket(
    ticket_in: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Raises a support ticket (Any logged-in user).
    """
    ticket = SupportTicket(
        title=ticket_in.title,
        description=ticket_in.description,
        priority=ticket_in.priority,
        status="OPEN",
        user_id=current_user.id
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Add initial ticket message
    msg = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=ticket_in.description
    )
    db.add(msg)
    db.commit()
    
    db.refresh(ticket)
    return ticket

@router.get("/support/tickets", response_model=List[SupportTicketOut])
def get_support_tickets(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get support tickets list. Admins see all. Residents see their own.
    """
    query = db.query(SupportTicket)
    roles = [r.name for r in current_user.roles]
    
    if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        query = query.filter(SupportTicket.user_id == current_user.id)
        
    if status:
        query = query.filter(SupportTicket.status == status)
        
    return query.order_by(SupportTicket.created_at.desc()).all()

@router.get("/support/tickets/{ticket_id}", response_model=SupportTicketOut)
def get_support_ticket_details(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of support ticket and its message history.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")
        
    roles = [r.name for r in current_user.roles]
    if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        if ticket.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
            
    return ticket

@router.put("/support/tickets/{ticket_id}", response_model=SupportTicketOut)
def update_support_ticket(
    ticket_id: UUID,
    ticket_in: SupportTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Admin updates ticket status, priority, or assigns admin handler.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")
        
    if ticket_in.status:
        ticket.status = ticket_in.status
    if ticket_in.priority:
        ticket.priority = ticket_in.priority
    if ticket_in.assigned_admin_id:
        ticket.assigned_admin_id = ticket_in.assigned_admin_id
        if ticket.status == "OPEN":
            ticket.status = "ASSIGNED"
            
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/support/tickets/{ticket_id}/messages", response_model=SupportMessageOut, status_code=status.HTTP_201_CREATED)
def reply_to_ticket(
    ticket_id: UUID,
    msg_in: SupportMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Adds a reply message to the support ticket thread.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    roles = [r.name for r in current_user.roles]
    if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        if ticket.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to send messages in this ticket")
            
    msg = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=msg_in.message,
        file_url=msg_in.file_url
    )
    db.add(msg)
    
    # Auto progress status if open and admin replies
    if "ASSOCIATION_ADMIN" in roles or "PLATFORM_ADMIN" in roles:
        if ticket.status == "OPEN":
            ticket.status = "ASSIGNED"
            
    db.commit()
    db.refresh(msg)
    return msg


# --- MODERATION / REPORTS ---
@router.post("/reports", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def file_moderation_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submit a report flagging an item (e.g. offensive marketplace listing).
    """
    report = Report(
        reporter_id=current_user.id,
        reported_item_type=report_in.reported_item_type,
        reported_item_id=report_in.reported_item_id,
        reason=report_in.reason,
        details=report_in.details,
        status="PENDING"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.get("/reports", response_model=List[ReportOut])
def get_moderation_reports(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    View report queue (Admins only).
    """
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    return query.order_by(Report.created_at.desc()).all()

@router.put("/reports/{report_id}/resolve", response_model=ReportOut)
def resolve_report(
    report_id: UUID,
    report_in: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Admins resolve report and take action (Admins only).
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.status = report_in.status
    report.resolver_id = current_user.id
    report.resolved_at = datetime.now()
    
    # If approved / resolved as violation, hide the target item
    if report_in.status == "RESOLVED":
        if report.reported_item_type == "marketplace_listing":
            listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == report.reported_item_id).first()
            if listing:
                listing.status = "INACTIVE"
                
    db.commit()
    db.refresh(report)
    return report
