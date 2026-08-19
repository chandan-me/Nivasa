from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import ServiceProvider, ServiceRequest, User, Unit, Notification
from app.schemas.service import (
    ServiceProviderCreate, ServiceProviderUpdate, ServiceProviderOut,
    ServiceRequestCreate, ServiceRequestUpdate, ServiceRequestOut
)

router = APIRouter(prefix="/services", tags=["Local Services & Bookings"])

# --- PROVIDER DIRECTORY ---
@router.get("/providers", response_model=List[ServiceProviderOut])
def get_providers(
    category: Optional[str] = Query(None),
    verified_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """
    List all local service providers registered for the community.
    """
    query = db.query(ServiceProvider)
    if category:
        query = query.filter(ServiceProvider.category == category)
    if verified_only:
        query = query.filter(ServiceProvider.status == "VERIFIED")
        
    return query.all()

@router.post("/providers/register", response_model=ServiceProviderOut, status_code=status.HTTP_201_CREATED)
def register_provider_profile(
    profile_in: ServiceProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SERVICE_PROVIDER"]))
):
    """
    Service provider creates their professional profile.
    """
    # Check if profile already exists
    exists = db.query(ServiceProvider).filter(ServiceProvider.user_id == current_user.id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Profile already registered")
        
    profile = ServiceProvider(
        user_id=current_user.id,
        business_name=profile_in.business_name,
        category=profile_in.category,
        bio=profile_in.bio,
        rating=0.0,
        is_verified=False,
        status="PENDING"
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# --- BOOKING & SERVICE REQUESTS ---
@router.post("/requests", response_model=ServiceRequestOut, status_code=status.HTTP_201_CREATED)
def create_booking_request(
    request_in: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER"]))
):
    """
    Residents books a service provider job.
    """
    if not current_user.unit_id:
        raise HTTPException(status_code=400, detail="Must belong to a unit to book services")
        
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == request_in.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Service provider profile not found")
        
    request = ServiceRequest(
        provider_id=request_in.provider_id,
        resident_id=current_user.id,
        unit_id=current_user.unit_id,
        description=request_in.description,
        scheduled_time=request_in.scheduled_time,
        status="REQUESTED"
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    
    # Notify provider
    notif = Notification(
        user_id=provider.user_id,
        title="New Service Booking Request",
        message=f"Resident {current_user.first_name} requested your service on {request.scheduled_time.strftime('%Y-%m-%d %H:%M')}.",
        notification_type="SERVICE",
        reference_id=request.id,
        reference_type="service_request"
    )
    db.add(notif)
    db.commit()
    
    db.refresh(request)
    return request

@router.get("/requests", response_model=List[ServiceRequestOut])
def get_service_requests(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get job requests list. Providers see assigned requests. Residents see their own bookings.
    """
    query = db.query(ServiceRequest)
    roles = [r.name for r in current_user.roles]
    
    if "SERVICE_PROVIDER" in roles:
        # Resolve provider profile
        profile = db.query(ServiceProvider).filter(ServiceProvider.user_id == current_user.id).first()
        if not profile:
            return []
        query = query.filter(ServiceRequest.provider_id == profile.id)
    else:
        query = query.filter(ServiceRequest.resident_id == current_user.id)
        
    if status:
        query = query.filter(ServiceRequest.status == status)
        
    return query.order_by(ServiceRequest.scheduled_time.asc()).all()

@router.put("/requests/{request_id}", response_model=ServiceRequestOut)
def update_service_request(
    request_id: UUID,
    request_in: ServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Accepts, schedules, marks complete (providers) or rates/reviews (residents).
    """
    request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    roles = [r.name for r in current_user.roles]
    
    # 1. Resident leaves rating/review on completion
    if request_in.rating:
        if request.resident_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the booking resident can leave a review")
        if request.status != "COMPLETED":
            raise HTTPException(status_code=400, detail="Can only review completed service jobs")
            
        request.rating = request_in.rating
        request.review = request_in.review
        
        db.commit()
        
        # Re-calculate provider average rating
        provider = db.query(ServiceProvider).filter(ServiceProvider.id == request.provider_id).first()
        if provider:
            avg_rating = db.query(
                import_func := db.query(ServiceRequest)
                .filter(ServiceRequest.provider_id == provider.id, ServiceRequest.rating != None)
            )
            ratings = [r.rating for r in avg_rating.all()]
            if ratings:
                provider.rating = sum(ratings) / len(ratings)
                db.commit()
                
    # 2. Status transitions (provider accepts, starts, completes, cancels)
    elif request_in.status:
        # Check authorization
        provider_profile = db.query(ServiceProvider).filter(ServiceProvider.user_id == current_user.id).first()
        is_provider = provider_profile and request.provider_id == provider_profile.id
        is_resident = request.resident_id == current_user.id
        
        if request_in.status in ["ACCEPTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"]:
            if not is_provider:
                raise HTTPException(status_code=403, detail="Only the assigned provider can update progress")
        elif request_in.status == "CANCELLED":
            if not is_provider and not is_resident:
                raise HTTPException(status_code=403, detail="Only booking participants can cancel the service")
                
        request.status = request_in.status
        
        # Trigger notifications
        notif_user = request.resident_id if is_provider else request.provider.user_id
        notif_title = f"Service Request {request_in.status}"
        notif_msg = f"Your service booking status is now '{request_in.status}'."
        
        notif = Notification(
            user_id=notif_user,
            title=notif_title,
            message=notif_msg,
            notification_type="SERVICE",
            reference_id=request.id,
            reference_type="service_request"
        )
        db.add(notif)
        
    db.commit()
    db.refresh(request)
    return request
