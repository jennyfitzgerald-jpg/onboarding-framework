const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.sqlite');

console.log('Starting server...');
console.log('PORT:', PORT);
console.log('DB_PATH:', DB_PATH);
console.log('__dirname:', __dirname);

// Ensure database directory exists (for cloud deployments)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    console.log('Creating database directory:', dbDir);
    fs.mkdirSync(dbDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from current directory (HTML, CSS, JS frontend files)
app.use(express.static(__dirname, {
    index: false, // Don't auto-serve index.html, we'll handle it in route
    dotfiles: 'ignore',
    extensions: ['html', 'css']
}));

// Initialize database
console.log('Initializing database...');
let db;
try {
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            console.error('Stack:', err.stack);
        } else {
            console.log('Connected to SQLite database');
            initializeDatabase();
        }
    });
} catch (error) {
    console.error('Error creating database connection:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

// Initialize database schema
function initializeDatabase() {
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
        } else {
            console.log('Database initialized');
            // Check if we need to seed
            db.get('SELECT COUNT(*) as count FROM steps', (err, row) => {
                if (!err && row.count === 0) {
                    console.log('Database is empty, auto-seeding with framework...');
                    seedDefaultFramework();
                }
            });
        }
    });
}

// Auto-seed the database with the Diagnexia Onboarding Framework
function seedDefaultFramework() {
    const defaultSteps = [
        {
            title: "1. BDM Discovery & Qualification",
            description: `BATON HOLDER: BDM (Commercial)
CONTRIBUTORS: Sales Support, Mike Langford (SME), Legal

WHAT HAPPENS:
• BDM scouts market, lands the account, owns the revenue line
• Complete Client Onboarding Handover sections 1-2
• Flag expected integration needs early
• Integration team notified via Chat Space IMMEDIATELY after first call

DELIVERABLES:
□ Client Handover Document (Sections 1-2)
□ Integration flagged (Yes/No)
□ Tier Classification: Strategic / Standard / Low-Touch
□ Chat Space notification sent to Integration

⚠️ BDM role is CLIENT ADVOCATE only`,
            leader: "BDM (Commercial)",
            category: "discovery",
            step_order: 1
        },
        {
            title: "2. Technical Scoping Call",
            description: `BATON HOLDER: BDM + Integration Team
CONTRIBUTORS: Automation Team, IT Security

WHAT HAPPENS:
• Integration team joins follow-up scoping call
• Map LIS/LIMS architecture, endpoints, routing
• Identify automation/scanner workflows
• Security and compliance requirements captured

DELIVERABLES:
□ Integration Requirements Document
□ Technical Feasibility Assessment
□ Integration Complexity Rating
□ Estimated integration timeline`,
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
• Once signed, Legal triggers official onboarding via Chat Space

DELIVERABLES:
□ Signed NDA
□ Signed MSA/Contract
□ SLA Agreement
□ "Contract Signed" notification

⚠️ NO implementation work starts before contract signature`,
            leader: "Legal",
            category: "documentation",
            step_order: 3
        },
        {
            title: "4. Handover & Chat Space Setup",
            description: `BATON HOLDER: Customer Service / Service Excellence
OVERSEEN BY: Mike Langford

WHAT HAPPENS:
• CS receives notification that contract is signed
• Create dedicated client Chat Space with ALL stakeholders
• Assign Implementation Lead
• Confirm tier classification and timeline

DELIVERABLES:
□ Chat Space created with all key members
□ Implementation Lead assigned
□ Timeline confirmed (Strategic: 8-12wks, Standard: 4-6wks, Low-Touch: 2-3wks)

🎯 FROM THIS POINT: Customer Service owns 95% of lifecycle`,
            leader: "Customer Service Lead",
            category: "preparation",
            step_order: 4
        },
        {
            title: "5. Welcome Call & Pack",
            description: `BATON HOLDER: CS Implementation Lead

WELCOME CALL:
• Introduce yourself as single point of contact
• Explain onboarding journey
• Set timeline expectations
• Explain homework requirements

WELCOME PACK (send same day):
□ IHC & Special Stains Template
□ SNOMED Code Template
□ Reporting Proforma Request
□ Manifest Templates
□ Shipping Instructions
□ Portal User Access Form
□ Portal Manual`,
            leader: "CS Implementation Lead",
            category: "engagement",
            step_order: 5
        },
        {
            title: "6. Homework Collection & Validation",
            description: `BATON HOLDER: CS Implementation Lead

COLLECT & HAND OFF:
□ SNOMED Code Template → Automation Team
□ IHC & Special Stains Template → Automation Team
□ Reporting Proforma → Path Management
□ Manifest Templates → Validate format
□ Portal User Access Form → Collect all users
□ Shipping info → Lab Ops

CHASE SEQUENCE:
• Day 3: Friendly reminder
• Day 5: Chase call
• Day 7: Escalate to BDM`,
            leader: "CS Implementation Lead",
            category: "documentation",
            step_order: 6
        },
        {
            title: "7. Questionnaire Workshop",
            description: `BATON HOLDER: CS Implementation Lead
CONTRIBUTORS: Integration, Automation, Path Mgmt, Case Control, Lab Ops

WORKSHOP AGENDA (90 mins):
• SNOMED mapping walkthrough
• Integration requirements deep-dive
• Reporting/routing requirements
• Logistics and shipping

POST-WORKSHOP:
• CS creates Service Design Document draft within 48hrs
• All teams update their trackers`,
            leader: "CS Implementation Lead",
            category: "integration",
            step_order: 7
        },
        {
            title: "8. Internal Feasibility & Alignment",
            description: `BATON HOLDER: Service Excellence Lead

INTERNAL REVIEW:
□ SNOMED mapping feasibility (Automation)
□ Reporting compatibility (Path Mgmt)
□ Integration capacity (Integration)
□ Compliance cleared (QA/Regulatory)
□ Pathologist coverage confirmed
□ Lab capacity validated

DELIVERABLE:
□ Feasibility Sign-Off from all teams
□ Final Service Design Document

This step prevents "surprises" at go-live`,
            leader: "Service Excellence Lead",
            category: "review",
            step_order: 8
        },
        {
            title: "9. Design Playback & Customer Approval",
            description: `BATON HOLDER: CS Implementation Lead

PRESENT:
• Portal access and usage
• Manifest/submission workflow
• Case routing logic
• Reporting pathway
• On-hold rules
• TAT commitments

SIGN-OFF REQUIRED:
□ Customer verbally approves
□ Confirmation email sent
□ Go-live date locked

⚠️ Changes loop back to Step 8`,
            leader: "CS Implementation Lead",
            category: "review",
            step_order: 9
        },
        {
            title: "10. Build Phase",
            description: `BATON HOLDER: Integration + Automation Teams
CO-ORDINATED BY: CS Implementation Lead

BUILD:
□ Portal users created
□ Integration configured
□ Automation setup
□ SNOMED mapping applied
□ Reporting templates loaded
□ Routing rules configured

Timeline: Strategic 2-3wks, Standard 1-2wks, Low-Touch 3-5 days`,
            leader: "Integration + Automation",
            category: "integration",
            step_order: 10
        },
        {
            title: "11. Training & Dry Run",
            description: `BATON HOLDER: CS Implementation Lead

TRAINING:
□ Portal navigation
□ Case submission
□ Manifest generation
□ Report access
□ On-hold handling
□ Escalation process

DRY RUN:
□ Create test case end-to-end
□ Verify routing logic
□ Test on-hold triggers
□ Validate manifest generation`,
            leader: "CS Implementation Lead",
            category: "training",
            step_order: 11
        },
        {
            title: "12. Go-Live & Hypercare",
            description: `BATON HOLDER: CS Implementation Lead

GO-LIVE DAY:
□ Activate service
□ Confirm first submission
□ Monitor first cases
□ Immediate issue triage

HYPERCARE (2 weeks):
□ Daily customer check-ins
□ Daily internal stand-ups
□ Rapid issue resolution (4hr SLA)

ESCALATION:
4hrs unresolved → Service Excellence Lead
24hrs unresolved → Mike Langford`,
            leader: "CS Implementation Lead",
            category: "go-live",
            step_order: 12
        },
        {
            title: "13. Day 30 Health Check",
            description: `BATON HOLDER: CS Account Owner
ESCALATION TO: Service Excellence Lead

SCORING (100 points):
□ Case Volume vs Expected (20 pts)
□ TAT Performance (20 pts)
□ On-Hold Rate (15 pts)
□ Customer Responsiveness (15 pts)
□ Issue Frequency (15 pts)
□ Relationship Temperature (15 pts)

80-100: Healthy
60-79: Watch - Weekly check-ins
Below 60: At Risk - Escalate`,
            leader: "CS Account Owner",
            category: "health-check",
            step_order: 13
        },
        {
            title: "14. Day 60 Health Check",
            description: `BATON HOLDER: CS Account Owner
ESCALATION TO: Mike Langford

Same scoring criteria as Day 30.

ESCALATE TO MIKE IF:
• Score dropped from Day 30
• Score remains below 60
• Customer dissatisfied
• Volume below projection

MIKE'S INVOLVEMENT:
• Executive sponsor call
• Resource reallocation
• Strategic intervention`,
            leader: "CS Account Owner",
            category: "health-check",
            step_order: 14
        },
        {
            title: "15. Day 90 Health Check & BAU",
            description: `BATON HOLDER: CS Account Owner
ESCALATION TO: Jenny (if critical)

80-100: Full BAU transition
60-79: Extended Watch (+30 days)
Below 60: Critical - Executive intervention

BAU TRANSITION:
□ Steady-state cadence set
□ KPI reporting automated
□ Feedback loops in place
□ NPS survey scheduled
□ Account in review cycle

ONGOING:
• CS: Day-to-day relationship
• BDM: Commercial, upsell
• SX: Quarterly reviews`,
            leader: "CS Account Owner",
            category: "health-check",
            step_order: 15
        }
    ];

    const stmt = db.prepare(`
        INSERT INTO steps (id, title, description, leader, category, completed, created_at, step_order)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `);

    defaultSteps.forEach((step, index) => {
        const id = `step-${Date.now()}-${index}`;
        const now = new Date().toISOString();
        stmt.run(id, step.title, step.description, step.leader, step.category, now, step.step_order);
    });

    stmt.finalize((err) => {
        if (err) {
            console.error('Error seeding database:', err.message);
        } else {
            console.log(`Auto-seeded ${defaultSteps.length} onboarding steps`);
        }
    });
}

// API Routes

// Get all steps
app.get('/api/steps', (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database not initialized' });
    }
    db.all('SELECT * FROM steps ORDER BY step_order ASC, created_at ASC', (err, rows) => {
        if (err) {
            console.error('Error fetching steps:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        // Convert completed integer to boolean
        const steps = rows.map(row => ({
            ...row,
            completed: row.completed === 1
        }));
        res.json(steps);
    });
});

// Get single step
app.get('/api/steps/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM steps WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Step not found' });
            return;
        }
        res.json({
            ...row,
            completed: row.completed === 1
        });
    });
});

// Create step
app.post('/api/steps', (req, res) => {
    const { title, description, leader, category, step_order } = req.body;
    
    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }

    const id = Date.now().toString();
    const now = new Date().toISOString();
    
    db.run(
        `INSERT INTO steps (id, title, description, leader, category, completed, created_at, step_order)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [id, title, description || null, leader || null, category || 'other', now, step_order || 0],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({
                id,
                title,
                description: description || null,
                leader: leader || null,
                category: category || 'other',
                completed: false,
                created_at: now,
                step_order: step_order || 0
            });
        }
    );
});

