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

        // Add new columns to clients table (migration - safe if columns already exist)
        const newColumns = [
            ['legal_entity', 'TEXT'],
            ['brand_name', 'TEXT'],
            ['operating_sites', 'TEXT'],
            ['short_code', 'TEXT'],
            ['contract_status', 'TEXT'],
            ['dpia_required', 'INTEGER DEFAULT 0'],
            ['dpia_status', 'TEXT'],
            ['phase_status', 'TEXT DEFAULT "planning"'],
            ['single_source_url', 'TEXT'],
            ['customer_non_responsive', 'INTEGER DEFAULT 0'],
            ['sales_escalation_triggered', 'INTEGER DEFAULT 0'],
            ['go_live_readiness_approved', 'INTEGER DEFAULT 0'],
            ['go_live_readiness_approved_by', 'TEXT'],
            ['go_live_readiness_approved_at', 'TEXT'],
            ['out_of_scope_phase2', 'TEXT']
        ];

        newColumns.forEach(([colName, colType]) => {
            db.run(`ALTER TABLE clients ADD COLUMN ${colName} ${colType}`, (err) => {
                // Ignore error if column already exists
                if (err && !err.message.includes('duplicate column')) {
                    console.log(`Note: Column ${colName} may already exist`);
                }
            });
        });

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

        // Go-live date history (Feature 3)
        db.run(`
            CREATE TABLE IF NOT EXISTS go_live_date_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id TEXT NOT NULL,
                original_or_revised TEXT NOT NULL,
                target_date TEXT NOT NULL,
                reason_for_change TEXT,
                approved_by TEXT,
                delay_caused_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        `);

        // Client requirements (Feature 2)
        db.run(`
            CREATE TABLE IF NOT EXISTS client_requirements (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL UNIQUE,
                standard_vs_non_standard TEXT,
                integration_expectations TEXT,
                specimen_blocks_slides_scope TEXT,
                day1_scope TEXT,
                phase2_scope TEXT,
                content TEXT,
                final_playback_confirmed INTEGER DEFAULT 0,
                final_playback_confirmed_at TEXT,
                updated_at TEXT,
                updated_by TEXT,
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        `);

        // Client tasks (Feature 4)
        db.run(`
            CREATE TABLE IF NOT EXISTS client_tasks (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                title TEXT NOT NULL,
                owner_team TEXT,
                owner_name TEXT,
                start_date TEXT,
                due_date TEXT,
                completion_date TEXT,
                status TEXT DEFAULT 'not_started',
                phase TEXT DEFAULT 'phase_1',
                severity TEXT,
                completion_evidence TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT,
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
        
        // Convert integer fields to boolean for frontend
        const clients = rows.map(client => ({
            ...client,
            dpia_required: client.dpia_required === 1,
            customer_non_responsive: client.customer_non_responsive === 1,
            sales_escalation_triggered: client.sales_escalation_triggered === 1,
            go_live_readiness_approved: client.go_live_readiness_approved === 1
        }));
        
        res.json(clients);
    });
});

// Get single client with all steps
app.get('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM clients WHERE id = ?', [id], (err, client) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!client) return res.status(404).json({ error: 'Client not found' });
        
        // Convert integer fields to boolean for frontend
        client.dpia_required = client.dpia_required === 1;
        client.customer_non_responsive = client.customer_non_responsive === 1;
        client.sales_escalation_triggered = client.sales_escalation_triggered === 1;
        client.go_live_readiness_approved = client.go_live_readiness_approved === 1;
        
        db.all('SELECT * FROM client_steps WHERE client_id = ? ORDER BY step_order', [id], (err, steps) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...client, steps });
        });
    });
});

// Create new client
app.post('/api/clients', (req, res) => {
    const { 
        name, tier, bdm_name, contract_date, go_live_date, notes,
        legal_entity, brand_name, operating_sites, short_code,
        contract_status, dpia_required, dpia_status, phase_status,
        single_source_url
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Client name is required' });

    const id = `client-${Date.now()}`;
    const now = new Date().toISOString();

    db.run(
        `INSERT INTO clients (id, name, tier, bdm_name, contract_date, go_live_date, notes, 
            legal_entity, brand_name, operating_sites, short_code,
            contract_status, dpia_required, dpia_status, phase_status,
            single_source_url, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id, name, tier || 'standard', bdm_name || null, contract_date || null, go_live_date || null, notes || null,
            legal_entity || null, brand_name || null, operating_sites || null, short_code || null,
            contract_status || null, dpia_required ? 1 : 0, dpia_status || null, phase_status || 'planning',
            single_source_url || null, now
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Create steps for this client
            createClientSteps(id, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // If go_live_date provided, record in history
                const goLiveDate = req.body.go_live_date || null;
                if (goLiveDate) {
                    db.run(
                        `INSERT INTO go_live_date_history (client_id, original_or_revised, target_date, created_at) 
                         VALUES (?, 'original', ?, ?)`,
                        [id, goLiveDate, now]
                    );
                }
                
                // Log activity
                db.run(`INSERT INTO activity_log (client_id, action, details) VALUES (?, 'client_created', ?)`,
                    [id, `Client "${name}" created`]);
                
                res.status(201).json({ 
                    id, name, tier: tier || 'standard', bdm_name, contract_date, notes,
                    legal_entity, brand_name, operating_sites, short_code,
                    contract_status, dpia_required: dpia_required ? 1 : 0, dpia_status, phase_status: phase_status || 'planning',
                    single_source_url, created_at: now 
                });
            });
        }
    );
});

