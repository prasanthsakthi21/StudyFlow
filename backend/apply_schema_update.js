const db = require('./db');

async function updateSchema() {
    try {
        console.log('Checking database schema...');

        // 1. Add public_id
        try {
            await db.query(`ALTER TABLE files ADD COLUMN public_id VARCHAR(255) AFTER user_id`);
            console.log('Added public_id column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding public_id:', e.message);
            else console.log('public_id already exists');
        }

        // 2. Add uploaded_by
        try {
            await db.query(`ALTER TABLE files ADD COLUMN uploaded_by ENUM('admin', 'student', 'teacher') DEFAULT 'student' AFTER public_id`);
            console.log('Added uploaded_by column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding uploaded_by:', e.message);
            else console.log('uploaded_by already exists');
        }

        // 3. Add secure_url
        try {
            await db.query(`ALTER TABLE files ADD COLUMN secure_url TEXT AFTER file_url`);
            console.log('Added secure_url column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding secure_url:', e.message);
            else console.log('secure_url already exists');
        }

        console.log('Schema update complete.');
        process.exit(0);
    } catch (err) {
        console.error('Fatal error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
