from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import Community, Building, Unit, User, Role
from app.schemas.community import (
    CommunityCreate, CommunityOut, BuildingCreate, BuildingOut, 
    UnitCreate, UnitOut, DirectoryMemberOut
)

router = APIRouter(prefix="/communities", tags=["Community Management"])

@router.get("", response_model=List[CommunityOut])
def get_communities(db: Session = Depends(get_db)):
    """
    List all communities.
    """
    return db.query(Community).all()

@router.post("", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
def create_community(
    community_in: CommunityCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["PLATFORM_ADMIN"]))
):
    """
    Create a new community (Platform Admin only).
    """
    community = Community(
        name=community_in.name,
        address=community_in.address,
        description=community_in.description
    )
    db.add(community)
    db.commit()
    db.refresh(community)
    return community

@router.get("/{community_id}/buildings", response_model=List[BuildingOut])
def get_buildings(community_id: UUID, db: Session = Depends(get_db)):
    """
    List all buildings/towers within a community.
    """
    return db.query(Building).filter(Building.community_id == community_id).all()

@router.post("/buildings", response_model=BuildingOut, status_code=status.HTTP_201_CREATED)
def create_building(
    building_in: BuildingCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Create a building (Admin only).
    """
    building = Building(
        name=building_in.name,
        community_id=building_in.community_id,
        description=building_in.description
    )
    db.add(building)
    db.commit()
    db.refresh(building)
    return building

@router.get("/buildings/{building_id}/units", response_model=List[UnitOut])
def get_units(building_id: UUID, db: Session = Depends(get_db)):
    """
    List all units in a building.
    """
    return db.query(Unit).filter(Unit.building_id == building_id).all()

@router.post("/units", response_model=UnitOut, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit_in: UnitCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Create a unit (Admin only).
    """
    unit = Unit(
        building_id=unit_in.building_id,
        number=unit_in.number,
        floor=unit_in.floor,
        status=unit_in.status
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit

@router.get("/{community_id}/directory", response_model=List[DirectoryMemberOut])
def get_directory(
    community_id: UUID,
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the community resident directory. Exposes only safe contact details.
    """
    query = db.query(User).join(Unit).join(Building).filter(Building.community_id == community_id)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(search_filter)) | 
            (User.last_name.ilike(search_filter)) | 
            (User.email.ilike(search_filter))
        )
        
    users = query.all()
    
    directory = []
    for u in users:
        # Resolve user role name
        role_name = u.roles[0].name if u.roles else "RESIDENT"
        
        # We only want to list residents, family members in the community directory
        if role_name in ["RESIDENT", "FAMILY_MEMBER"]:
            directory.append({
                "id": u.id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "phone": u.phone,
                "role_name": role_name,
                "building_name": u.unit.building.name if u.unit else "N/A",
                "unit_number": u.unit.number if u.unit else "N/A"
            })
            
    return directory
