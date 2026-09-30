const db = require('./db');

async function addAudioUrlColumn() {
    try {
        console.log('Adding audio_url column to micro_lessons table...');

        // Check if column exists logic typically involves querying schema, 
        // but simplified "ADD COLUMN IF NOT EXISTS" for MySQL sometimes varies by version.
        // We'll wrap in try-catch or use raw SQL.

        // Note: MySQL 8.0+ supports IF NOT EXISTS in ADD COLUMN, but older might not.
        // Safe approach: Try to add it, ignore 'Duplicate column' error.

        await db.query(`
      ALTER TABLE micro_lessons
      ADD COLUMN audio_url TEXT;
    `);

        console.log('✅ audio_url column added successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ audio_url column already exists.');
        } else {
            console.error('❌ Failed to add column:', error);
        }
    } finally {
        process.exit();
    }
}

addAudioUrlColumn();
