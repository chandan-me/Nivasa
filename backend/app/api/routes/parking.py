from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import Vehicle, ParkingSlot, ParkingViolation, User
from app.schemas.parking import (
    VehicleCreate, VehicleOut,
    ParkingSlotCreate, ParkingSlotAssign, ParkingSlotOut,
    ParkingViolationCreate, ParkingViolationOut
)

router = APIRouter(prefix="/parking", tags=["Vehicles & Parking"])

# --- VEHICLES ---
@router.post("/vehicles", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def register_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["RESIDENT", "FAMILY_MEMBER"]))
):
    """
    Registers a resident vehicle.
    """
    # Check duplicate registration number
    exists = db.query(Vehicle).filter(Vehicle.registration_number == vehicle_in.registration_number).first()
    if exists:
        raise HTTPException(status_code=400, detail="Vehicle with this registration number already exists")
        
    vehicle = Vehicle(
        user_id=current_user.id,
        registration_number=vehicle_in.registration_number.upper(),
        vehicle_type=vehicle_in.vehicle_type,
        model=vehicle_in.model,
        color=vehicle_in.color
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("/vehicles", response_model=List[VehicleOut])
def get_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    List resident vehicles. Residents see their own. Admins/Guards see all.
    """
    query = db.query(Vehicle)
    roles = [r.name for r in current_user.roles]
    
    if "SECURITY_GUARD" not in roles and "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        query = query.filter(Vehicle.user_id == current_user.id)
        
    return query.all()

@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Removes a registered vehicle.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    roles = [r.name for r in current_user.roles]
    if vehicle.user_id != current_user.id and "ASSOCIATION_ADMIN" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(vehicle)
    db.commit()
    return None


# --- PARKING SLOTS ---
@router.get("/slots", response_model=List[ParkingSlotOut])
def get_slots(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List slot occupancies.
    """
    query = db.query(ParkingSlot)
    if status:
        query = query.filter(ParkingSlot.status == status)
    return query.order_by(ParkingSlot.slot_number.asc()).all()

@router.put("/slots/{slot_id}/assign", response_model=ParkingSlotOut)
def assign_parking_slot(
    slot_id: UUID,
    assign_in: ParkingSlotAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Assigns slot to a resident and vehicle (Admins only).
    """
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found")
        
    slot.assigned_user_id = assign_in.assigned_user_id
    slot.vehicle_id = assign_in.vehicle_id
    slot.status = assign_in.status
    
    db.commit()
    db.refresh(slot)
    return slot


# --- VIOLATIONS ---
@router.post("/violations", response_model=ParkingViolationOut, status_code=status.HTTP_201_CREATED)
def report_violation(
    violation_in: ParkingViolationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Report a parking slot violation (e.g. wrong car parked in my slot).
    """
    violation = ParkingViolation(
        vehicle_id=violation_in.vehicle_id,
        slot_id=violation_in.slot_id,
        description=violation_in.description,
        reported_by_id=current_user.id
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)
    return violation

@router.get("/violations", response_model=List[ParkingViolationOut])
def get_violations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List violations log (Guards/Admins see all. Residents see their reported).
    """
    query = db.query(ParkingViolation)
    roles = [r.name for r in current_user.roles]
    
    if "SECURITY_GUARD" not in roles and "ASSOCIATION_ADMIN" not in roles:
        query = query.filter(ParkingViolation.reported_by_id == current_user.id)
        
    return query.order_by(ParkingViolation.created_at.desc()).all()
