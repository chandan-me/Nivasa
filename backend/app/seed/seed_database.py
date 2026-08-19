import sys
import os
from datetime import date, datetime, timedelta, time, timezone

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, verify_connection
from app.core.security import get_password_hash
from app.models import (
    Role, User, Community, Building, Unit, FamilyMember, Visitor, GateEvent,
    Delivery, MaintenanceTicket, MaintenanceTimeline, Announcement, Poll,
    PollOption, PollVote, Event, EventRSVP, Payment, ServiceProvider,
    ServiceRequest, MarketplaceListing, Rental, LostFoundItem, Vehicle,
    ParkingSlot, ParkingViolation, Notification, Document, SupportTicket,
    SupportMessage, Report, Conversation, Message
)

def seed_db():
    db: Session = SessionLocal()
    try:
        print("Starting database seeding...")
        
        # 1. Seed Roles
        role_names = [
            "RESIDENT", "FAMILY_MEMBER", "SECURITY_GUARD", 
            "ASSOCIATION_ADMIN", "PROPERTY_MANAGER", 
            "SERVICE_PROVIDER", "PLATFORM_ADMIN"
        ]
        roles_dict = {}
        for r_name in role_names:
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name, description=f"Role representing {r_name.lower().replace('_', ' ')}")
                db.add(role)
                db.commit()
                db.refresh(role)
            roles_dict[r_name] = role
        print("Roles seeded successfully.")

        # 2. Seed Community
        community = db.query(Community).filter(Community.name == "Green Valley Apartments").first()
        if not community:
            community = Community(
                name="Green Valley Apartments",
                address="123 Nature Boulevard, Eco City",
                description="A modern, eco-friendly smart residential community."
            )
            db.add(community)
            db.commit()
            db.refresh(community)
        print(f"Community '{community.name}' seeded.")

        # 3. Seed Buildings
        b_names = ["Tower A", "Tower B"]
        buildings_dict = {}
        for b_name in b_names:
            building = db.query(Building).filter(Building.name == b_name, Building.community_id == community.id).first()
            if not building:
                building = Building(
                    name=b_name,
                    community_id=community.id,
                    description=f"{b_name} of Green Valley Apartments"
                )
                db.add(building)
                db.commit()
                db.refresh(building)
            buildings_dict[b_name] = building
        print("Buildings seeded.")

        # 4. Seed Units
        units_dict = {}
        # Tower A Units
        for floor in [1, 2]:
            for num in [1, 2]:
                u_num = f"A-{floor}0{num}"
                unit = db.query(Unit).filter(Unit.number == u_num, Unit.building_id == buildings_dict["Tower A"].id).first()
                if not unit:
                    unit = Unit(
                        building_id=buildings_dict["Tower A"].id,
                        number=u_num,
                        floor=floor,
                        status="VACANT"
                    )
                    db.add(unit)
                units_dict[u_num] = unit

        # Tower B Units
        for floor in [1, 2]:
            for num in [1, 2]:
                u_num = f"B-{floor}0{num}"
                unit = db.query(Unit).filter(Unit.number == u_num, Unit.building_id == buildings_dict["Tower B"].id).first()
                if not unit:
                    unit = Unit(
                        building_id=buildings_dict["Tower B"].id,
                        number=u_num,
                        floor=floor,
                        status="VACANT"
                    )
                    db.add(unit)
                units_dict[u_num] = unit
        db.commit()
        # Refresh units
        for k in units_dict:
            db.refresh(units_dict[k])
        print("Units seeded.")

        # Helper to create user
        def create_user_if_not_exists(email, password, first_name, last_name, role_name, unit_id=None, phone=None):
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    password_hash=get_password_hash(password),
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone or "+1-555-0199",
                    is_active=True,
                    is_verified=True,
                    unit_id=unit_id
                )
                user.roles.append(roles_dict[role_name])
                db.add(user)
                db.commit()
                db.refresh(user)
                
                # If assigned to a unit, update unit status to OCCUPIED
                if unit_id:
                    unit = db.query(Unit).filter(Unit.id == unit_id).first()
                    if unit:
                        unit.status = "OCCUPIED"
                        db.commit()
            return user

        # 5. Seed Users for each role
        admin_user = create_user_if_not_exists(
            "admin@apartmenthub.com", "admin123", "Amit", "Sharma", "ASSOCIATION_ADMIN"
        )
        manager_user = create_user_if_not_exists(
            "manager@apartmenthub.com", "manager123", "Vikram", "Rathore", "PROPERTY_MANAGER"
        )
        guard_user = create_user_if_not_exists(
            "guard@apartmenthub.com", "guard123", "Ram", "Singh", "SECURITY_GUARD"
        )
        resident_a = create_user_if_not_exists(
            "residenta@apartmenthub.com", "resident123", "Rahul", "Verma", "RESIDENT", 
            unit_id=units_dict["A-101"].id, phone="+1-555-0101"
        )
        resident_b = create_user_if_not_exists(
            "residentb@apartmenthub.com", "resident123", "Priya", "Patel", "RESIDENT", 
            unit_id=units_dict["B-101"].id, phone="+1-555-0102"
        )
        provider_user = create_user_if_not_exists(
            "plumber@localhandy.com", "plumber123", "Ravi", "Kumar", "SERVICE_PROVIDER", phone="+1-555-0188"
        )
        
        # Add family member associated with residentA
        family_user = db.query(User).filter(User.email == "familya@apartmenthub.com").first()
        if not family_user:
            family_user = User(
                email="familya@apartmenthub.com",
                password_hash=get_password_hash("family123"),
                first_name="Neha",
                last_name="Verma",
                phone="+1-555-0103",
                is_active=True,
                is_verified=True,
                unit_id=units_dict["A-101"].id
            )
            family_user.roles.append(roles_dict["FAMILY_MEMBER"])
            db.add(family_user)
            db.commit()
            db.refresh(family_user)

            family_member = FamilyMember(
                user_id=family_user.id,
                resident_id=resident_a.id,
                relationship="Spouse",
                permissions={"can_approve_visitors": True}
            )
            db.add(family_member)
            db.commit()

        # Seed service provider profile details
        provider_profile = db.query(ServiceProvider).filter(ServiceProvider.user_id == provider_user.id).first()
        if not provider_profile:
            provider_profile = ServiceProvider(
                user_id=provider_user.id,
                business_name="Kumar Plumbing Services",
                category="PLUMBER",
                bio="Expert plumbing, leak repairs, and installation services.",
                rating=4.8,
                is_verified=True,
                status="VERIFIED"
            )
            db.add(provider_profile)
            db.commit()

        print("Users and Profiles seeded.")

        # 6. Seed Vehicles and Parking Slots
        vehicle = db.query(Vehicle).filter(Vehicle.registration_number == "MH-12-AB-1234").first()
        if not vehicle:
            vehicle = Vehicle(
                user_id=resident_a.id,
                registration_number="MH-12-AB-1234",
                vehicle_type="CAR",
                model="Honda City",
                color="Silver"
            )
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)
            
        # Create parking slots and assign
        slots = [
            ("P-A01", "Tower A", resident_a.id, vehicle.id),
            ("P-A02", "Tower A", None, None),
            ("P-B01", "Tower B", resident_b.id, None),
        ]
        for slot_num, b_name, user_id, veh_id in slots:
            slot = db.query(ParkingSlot).filter(ParkingSlot.slot_number == slot_num).first()
            if not slot:
                slot = ParkingSlot(
                    slot_number=slot_num,
                    building_id=buildings_dict[b_name].id,
                    status="OCCUPIED" if user_id else "VACANT",
                    assigned_user_id=user_id,
                    vehicle_id=veh_id
                )
                db.add(slot)
        db.commit()
        print("Vehicles and Parking Slots seeded.")

        # 7. Seed Visitors
        visitor = db.query(Visitor).filter(Visitor.name == "John Doe").first()
        if not visitor:
            visitor = Visitor(
                name="John Doe",
                phone="+1-555-0211",
                purpose="Delivery/Friend",
                date=date.today(),
                start_time=time(14, 0),
                end_time=time(16, 0),
                vehicle_details="Yamaha R15",
                resident_id=resident_a.id,
                unit_id=units_dict["A-101"].id,
                status="EXPECTED"
            )
            db.add(visitor)
            db.commit()
            db.refresh(visitor)

        # 8. Seed Deliveries
        delivery = db.query(Delivery).filter(Delivery.tracking_number == "TRK-AMZN-9988").first()
        if not delivery:
            delivery = Delivery(
                resident_id=resident_a.id,
                unit_id=units_dict["A-101"].id,
                guard_id=guard_user.id,
                company="Amazon",
                tracking_number="TRK-AMZN-9988",
                status="ARRIVED",
                entry_time=datetime.now(timezone.utc) - timedelta(hours=1)
            )
            db.add(delivery)
            db.commit()

        # 9. Seed Maintenance Tickets
        ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.title == "Kitchen Sink Leaking").first()
        if not ticket:
            ticket = MaintenanceTicket(
                title="Kitchen Sink Leaking",
                description="The drain pipe under the kitchen sink is leaking when water runs.",
                category="PLUMBING",
                priority="HIGH",
                status="OPEN",
                resident_id=resident_a.id,
                unit_id=units_dict["A-101"].id,
                assigned_technician_id=provider_user.id,
                sla_deadline=datetime.now(timezone.utc) + timedelta(days=1)
            )
            db.add(ticket)
            db.commit()
            db.refresh(ticket)
            
            # Initial timeline record
            timeline = MaintenanceTimeline(
                ticket_id=ticket.id,
                status="OPEN",
                notes="Ticket raised by resident.",
                changed_by_id=resident_a.id
            )
            db.add(timeline)
            db.commit()

        # 10. Seed Announcements
        announcement = db.query(Announcement).filter(Announcement.title == "Annual Clubhouse Renovation").first()
        if not announcement:
            announcement = Announcement(
                title="Annual Clubhouse Renovation",
                content="The community clubhouse will be closed for renovation starting next Monday, 24th August, for 2 weeks.",
                community_id=community.id,
                is_pinned=True,
                created_by_id=admin_user.id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=15)
            )
            db.add(announcement)
            db.commit()

        # 11. Seed Polls
        poll = db.query(Poll).filter(Poll.question == "Should we upgrade the gym equipments?").first()
        if not poll:
            poll = Poll(
                question="Should we upgrade the gym equipments?",
                community_id=community.id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
                created_by_id=admin_user.id
            )
            db.add(poll)
            db.commit()
            db.refresh(poll)

            options = ["Yes, increase maintenance fee", "No, keep current equipment", "Yes, but find sponsors"]
            for opt_text in options:
                opt = PollOption(poll_id=poll.id, option_text=opt_text)
                db.add(opt)
            db.commit()

        # 12. Seed Events
        event = db.query(Event).filter(Event.title == "Independence Day Celebration").first()
        if not event:
            event = Event(
                title="Independence Day Celebration",
                description="Flag hoisting ceremony followed by breakfast at the central garden area.",
                location="Central Lawn",
                start_time=datetime.now(timezone.utc) + timedelta(days=2),
                end_time=datetime.now(timezone.utc) + timedelta(days=2, hours=3),
                capacity=150,
                community_id=community.id,
                created_by_id=admin_user.id,
                status="UPCOMING"
            )
            db.add(event)
            db.commit()

        # 13. Seed Payments
        payment = db.query(Payment).filter(Payment.title == "August Maintenance Fee").first()
        if not payment:
            # Pending bill
            payment1 = Payment(
                title="August Maintenance Fee",
                amount=150.00,
                due_date=date.today() + timedelta(days=10),
                charge_type="MAINTENANCE",
                status="PENDING",
                user_id=resident_a.id,
                unit_id=units_dict["A-101"].id
            )
            # Paid bill
            payment2 = Payment(
                title="July Maintenance Fee",
                amount=150.00,
                due_date=date.today() - timedelta(days=20),
                charge_type="MAINTENANCE",
                status="SUCCESSFUL",
                user_id=resident_a.id,
                unit_id=units_dict["A-101"].id,
                transaction_reference="TXN123456789",
                paid_at=datetime.now(timezone.utc) - timedelta(days=20)
            )
            db.add(payment1)
            db.add(payment2)
            db.commit()

        # 14. Seed Marketplace Listing
        listing = db.query(MarketplaceListing).filter(MarketplaceListing.title == "Solid Wood Coffee Table").first()
        if not listing:
            listing = MarketplaceListing(
                title="Solid Wood Coffee Table",
                description="Selling a sturdy solid teak wood coffee table. Good condition, minor scratches on the top surface.",
                price=80.00,
                condition="GOOD",
                listing_type="BUY_SELL",
                status="ACTIVE",
                user_id=resident_a.id,
                community_id=community.id
            )
            db.add(listing)
            db.commit()

        # 15. Seed Notification
        notification = db.query(Notification).filter(Notification.title == "New Visitor Approved").first()
        if not notification:
            notification = Notification(
                user_id=resident_a.id,
                title="New Visitor Approved",
                message="Your visitor John Doe has been scheduled for today.",
                notification_type="VISITOR",
                is_read=False
            )
            db.add(notification)
            db.commit()

        print("Database seeded successfully with all default entities!")
    except Exception as e:
        print(f"Error during database seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