// Update client
app.put('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    const { 
        name, tier, bdm_name, contract_date, go_live_date, status, health_score, notes,
        legal_entity, brand_name, operating_sites, short_code,
        contract_status, dpia_required, dpia_status, phase_status,
        single_source_url, customer_non_responsive, sales_escalation_triggered,
        out_of_scope_phase2
    } = req.body;
    const now = new Date().toISOString();

    // Check if go_live_date changed - if so, record in history
    db.get('SELECT go_live_date FROM clients WHERE id = ?', [id], (err, client) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!client) return res.status(404).json({ error: 'Client not found' });

        const oldGoLiveDate = client.go_live_date;
        const newGoLiveDate = go_live_date || null;

        // If go_live_date changed, record in history
        if (oldGoLiveDate !== newGoLiveDate && newGoLiveDate) {
            db.get('SELECT COUNT(*) as count FROM go_live_date_history WHERE client_id = ?', [id], (err, row) => {
                if (err) {
                    console.error('Error checking date history:', err);
                } else {
                    const isOriginal = !row || row.count === 0;
                    db.run(
                        `INSERT INTO go_live_date_history (client_id, original_or_revised, target_date, created_at) 
                         VALUES (?, ?, ?, ?)`,
                        [id, isOriginal ? 'original' : 'revised', newGoLiveDate, now]
                    );
                }
            });
        }

        db.run(
            `UPDATE clients SET 
                name = ?, tier = ?, bdm_name = ?, contract_date = ?, go_live_date = ?, 
                status = ?, health_score = ?, notes = ?, updated_at = ?,
                legal_entity = ?, brand_name = ?, operating_sites = ?, short_code = ?,
                contract_status = ?, dpia_required = ?, dpia_status = ?, phase_status = ?,
                single_source_url = ?, customer_non_responsive = ?, sales_escalation_triggered = ?,
                out_of_scope_phase2 = ?
             WHERE id = ?`,
            [
                name, tier, bdm_name, contract_date, go_live_date, status, health_score, notes, now,
                legal_entity, brand_name, operating_sites, short_code,
                contract_status, dpia_required ? 1 : 0, dpia_status, phase_status,
                single_source_url, customer_non_responsive ? 1 : 0, sales_escalation_triggered ? 1 : 0,
                out_of_scope_phase2, id
            ],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Client not found' });
                res.json({ success: true });
            }
        );
    });
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

// --- GATING (Feature 1) ---
app.put('/api/clients/:id/gating', (req, res) => {
    const { id } = req.params;
    const { contract_status, dpia_required, dpia_status } = req.body;
    const now = new Date().toISOString();

    db.run(
        `UPDATE clients SET contract_status = ?, dpia_required = ?, dpia_status = ?, updated_at = ? WHERE id = ?`,
        [contract_status || null, dpia_required ? 1 : 0, dpia_status || null, now, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Client not found' });
            
            db.run(`INSERT INTO activity_log (client_id, action, details) VALUES (?, 'gating_updated', ?)`,
                [id, `Gating updated: Contract=${contract_status}, DPIA=${dpia_status}`]);
            
            res.json({ success: true });
        }
    );
});

