const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

// Default onboarding framework steps
// You can customize these based on your actual framework
const defaultSteps = [
    {
        title: "BDM Discovery & Qualification",
        description: "Business Development Manager engages client, scouts market landscape, owns revenue. Integration team notified via Chat Space immediately after first call.",
        category: "preparation",
        step_order: 1
    },
    {
        title: "Technical Scoping Call",
        description: "Integration team joins follow-up scoping call for technical sales piece. Integration requirements identified and documented.",
        category: "preparation",
        step_order: 2
    },
    {
        title: "Contract Signing",
        description: "Contract finalized and signed. BDM hands off to Customer Service team. Dedicated Chat Space created for client.",
        category: "documentation",
        step_order: 3
    },
    {
        title: "Handover & Setup",
        description: "CS receives notification in Chat Space that contract is signed. Review Client Handover document from BDM. Create/join dedicated client Chat Space. Assign Implementation Lead. Review tier classification (Strategic/Standard/Low-Touch).",
        category: "preparation",
        step_order: 4
    },
    {
        title: "Welcome Call",
        description: "Schedule Welcome Call with customer. Introduce yourself and role, explain onboarding journey, set expectations on timeline, confirm key contacts, explain homework requirements. Send Welcome Pack email with SNOMED Code Template, IHC & Special Stains Template, Reporting Proforma Request, Manifest Templates, Shipping Instructions, Portal User Access Form, Portal Manual.",
        category: "training",
        step_order: 5
    },
    {
        title: "Homework Collection",
        description: "Collect SNOMED Code Template, IHC & Special Stains Template, Reporting Proforma, Manifest Templates, Shipping Instructions, Portal User Access Form. Validate and hand off to Automation Team (SNOMED list), Integration Team (integration requirements), Path Management (reporting specs), Case Control (routing rules), Lab Ops (logistics). Set chase schedule if not received.",
        category: "documentation",
        step_order: 6
    },
    {
        title: "Questionnaire Workshop",
        description: "Comprehensive information gathering session. Map SNOMED codes, understand integration needs, establish clear communication channels with customer. Document all requirements. Post-workshop handoffs to specialized teams.",
        category: "integration",
        step_order: 7
    },
    {
        title: "Internal Design & Build",
        description: "Coordinate with SMEs (Subject Matter Experts). Synthesize feasibility feedback. Create Draft Service Design document. Monitor build progress across all teams (Automation, Integration, Path Management, Case Control, Lab Ops).",
        category: "integration",
        step_order: 8
    },
    {
        title: "Design Playback",
        description: "Present proposed workflow to customer. Walk through entire service design. Secure customer validation and sign-off. Establish concrete go-live timeline.",
        category: "review",
        step_order: 9
    },
    {
        title: "Training & Pilot",
        description: "Portal training for customer users. Dry-run test cases. Validate design with real-world performance insights. Monitor pilot cases closely.",
        category: "training",
        step_order: 10
    },
    {
        title: "Go-Live & Hypercare",
        description: "Day 1 actions and monitoring. Daily stand-ups for rapid issue resolution. Intensive monitoring during initial implementation period. Daily monitoring checklist.",
        category: "integration",
        step_order: 11
    },
    {
        title: "BAU & Health Checks",
        description: "Day 30/60/90 health check scoring with weighted criteria. Escalation triggers (Day 30 → SX Lead, Day 60 → Mike, Day 90 → Jenny). Regular review cadence. Transition to business as usual operations.",
        category: "review",
        step_order: 12
    }
];

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
            null, // leader - to be assigned
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
