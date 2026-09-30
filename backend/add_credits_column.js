const db = require('./db');

async function addCreditsColumn() {
    try {
        console.log('Checking "users" table for "credits" column...');
        const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'credits'");

        if (columns.length === 0) {
            console.log('Adding "credits" column...');
            await db.query("ALTER TABLE users ADD COLUMN credits INT DEFAULT 0");
            console.log('✅ Added "credits" column to users table.');
        } else {
            console.log('✅ "credits" column already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to add credits column:', err.message);
        process.exit(1);
    }
}

addCreditsColumn();
