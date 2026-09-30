const db = require('./db');

async function createTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS career_assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                skills TEXT,
                interests TEXT,
                academics TEXT,
                result_json JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ career_assessments table created/verified');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

createTable();
