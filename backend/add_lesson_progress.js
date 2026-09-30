const db = require('./db');

const createLessonProgressTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS lesson_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            file_id INT NOT NULL,
            last_lesson_index INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
            UNIQUE KEY unique_access (user_id, file_id)
        );
    `;

    try {
        await db.query(sql);
        console.log("✅ lesson_progress table created or already exists.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating table:", err);
        process.exit(1);
    }
};

createLessonProgressTable();
