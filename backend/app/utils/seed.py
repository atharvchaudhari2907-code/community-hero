"""
Seeds the local database with demo users and complaints so the app is
immediately testable end-to-end with zero manual setup.

Run with: python -m app.utils.seed
"""
from sqlmodel import Session, select
from app.database import engine, init_db
from app.models.db import User, UserRole, Complaint, IssueCategory, SeverityLevel, ComplaintStatus
from app.dependencies import hash_password

DEMO_PASSWORD = "Password123"


def seed():
    init_db()
    with Session(engine) as session:
        existing = session.exec(select(User)).first()
        if existing:
            print("Database already seeded. Skipping.")
            return

        citizen = User(
            name="Aditi Deshmukh", email="citizen@demo.in", password_hash=hash_password(DEMO_PASSWORD),
            phone="9876543210", role=UserRole.citizen, ward="Shivajinagar", city="Pune",
            xp=45, level=1, level_name="Community Starter", badge="🌱",
        )
        admin = User(
            name="Priya Nair", email="admin@demo.in", password_hash=hash_password(DEMO_PASSWORD),
            phone="9876543211", role=UserRole.admin, ward="HQ", city="Pune",
        )
        workers = [
            User(
                name="Ramesh Kumar", email="ramesh.worker@demo.in", password_hash=hash_password(DEMO_PASSWORD),
                phone="9876500001", role=UserRole.worker, ward="Shivajinagar", city="Pune",
                employee_id="PWD-1042", department="Roads & PWD", zone="Zone 3",
                skills=[IssueCategory.pothole, IssueCategory.drainage],
                is_available=True, current_lat=18.5180, current_lng=73.8520,
                tasks_completed_today=2, average_rating=4.6, total_tasks=58,
            ),
            User(
                name="Suresh Patil", email="suresh.worker@demo.in", password_hash=hash_password(DEMO_PASSWORD),
                phone="9876500002", role=UserRole.worker, ward="Deccan", city="Pune",
                employee_id="SWM-2091", department="Solid Waste Management", zone="Zone 2",
                skills=[IssueCategory.garbage],
                is_available=True, current_lat=18.5310, current_lng=73.8430,
                tasks_completed_today=4, average_rating=4.8, total_tasks=120,
            ),
            User(
                name="Dinesh Shinde", email="dinesh.worker@demo.in", password_hash=hash_password(DEMO_PASSWORD),
                phone="9876500003", role=UserRole.worker, ward="Koregaon Park", city="Pune",
                employee_id="ELE-3077", department="Electrical", zone="Zone 4",
                skills=[IssueCategory.streetlight, IssueCategory.traffic_signal],
                is_available=False, current_lat=18.5350, current_lng=73.8940, active_task_id=None,
                tasks_completed_today=1, average_rating=4.3, total_tasks=37,
            ),
        ]

        session.add(citizen)
        session.add(admin)
        for w in workers:
            session.add(w)
        session.commit()
        session.refresh(citizen)

        seed_complaints = [
            dict(
                title="Large pothole at MG Road near Signal #4",
                description="A deep pothole has formed near the MG Road traffic signal, causing two-wheelers to swerve dangerously into oncoming traffic during evening rush hour.",
                category=IssueCategory.pothole, severity=SeverityLevel.critical,
                lat=18.5204, lng=73.8567, address="MG Road, Pune 411001", ward="Shivajinagar",
                status=ComplaintStatus.in_progress, upvotes=23,
            ),
            dict(
                title="Streetlight not working for 3 days on Lane 5",
                description="The streetlight outside building number 12 on Lane 5 has been off for three nights, making the lane unsafe for evening walkers.",
                category=IssueCategory.streetlight, severity=SeverityLevel.high,
                lat=18.5362, lng=73.8952, address="Koregaon Park, Pune 411001", ward="Koregaon Park",
                status=ComplaintStatus.assigned, upvotes=11,
            ),
            dict(
                title="Overflowing garbage bin near Balaji Chowk",
                description="The community garbage bin near Balaji Chowk has been overflowing for two days and is attracting stray animals.",
                category=IssueCategory.garbage, severity=SeverityLevel.medium,
                lat=18.5314, lng=73.8446, address="FC Road, Pune 411004", ward="Deccan",
                status=ComplaintStatus.citizen_verified, upvotes=7,
            ),
            dict(
                title="Water logging after rain on Model Colony road",
                description="Heavy waterlogging occurs on the main Model Colony road after every rain, making it impassable for nearly an hour.",
                category=IssueCategory.water, severity=SeverityLevel.high,
                lat=18.5089, lng=73.8259, address="Model Colony, Pune 411016", ward="Aundh",
                status=ComplaintStatus.submitted, upvotes=18,
            ),
            dict(
                title="Broken drainage cover causing accidents on Nagar Road",
                description="A drainage cover near the Nagar Road junction is broken and sunken, and a scooter rider was nearly injured riding over it last night.",
                category=IssueCategory.drainage, severity=SeverityLevel.critical,
                lat=18.5440, lng=73.9197, address="Nagar Road, Pune 411014", ward="Viman Nagar",
                status=ComplaintStatus.escalated, upvotes=34,
            ),
        ]

        for sc in seed_complaints:
            c = Complaint(
                citizen_id=citizen.id, citizen_name=citizen.name,
                title=sc["title"], description=sc["description"],
                category=sc["category"], severity=sc["severity"],
                lat=sc["lat"], lng=sc["lng"], address=sc["address"], ward=sc["ward"],
                status=sc["status"], upvotes=sc["upvotes"],
                department={
                    IssueCategory.pothole: "Roads & PWD",
                    IssueCategory.drainage: "Roads & PWD",
                    IssueCategory.streetlight: "Electrical",
                    IssueCategory.garbage: "Solid Waste Management",
                    IssueCategory.water: "Water Supply",
                }.get(sc["category"], "General Administration"),
            )
            c.add_event("submitted", "Complaint submitted by citizen.", actor=citizen.name)
            session.add(c)

        session.commit()
        print("✅ Seed complete.")
        print(f"   Citizen login: citizen@demo.in / {DEMO_PASSWORD}")
        print(f"   Worker login:  ramesh.worker@demo.in / {DEMO_PASSWORD}")
        print(f"   Admin login:   admin@demo.in / {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed()
