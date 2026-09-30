const db = require('./db');

async function createCodeLessonsTable() {
    try {
        console.log('Creating code_lessons table if not exists...');

        await db.query(`
      CREATE TABLE IF NOT EXISTS code_lessons (
          id INT AUTO_INCREMENT PRIMARY KEY,
          language VARCHAR(50) NOT NULL,
          snippet TEXT NOT NULL,
          explanation TEXT,
          complexity VARCHAR(50), 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Insert dummy data if empty
        const [rows] = await db.query('SELECT COUNT(*) as count FROM code_lessons');
        if (rows[0].count === 0) {
            console.log('Seeding code_lessons table...');

            const dummyData = [
                {
                    language: 'javascript',
                    snippet: 'function binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}',
                    explanation: 'Binary search finds an element in a sorted array by repeatedly dividing the search interval in half.',
                    complexity: 'O(log n)'
                },
                {
                    language: 'python',
                    snippet: 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]',
                    explanation: 'Bubble sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
                    complexity: 'O(n^2)'
                },
                {
                    language: 'java',
                    snippet: 'public int factorial(int n) {\n    if (n == 0) return 1;\n    return n * factorial(n - 1);\n}',
                    explanation: 'Recursive function to calculate the factorial of a number.',
                    complexity: 'O(n)'
                }
            ];

            for (const data of dummyData) {
                await db.query('INSERT INTO code_lessons (language, snippet, explanation, complexity) VALUES (?, ?, ?, ?)',
                    [data.language, data.snippet, data.explanation, data.complexity]);
            }
        }

        console.log('✅ code_lessons table ready.');
    } catch (error) {
        console.error('❌ Failed to create/seed table:', error);
    } finally {
        process.exit();
    }
}

createCodeLessonsTable();
