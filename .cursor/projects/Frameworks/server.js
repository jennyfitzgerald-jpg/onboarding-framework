const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Ensure database directory exists (for cloud deployments)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

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
                    console.log('Database is empty, run "npm run seed" to populate with default steps');
                }
            });
        }
    });
}

// API Routes

// Get all steps
app.get('/api/steps', (req, res) => {
    db.all('SELECT * FROM steps ORDER BY step_order ASC, created_at ASC', (err, rows) => {
        if (err) {
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

// Serve index.html for root and all routes (SPA support)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