// Update step
app.put('/api/steps/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, leader, category, completed, step_order } = req.body;
    
    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }

    const now = new Date().toISOString();
    const completedInt = completed ? 1 : 0;
    const completedAt = completed ? now : null;

    db.run(
        `UPDATE steps 
         SET title = ?, description = ?, leader = ?, category = ?, completed = ?, 
             updated_at = ?, completed_at = ?, step_order = ?
         WHERE id = ?`,
        [title, description || null, leader || null, category || 'other', completedInt, now, completedAt, step_order || 0, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Step not found' });
                return;
            }
            // Return updated step
            db.get('SELECT * FROM steps WHERE id = ?', [id], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({
                    ...row,
                    completed: row.completed === 1
                });
            });
        }
    );
});

// Delete step
app.delete('/api/steps/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM steps WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Step not found' });
            return;
        }
        res.json({ message: 'Step deleted successfully', id });
    });
});

// Toggle step completion
app.patch('/api/steps/:id/toggle', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM steps WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Step not found' });
            return;
        }
        
        const newCompleted = row.completed === 0 ? 1 : 0;
        const now = new Date().toISOString();
        const completedAt = newCompleted === 1 ? now : null;

        db.run(
            'UPDATE steps SET completed = ?, updated_at = ?, completed_at = ? WHERE id = ?',
            [newCompleted, now, completedAt, id],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                db.get('SELECT * FROM steps WHERE id = ?', [id], (err, updatedRow) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({
                        ...updatedRow,
                        completed: updatedRow.completed === 1
                    });
                });
            }
        );
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    db.all(`
        SELECT 
            COUNT(*) as total,
            SUM(completed) as completed,
            COUNT(*) - SUM(completed) as pending
        FROM steps
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const stats = rows[0];
        res.json({
            total: stats.total || 0,
            completed: stats.completed || 0,
            pending: stats.pending || 0,
            percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        });
    });
});

// Serve index.html for root
app.get('/', (req, res) => {
    try {
        const indexPath = path.join(__dirname, 'index.html');
        console.log('Serving index.html from:', indexPath);
        if (!fs.existsSync(indexPath)) {
            console.error('index.html not found at:', indexPath);
            return res.status(500).send('index.html not found');
        }
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('Error sending index.html:', err);
                res.status(500).send('Error loading page');
            }
        });
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading page');
    }
});

// Serve app.js and styles.css as static files
app.get('/app.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.js'), { headers: { 'Content-Type': 'application/javascript' } });
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'), { headers: { 'Content-Type': 'text/css' } });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Database: ${DB_PATH}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});
