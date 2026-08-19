"""
Seed script — populates the database with realistic demo data.
Run: python -m app.db.seed
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import random

from app.db.session import SessionLocal, engine, Base
from app.models import *
from app.core.security import hash_password


def seed():
    # Import all models to ensure tables are registered
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Skip if data already exists
        if db.query(Role).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # ── Roles ──
        roles_data = [
            ("SALES_REP", "Sales Representative"),
            ("SALES_MANAGER", "Sales Manager"),
            ("ACCOUNT_MANAGER", "Account Manager"),
            ("MARKETING", "Marketing Team Member"),
            ("PRODUCT_MANAGER", "Product Manager"),
            ("EXECUTIVE", "Executive Leadership"),
        ]
        roles = {}
        for name, desc in roles_data:
            r = Role(name=name, description=desc)
            db.add(r)
            db.flush()
            roles[name] = r
        print(f"  Created {len(roles)} roles")

        # ── Territories ──
        territories_data = [
            ("North India", "North", "Covers Delhi NCR, Punjab, Haryana, UP, Uttarakhand"),
            ("South India", "South", "Covers Karnataka, Tamil Nadu, Kerala, Andhra Pradesh, Telangana"),
            ("West India", "West", "Covers Maharashtra, Gujarat, Rajasthan, Goa"),
            ("East India", "East", "Covers West Bengal, Odisha, Bihar, Jharkhand, NE States"),
        ]
        territories = {}
        for name, region, desc in territories_data:
            t = Territory(name=name, region=region, description=desc)
            db.add(t)
            db.flush()
            territories[region] = t
        print(f"  Created {len(territories)} territories")

        # ── Users (one per role) ──
        users_data = [
            ("priya.sharma@hosho.in", "Priya Sharma", "SALES_REP", "+91-9876543210", "North"),
            ("rajesh.kumar@hosho.in", "Rajesh Kumar", "SALES_MANAGER", "+91-9876543211", "North"),
            ("anita.desai@hosho.in", "Anita Desai", "ACCOUNT_MANAGER", "+91-9876543212", "West"),
            ("vikram.singh@hosho.in", "Vikram Singh", "MARKETING", "+91-9876543213", "South"),
            ("neha.patel@hosho.in", "Neha Patel", "PRODUCT_MANAGER", "+91-9876543214", "West"),
            ("amit.joshi@hosho.in", "Amit Joshi", "EXECUTIVE", "+91-9876543215", None),
            ("suresh.reddy@hosho.in", "Suresh Reddy", "SALES_REP", "+91-9876543216", "South"),
            ("kavita.nair@hosho.in", "Kavita Nair", "SALES_REP", "+91-9876543217", "East"),
        ]
        users = {}
        for email, name, role_name, phone, region in users_data:
            u = User(
                email=email,
                hashed_password=hash_password("password123"),
                full_name=name,
                phone=phone,
                role_id=roles[role_name].id,
                territory_id=territories.get(region, territories.get("North")).id if region else None,
            )
            db.add(u)
            db.flush()
            users[email] = u
        # Set territory managers
        territories["North"].manager_id = users["rajesh.kumar@hosho.in"].id
        territories["South"].manager_id = users["rajesh.kumar@hosho.in"].id
        territories["West"].manager_id = users["rajesh.kumar@hosho.in"].id
        territories["East"].manager_id = users["rajesh.kumar@hosho.in"].id
        print(f"  Created {len(users)} users")

        # ── Competitors ──
        competitors_data = [
            ("TechRival Solutions", "https://techrival.example.com", "Established player in enterprise software", "Strong brand recognition, large sales team", "Higher pricing, slower innovation"),
            ("CloudFirst Inc", "https://cloudfirst.example.com", "Cloud-native CRM competitor", "Modern tech stack, competitive pricing", "Limited enterprise features"),
            ("DataPrime Systems", "https://dataprime.example.com", "Data analytics focused competitor", "Strong analytics features", "Weak CRM capabilities"),
            ("NexGen Software", "https://nexgen.example.com", "Newer entrant with aggressive pricing", "Low pricing, fast implementation", "Limited support, fewer integrations"),
            ("OmniSuite Corp", "https://omnisuite.example.com", "Full suite business software vendor", "All-in-one solution", "Complex implementation, high TCO"),
        ]
        competitors = {}
        for name, web, desc, strengths, weaknesses in competitors_data:
            c = Competitor(name=name, website=web, description=desc, strengths=strengths, weaknesses=weaknesses)
            db.add(c)
            db.flush()
            competitors[name] = c
        print(f"  Created {len(competitors)} competitors")

        # ── Customers ──
        customers_data = [
            ("Tata Consultancy Services", "Information Technology", "North", "Mumbai", "Maharashtra", Decimal("150000000"), 600000, "ACTIVE"),
            ("Infosys Limited", "Information Technology", "South", "Bengaluru", "Karnataka", Decimal("130000000"), 350000, "ACTIVE"),
            ("Reliance Industries", "Conglomerate", "West", "Mumbai", "Maharashtra", Decimal("800000000"), 240000, "ACTIVE"),
            ("Apollo Hospitals", "Healthcare", "South", "Chennai", "Tamil Nadu", Decimal("12000000"), 80000, "ACTIVE"),
            ("Bajaj Finance", "Financial Services", "West", "Pune", "Maharashtra", Decimal("45000000"), 35000, "ACTIVE"),
            ("ITC Limited", "FMCG", "East", "Kolkata", "West Bengal", Decimal("60000000"), 30000, "ACTIVE"),
            ("Wipro Technologies", "Information Technology", "South", "Bengaluru", "Karnataka", Decimal("85000000"), 250000, "PROSPECT"),
            ("Mahindra & Mahindra", "Automotive", "West", "Mumbai", "Maharashtra", Decimal("70000000"), 260000, "ACTIVE"),
            ("HCL Technologies", "Information Technology", "North", "Noida", "Uttar Pradesh", Decimal("95000000"), 210000, "ACTIVE"),
            ("Sun Pharmaceutical", "Pharmaceutical", "West", "Mumbai", "Maharashtra", Decimal("40000000"), 40000, "PROSPECT"),
            ("Larsen & Toubro", "Engineering", "West", "Mumbai", "Maharashtra", Decimal("200000000"), 350000, "ACTIVE"),
            ("Godrej Group", "Diversified", "West", "Mumbai", "Maharashtra", Decimal("15000000"), 28000, "PROSPECT"),
            ("Biocon Limited", "Pharmaceutical", "South", "Bengaluru", "Karnataka", Decimal("8000000"), 12000, "INACTIVE"),
            ("HDFC Bank", "Financial Services", "North", "Mumbai", "Maharashtra", Decimal("250000000"), 140000, "ACTIVE"),
            ("Maruti Suzuki", "Automotive", "North", "Gurugram", "Haryana", Decimal("110000000"), 35000, "ACTIVE"),
        ]
        customers = {}
        rep_ids = [
            users["priya.sharma@hosho.in"].id,
            users["suresh.reddy@hosho.in"].id,
            users["kavita.nair@hosho.in"].id,
        ]
        for i, (name, ind, reg, city, state, rev, emp, stat) in enumerate(customers_data):
            c = Customer(
                name=name, industry=ind, region=reg, city=city, state=state,
                country="India", annual_revenue=rev, employee_count=emp,
                status=stat, owner_id=rep_ids[i % len(rep_ids)],
            )
            db.add(c)
            db.flush()
            customers[name] = c
        print(f"  Created {len(customers)} customers")

        # ── Customer Contacts (2 per customer) ──
        contact_designations = ["CTO", "VP Engineering", "Head of IT", "Director Sales", "CFO", "COO", "Head of Procurement", "General Manager"]
        contact_departments = ["Technology", "Engineering", "Finance", "Operations", "Procurement", "Sales"]
        contact_count = 0
        for cust_name, cust in customers.items():
            for j in range(2):
                first_names = ["Arjun", "Meera", "Ravi", "Deepa", "Kiran", "Sneha", "Rohit", "Pooja", "Varun", "Aisha"]
                last_names = ["Verma", "Gupta", "Iyer", "Bose", "Shah", "Kapoor", "Menon", "Das", "Pillai", "Rao"]
                fn = random.choice(first_names)
                ln = random.choice(last_names)
                cc = CustomerContact(
                    customer_id=cust.id,
                    first_name=fn, last_name=ln,
                    email=f"{fn.lower()}.{ln.lower()}@{cust_name.split()[0].lower()}.com",
                    phone=f"+91-98{random.randint(10000000, 99999999)}",
                    designation=random.choice(contact_designations),
                    department=random.choice(contact_departments),
                    is_primary=(j == 0),
                )
                db.add(cc)
                contact_count += 1
        print(f"  Created {contact_count} contacts")

        # ── Products ──
        products_data = [
            ("SalesForce Pro", "CRM", "Enterprise CRM platform with AI-driven insights", Decimal("500000")),
            ("DataVault Analytics", "Analytics", "Business intelligence and data visualization suite", Decimal("350000")),
            ("CloudSecure Gateway", "Security", "Cloud security and access management solution", Decimal("450000")),
            ("WorkFlow Engine", "Automation", "Business process automation platform", Decimal("280000")),
            ("ConnectHub", "Communication", "Unified communications and collaboration tool", Decimal("180000")),
            ("InventoryMax", "Supply Chain", "Inventory and supply chain management system", Decimal("320000")),
            ("HR Central", "HR Tech", "Human resource management and payroll system", Decimal("250000")),
            ("FinanceEdge", "Finance", "Financial planning and analysis platform", Decimal("400000")),
        ]
        products = {}
        for name, cat, desc, price in products_data:
            p = Product(name=name, category=cat, description=desc, base_price=price)
            db.add(p)
            db.flush()
            products[name] = p
        print(f"  Created {len(products)} products")

        # ── Campaigns ──
        mktg_user = users["vikram.singh@hosho.in"]
        campaigns_data = [
            ("Q3 Enterprise Push", "Targeted outreach to enterprise IT decision makers", "EMAIL", "ACTIVE", Decimal("500000"), Decimal("420000"), date(2026, 7, 1), date(2026, 9, 30), 50),
            ("Cloud Security Webinar Series", "Monthly webinar series on cloud security best practices", "WEBINAR", "ACTIVE", Decimal("200000"), Decimal("150000"), date(2026, 6, 1), date(2026, 8, 31), 30),
            ("Industry Summit 2026", "Annual industry summit and networking event", "EVENT", "COMPLETED", Decimal("1200000"), Decimal("1100000"), date(2026, 3, 15), date(2026, 3, 17), 80),
            ("Digital Transformation Guide", "Content marketing campaign with whitepaper downloads", "SOCIAL", "ACTIVE", Decimal("150000"), Decimal("90000"), date(2026, 5, 1), date(2026, 10, 31), 40),
            ("Partner Referral Program", "Channel partner lead generation program", "REFERRAL", "PLANNED", Decimal("300000"), None, date(2026, 9, 1), date(2026, 12, 31), 25),
        ]
        campaigns = {}
        for name, desc, ctype, stat, budget, cost, sd, ed, tl in campaigns_data:
            camp = Campaign(
                name=name, description=desc, campaign_type=ctype, status=stat,
                budget=budget, actual_cost=cost, start_date=sd, end_date=ed,
                target_leads=tl, owner_id=mktg_user.id,
            )
            db.add(camp)
            db.flush()
            campaigns[name] = camp
        print(f"  Created {len(campaigns)} campaigns")

        # ── Leads ──
        lead_statuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "UNQUALIFIED"]
        lead_sources = ["WEBSITE", "REFERRAL", "CAMPAIGN", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA"]
        leads_raw = [
            ("ERP Modernization Inquiry", "Wipro Technologies", "QUALIFIED", "CAMPAIGN", "HIGH", Decimal("2500000")),
            ("Cloud Migration Assessment", "Sun Pharmaceutical", "NEW", "WEBSITE", "MEDIUM", Decimal("1800000")),
            ("Security Audit Request", "HDFC Bank", "CONTACTED", "REFERRAL", "HIGH", Decimal("3200000")),
            ("Data Analytics Platform", "ITC Limited", "CONVERTED", "TRADE_SHOW", "CRITICAL", Decimal("1500000")),
            ("HR System Upgrade", "Maruti Suzuki", "QUALIFIED", "COLD_CALL", "MEDIUM", Decimal("900000")),
            ("Supply Chain Optimization", "Reliance Industries", "NEW", "CAMPAIGN", "HIGH", Decimal("4500000")),
            ("Financial Reporting Tool", "Bajaj Finance", "CONTACTED", "WEBSITE", "MEDIUM", Decimal("1200000")),
            ("Unified Communications Setup", "Apollo Hospitals", "QUALIFIED", "REFERRAL", "LOW", Decimal("800000")),
            ("CRM Implementation", "Godrej Group", "NEW", "SOCIAL_MEDIA", "MEDIUM", Decimal("2000000")),
            ("Process Automation", "Larsen & Toubro", "QUALIFIED", "CAMPAIGN", "HIGH", Decimal("3500000")),
            ("IT Infrastructure Review", "HCL Technologies", "UNQUALIFIED", "COLD_CALL", "LOW", Decimal("600000")),
            ("Digital Marketing Platform", "Mahindra & Mahindra", "CONTACTED", "WEBSITE", "MEDIUM", Decimal("1100000")),
            ("Cybersecurity Assessment", "Tata Consultancy Services", "CONVERTED", "REFERRAL", "CRITICAL", Decimal("5000000")),
            ("Inventory Management System", "ITC Limited", "NEW", "CAMPAIGN", "MEDIUM", Decimal("1300000")),
            ("Employee Portal Development", "Infosys Limited", "QUALIFIED", "TRADE_SHOW", "HIGH", Decimal("2200000")),
            ("Business Intelligence Suite", "HDFC Bank", "CONTACTED", "WEBSITE", "HIGH", Decimal("2800000")),
            ("Customer Support Platform", "Apollo Hospitals", "NEW", "SOCIAL_MEDIA", "LOW", Decimal("700000")),
            ("Compliance Management System", "Bajaj Finance", "QUALIFIED", "REFERRAL", "CRITICAL", Decimal("3800000")),
            ("AI Analytics Module", "Reliance Industries", "CONTACTED", "CAMPAIGN", "HIGH", Decimal("4200000")),
            ("Mobile App Development", "Maruti Suzuki", "NEW", "COLD_CALL", "MEDIUM", Decimal("1600000")),
        ]
        leads = []
        camp_list = list(campaigns.values())
        for i, (title, comp, stat, src, pri, val) in enumerate(leads_raw):
            cust = customers.get(comp)
            l = Lead(
                title=title,
                customer_id=cust.id if cust else None,
                assigned_to=rep_ids[i % len(rep_ids)] if stat not in ["NEW"] else None,
                status=stat, source=src, priority=pri, estimated_value=val,
                contact_name=f"Contact for {comp}",
                contact_email=f"contact{i}@{comp.split()[0].lower()}.com",
                company_name=comp,
                campaign_id=camp_list[i % len(camp_list)].id if src == "CAMPAIGN" else None,
                assignment_date=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)) if stat not in ["NEW"] else None,
            )
            db.add(l)
            db.flush()
            leads.append(l)
        print(f"  Created {len(leads)} leads")

        # ── Opportunities ──
        stages = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]
        opps_raw = [
            ("TCS SalesForce Pro Implementation", "Tata Consultancy Services", Decimal("4500000"), "CLOSED_WON", 100, -45),
            ("Infosys DataVault Deployment", "Infosys Limited", Decimal("3200000"), "NEGOTIATION", 75, 15),
            ("Reliance Cloud Security Suite", "Reliance Industries", Decimal("5800000"), "PROPOSAL", 50, 30),
            ("Apollo ConnectHub Rollout", "Apollo Hospitals", Decimal("1200000"), "CLOSED_WON", 100, -30),
            ("Bajaj FinanceEdge Platform", "Bajaj Finance", Decimal("3800000"), "QUALIFICATION", 30, 45),
            ("ITC InventoryMax Upgrade", "ITC Limited", Decimal("2100000"), "CLOSED_WON", 100, -15),
            ("Wipro WorkFlow Engine", "Wipro Technologies", Decimal("2800000"), "PROSPECTING", 10, 60),
            ("Mahindra HR Central", "Mahindra & Mahindra", Decimal("1900000"), "NEGOTIATION", 80, 20),
            ("HCL Analytics Suite", "HCL Technologies", Decimal("4200000"), "CLOSED_LOST", 0, -20),
            ("Sun Pharma Cloud Secure", "Sun Pharmaceutical", Decimal("1500000"), "PROSPECTING", 15, 75),
            ("L&T WorkFlow Automation", "Larsen & Toubro", Decimal("5200000"), "PROPOSAL", 45, 35),
            ("Godrej CRM Implementation", "Godrej Group", Decimal("2400000"), "QUALIFICATION", 25, 50),
            ("HDFC Security Gateway", "HDFC Bank", Decimal("6500000"), "NEGOTIATION", 70, 10),
            ("Maruti ConnectHub Setup", "Maruti Suzuki", Decimal("980000"), "CLOSED_WON", 100, -60),
            ("TCS DataVault Analytics", "Tata Consultancy Services", Decimal("3500000"), "PROPOSAL", 55, 25),
            ("Infosys HR Central Migration", "Infosys Limited", Decimal("2700000"), "CLOSED_LOST", 0, -10),
            ("Reliance FinanceEdge", "Reliance Industries", Decimal("4100000"), "QUALIFICATION", 35, 40),
            ("Apollo InventoryMax", "Apollo Hospitals", Decimal("1800000"), "CLOSED_WON", 100, -25),
            ("Bajaj Security Audit", "Bajaj Finance", Decimal("2200000"), "PROSPECTING", 20, 55),
            ("ITC Digital Platform", "ITC Limited", Decimal("3300000"), "NEGOTIATION", 65, 18),
            ("HCL Cloud Migration", "HCL Technologies", Decimal("3900000"), "CLOSED_WON", 100, -35),
            ("L&T FinanceEdge Pro", "Larsen & Toubro", Decimal("4800000"), "PROPOSAL", 40, 28),
            ("HDFC Analytics Platform", "HDFC Bank", Decimal("5500000"), "CLOSED_WON", 100, -50),
            ("Wipro Security Suite", "Wipro Technologies", Decimal("3100000"), "CLOSED_LOST", 0, -5),
            ("Mahindra DataVault", "Mahindra & Mahindra", Decimal("2600000"), "QUALIFICATION", 30, 42),
        ]
        comp_list = list(competitors.values())
        opportunities = []
        for i, (name, cust_name, val, stage, prob, days_offset) in enumerate(opps_raw):
            cust = customers[cust_name]
            close_date = date.today() + timedelta(days=days_offset)
            status_map = {"CLOSED_WON": "WON", "CLOSED_LOST": "LOST"}
            opp = Opportunity(
                name=name,
                customer_id=cust.id,
                owner_id=rep_ids[i % len(rep_ids)],
                deal_value=val,
                stage=stage,
                status=status_map.get(stage, "OPEN"),
                probability=prob,
                expected_close_date=close_date,
                actual_close_date=close_date if stage in ["CLOSED_WON", "CLOSED_LOST"] else None,
                loss_reason="Competitor offered lower pricing" if stage == "CLOSED_LOST" else None,
                competitor_id=comp_list[i % len(comp_list)].id if random.random() > 0.4 else None,
            )
            db.add(opp)
            db.flush()
            opportunities.append(opp)
        print(f"  Created {len(opportunities)} opportunities")

        # ── Activities ──
        activity_types = ["CALL", "MEETING", "EMAIL", "TASK"]
        activity_titles = [
            "Initial discovery call", "Product demo presentation", "Follow-up email",
            "Contract review meeting", "Technical requirements discussion",
            "Pricing proposal delivery", "Stakeholder alignment call",
            "Send updated proposal", "Schedule onsite visit", "Weekly check-in call",
            "Quarterly business review", "Send case study materials",
            "Integration planning session", "Budget approval follow-up",
            "Decision maker meeting", "Implementation kickoff",
        ]
        act_count = 0
        for i in range(40):
            opp = random.choice(opportunities)
            cust_id = opp.customer_id
            user_id = opp.owner_id
            atype = random.choice(activity_types)
            status_choice = random.choice(["PLANNED", "COMPLETED", "COMPLETED", "COMPLETED"])
            sched = datetime.now(timezone.utc) + timedelta(days=random.randint(-30, 14), hours=random.randint(9, 17))
            a = Activity(
                title=random.choice(activity_titles),
                activity_type=atype,
                status=status_choice,
                user_id=user_id,
                customer_id=cust_id,
                opportunity_id=opp.id,
                scheduled_date=sched,
                completed_date=sched + timedelta(hours=1) if status_choice == "COMPLETED" else None,
                follow_up_date=sched + timedelta(days=random.randint(3, 14)) if random.random() > 0.5 else None,
                duration_minutes=random.choice([15, 30, 45, 60, 90]),
                notes=f"Activity related to {opp.name}",
            )
            db.add(a)
            act_count += 1
        print(f"  Created {act_count} activities")

        # ── Sales Targets ──
        today = date.today()
        month_start = today.replace(day=1)
        if today.month == 12:
            month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

        target_amounts = [Decimal("5000000"), Decimal("4500000"), Decimal("4000000")]
        for i, rep_id in enumerate(rep_ids):
            achieved = Decimal(str(random.randint(1500000, 4500000)))
            st = SalesTarget(
                user_id=rep_id,
                period="MONTHLY",
                target_amount=target_amounts[i % len(target_amounts)],
                achieved_amount=achieved,
                start_date=month_start,
                end_date=month_end,
            )
            db.add(st)
        print(f"  Created {len(rep_ids)} sales targets")

        # ── Discount Requests ──
        discount_data = [
            (opportunities[0], rep_ids[0], Decimal("10.00"), "Long-term strategic customer, volume commitment", "APPROVED", "Approved for strategic account"),
            (opportunities[1], rep_ids[1], Decimal("15.00"), "Competitive pressure from CloudFirst", "PENDING", None),
            (opportunities[2], rep_ids[2], Decimal("8.00"), "Multi-year contract commitment", "APPROVED", "Approved with multi-year clause"),
            (opportunities[4], rep_ids[0], Decimal("20.00"), "Budget constraints from customer side", "REJECTED", "Discount too high, offer 10% instead"),
            (opportunities[7], rep_ids[1], Decimal("12.00"), "Bundle deal with additional products", "PENDING", None),
        ]
        mgr = users["rajesh.kumar@hosho.in"]
        for opp, req_id, disc, reason, stat, comments in discount_data:
            orig = float(opp.deal_value)
            discounted = orig * (1 - float(disc) / 100)
            dr = DiscountRequest(
                opportunity_id=opp.id,
                requester_id=req_id,
                approver_id=mgr.id if stat != "PENDING" else None,
                requested_discount=disc,
                original_value=Decimal(str(orig)),
                discounted_value=Decimal(str(discounted)),
                reason=reason,
                status=stat,
                manager_comments=comments,
                approved_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 10)) if stat != "PENDING" else None,
            )
            db.add(dr)
        print(f"  Created {len(discount_data)} discount requests")

        # ── Accounts ──
        acct_mgr = users["anita.desai@hosho.in"]
        account_customers = ["Tata Consultancy Services", "Infosys Limited", "Reliance Industries",
                             "HDFC Bank", "Apollo Hospitals", "Bajaj Finance", "Larsen & Toubro", "Maruti Suzuki"]
        accounts = {}
        for i, cname in enumerate(account_customers):
            cust = customers[cname]
            acct = Account(
                customer_id=cust.id,
                manager_id=acct_mgr.id,
                account_type=random.choice(["STANDARD", "STRATEGIC", "KEY"]),
                health_score=random.randint(40, 95),
                contract_value=Decimal(str(random.randint(1000000, 8000000))),
                contract_start_date=date.today() - timedelta(days=random.randint(90, 365)),
                contract_end_date=date.today() + timedelta(days=random.randint(30, 365)),
            )
            db.add(acct)
            db.flush()
            accounts[cname] = acct
        print(f"  Created {len(accounts)} accounts")

        # ── Account Plans ──
        plan_count = 0
        for cname, acct in accounts.items():
            plan = AccountPlan(
                account_id=acct.id,
                title=f"Growth Plan - {cname}",
                objectives=f"Increase product adoption and expand into new departments at {cname}",
                strategy="Cross-sell complementary products, secure multi-year renewals, build executive relationships",
                key_contacts="CTO, VP Engineering, Head of Procurement",
                revenue_goal=Decimal(str(random.randint(2000000, 10000000))),
                next_actions="Schedule QBR, present roadmap updates, identify upsell opportunities",
                status=random.choice(["DRAFT", "ACTIVE", "ACTIVE", "ACTIVE"]),
                start_date=date.today(),
                end_date=date.today() + timedelta(days=180),
            )
            db.add(plan)
            plan_count += 1
        print(f"  Created {plan_count} account plans")

        # ── Renewals ──
        renewal_statuses = ["UPCOMING", "IN_PROGRESS", "RENEWED", "OVERDUE"]
        ren_count = 0
        for cname, acct in accounts.items():
            days_offset = random.randint(-15, 90)
            ren_date = date.today() + timedelta(days=days_offset)
            stat = "OVERDUE" if days_offset < 0 else ("RENEWED" if random.random() > 0.7 else "UPCOMING")
            ren = Renewal(
                customer_id=customers[cname].id,
                account_id=acct.id,
                contract_name=f"Annual License - {cname}",
                contract_value=acct.contract_value,
                renewal_date=ren_date,
                reminder_date=ren_date - timedelta(days=30),
                status=stat,
            )
            db.add(ren)
            ren_count += 1
        # Add extra renewals
        for cname in ["Tata Consultancy Services", "HDFC Bank"]:
            ren = Renewal(
                customer_id=customers[cname].id,
                account_id=accounts[cname].id,
                contract_name=f"Premium Support - {cname}",
                contract_value=Decimal(str(random.randint(500000, 2000000))),
                renewal_date=date.today() + timedelta(days=random.randint(5, 45)),
                reminder_date=date.today() + timedelta(days=random.randint(-5, 10)),
                status="UPCOMING",
            )
            db.add(ren)
            ren_count += 1
        print(f"  Created {ren_count} renewals")

        # ── Satisfaction Records ──
        sat_count = 0
        for cname in account_customers:
            for m in range(3):
                score = random.randint(3, 10)
                rating_map = {range(1, 4): "POOR", range(4, 6): "FAIR", range(6, 8): "GOOD", range(8, 11): "EXCELLENT"}
                rating = "GOOD"
                for r, v in rating_map.items():
                    if score in r:
                        rating = v
                        break
                sat = SatisfactionRecord(
                    customer_id=customers[cname].id,
                    recorded_by=acct_mgr.id,
                    score=score,
                    rating=rating,
                    feedback=f"{'Excellent' if score >= 8 else 'Good' if score >= 6 else 'Needs improvement'} experience with our products and support team.",
                    feedback_date=date.today() - timedelta(days=m * 30 + random.randint(0, 10)),
                )
                db.add(sat)
                sat_count += 1
        print(f"  Created {sat_count} satisfaction records")

        # ── Customer Segments ──
        segments_data = [
            ("Enterprise IT", "Large IT companies with 100K+ employees", "South", "Information Technology", Decimal("80000000"), None),
            ("Financial Institutions", "Banks and financial services firms", None, "Financial Services", Decimal("40000000"), None),
            ("Manufacturing Giants", "Large manufacturing and automotive companies", "West", None, Decimal("50000000"), None),
            ("Healthcare Providers", "Hospitals and healthcare organizations", "South", "Healthcare", None, Decimal("50000000")),
        ]
        for name, desc, reg, ind, minrev, maxrev in segments_data:
            seg = CustomerSegment(
                name=name, description=desc,
                criteria_region=reg, criteria_industry=ind,
                criteria_min_revenue=minrev, criteria_max_revenue=maxrev,
                customer_count=random.randint(3, 8),
                revenue_contribution=Decimal(str(random.randint(5000000, 30000000))),
            )
            db.add(seg)
        print(f"  Created {len(segments_data)} customer segments")

        # ── Content Items ──
        content_data = [
            ("Enterprise CRM Buyer's Guide", "Comprehensive guide for enterprise CRM selection", "WHITEPAPER", "PUBLISHED"),
            ("Cloud Security Best Practices", "Security guidelines for cloud-first organizations", "BROCHURE", "APPROVED"),
            ("Customer Success Stories", "Case studies from top implementations", "CASE_STUDY", "PUBLISHED"),
            ("Product Comparison Matrix", "Feature comparison vs competitors", "PRESENTATION", "IN_REVIEW"),
            ("Digital Transformation Playbook", "Step-by-step digital transformation guide", "WHITEPAPER", "DRAFT"),
            ("ROI Calculator Template", "Tool for calculating implementation ROI", "PRESENTATION", "PUBLISHED"),
        ]
        for title, desc, ctype, stat in content_data:
            ci = ContentItem(
                title=title, description=desc, content_type=ctype,
                status=stat, owner_id=mktg_user.id,
            )
            db.add(ci)
        print(f"  Created {len(content_data)} content items")

        # ── Product Updates ──
        product_list = list(products.values())
        updates_data = [
            ("AI-Powered Lead Scoring", "3.2", "Machine learning based lead scoring engine", date(2026, 9, 15), "PLANNED"),
            ("Enhanced Dashboard Analytics", "3.1", "New real-time analytics dashboard widgets", date(2026, 8, 1), "IN_DEVELOPMENT"),
            ("Mobile App 2.0", "2.0", "Completely redesigned mobile experience", date(2026, 10, 1), "PLANNED"),
            ("API Gateway Integration", "3.0", "RESTful API gateway for third-party integrations", date(2026, 7, 15), "RELEASED"),
            ("Multi-tenant Architecture", "4.0", "Support for multi-tenant deployments", date(2027, 1, 1), "PLANNED"),
            ("Advanced Reporting Module", "3.1.1", "Custom report builder with drag-and-drop", date(2026, 8, 30), "BETA"),
        ]
        for i, (title, ver, desc, rdate, stat) in enumerate(updates_data):
            pu = ProductUpdate(
                product_id=product_list[i % len(product_list)].id,
                title=title, version=ver, description=desc,
                release_date=rdate, roadmap_status=stat,
            )
            db.add(pu)
        print(f"  Created {len(updates_data)} product updates")

        # ── Customer Feedback ──
        fb_count = 0
        feedback_texts = [
            "The dashboard performance has improved significantly. Very satisfied with the latest update.",
            "Integration with our existing ERP was smoother than expected. Good documentation.",
            "Response time from support team needs improvement. Waited 48 hours for a critical issue.",
            "Excellent product capabilities but the learning curve is steep for new users.",
            "The reporting module is powerful but could use more export format options.",
            "Mobile app crashes frequently on Android devices. Needs urgent fix.",
            "Outstanding customer success team. They helped us achieve 95% user adoption.",
            "Pricing is competitive but would appreciate volume discounts for large deployments.",
            "The API documentation is comprehensive and developer-friendly.",
            "Would like to see better multi-language support in the interface.",
            "Security features meet all our compliance requirements. Great work.",
            "Onboarding process was well-structured. New team members got productive within a week.",
            "Need better integration with Microsoft Teams for notifications.",
            "The workflow automation engine saved us 200+ hours per month.",
            "Data migration tool worked flawlessly. No data loss during transition.",
        ]
        sources = ["SALES_CALL", "SUPPORT", "SURVEY", "EMAIL"]
        for i, fb_text in enumerate(feedback_texts):
            cust = list(customers.values())[i % len(customers)]
            prod = product_list[i % len(product_list)]
            fb = CustomerFeedback(
                customer_id=cust.id,
                product_id=prod.id,
                recorded_by=rep_ids[i % len(rep_ids)],
                feedback=fb_text,
                rating=random.randint(2, 5),
                source=random.choice(sources),
                status=random.choice(["NEW", "REVIEWED", "ACKNOWLEDGED"]),
                feedback_date=date.today() - timedelta(days=random.randint(1, 90)),
            )
            db.add(fb)
            fb_count += 1
        print(f"  Created {fb_count} feedback records")

        # ── Feature Requests ──
        fr_data = [
            ("Bulk import contacts via CSV", "Allow importing customer contacts from CSV files", "HIGH", "PLANNED", "Saves 10+ hours per month for data entry team"),
            ("Custom dashboard widgets", "Let users create and arrange their own dashboard widgets", "MEDIUM", "UNDER_REVIEW", "Improves user satisfaction and productivity"),
            ("Two-factor authentication", "Add 2FA support for enhanced security", "CRITICAL", "IN_PROGRESS", "Required for banking sector compliance"),
            ("Offline mode for mobile app", "Allow basic functionality without internet connection", "MEDIUM", "SUBMITTED", "Field sales team often works in low-connectivity areas"),
            ("Advanced workflow conditions", "Support for complex conditional logic in workflows", "HIGH", "PLANNED", "Enables automation of complex business processes"),
            ("Integration with SAP", "Native integration with SAP ERP modules", "HIGH", "UNDER_REVIEW", "Required by 40% of enterprise customers"),
            ("Email template builder", "Visual drag-and-drop email template editor", "LOW", "SUBMITTED", "Reduces dependency on marketing team for communications"),
            ("AI chatbot for customer support", "Intelligent chatbot for first-level support", "MEDIUM", "SUBMITTED", "Could reduce support ticket volume by 30%"),
            ("Audit trail for all changes", "Complete audit log for compliance tracking", "CRITICAL", "IN_PROGRESS", "Mandatory for regulated industries"),
            ("Multi-currency support", "Handle transactions in multiple currencies", "HIGH", "PLANNED", "Essential for international expansion"),
        ]
        for i, (title, desc, pri, stat, impact) in enumerate(fr_data):
            cust = list(customers.values())[i % len(customers)]
            prod = product_list[i % len(product_list)]
            fr = FeatureRequest(
                customer_id=cust.id,
                product_id=prod.id,
                title=title,
                description=desc,
                priority=pri,
                status=stat,
                business_impact=impact,
                requested_date=date.today() - timedelta(days=random.randint(5, 120)),
            )
            db.add(fr)
        print(f"  Created {len(fr_data)} feature requests")

        # ── Product Documents ──
        doc_data = [
            ("SalesForce Pro Admin Guide", "SalesForce Pro", "USER_GUIDE", "Complete administration and configuration guide", "3.1", "PUBLISHED"),
            ("DataVault API Reference", "DataVault Analytics", "API", "RESTful API documentation with examples", "2.0", "PUBLISHED"),
            ("CloudSecure Setup Guide", "CloudSecure Gateway", "TECHNICAL", "Installation and initial configuration guide", "1.5", "PUBLISHED"),
            ("WorkFlow Engine FAQ", "WorkFlow Engine", "FAQ", "Frequently asked questions and troubleshooting", "2.1", "PUBLISHED"),
            ("ConnectHub Integration Guide", "ConnectHub", "TECHNICAL", "Guide for integrating with third-party systems", "1.2", "DRAFT"),
            ("InventoryMax User Manual", "InventoryMax", "USER_GUIDE", "End-user manual for daily operations", "2.0", "PUBLISHED"),
        ]
        for title, prod_name, cat, desc, ver, stat in doc_data:
            doc = ProductDocument(
                product_id=products[prod_name].id,
                title=title, category=cat, description=desc,
                version=ver, status=stat,
            )
            db.add(doc)
        print(f"  Created {len(doc_data)} product documents")

        db.commit()
        print("\nDatabase seeding completed successfully!")
        print("\nLogin credentials (all passwords: password123):")
        for email, name, role_name, _, _ in users_data:
            print(f"  {role_name:20s} -> {email}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
