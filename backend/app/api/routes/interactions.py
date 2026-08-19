from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import (
    Announcement, Poll, PollOption, PollVote, Event, EventRSVP, Document, User, Notification
)
from app.schemas.interactions import (
    AnnouncementCreate, AnnouncementOut,
    PollCreate, PollOut, PollVoteCreate,
    EventCreate, EventOut, EventRSVPCreate, EventRSVPOut,
    DocumentCreate, DocumentOut
)

router = APIRouter(prefix="", tags=["Community interactions"])

# --- ANNOUNCEMENTS ---
@router.post("/announcements", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
def create_announcement(
    ann_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Creates a new community announcement (Admins only).
    """
    # Find user's community
    # For simplicity, association admin belongs to green valley
    from app.models import Community
    community = db.query(Community).first()
    if not community:
        raise HTTPException(status_code=400, detail="No community registered yet")

    announcement = Announcement(
        title=ann_in.title,
        content=ann_in.content,
        community_id=community.id,
        building_id=ann_in.building_id,
        is_pinned=ann_in.is_pinned,
        expires_at=ann_in.expires_at,
        created_by_id=current_user.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    
    # Notify residents matching target
    residents_query = db.query(User).filter(User.roles.any(name="RESIDENT"))
    if ann_in.building_id:
        residents_query = residents_query.filter(User.unit.has(building_id=ann_in.building_id))
    
    residents = residents_query.all()
    for res in residents:
        notif = Notification(
            user_id=res.id,
            title="New Announcement",
            message=f"A new announcement '{announcement.title}' has been published.",
            notification_type="ANNOUNCEMENT",
            reference_id=announcement.id,
            reference_type="announcement"
        )
        db.add(notif)
        
    db.commit()
    db.refresh(announcement)
    return announcement

@router.get("/announcements", response_model=List[AnnouncementOut])
def get_announcements(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Get active announcements targeted at the resident's community or specific building.
    """
    query = db.query(Announcement)
    
    # If resident, filter by building_id matching their unit
    roles = [r.name for r in current_user.roles]
    if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        if current_user.unit:
            query = query.filter(
                (Announcement.building_id == None) | 
                (Announcement.building_id == current_user.unit.building_id)
            )
            
    # Filter expired announcements
    query = query.filter(
        (Announcement.expires_at == None) | 
        (Announcement.expires_at > datetime.now())
    )
    
    return query.order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).all()


# --- POLLS ---
@router.post("/polls", response_model=PollOut, status_code=status.HTTP_201_CREATED)
def create_poll(
    poll_in: PollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Creates a new community poll with options (Admins only).
    """
    from app.models import Community
    community = db.query(Community).first()
    if not community:
        raise HTTPException(status_code=400, detail="No community registered yet")

    poll = Poll(
        question=poll_in.question,
        community_id=community.id,
        expires_at=poll_in.expires_at,
        created_by_id=current_user.id
    )
    db.add(poll)
    db.commit()
    db.refresh(poll)

    for opt_create in poll_in.options:
        opt = PollOption(poll_id=poll.id, option_text=opt_create.option_text)
        db.add(opt)
        
    db.commit()
    db.refresh(poll)
    return poll

@router.get("/polls", response_model=List[PollOut])
def get_polls(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Retrieve active polls in the community, along with option vote aggregates.
    """
    polls = db.query(Poll).order_by(Poll.created_at.desc()).all()
    
    for p in polls:
        # Calculate vote counts for options
        for opt in p.options:
            opt.vote_count = db.query(PollVote).filter(PollVote.option_id == opt.id).count()
            
        # Determine if current user voted
        user_vote = db.query(PollVote).filter(PollVote.poll_id == p.id, PollVote.user_id == current_user.id).first()
        if user_vote:
            p.user_voted_option_id = user_vote.option_id
            
    return polls

@router.post("/polls/{poll_id}/vote", response_model=PollOut)
def vote_poll(
    poll_id: UUID,
    vote_in: PollVoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER"]))
):
    """
    Records a vote on a poll. Double voting is restricted by DB constraints.
    """
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
        
    if poll.expires_at < datetime.now():
        raise HTTPException(status_code=400, detail="Poll has expired")
        
    # Check duplicate
    exists = db.query(PollVote).filter(PollVote.poll_id == poll_id, PollVote.user_id == current_user.id).first()
    if exists:
        raise HTTPException(status_code=400, detail="You have already voted on this poll")
        
    vote = PollVote(
        poll_id=poll_id,
        option_id=vote_in.option_id,
        user_id=current_user.id
    )
    db.add(vote)
    db.commit()
    
    # Return refreshed poll details
    db.refresh(poll)
    for opt in poll.options:
        opt.vote_count = db.query(PollVote).filter(PollVote.option_id == opt.id).count()
    poll.user_voted_option_id = vote_in.option_id
    return poll


# --- EVENTS ---
@router.post("/events", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Schedules a community event (Admins only).
    """
    from app.models import Community
    community = db.query(Community).first()
    if not community:
        raise HTTPException(status_code=400, detail="No community registered yet")

    event = Event(
        title=event_in.title,
        description=event_in.description,
        location=event_in.location,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        capacity=event_in.capacity,
        community_id=community.id,
        created_by_id=current_user.id,
        status="UPCOMING"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.get("/events", response_model=List[EventOut])
def get_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    List scheduled events.
    """
    events = db.query(Event).order_by(Event.start_time.asc()).all()
    for ev in events:
        # Resolve current user RSVP status
        rsvp = db.query(EventRSVP).filter(EventRSVP.event_id == ev.id, EventRSVP.user_id == current_user.id).first()
        ev.user_rsvp_status = rsvp.status if rsvp else None
    return events

@router.post("/events/{event_id}/rsvp", response_model=EventRSVPOut)
def record_rsvp(
    event_id: UUID,
    rsvp_in: EventRSVPCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER"]))
):
    """
    Registers or updates user RSVP status for an event (Checking capacity constraints).
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.start_time < datetime.now():
        raise HTTPException(status_code=400, detail="Cannot RSVP to a past event")
        
    # Capacity check if YES rsvp
    if rsvp_in.status == "YES" and event.capacity:
        current_yes_count = db.query(EventRSVP).filter(EventRSVP.event_id == event_id, EventRSVP.status == "YES").count()
        if current_yes_count >= event.capacity:
            raise HTTPException(status_code=400, detail="Event is already at full capacity")
            
    # Check existing RSVP
    rsvp = db.query(EventRSVP).filter(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id).first()
    if rsvp:
        rsvp.status = rsvp_in.status
    else:
        rsvp = EventRSVP(
            event_id=event_id,
            user_id=current_user.id,
            status=rsvp_in.status
        )
        db.add(rsvp)
        
    db.commit()
    db.refresh(rsvp)
    return rsvp


# --- DOCUMENTS ---
@router.post("/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Uploads/registers a community document (Admins only).
    """
    from app.models import Community
    community = db.query(Community).first()
    if not community:
        raise HTTPException(status_code=400, detail="No community registered yet")

    doc = Document(
        title=doc_in.title,
        file_url=doc_in.file_url,
        category=doc_in.category,
        community_id=community.id,
        building_id=doc_in.building_id,
        uploaded_by_id=current_user.id,
        access_level=doc_in.access_level
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/documents", response_model=List[DocumentOut])
def get_documents(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List documents that the user has permission to read.
    """
    query = db.query(Document)
    roles = [r.name for r in current_user.roles]
    
    # Filters by access levels
    if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        # Residents/Guards see files with RESIDENT/PUBLIC levels
        query = query.filter(Document.access_level.in_(["RESIDENT", "PUBLIC"]))
        
    if category:
        query = query.filter(Document.category == category)
        
    return query.order_by(Document.created_at.desc()).all()
