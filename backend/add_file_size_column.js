const db = require('./db');

async function migrate() {
    try {
        console.log('Checking if file_size column exists in files table...');
        const [columns] = await db.query("SHOW COLUMNS FROM files LIKE 'file_size'");

        if (columns.length === 0) {
            console.log('Column file_size does not exist. Adding it...');
            await db.query("ALTER TABLE files ADD COLUMN file_size BIGINT DEFAULT 0");
            console.log('Column added successfully.');
        } else {
            console.log('Column file_size already exists. Skipping.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
