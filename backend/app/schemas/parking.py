from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class VehicleCreate(BaseModel):
    registration_number: str = Field(..., min_length=2, max_length=50)
    vehicle_type: str # CAR, MOTORCYCLE, BICYCLE, OTHER
    model: str = Field(..., min_length=1, max_length=100)
    color: str = Field(..., min_length=1, max_length=50)

class VehicleOut(VehicleCreate):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ParkingSlotCreate(BaseModel):
    slot_number: str = Field(..., min_length=1, max_length=50)
    building_id: Optional[UUID] = None

class ParkingSlotAssign(BaseModel):
    assigned_user_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None
    status: str = "OCCUPIED" # OCCUPIED, VACANT, RESERVED

class ParkingSlotOut(BaseModel):
    id: UUID
    slot_number: str
    building_id: Optional[UUID] = None
    status: str
    assigned_user_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ParkingViolationCreate(BaseModel):
    vehicle_id: Optional[UUID] = None
    slot_id: Optional[UUID] = None
    description: str = Field(...)

class ParkingViolationOut(BaseModel):
    id: UUID
    vehicle_id: Optional[UUID] = None
    slot_id: Optional[UUID] = None
    description: str
    reported_by_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True
