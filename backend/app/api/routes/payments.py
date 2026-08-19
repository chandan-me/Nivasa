from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models import Payment, User, Notification
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentOut, PaymentSummaryOut

router = APIRouter(prefix="/payments", tags=["Billing & Payments"])

@router.get("", response_model=List[PaymentOut])
def get_payments(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List billing invoices. Residents see their own invoices. Admins see all invoices.
    """
    query = db.query(Payment)
    roles = [r.name for r in current_user.roles]
    
    if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles:
        query = query.filter(Payment.user_id == current_user.id)
        
    if status:
        query = query.filter(Payment.status == status)
        
    return query.order_by(Payment.due_date.asc()).all()

@router.get("/summary", response_model=PaymentSummaryOut)
def get_payment_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Returns aggregation metrics for due, paid, and overdue balances for the current resident.
    """
    payments = db.query(Payment).filter(Payment.user_id == current_user.id).all()
    
    total_due = 0.0
    total_paid = 0.0
    total_overdue = 0.0
    upcoming_due_date = None
    
    # Simple check for overdue
    today_date = date.today()
    
    pending_payments = []
    for p in payments:
        amount_val = float(p.amount)
        if p.status == "SUCCESSFUL":
            total_paid += amount_val
        elif p.status == "PENDING":
            total_due += amount_val
            pending_payments.append(p)
            # Check if overdue
            if p.due_date < today_date:
                total_overdue += amount_val
        elif p.status == "OVERDUE":
            total_due += amount_val
            total_overdue += amount_val
            pending_payments.append(p)
            
    # Find closest upcoming due date
    if pending_payments:
        pending_payments.sort(key=lambda x: x.due_date)
        upcoming_due_date = pending_payments[0].due_date
        
    return {
        "total_due": total_due,
        "total_paid": total_paid,
        "total_overdue": total_overdue,
        "upcoming_due_date": upcoming_due_date
    }

@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def raise_invoice(
    invoice_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ASSOCIATION_ADMIN", "PLATFORM_ADMIN"]))
):
    """
    Raises a new billing charge for a resident (Admins only).
    """
    payment = Payment(
        title=invoice_in.title,
        amount=invoice_in.amount,
        due_date=invoice_in.due_date,
        charge_type=invoice_in.charge_type,
        user_id=invoice_in.user_id,
        unit_id=invoice_in.unit_id,
        status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Notify resident
    notif = Notification(
        user_id=invoice_in.user_id,
        title="New Bill Raised",
        message=f"A new bill '{payment.title}' of ${payment.amount:.2f} has been raised. Due: {payment.due_date}.",
        notification_type="PAYMENT",
        reference_id=payment.id,
        reference_type="payment"
    )
    db.add(notif)
    db.commit()
    
    db.refresh(payment)
    return payment

@router.post("/{payment_id}/checkout", response_model=PaymentOut)
def pay_invoice(
    payment_id: UUID,
    checkout_in: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Executes mock checkout payment transactions.
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Invoice record not found")
        
    # Check permission (own bills only, unless admin)
    roles = [r.name for r in current_user.roles]
    if "ASSOCIATION_ADMIN" not in roles and "PLATFORM_ADMIN" not in roles and payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay this bill")
        
    payment.status = checkout_in.status
    if checkout_in.status == "SUCCESSFUL":
        payment.transaction_reference = checkout_in.transaction_reference or f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        payment.paid_at = checkout_in.paid_at or datetime.now()
        
        # Notify user of receipt
        notif = Notification(
            user_id=payment.user_id,
            title="Payment Received",
            message=f"Thank you! Your payment for '{payment.title}' was successful.",
            notification_type="PAYMENT",
            reference_id=payment.id,
            reference_type="payment"
        )
        db.add(notif)
        
    db.commit()
    db.refresh(payment)
    return payment
