const db = require('./db');

async function updateMetadata() {
    try {
        console.log('🔄 Updating Metadata for Frontend & System Design...');

        const updates = [
            // Frontend (IDs 20-26 based on previous check)
            { id: 20, diff: 1, time: '2h' }, // HTML/CSS
            { id: 21, diff: 2, time: '5h' }, // JS
            { id: 22, diff: 3, time: '4h' }, // React Basics
            { id: 23, diff: 3, time: '3h' }, // Hooks (was React in my seed, but 23 is Hooks in DB)
            { id: 24, diff: 4, time: '2h' }, // Routing
            { id: 25, diff: 5, time: '4h' }, // State Mgmt
            { id: 26, diff: 4, time: '3h' }, // API / Query

            // System Design (IDs 101-108)
            { id: 101, diff: 2, time: '3h' }, // Protocols
            { id: 102, diff: 2, time: '4h' }, // OS Basics
            { id: 103, diff: 3, time: '5h' }, // Networking
            { id: 104, diff: 3, time: '6h' }, // Databases
            { id: 105, diff: 4, time: '2h' }, // Caching
            { id: 106, diff: 5, time: '3h' }, // Load Bal.
            { id: 107, diff: 6, time: '4h' }, // Sharding
            { id: 108, diff: 7, time: '2h' }  // CAP Thm
        ];

        for (const u of updates) {
            await db.query(
                'UPDATE topics SET difficulty_score = ?, estimated_time = ? WHERE id = ?',
                [u.diff, u.time, u.id]
            );
        }

        console.log('✅ Updated difficulty and time for all topics.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating metadata:', error);
        process.exit(1);
    }
}

updateMetadata();
