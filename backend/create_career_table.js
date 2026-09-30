const db = require('./db');

async function createCareerTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS career_analysis (
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
        console.log('career_analysis table created or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

createCareerTable();