// --- GO-LIVE DATE HISTORY (Feature 3) ---
app.get('/api/clients/:id/go-live-history', (req, res) => {
    const { id } = req.params;
    db.all('SELECT * FROM go_live_date_history WHERE client_id = ? ORDER BY created_at ASC', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/clients/:id/go-live-date', (req, res) => {
    const { id } = req.params;
    const { target_date, reason_for_change, approved_by, delay_caused_by } = req.body;
    const now = new Date().toISOString();

    if (!target_date) return res.status(400).json({ error: 'Target date is required' });

    db.get('SELECT COUNT(*) as count FROM go_live_date_history WHERE client_id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const isOriginal = !row || row.count === 0;
        
        db.run(
            `INSERT INTO go_live_date_history (client_id, original_or_revised, target_date, reason_for_change, approved_by, delay_caused_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, isOriginal ? 'original' : 'revised', target_date, reason_for_change || null, approved_by || null, delay_caused_by || null, now],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                // Update client's go_live_date
                db.run(`UPDATE clients SET go_live_date = ?, updated_at = ? WHERE id = ?`, [target_date, now, id]);
                
                // Log activity
                db.run(`INSERT INTO activity_log (client_id, action, details, performed_by) VALUES (?, 'go_live_date_changed', ?, ?)`,
                    [id, `Go-live date ${isOriginal ? 'set' : 'revised'} to ${target_date}${reason_for_change ? ': ' + reason_for_change : ''}`, approved_by || null]);
                
                res.json({ success: true, id: this.lastID });
            }
        );
    });
});

// --- REQUIREMENTS (Feature 2) ---
app.get('/api/clients/:id/requirements', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM client_requirements WHERE client_id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

app.put('/api/clients/:id/requirements', (req, res) => {
    const { id } = req.params;
    const { 
        standard_vs_non_standard, integration_expectations, specimen_blocks_slides_scope,
        day1_scope, phase2_scope, content, final_playback_confirmed, updated_by
    } = req.body;
    const now = new Date().toISOString();

    db.get('SELECT * FROM client_requirements WHERE client_id = ?', [id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });

        if (existing) {
            // Update existing
            db.run(
                `UPDATE client_requirements SET 
                    standard_vs_non_standard = ?, integration_expectations = ?, specimen_blocks_slides_scope = ?,
                    day1_scope = ?, phase2_scope = ?, content = ?,
                    final_playback_confirmed = ?, updated_at = ?, updated_by = ?
                 WHERE client_id = ?`,
                [
                    standard_vs_non_standard, integration_expectations, specimen_blocks_slides_scope,
                    day1_scope, phase2_scope, content,
                    final_playback_confirmed ? 1 : 0, now, updated_by || null, id
                ],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    db.run(`INSERT INTO activity_log (client_id, action, details, performed_by) VALUES (?, 'requirements_updated', ?, ?)`,
                        [id, 'Requirements document updated', updated_by || null]);
                    res.json({ success: true });
                }
            );
        } else {
            // Create new
            const reqId = `req-${id}-${Date.now()}`;
            db.run(
                `INSERT INTO client_requirements 
                    (id, client_id, standard_vs_non_standard, integration_expectations, specimen_blocks_slides_scope,
                     day1_scope, phase2_scope, content, final_playback_confirmed, updated_at, updated_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    reqId, id, standard_vs_non_standard, integration_expectations, specimen_blocks_slides_scope,
                    day1_scope, phase2_scope, content, final_playback_confirmed ? 1 : 0, now, updated_by || null
                ],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    db.run(`INSERT INTO activity_log (client_id, action, details, performed_by) VALUES (?, 'requirements_created', ?, ?)`,
                        [id, 'Requirements document created', updated_by || null]);
                    res.json({ success: true, id: reqId });
                }
            );
        }
    });
});

