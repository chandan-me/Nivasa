from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta, date

from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.models import (
    User, Unit, Visitor, MaintenanceTicket, Payment, ServiceProvider, 
    MarketplaceListing, ServiceRequest, Role
)
from app.schemas.user import UserOut
from app.schemas.service import ServiceProviderOut

router = APIRouter(prefix="/admin", tags=["Admin Operations & Analytics"])

# --- ADMIN DASHBOARD KPIs ---
@router.get("/dashboard/kpis", dependencies=[Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN", "PROPERTY_MANAGER"]))])
def get_dashboard_kpis(db: Session = Depends(get_db)):
    """
    Calculate and return key performance indicators from PostgreSQL database dynamically.
    """
    total_residents = db.query(User).join(User.roles).filter(Role.name.in_(["RESIDENT", "FAMILY_MEMBER"])).count()
    total_units = db.query(Unit).count()
    occupied_units = db.query(Unit).filter(Unit.status == "OCCUPIED").count()
    
    active_visitors = db.query(Visitor).filter(Visitor.status == "ENTERED").count()
    open_maintenance = db.query(MaintenanceTicket).filter(MaintenanceTicket.status.in_(["OPEN", "ASSIGNED", "IN_PROGRESS"])).count()
    
    # Calculate payment collections
    payments = db.query(Payment).all()
    total_due = 0.0
    total_collected = 0.0
    
    for p in payments:
        amount_val = float(p.amount)
        if p.status == "SUCCESSFUL":
            total_collected += amount_val
        elif p.status in ["PENDING", "OVERDUE"]:
            total_due += amount_val
            
    total_billing = total_collected + total_due
    collection_rate = (total_collected / total_billing * 100) if total_billing > 0 else 100.0
    
    service_requests = db.query(ServiceRequest).count()
    marketplace_activity = db.query(MarketplaceListing).filter(MarketplaceListing.status == "ACTIVE").count()

    return {
        "total_residents": total_residents,
        "total_units": total_units,
        "occupancy_rate": (occupied_units / total_units * 100) if total_units > 0 else 0,
        "active_visitors": active_visitors,
        "open_maintenance": open_maintenance,
        "collection_rate": collection_rate,
        "total_collected": total_collected,
        "total_due": total_due,
        "service_requests": service_requests,
        "marketplace_listings": marketplace_activity
    }

# --- ANALYTICS CHARTS ---
@router.get("/analytics/charts", dependencies=[Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))])
def get_analytics_charts(
    range_type: str = Query("weekly", description="daily, weekly, monthly"),
    db: Session = Depends(get_db)
):
    """
    Generate aggregate timeseries for payment collections, visitor volumes, and maintenance tickets resolution SLA.
    """
    # 1. Payment collections (Mock charts data based on database records grouped by category or type)
    # Let's count charges grouped by status
    status_counts = db.query(Payment.status, func.count(Payment.id)).group_by(Payment.status).all()
    payment_chart = [{"name": s, "value": count} for s, count in status_counts]
    
    # 2. Visitor volumes over last 7 days
    visitor_chart = []
    today = date.today()
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        visitor_count = db.query(Visitor).filter(Visitor.date == target_date).count()
        visitor_chart.append({
            "date": target_date.strftime("%b %d"),
            "visitors": visitor_count
        })
        
    # 3. Maintenance Category loads
    maint_counts = db.query(
        MaintenanceTicket.category, 
        func.count(MaintenanceTicket.id)
    ).group_by(MaintenanceTicket.category).all()
    
    maintenance_chart = [{"category": cat, "count": count} for cat, count in maint_counts]

    return {
        "payment_collection": payment_chart,
        "visitor_volume": visitor_chart,
        "maintenance_distribution": maintenance_chart
    }


# --- USER RESIDENT MANAGEMENT ---
@router.get("/residents", response_model=List[UserOut], dependencies=[Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN", "PROPERTY_MANAGER"]))])
def get_residents_list(db: Session = Depends(get_db)):
    """
    Retrieve all users registered in the system (Admins only).
    """
    return db.query(User).all()

@router.put("/residents/{user_id}/verify", response_model=UserOut, dependencies=[Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))])
def verify_resident(user_id: UUID, db: Session = Depends(get_db)):
    """
    Verifies / Approves a newly registered resident.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return user

@router.put("/residents/{user_id}/deactivate", response_model=UserOut, dependencies=[Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))])
def deactivate_user(user_id: UUID, db: Session = Depends(get_db)):
    """
    Deactivates a user account (e.g. resident moved out).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


# --- VENDOR MANAGEMENT ---
@router.get("/vendors", response_model=List[ServiceProviderOut], dependencies=[Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN", "PROPERTY_MANAGER"]))])
def get_vendors_list(db: Session = Depends(get_db)):
    """
    Retrieve list of all service provider profiles (Admins only).
    """
    return db.query(ServiceProvider).all()

@router.put("/vendors/{vendor_id}/verify", response_model=ServiceProviderOut, dependencies=[Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))])
def verify_vendor(vendor_id: UUID, db: Session = Depends(get_db)):
    """
    Approve vendor credentials (Admins only).
    """
    vendor = db.query(ServiceProvider).filter(ServiceProvider.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
        
    vendor.status = "VERIFIED"
    vendor.is_verified = True
    db.commit()
    db.refresh(vendor)
    return vendor

@router.put("/vendors/{vendor_id}/suspend", response_model=ServiceProviderOut, dependencies=[Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))])
def suspend_vendor(vendor_id: UUID, db: Session = Depends(get_db)):
    """
    Suspends vendor access (Admins only).
    """
    vendor = db.query(ServiceProvider).filter(ServiceProvider.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
        
    vendor.status = "SUSPENDED"
    vendor.is_verified = False
    db.commit()
    db.refresh(vendor)
    return vendor
