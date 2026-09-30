const db = require('./db');
const fs = require('fs');
const path = require('path');

async function checkHealth() {
    console.log("Health Check Starting...");
    try {
        // 1. Check DB Connection
        await db.query('SELECT 1');
        console.log("✅ Database Connected");

        // 2. Check Tables
        const [tables] = await db.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log("Tables found:", tableNames);

        // 3. Check audio_url column
        const [columns] = await db.query("SHOW COLUMNS FROM micro_lessons LIKE 'audio_url'");
        if (columns.length > 0) {
            console.log("✅ 'audio_url' column exists in micro_lessons");
        } else {
            console.error("❌ 'audio_url' column MISSING in micro_lessons");
        }

        // 4. Check Uploads Directory
        const uploadDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadDir)) {
            console.log("✅ Uploads directory exists");
        } else {
            console.error("❌ Uploads directory MISSING");
        }

        console.log("Health Check Complete");
        process.exit(0);
    } catch (err) {
        console.error("❌ Health Check Failed:", err);
        process.exit(1);
    }
}

checkHealth();
