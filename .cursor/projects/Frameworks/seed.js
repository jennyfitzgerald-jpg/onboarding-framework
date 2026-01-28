const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

// Comprehensive Diagnexia Onboarding Framework
// 12-Step Implementation with clear baton holders
const defaultSteps = [
    // PHASE 1: COMMERCIAL & DISCOVERY
    {
        title: "1. BDM Discovery & Qualification",
        description: `BATON HOLDER: BDM (Commercial)
CONTRIBUTORS: Sales Support, Mike Langford (SME), Legal

WHAT HAPPENS:
• BDM scouts market, lands the account, owns the revenue line
• Complete Client Onboarding Handover sections 1-2: Client Info, Outsourcing Questions, Scanning, Volumes, Consult Pathways
• Flag expected integration needs early (most sites require this)
• Set expectations that Customer Service will run onboarding after contract signature
• Integration team notified via Chat Space IMMEDIATELY after first call

DELIVERABLES:
□ Client Handover Document (Sections 1-2)
□ Integration flagged (Yes/No)
□ Tier Classification: Strategic (>£500k, NHS Networks like NWLP) / Standard / Low-Touch (digital-only)
□ Chat Space notification sent to Integration

⚠️ BDM role is CLIENT ADVOCATE only - not project manager`,
        leader: "BDM (Commercial)",
        category: "discovery",
        step_order: 1
    },
    {
        title: "2. Technical Scoping Call",
        description: `BATON HOLDER: BDM + Integration Team
CONTRIBUTORS: Automation Team, IT Security

WHAT HAPPENS:
• Integration team joins follow-up scoping call for technical sales piece
• Map LIS/LIMS architecture, endpoints, routing requirements
• Identify automation/scanner workflows (Prima, Diagnexia Automation)
• Security and compliance requirements captured
• Scope defines Standard vs Complex integration path

DELIVERABLES:
□ Integration Requirements Document
□ Technical Feasibility Assessment
□ Integration Complexity Rating (Simple/Medium/Complex)
□ Estimated integration timeline

Timeline: Within 5 business days of Step 1`,
        leader: "Integration Team",
        category: "discovery",
        step_order: 2
    },
    {
        title: "3. Contracting & Internal Trigger",
        description: `BATON HOLDER: Legal (Maninder / Danniella)
CONTRIBUTORS: Finance, BDM, Service Excellence

WHAT HAPPENS:
• Legal finalizes NDAs, MSAs, SLAs, pricing schedules
• Finance validates commercial terms
• Once signed, Legal triggers official onboarding start via Chat Space
• Contract signature = Day 0 for implementation timeline

DELIVERABLES:
□ Signed NDA
□ Signed MSA/Contract
□ SLA Agreement
□ Pricing Schedule confirmed
□ "Contract Signed" notification in Chat Space

⚠️ NO implementation work starts before contract signature`,
        leader: "Legal",
        category: "documentation",
        step_order: 3
    },

    // PHASE 2: CUSTOMER SERVICE TAKES THE BATON
    {
        title: "4. Handover & Chat Space Setup",
        description: `BATON HOLDER: Customer Service / Service Excellence (Joanne / Rebecca)
OVERSEEN BY: Mike Langford

WHAT HAPPENS:
• CS receives notification that contract is signed
• Review complete Client Handover document from BDM
• Create dedicated client Chat Space with ALL stakeholders:
  - Jenny F, BDM, Legal, Finance, IT, Integration, Service Excellence
  - Case Control, Customer Service, Path Management, Lab Ops
  - Logistics, Regulatory, Security, QA, Automation
• Assign Implementation Lead (CS team member)
• Confirm tier classification and timeline

DELIVERABLES:
□ Chat Space created with all key members
□ Implementation Lead assigned
□ Implementation timeline confirmed (Strategic: 8-12 weeks, Standard: 4-6 weeks, Low-Touch: 2-3 weeks)
□ Internal kick-off complete

🎯 FROM THIS POINT: Customer Service owns 95% of lifecycle`,
        leader: "Customer Service Lead",
        category: "preparation",
        step_order: 4
    },
    {
        title: "5. Welcome Call & Pack",
        description: `BATON HOLDER: CS Implementation Lead
CONTRIBUTORS: BDM (for continuity only)

WELCOME CALL AGENDA:
• Introduce yourself: "I'm [Name], your Implementation Lead. I'll be your single point of contact throughout onboarding."
• Explain the onboarding journey and what to expect
• Set timeline expectations based on tier
• Confirm key customer contacts
• Explain homework requirements

WELCOME PACK CONTENTS (send same day):
□ IHC & Special Stains Template
□ SNOMED Code Template
□ Reporting Proforma Request
□ Manifest Templates
□ Shipping Instructions
□ Portal User Access Form
□ Portal Manual

WHAT TO SAY:
"You'll receive our Welcome Pack today with templates we need completed. The SNOMED list is particularly important as it determines how your cases route through our system."

Timeline: Within 2 business days of Step 4`,
        leader: "CS Implementation Lead",
        category: "engagement",
        step_order: 5
    },
    {
        title: "6. Homework Collection & Validation",
        description: `BATON HOLDER: CS Implementation Lead
CONTRIBUTORS: Automation, Integration, Path Management, Case Control, Lab Ops

COLLECT & VALIDATE:
□ SNOMED Code Template → Hand off to Automation Team
□ IHC & Special Stains Template → Hand off to Automation Team  
□ Reporting Proforma → Hand off to Path Management
□ Manifest Templates → Validate format
□ Portal User Access Form → Collect all user details
□ Shipping/Logistics info → Hand off to Lab Ops

HANDOFF SCRIPTS:
To Automation: "@Automation - SNOMED list attached for [Client]. Please validate mapping within 48hrs. Flag any codes needing manual review."

To Integration: "@Integration - Technical requirements attached. Please confirm build timeline."

To Path Management: "@PathMgmt - Reporting specs attached. Please confirm pathologist coverage and template feasibility."

CHASE SEQUENCE:
• Day 3: Friendly reminder
• Day 5: Chase call
• Day 7: Escalate to BDM for relationship nudge

Timeline: 5-7 business days`,
        leader: "CS Implementation Lead",
        category: "documentation",
        step_order: 6
    },
    {
        title: "7. Questionnaire Workshop",
        description: `BATON HOLDER: CS Implementation Lead
CONTRIBUTORS: Integration, Automation, Path Management, Case Control, Lab Ops

WORKSHOP AGENDA (90 mins):
• 0-15 mins: Introductions, agenda review
• 15-45 mins: SNOMED mapping walkthrough with Automation
• 45-60 mins: Integration requirements deep-dive
• 60-75 mins: Reporting/routing requirements with Path Mgmt & Case Control
• 75-90 mins: Logistics and shipping with Lab Ops

CAPTURE DOCUMENT:
□ Full SNOMED mapping validated
□ Integration endpoints confirmed
□ Reporting templates agreed
□ Routing rules documented
□ Subspecialty requirements noted
□ Coverage limitations identified
□ Shipping logistics confirmed

POST-WORKSHOP:
• CS creates Service Design Document draft within 48hrs
• All teams update their systems/trackers

Timeline: Within 5 business days of homework completion`,
        leader: "CS Implementation Lead",
        category: "integration",
        step_order: 7
    },
    {
        title: "8. Internal Feasibility & Alignment",
        description: `BATON HOLDER: Service Excellence Lead
CONTRIBUTORS: Integration, Automation, Lab Ops, Path Management, Case Control, QA/Regulatory

INTERNAL REVIEW CHECKLIST:
□ SNOMED mapping feasibility confirmed (Automation)
□ Reporting structure compatibility verified (Path Mgmt)
□ Integration sprint capacity confirmed (Integration)
□ Customization requirements identified
□ Compliance requirements cleared (QA/Regulatory)
□ Pathologist coverage confirmed
□ Lab capacity validated

RISK FLAGS:
⚠️ Any blockers must be escalated immediately
⚠️ Timeline adjustments communicated to customer proactively

DELIVERABLE:
□ Feasibility Sign-Off from all teams
□ Final Service Design Document

This step prevents "surprises" at go-live

Timeline: 3-5 business days`,
        leader: "Service Excellence Lead",
        category: "review",
        step_order: 8
    },
    {
        title: "9. Design Playback & Customer Approval",
        description: `BATON HOLDER: CS Implementation Lead
CONTRIBUTORS: Integration, Automation, Path Management (as required)

PLAYBACK CALL AGENDA:
Present complete proposed workflow:
• Portal access and usage
• Manifest/submission workflow  
• Case routing logic
• Reporting pathway and templates
• On-hold rules and handling
• Turnaround time commitments
• Escalation process

WHAT TO SAY:
"Today I'll walk you through exactly how your cases will flow through Diagnexia. Please stop me at any point if something doesn't match your expectations."

SIGN-OFF REQUIRED:
□ Customer verbally approves design
□ Follow-up email confirming approval sent
□ Go-live date locked in

⚠️ Any changes loop back to Step 8 before proceeding

Timeline: 1-2 business days`,
        leader: "CS Implementation Lead",
        category: "review",
        step_order: 9
    },
    {
        title: "10. Build Phase",
        description: `BATON HOLDER: Integration Team (digital connection) + Automation Team
CO-ORDINATED BY: CS Implementation Lead

BUILD ACTIVITIES:
□ Portal users created (per Portal Manual)
□ Integration configured with customer LIMS
□ Automation setup (scanner, Prima, label formats)
□ SNOMED mapping applied in system
□ Reporting templates loaded
□ Routing rules configured
□ On-hold logic implemented

MONITORING:
• CS checks in daily with technical teams
• Any delays immediately communicated to customer
• Update Chat Space with build progress

DELIVERABLE:
□ System ready for training/dry run
□ All configurations documented

Timeline: Strategic 2-3 weeks, Standard 1-2 weeks, Low-Touch 3-5 days`,
        leader: "Integration + Automation Teams",
        category: "integration",
        step_order: 10
    },
    {
        title: "11. Training & Dry Run",
        description: `BATON HOLDER: CS Implementation Lead
CONTRIBUTORS: Integration, Automation, Path Management, Case Control

TRAINING SESSION:
□ Portal navigation training
□ Case submission walkthrough
□ Manifest generation training
□ Report access and download
□ On-hold case handling
□ Query/escalation process

DRY RUN TEST CASES:
□ Create test case end-to-end
□ Upload test files
□ Verify routing logic
□ Test on-hold triggers
□ Download test report
□ Validate manifest generation

SUCCESS CRITERIA:
• Customer can independently submit a case
• Customer can access and download reports
• Customer understands escalation process

Timeline: 2-3 days`,
        leader: "CS Implementation Lead",
        category: "training",
        step_order: 11
    },
    {
        title: "12. Go-Live & Hypercare",
        description: `BATON HOLDER: CS Implementation Lead
CONTRIBUTORS: Pathologists, Case Control, Lab Ops, Integration

GO-LIVE DAY:
□ Activate service in platform
□ Confirm first shipment/submission received
□ Monitor first cases through system
□ Immediate triage of any issues

HYPERCARE PERIOD (First 2 weeks):
□ Daily check-in calls with customer
□ Daily internal stand-ups
□ Case Control monitors flow, on-holds, delays
□ Path Management confirms coverage
□ Rapid issue resolution (4hr SLA)

DAILY MONITORING CHECKLIST:
□ Cases received today
□ Cases completed today
□ Any on-holds? Reason?
□ Any delays? Root cause?
□ Customer feedback

ESCALATION:
Issues not resolved within 4hrs → Service Excellence Lead
Issues not resolved within 24hrs → Mike Langford

Timeline: 2 weeks hypercare`,
        leader: "CS Implementation Lead",
        category: "go-live",
        step_order: 12
    },

    // PHASE 3: STEADY STATE & VULNERABILITY TRACKING
    {
        title: "13. Day 30 Health Check",
        description: `BATON HOLDER: CS Account Owner
ESCALATION: Service Excellence Lead

1-90 DAY VULNERABILITY PERIOD - CHECK 1

HEALTH CHECK SCORING (100 points):
□ Case Volume vs Expected (20 pts) - Are they sending what they projected?
□ TAT Performance (20 pts) - Are we hitting SLAs?
□ On-Hold Rate (15 pts) - Below 5% target?
□ Customer Responsiveness (15 pts) - Do they reply within 24hrs?
□ Issue Frequency (15 pts) - How many support tickets?
□ Relationship Temperature (15 pts) - Subjective assessment

SCORING:
• 80-100: Healthy - Continue standard cadence
• 60-79: Watch - Weekly check-ins, monitor closely
• Below 60: At Risk - Escalate to Service Excellence Lead

ACTIONS IF AT RISK:
• Root cause analysis within 48hrs
• Recovery plan created
• Increased touchpoints
• BDM re-engaged for relationship support`,
        leader: "CS Account Owner",
        category: "health-check",
        step_order: 13
    },
    {
        title: "14. Day 60 Health Check",
        description: `BATON HOLDER: CS Account Owner
ESCALATION: Mike Langford (Senior Director Customer Experience)

HEALTH CHECK SCORING (Same criteria as Day 30):
□ Case Volume vs Expected (20 pts)
□ TAT Performance (20 pts)
□ On-Hold Rate (15 pts)
□ Customer Responsiveness (15 pts)
□ Issue Frequency (15 pts)
□ Relationship Temperature (15 pts)

SCORING:
• 80-100: Healthy - Transition to monthly cadence
• 60-79: Watch - Maintain weekly, create improvement plan
• Below 60: At Risk - Escalate to Mike Langford

ESCALATION TO MIKE IF:
• Score dropped from Day 30
• Score remains below 60
• Customer has expressed dissatisfaction
• Volume significantly below projection

MIKE'S INVOLVEMENT:
• Executive sponsor call with customer
• Resource reallocation if needed
• Strategic intervention plan`,
        leader: "CS Account Owner",
        category: "health-check",
        step_order: 14
    },
    {
        title: "15. Day 90 Health Check & BAU Transition",
        description: `BATON HOLDER: CS Account Owner  
ESCALATION: Jenny (if still at risk)

FINAL VULNERABILITY ASSESSMENT:
□ Case Volume vs Expected (20 pts)
□ TAT Performance (20 pts)
□ On-Hold Rate (15 pts)
□ Customer Responsiveness (15 pts)
□ Issue Frequency (15 pts)
□ Relationship Temperature (15 pts)

SCORING:
• 80-100: Healthy - Full BAU transition
• 60-79: Extended Watch - Continue weekly for 30 more days
• Below 60: Critical - Escalate to Jenny for executive intervention

BAU TRANSITION CHECKLIST:
□ Steady-state cadence established (monthly for Standard, weekly for Strategic)
□ KPI reporting automated
□ Feedback loops in place
□ NPS survey scheduled
□ Account added to regular review cycle
□ BDM briefed on ongoing status

ONGOING RESPONSIBILITIES:
• CS Account Owner: Day-to-day relationship, issue triage
• BDM: Commercial relationship, upsell/cross-sell, escalations
• Service Excellence: Quarterly reviews, continuous improvement`,
        leader: "CS Account Owner",
        category: "health-check",
        step_order: 15
    }
];

// Run seeding
db.serialize(() => {
    // Create table if it doesn't exist
    db.run(`
        CREATE TABLE IF NOT EXISTS steps (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            leader TEXT,
            category TEXT DEFAULT 'other',
            completed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT,
            completed_at TEXT,
            step_order INTEGER DEFAULT 0
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
            return;
        }
        console.log('Database table ready');
    });

    // Clear existing steps
    db.run('DELETE FROM steps', (err) => {
        if (err) {
            console.error('Error clearing steps:', err.message);
            return;
        }
        console.log('Cleared existing steps');
    });

    // Insert default steps
    const stmt = db.prepare(`
        INSERT INTO steps (id, title, description, leader, category, completed, created_at, step_order)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `);

    defaultSteps.forEach((step, index) => {
        const id = `step-${Date.now()}-${index}`;
        const now = new Date().toISOString();
        stmt.run(
            id,
            step.title,
            step.description,
            step.leader,
            step.category,
            now,
            step.step_order
        );
    });

    stmt.finalize((err) => {
        if (err) {
            console.error('Error seeding database:', err.message);
        } else {
            console.log(`Successfully seeded ${defaultSteps.length} steps`);
        }
        db.close();
    });
});
