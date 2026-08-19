from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import MarketplaceListing, Rental, LostFoundItem, User, Community, Notification
from app.schemas.marketplace import (
    MarketplaceListingCreate, MarketplaceListingUpdate, MarketplaceListingOut,
    RentalCreate, RentalUpdate, RentalOut,
    LostFoundItemCreate, LostFoundItemUpdate, LostFoundItemOut
)

router = APIRouter(prefix="/marketplace", tags=["Community Marketplace & Lost/Found"])

# --- CLASSIFIED LISTINGS ---
@router.post("/listings", response_model=MarketplaceListingOut, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: MarketplaceListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER"]))
):
    """
    Creates a new classified listing (Sell, Rent, Borrow, Give Away).
    """
    community = db.query(Community).first()
    if not community:
        raise HTTPException(status_code=400, detail="No community registered")
        
    listing = MarketplaceListing(
        title=listing_in.title,
        description=listing_in.description,
        price=listing_in.price,
        condition=listing_in.condition,
        listing_type=listing_in.listing_type,
        status="ACTIVE",
        user_id=current_user.id,
        community_id=community.id,
        image_url=listing_in.image_url
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing

@router.get("/listings", response_model=List[MarketplaceListingOut])
def get_listings(
    listing_type: Optional[str] = Query(None),
    status: Optional[str] = Query("ACTIVE"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Query classified listings. Supports full search and filter parameters.
    """
    query = db.query(MarketplaceListing)
    if status:
        query = query.filter(MarketplaceListing.status == status)
    if listing_type:
        query = query.filter(MarketplaceListing.listing_type == listing_type)
    if search:
        query = query.filter(
            (MarketplaceListing.title.ilike(f"%{search}%")) |
            (MarketplaceListing.description.ilike(f"%{search}%"))
        )
    return query.order_by(MarketplaceListing.created_at.desc()).all()

@router.put("/listings/{listing_id}", response_model=MarketplaceListingOut)
def update_listing(
    listing_id: UUID,
    listing_in: MarketplaceListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates or deletes a marketplace listing (Creator only, or Moderator/Admin).
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    roles = [r.name for r in current_user.roles]
    if listing.user_id != current_user.id and "ASSOCIATION_ADMIN" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")
        
    for k, v in listing_in.model_dump(exclude_unset=True).items():
        setattr(listing, k, v)
        
    db.commit()
    db.refresh(listing)
    return listing

# --- BORROW & RENTALS ---
@router.post("/rentals", response_model=RentalOut, status_code=status.HTTP_201_CREATED)
def request_rental(
    rental_in: RentalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER"]))
):
    """
    Submits a borrow or rent request for an active item.
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == rental_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Item listing not found")
    if listing.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Item is not active/available")
        
    rental = Rental(
        listing_id=rental_in.listing_id,
        owner_id=listing.user_id,
        renter_id=current_user.id,
        price=listing.price,
        start_date=rental_in.start_date,
        end_date=rental_in.end_date,
        status="REQUESTED"
    )
    db.add(rental)
    db.commit()
    db.refresh(rental)
    
    # Notify Owner
    notif = Notification(
        user_id=listing.user_id,
        title="New Rental Request",
        message=f"Someone requested to borrow/rent your item '{listing.title}'.",
        notification_type="MARKETPLACE",
        reference_id=rental.id,
        reference_type="rental"
    )
    db.add(notif)
    db.commit()
    
    db.refresh(rental)
    return rental

@router.get("/rentals", response_model=List[RentalOut])
def get_rentals(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    List user rentals (owned items or items requested to borrow/rent).
    """
    return db.query(Rental).filter(
        (Rental.owner_id == current_user.id) | (Rental.renter_id == current_user.id)
    ).order_by(Rental.created_at.desc()).all()

@router.put("/rentals/{rental_id}", response_model=RentalOut)
def update_rental_status(
    rental_id: UUID,
    rental_in: RentalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update status of borrow/rental request (accept, confirm active, return).
    """
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental transaction not found")
        
    is_owner = rental.owner_id == current_user.id
    is_renter = rental.renter_id == current_user.id
    
    if not is_owner and not is_renter:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Check transitions
    if rental_in.status == "ACCEPTED" and not is_owner:
        raise HTTPException(status_code=403, detail="Only owner can accept rental request")
        
    rental.status = rental_in.status
    
    # If active, mark listing as rented/unavailable
    if rental_in.status == "ACTIVE":
        rental.listing.status = "RENTED"
    elif rental_in.status == "COMPLETED":
        rental.listing.status = "ACTIVE" # make available again
        
    db.commit()
    
    # Notify counterparty
    notif_target = rental.renter_id if is_owner else rental.owner_id
    notif = Notification(
        user_id=notif_target,
        title="Rental Status Update",
        message=f"Your rental booking status for '{rental.listing.title}' was updated to '{rental_in.status}'.",
        notification_type="MARKETPLACE",
        reference_id=rental.id,
        reference_type="rental"
    )
    db.add(notif)
    db.commit()
    
    db.refresh(rental)
    return rental


# --- LOST & FOUND ---
@router.post("/lost-found", response_model=LostFoundItemOut, status_code=status.HTTP_201_CREATED)
def create_lost_found_report(
    item_in: LostFoundItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER"]))
):
    """
    Submit lost or found item reports.
    """
    item = LostFoundItem(
        title=item_in.title,
        description=item_in.description,
        item_type=item_in.item_type,
        location=item_in.location,
        date_reported=item_in.date_reported,
        status="OPEN",
        user_id=current_user.id,
        image_url=item_in.image_url
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/lost-found", response_model=List[LostFoundItemOut])
def get_lost_found_items(
    item_type: Optional[str] = Query(None),
    status: Optional[str] = Query("OPEN"),
    db: Session = Depends(get_db)
):
    """
    List reported lost & found items.
    """
    query = db.query(LostFoundItem)
    if status:
        query = query.filter(LostFoundItem.status == status)
    if item_type:
        query = query.filter(LostFoundItem.item_type == item_type)
    return query.order_by(LostFoundItem.date_reported.desc()).all()

@router.put("/lost-found/{item_id}", response_model=LostFoundItemOut)
def update_lost_found_item(
    item_id: UUID,
    item_in: LostFoundItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update details/claim status of lost & found item.
    """
    item = db.query(LostFoundItem).filter(LostFoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    roles = [r.name for r in current_user.roles]
    if item.user_id != current_user.id and "ASSOCIATION_ADMIN" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    for k, v in item_in.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
        
    db.commit()
    db.refresh(item)
    return item
