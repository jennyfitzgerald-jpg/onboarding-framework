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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname, { index: false, dotfiles: 'ignore' }));

// Initialize database
let db;
try {
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to SQLite database');
            initializeDatabase();
        }
    });
} catch (error) {
    console.error('Error creating database connection:', error.message);
    process.exit(1);
}

// Initialize database schema
function initializeDatabase() {
    db.serialize(() => {
        // Clients table
        db.run(`
            CREATE TABLE IF NOT EXISTS clients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                tier TEXT DEFAULT 'standard',
                bdm_name TEXT,
                contract_date TEXT,
                go_live_date TEXT,
                current_stage INTEGER DEFAULT 1,
                status TEXT DEFAULT 'active',
                health_score INTEGER DEFAULT 100,
                notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            )
        `);

        // Template steps (master framework)
        db.run(`
            CREATE TABLE IF NOT EXISTS template_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                step_order INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                default_owner TEXT,
                category TEXT DEFAULT 'other',
                duration_days INTEGER DEFAULT 5
            )
        `);

        // Client steps (per-client progress)
        db.run(`
            CREATE TABLE IF NOT EXISTS client_steps (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                step_order INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                assigned_person TEXT,
                default_owner TEXT,
                category TEXT DEFAULT 'other',
                status TEXT DEFAULT 'pending',
                notes TEXT,
                started_at TEXT,
                completed_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        `);

        // Activity log
        db.run(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id TEXT NOT NULL,
                step_order INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                performed_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        `);

        // Check if template needs seeding
        db.get('SELECT COUNT(*) as count FROM template_steps', (err, row) => {
            if (!err && row.count === 0) {
                console.log('Seeding template steps...');
                seedTemplateSteps();
            }
        });
    });
}

// Seed the master template
function seedTemplateSteps() {
    const steps = [
        { order: 1, title: "BDM Discovery & Qualification", owner: "BDM (Commercial)", category: "discovery", duration: 5,
          description: `BATON HOLDER: BDM (Commercial)\n\n• Scout market, land the account, own revenue line\n• Complete Client Handover sections 1-2\n• Flag integration needs early\n• Notify Integration via Chat Space IMMEDIATELY\n\nDELIVERABLES:\n□ Client Handover Document\n□ Integration flagged (Yes/No)\n□ Tier Classification\n□ Chat Space notification sent` },
        { order: 2, title: "Technical Scoping Call", owner: "Integration Team", category: "discovery", duration: 5,
          description: `BATON HOLDER: Integration Team\n\n• Integration joins scoping call\n• Map LIS/LIMS architecture\n• Identify automation workflows\n• Capture security requirements\n\nDELIVERABLES:\n□ Integration Requirements Doc\n□ Technical Feasibility Assessment\n□ Complexity Rating\n□ Timeline estimate` },
        { order: 3, title: "Contracting & Internal Trigger", owner: "Legal", category: "documentation", duration: 10,
          description: `BATON HOLDER: Legal\n\n• Finalize NDAs, MSAs, SLAs\n• Finance validates terms\n• Trigger onboarding via Chat Space\n\nDELIVERABLES:\n□ Signed NDA\n□ Signed Contract\n□ SLA Agreement\n□ "Contract Signed" notification\n\n⚠️ NO work before contract signature` },
        { order: 4, title: "Handover & Chat Space Setup", owner: "Customer Service Lead", category: "preparation", duration: 2,
          description: `BATON HOLDER: Customer Service Lead\n\n• Create client Chat Space with ALL stakeholders\n• Assign Implementation Lead\n• Confirm tier and timeline\n\nDELIVERABLES:\n□ Chat Space created\n□ Implementation Lead assigned\n□ Timeline confirmed\n\n🎯 CS owns 95% of lifecycle from here` },
        { order: 5, title: "Welcome Call & Pack", owner: "CS Implementation Lead", category: "engagement", duration: 2,
          description: `BATON HOLDER: CS Implementation Lead\n\nWELCOME CALL:\n• Introduce as single point of contact\n• Explain onboarding journey\n• Set timeline expectations\n\nWELCOME PACK:\n□ IHC & Special Stains Template\n□ SNOMED Code Template\n□ Reporting Proforma\n□ Manifest Templates\n□ Portal Access Form` },
        { order: 6, title: "Homework Collection & Validation", owner: "CS Implementation Lead", category: "documentation", duration: 7,
          description: `BATON HOLDER: CS Implementation Lead\n\nCOLLECT & HAND OFF:\n□ SNOMED Template → Automation\n□ IHC Template → Automation\n□ Reporting Proforma → Path Mgmt\n□ Portal Access Form → Tech Support\n□ Shipping info → Lab Ops\n\nCHASE: Day 3 reminder, Day 5 call, Day 7 escalate` },
        { order: 7, title: "Questionnaire Workshop", owner: "CS Implementation Lead", category: "integration", duration: 3,
          description: `BATON HOLDER: CS Implementation Lead\n\nWORKSHOP (90 mins):\n• SNOMED mapping walkthrough\n• Integration deep-dive\n• Reporting/routing requirements\n• Logistics confirmation\n\nPOST-WORKSHOP:\n• Service Design Document within 48hrs\n• All teams update trackers` },
        { order: 8, title: "Internal Feasibility & Alignment", owner: "Service Excellence Lead", category: "review", duration: 5,
          description: `BATON HOLDER: Service Excellence Lead\n\nINTERNAL REVIEW:\n□ SNOMED feasibility (Automation)\n□ Reporting compatibility (Path Mgmt)\n□ Integration capacity\n□ Compliance cleared\n□ Pathologist coverage\n□ Lab capacity\n\nDELIVERABLE:\n□ Feasibility Sign-Off\n□ Final Service Design` },
        { order: 9, title: "Design Playback & Customer Approval", owner: "CS Implementation Lead", category: "review", duration: 2,
          description: `BATON HOLDER: CS Implementation Lead\n\nPRESENT:\n• Portal access & usage\n• Manifest workflow\n• Case routing logic\n• Reporting pathway\n• TAT commitments\n\nSIGN-OFF:\n□ Customer approves\n□ Confirmation email sent\n□ Go-live date locked` },
        { order: 10, title: "Build Phase", owner: "Integration + Automation", category: "integration", duration: 14,
          description: `BATON HOLDER: Integration + Automation\n\nBUILD:\n□ Portal users created\n□ Integration configured\n□ Automation setup\n□ SNOMED mapping applied\n□ Reporting templates loaded\n□ Routing rules configured\n\nTimeline: Strategic 2-3wks, Standard 1-2wks` },
        { order: 11, title: "Training & Dry Run", owner: "CS Implementation Lead", category: "training", duration: 3,
          description: `BATON HOLDER: CS Implementation Lead\n\nTRAINING:\n□ Portal navigation\n□ Case submission\n□ Manifest generation\n□ Report access\n\nDRY RUN:\n□ Test case end-to-end\n□ Verify routing\n□ Test on-hold triggers\n□ Validate manifests` },
        { order: 12, title: "Go-Live & Hypercare", owner: "CS Implementation Lead", category: "go-live", duration: 14,
          description: `BATON HOLDER: CS Implementation Lead\n\nGO-LIVE:\n□ Activate service\n□ Confirm first submission\n□ Monitor first cases\n\nHYPERCARE (2 weeks):\n□ Daily customer check-ins\n□ Daily internal stand-ups\n□ 4hr SLA issue resolution\n\nESCALATION: 4hrs → SX Lead, 24hrs → Mike` },
        { order: 13, title: "Day 30 Health Check", owner: "CS Account Owner", category: "health-check", duration: 1,
          description: `BATON HOLDER: CS Account Owner\nESCALATE TO: Service Excellence Lead\n\nSCORING (100 pts):\n□ Volume vs Expected (20)\n□ TAT Performance (20)\n□ On-Hold Rate (15)\n□ Customer Response (15)\n□ Issue Frequency (15)\n□ Relationship Temp (15)\n\n80-100: Healthy | 60-79: Watch | <60: At Risk` },
        { order: 14, title: "Day 60 Health Check", owner: "CS Account Owner", category: "health-check", duration: 1,
          description: `BATON HOLDER: CS Account Owner\nESCALATE TO: Mike Langford\n\nSame scoring as Day 30.\n\nESCALATE IF:\n• Score dropped\n• Score <60\n• Customer dissatisfied\n• Volume below projection\n\nMIKE: Executive call, resource reallocation` },
        { order: 15, title: "Day 90 Health Check & BAU", owner: "CS Account Owner", category: "health-check", duration: 1,
          description: `BATON HOLDER: CS Account Owner\nESCALATE TO: Jenny (if critical)\n\n80-100: Full BAU\n60-79: Extended Watch\n<60: Executive intervention\n\nBAU TRANSITION:\n□ Cadence set\n□ KPI reporting automated\n□ Feedback loops\n□ NPS scheduled\n□ In review cycle` }
    ];

    const stmt = db.prepare(`INSERT INTO template_steps (step_order, title, description, default_owner, category, duration_days) VALUES (?, ?, ?, ?, ?, ?)`);
    steps.forEach(s => stmt.run(s.order, s.title, s.description, s.owner, s.category, s.duration));
    stmt.finalize(() => console.log('Template steps seeded'));
}

// Create client steps from template
function createClientSteps(clientId, callback) {
    db.all('SELECT * FROM template_steps ORDER BY step_order', (err, templates) => {
        if (err) return callback(err);
        
        const stmt = db.prepare(`INSERT INTO client_steps (id, client_id, step_order, title, description, default_owner, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`);
        templates.forEach(t => {
            const id = `${clientId}-step-${t.step_order}`;
            stmt.run(id, clientId, t.step_order, t.title, t.description, t.default_owner, t.category);
        });
        stmt.finalize(callback);
    });
}

// ============ API ROUTES ============

// --- CLIENTS ---

// Get all clients with progress summary
app.get('/api/clients', (req, res) => {
    db.all(`
        SELECT c.*, 
            (SELECT COUNT(*) FROM client_steps WHERE client_id = c.id AND status = 'completed') as completed_steps,
            (SELECT COUNT(*) FROM client_steps WHERE client_id = c.id) as total_steps
        FROM clients c 
        ORDER BY c.created_at DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get single client with all steps
app.get('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM clients WHERE id = ?', [id], (err, client) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!client) return res.status(404).json({ error: 'Client not found' });
        
        db.all('SELECT * FROM client_steps WHERE client_id = ? ORDER BY step_order', [id], (err, steps) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...client, steps });
        });
    });
});