// --- TASKS (Feature 4) ---
app.get('/api/clients/:id/tasks', (req, res) => {
    const { id } = req.params;
    db.all('SELECT * FROM client_tasks WHERE client_id = ? ORDER BY due_date ASC, created_at ASC', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/clients/:id/tasks', (req, res) => {
    const { id } = req.params;
    const { title, owner_team, owner_name, start_date, due_date, phase, severity } = req.body;
    const now = new Date().toISOString();

    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const taskId = `task-${id}-${Date.now()}`;
    db.run(
        `INSERT INTO client_tasks (id, client_id, title, owner_team, owner_name, start_date, due_date, phase, severity, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskId, id, title, owner_team || null, owner_name || null, start_date || null, due_date || null, phase || 'phase_1', severity || null, now],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`INSERT INTO activity_log (client_id, action, details) VALUES (?, 'task_created', ?)`,
                [id, `Task created: ${title}`]);
            res.status(201).json({ id: taskId, title, owner_team, owner_name, start_date, due_date, phase, severity });
        }
    );
});

app.put('/api/clients/:id/tasks/:taskId', (req, res) => {
    const { id, taskId } = req.params;
    const { title, owner_team, owner_name, start_date, due_date, completion_date, status, phase, severity, completion_evidence } = req.body;
    const now = new Date().toISOString();

    db.run(
        `UPDATE client_tasks SET 
            title = ?, owner_team = ?, owner_name = ?, start_date = ?, due_date = ?,
            completion_date = ?, status = ?, phase = ?, severity = ?, completion_evidence = ?, updated_at = ?
         WHERE id = ? AND client_id = ?`,
        [title, owner_team, owner_name, start_date, due_date, completion_date, status, phase, severity, completion_evidence, now, taskId, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
            
            db.run(`INSERT INTO activity_log (client_id, action, details) VALUES (?, 'task_updated', ?)`,
                [id, `Task updated: ${title}`]);
            res.json({ success: true });
        }
    );
});

app.delete('/api/clients/:id/tasks/:taskId', (req, res) => {
    const { id, taskId } = req.params;
    db.run('DELETE FROM client_tasks WHERE id = ? AND client_id = ?', [taskId, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ success: true });
    });
});

// --- ALERTS (Feature 5) - Computed ---
app.get('/api/clients/:id/alerts', (req, res) => {
    const { id } = req.params;
    const alerts = [];

    db.get('SELECT * FROM clients WHERE id = ?', [id], (err, client) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!client) return res.status(404).json({ error: 'Client not found' });

        // Check contract status
        if (client.contract_status !== 'yes') {
            alerts.push({
                type: 'contract_not_signed',
                severity: 'high',
                message: 'Contract status is not "Yes" - onboarding cannot proceed',
                step_order: 3
            });
        }

        // Check DPIA
        if (client.dpia_required === 1 && client.dpia_status !== 'yes' && client.dpia_status !== 'waived') {
            alerts.push({
                type: 'dpia_missing',
                severity: 'high',
                message: `DPIA is required but status is "${client.dpia_status || 'not set'}"`,
                step_order: 3
            });
        }

        // Check tasks
        db.all('SELECT * FROM client_tasks WHERE client_id = ?', [id], (err, tasks) => {
            if (!err && tasks) {
                const now = new Date();
                tasks.forEach(task => {
                    // Tasks with no completion date past due
                    if (task.status !== 'done' && task.due_date) {
                        const dueDate = new Date(task.due_date);
                        if (dueDate < now && !task.completion_date) {
                            alerts.push({
                                type: 'task_overdue_no_completion',
                                severity: 'high',
                                message: `Task "${task.title}" is overdue with no completion date`,
                                task_id: task.id
                            });
                        }
                    }

                    // Tasks overdue
                    if (task.status !== 'done' && task.due_date) {
                        const dueDate = new Date(task.due_date);
                        if (dueDate < now) {
                            alerts.push({
                                type: 'task_overdue',
                                severity: task.severity === 'high' ? 'high' : 'medium',
                                message: `Task "${task.title}" is overdue`,
                                task_id: task.id
                            });
                        }
                    }

                    // Critical dependencies missing (check by title keywords)
                    const criticalKeywords = ['EMR', 'SNOMED', 'labels', 'integration'];
                    if (task.status !== 'done' && criticalKeywords.some(kw => task.title.toLowerCase().includes(kw.toLowerCase()))) {
                        alerts.push({
                            type: 'critical_dependency_missing',
                            severity: 'high',
                            message: `Critical dependency "${task.title}" is not completed`,
                            task_id: task.id
                        });
                    }
                });
            }

            res.json(alerts);
        });
    });
});

app.get('/api/alerts', (req, res) => {
    const { severity } = req.query;
    db.all('SELECT id FROM clients WHERE status = "active"', [], (err, clients) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const allAlerts = [];
        let processed = 0;
        
        if (clients.length === 0) return res.json([]);
        
        clients.forEach(client => {
            // Reuse alert logic for each client
            const clientAlerts = [];
            
            db.get('SELECT * FROM clients WHERE id = ?', [client.id], (err, c) => {
                if (!err && c) {
                    if (c.contract_status !== 'yes') {
                        clientAlerts.push({ client_id: c.id, client_name: c.name, type: 'contract_not_signed', severity: 'high', message: 'Contract not signed' });
                    }
                    if (c.dpia_required === 1 && c.dpia_status !== 'yes' && c.dpia_status !== 'waived') {
                        clientAlerts.push({ client_id: c.id, client_name: c.name, type: 'dpia_missing', severity: 'high', message: 'DPIA missing' });
                    }
                }
                
                db.all('SELECT * FROM client_tasks WHERE client_id = ? AND status != "done"', [client.id], (err, tasks) => {
                    if (!err && tasks) {
                        const now = new Date();
                        tasks.forEach(task => {
                            if (task.due_date && new Date(task.due_date) < now) {
                                clientAlerts.push({ client_id: client.id, client_name: c?.name, type: 'task_overdue', severity: 'medium', message: `Task overdue: ${task.title}`, task_id: task.id });
                            }
                        });
                    }
                    
                    allAlerts.push(...clientAlerts);
                    processed++;
                    
                    if (processed === clients.length) {
                        const filtered = severity ? allAlerts.filter(a => a.severity === severity) : allAlerts;
                        res.json(filtered);
                    }
                });
            });
        });
    });
});

// --- GO-LIVE READINESS (Feature 6) ---
app.post('/api/clients/:id/go-live-readiness', (req, res) => {
    const { id } = req.params;
    const { approved_by, out_of_scope_phase2 } = req.body;
    const now = new Date().toISOString();

    if (!approved_by) return res.status(400).json({ error: 'Approved by is required' });

    db.run(
        `UPDATE clients SET 
            go_live_readiness_approved = 1,
            go_live_readiness_approved_by = ?,
            go_live_readiness_approved_at = ?,
            out_of_scope_phase2 = ?,
            updated_at = ?
         WHERE id = ?`,
        [approved_by, now, out_of_scope_phase2 || null, now, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Client not found' });
            
            db.run(`INSERT INTO activity_log (client_id, action, details, performed_by) VALUES (?, 'go_live_readiness_approved', ?, ?)`,
                [id, `Go-live readiness approved. Out of scope: ${out_of_scope_phase2 || 'None'}`, approved_by]);
            
            res.json({ success: true });
        }
    );
});

// --- ESCALATION (Feature 9) ---
app.put('/api/clients/:id/escalation', (req, res) => {
    const { id } = req.params;
    const { customer_non_responsive, sales_escalation_triggered } = req.body;
    const now = new Date().toISOString();

    db.run(
        `UPDATE clients SET 
            customer_non_responsive = ?,
            sales_escalation_triggered = ?,
            updated_at = ?
         WHERE id = ?`,
        [customer_non_responsive ? 1 : 0, sales_escalation_triggered ? 1 : 0, now, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Client not found' });
            
            const details = [];
            if (customer_non_responsive) details.push('Customer marked as non-responsive');
            if (sales_escalation_triggered) details.push('Sales escalation triggered');
            
            db.run(`INSERT INTO activity_log (client_id, action, details) VALUES (?, 'escalation_updated', ?)`,
                [id, details.join(', ') || 'Escalation flags updated']);
            
            res.json({ success: true });
        }
    );
});

// --- PORTFOLIO / REPORTING (Feature 12) ---
app.get('/api/portfolio', (req, res) => {
    db.all(`
        SELECT 
            c.id, c.name, c.short_code, c.phase_status, c.current_stage, c.go_live_date, c.updated_at,
            c.contract_status, c.dpia_required, c.dpia_status,
            (SELECT COUNT(*) FROM client_tasks WHERE client_id = c.id AND status != 'done' AND due_date < date('now')) as overdue_tasks,
            (SELECT COUNT(*) FROM client_tasks WHERE client_id = c.id AND status != 'done') as pending_tasks
        FROM clients c
        WHERE c.status = 'active'
        ORDER BY c.go_live_date ASC, c.updated_at DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Add key blockers
        const results = rows.map(row => {
            const blockers = [];
            if (row.contract_status && row.contract_status !== 'yes') blockers.push('Contract not signed');
            if (row.dpia_required === 1 && row.dpia_status !== 'yes' && row.dpia_status !== 'waived') blockers.push('DPIA missing');
            if (row.overdue_tasks > 0) blockers.push(`${row.overdue_tasks} overdue task(s)`);
            return { ...row, key_blockers: blockers };
        });
        
        res.json(results);
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
            (SELECT COUNT(*) FROM clients WHERE phase_status IN ('planning', 'discovery', 'in_build', 'ready_to_go_live')) as in_onboarding,
            (SELECT COUNT(*) FROM clients WHERE phase_status = 'live') as in_bau,
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