// Create new client
app.post('/api/clients', (req, res) => {
    const { name, tier, bdm_name, contract_date, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Client name is required' });

    const id = `client-${Date.now()}`;
    const now = new Date().toISOString();

    db.run(
        `INSERT INTO clients (id, name, tier, bdm_name, contract_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, tier || 'standard', bdm_name || null, contract_date || null, notes || null, now],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Create steps for this client
            createClientSteps(id, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // Log activity
                db.run(`INSERT INTO activity_log (client_id, action, details) VALUES (?, 'client_created', ?)`,
                    [id, `Client "${name}" created`]);
                
                res.status(201).json({ id, name, tier: tier || 'standard', bdm_name, contract_date, notes, created_at: now });
            });
        }
    );
});

// Update client
app.put('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    const { name, tier, bdm_name, contract_date, go_live_date, status, health_score, notes } = req.body;
    const now = new Date().toISOString();

    db.run(
        `UPDATE clients SET name = ?, tier = ?, bdm_name = ?, contract_date = ?, go_live_date = ?, status = ?, health_score = ?, notes = ?, updated_at = ? WHERE id = ?`,
        [name, tier, bdm_name, contract_date, go_live_date, status, health_score, notes, now, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Client not found' });
            res.json({ success: true });
        }
    );
});

// Delete client
app.delete('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    db.serialize(() => {
        db.run('DELETE FROM client_steps WHERE client_id = ?', [id]);
        db.run('DELETE FROM activity_log WHERE client_id = ?', [id]);
        db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// --- CLIENT STEPS ---

// Update client step (assign person, change status, add notes)
app.put('/api/clients/:clientId/steps/:stepOrder', (req, res) => {
    const { clientId, stepOrder } = req.params;
    const { assigned_person, status, notes } = req.body;
    const now = new Date().toISOString();

    // Determine timestamps
    let started_at = null;
    let completed_at = null;
    
    db.get('SELECT * FROM client_steps WHERE client_id = ? AND step_order = ?', [clientId, stepOrder], (err, step) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (status === 'in_progress' && step.status === 'pending') {
            started_at = now;
        } else {
            started_at = step.started_at;
        }

        if (status === 'completed' && step.status !== 'completed') {
            completed_at = now;
            if (!step.started_at) started_at = now;
        } else {
            completed_at = step.completed_at;
        }

        db.run(
            `UPDATE client_steps SET assigned_person = ?, status = ?, notes = ?, started_at = ?, completed_at = ? WHERE client_id = ? AND step_order = ?`,
            [assigned_person || step.assigned_person, status || step.status, notes !== undefined ? notes : step.notes, started_at, completed_at, clientId, stepOrder],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });

                // Update client's current stage
                if (status === 'completed') {
                    db.run(`UPDATE clients SET current_stage = ?, updated_at = ? WHERE id = ? AND current_stage <= ?`,
                        [parseInt(stepOrder) + 1, now, clientId, stepOrder]);
                }

                // Log activity
                const action = status === 'completed' ? 'step_completed' : (assigned_person ? 'person_assigned' : 'step_updated');
                db.run(`INSERT INTO activity_log (client_id, step_order, action, details, performed_by) VALUES (?, ?, ?, ?, ?)`,
                    [clientId, stepOrder, action, `Step ${stepOrder} updated`, assigned_person]);

                res.json({ success: true });
            }
        );
    });
});

// Toggle step status
app.patch('/api/clients/:clientId/steps/:stepOrder/toggle', (req, res) => {
    const { clientId, stepOrder } = req.params;
    const now = new Date().toISOString();

    db.get('SELECT * FROM client_steps WHERE client_id = ? AND step_order = ?', [clientId, stepOrder], (err, step) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!step) return res.status(404).json({ error: 'Step not found' });

        const newStatus = step.status === 'completed' ? 'pending' : 'completed';
        const completed_at = newStatus === 'completed' ? now : null;
        const started_at = step.started_at || (newStatus === 'completed' ? now : null);

        db.run(
            `UPDATE client_steps SET status = ?, started_at = ?, completed_at = ? WHERE client_id = ? AND step_order = ?`,
            [newStatus, started_at, completed_at, clientId, stepOrder],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });

                // Update current stage
                if (newStatus === 'completed') {
                    db.run(`UPDATE clients SET current_stage = ?, updated_at = ? WHERE id = ? AND current_stage <= ?`,
                        [parseInt(stepOrder) + 1, now, clientId, stepOrder]);
                }

                res.json({ success: true, status: newStatus });
            }
        );
    });
});

// --- ACTIVITY LOG ---
app.get('/api/clients/:id/activity', (req, res) => {
    const { id } = req.params;
    db.all('SELECT * FROM activity_log WHERE client_id = ? ORDER BY created_at DESC LIMIT 50', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- DASHBOARD STATS ---
app.get('/api/stats', (req, res) => {
    db.get(`
        SELECT 
            (SELECT COUNT(*) FROM clients) as total_clients,
            (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
            (SELECT COUNT(*) FROM clients WHERE current_stage <= 12) as in_onboarding,
            (SELECT COUNT(*) FROM clients WHERE current_stage > 12) as in_bau,
            (SELECT COUNT(*) FROM clients WHERE health_score < 60) as at_risk
        FROM clients LIMIT 1
    `, (err, stats) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(stats || { total_clients: 0, active_clients: 0, in_onboarding: 0, in_bau: 0, at_risk: 0 });
    });
});

// --- TEMPLATE (for reference) ---
app.get('/api/template', (req, res) => {
    db.all('SELECT * FROM template_steps ORDER BY step_order', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Serve frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

process.on('uncaughtException', (err) => { console.error('Uncaught:', err); process.exit(1); });
process.on('SIGINT', () => { db.close(); process.exit(0); });
