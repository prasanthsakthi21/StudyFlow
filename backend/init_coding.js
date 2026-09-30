const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'studyflow_db'
};

const problems = [
    {
        title: 'Reverse a Number',
        description: 'Given an integer N, reverse the digits of the number.',
        difficulty: 'Easy',
        tags: JSON.stringify(['Math', 'Basic']),
        input_format: 'A single integer N',
        output_format: 'Reverse of the given number',
        constraints: '-10^9 ≤ N ≤ 10^9',
        example_input: '1234',
        example_output: '4321',
        starter_code: JSON.stringify({
            python: 'n = int(input())\n\n# __SOLUTION_START__\nprint(str(n)[::-1])',
            javascript: 'const n = parseInt(readline());\nconsole.log(n.toString().split("").reverse().join(""));',
            c: '#include <stdio.h>\nint main() { int n; scanf("%d", &n); /* Logic */ return 0; }'
        }),
        test_cases: JSON.stringify([
            { input: '123', output: '321' },
            { input: '100', output: '001' },
            { input: '0', output: '0' }
        ])
    },
    {
        title: 'Check Prime Number',
        description: 'Check whether the given number is a prime number.',
        difficulty: 'Easy',
        tags: JSON.stringify(['Math', 'Easy']),
        input_format: 'A single integer N',
        output_format: 'Print "Prime" or "Not Prime"',
        constraints: '1 ≤ N ≤ 10^9',
        example_input: '7',
        example_output: 'Prime',
        starter_code: JSON.stringify({
            python: 'n = int(input())\n# Write logic'
        }),
        test_cases: JSON.stringify([
            { input: '7', output: 'Prime' },
            { input: '10', output: 'Not Prime' },
            { input: '2', output: 'Prime' }
        ])
    },
    {
        title: 'Find Second Largest',
        description: 'Given an array of N integers, find the second largest element.',
        difficulty: 'Medium',
        tags: JSON.stringify(['Array', 'Sorting']),
        input_format: 'N\nArray elements',
        output_format: 'Second largest number',
        constraints: '2 ≤ N ≤ 10^5',
        example_input: '5\n10 20 30 40 50',
        example_output: '40',
        starter_code: JSON.stringify({
            python: 'n = int(input())\narr = list(map(int, input().split()))\n# Logic'
        }),
        test_cases: JSON.stringify([
            { input: '5\n1 2 3 4 5', output: '4' },
            { input: '3\n10 10 5', output: '5' }
        ])
    },
    {
        title: 'FizzBuzz',
        description: 'Print numbers from 1 to N. For multiples of 3 print "Fizz", 5 print "Buzz", both print "FizzBuzz".',
        difficulty: 'Easy',
        tags: JSON.stringify(['Logic', 'Loop']),
        input_format: 'Integer N',
        output_format: 'Lines of strings/numbers',
        constraints: '1 ≤ N ≤ 100',
        example_input: '5',
        example_output: '1\n2\nFizz\n4\nBuzz',
        starter_code: JSON.stringify({
            python: 'n = int(input())\n# Logic'
        }),
        test_cases: JSON.stringify([
            { input: '3', output: '1\n2\nFizz' },
            { input: '5', output: '1\n2\nFizz\n4\nBuzz' }
        ])
    },
    {
        title: 'Valid Palindrome',
        description: 'Given a string, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.',
        difficulty: 'Easy',
        tags: JSON.stringify(['String', 'Two Pointers']),
        input_format: 'String S',
        output_format: 'True or False',
        constraints: '1 <= s.length <= 2 * 10^5',
        example_input: 'A man, a plan, a canal: Panama',
        example_output: 'True',
        starter_code: JSON.stringify({
            python: 's = input()\n# Logic'
        }),
        test_cases: JSON.stringify([
            { input: 'race a car', output: 'False' },
            { input: 'aba', output: 'True' }
        ])
    },
    {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'Easy',
        tags: JSON.stringify(['Array', 'Hash Table']),
        input_format: 'N\nArray\nTarget',
        output_format: 'Index1 Index2',
        constraints: '2 <= nums.length <= 10^4',
        example_input: '4\n2 7 11 15\n9',
        example_output: '0 1',
        starter_code: JSON.stringify({
            python: 'n = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\n# Logic'
        }),
        test_cases: JSON.stringify([
            { input: '3\n3 2 4\n6', output: '1 2' }
        ])
    },
    {
        title: 'Merge k Sorted Lists',
        description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
        difficulty: 'Hard',
        tags: JSON.stringify(['LinkedList', 'Divide and Conquer', 'Heap']),
        input_format: 'Complex Format',
        output_format: 'Sorted List',
        constraints: '0 <= k <= 10^4',
        example_input: '[[1,4,5],[1,3,4],[2,6]]',
        example_output: '[1,1,2,3,4,4,5,6]',
        starter_code: JSON.stringify({
            python: '# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        pass'
        }),
        test_cases: JSON.stringify([])
    },
    {
        title: 'Factorial of a Number',
        description: 'Calculate the factorial of a given non-negative integer N.',
        difficulty: 'Easy',
        tags: JSON.stringify(['Math', 'Recursion']),
        input_format: 'Integer N',
        output_format: 'Factorial of N',
        constraints: '0 ≤ N ≤ 20',
        example_input: '5',
        example_output: '120',
        starter_code: JSON.stringify({
            python: 'n = int(input())\n# Logic'
        }),
        test_cases: JSON.stringify([
            { input: '0', output: '1' },
            { input: '5', output: '120' }
        ])
    },
    {
        title: 'Maximum Subarray Sum',
        description: 'Find the contiguous subarray within an array (containing at least one number) which has the largest sum.',
        difficulty: 'Medium',
        tags: JSON.stringify(['Array', 'Dynamic Programming']),
        input_format: 'N\nArray elements',
        output_format: 'Maximum Sum',
        constraints: '1 <= N <= 10^5',
        example_input: '9\n-2 1 -3 4 -1 2 1 -5 4',
        example_output: '6',
        starter_code: JSON.stringify({
            python: 'n = int(input())\narr = list(map(int, input().split()))\n# Logic'
        }),
        test_cases: JSON.stringify([
            { input: '1\n1', output: '1' },
            { input: '2\n-1 -2', output: '-1' } // Assuming logic handles max
        ])
    },
    {
        title: 'Climbing Stairs',
        description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
        difficulty: 'Easy',
        tags: JSON.stringify(['DP']),
        input_format: 'Integer N',
        output_format: 'Ways',
        constraints: '1 <= n <= 45',
        example_input: '2',
        example_output: '2',
        starter_code: JSON.stringify({
            python: 'n = int(input())\n# Logic'
        }),
        test_cases: JSON.stringify([
            { input: '3', output: '3' },
            { input: '4', output: '5' }
        ])
    }
];

async function init() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        // Create Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS coding_problems (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
                tags JSON,
                input_format TEXT,
                output_format TEXT,
                constraints TEXT,
                example_input TEXT,
                example_output TEXT,
                starter_code JSON,
                test_cases JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table coding_problems ensured.');

        // Insert Problems
        for (const p of problems) {
            // Check if exists
            const [rows] = await connection.execute('SELECT id FROM coding_problems WHERE title = ?', [p.title]);
            if (rows.length === 0) {
                await connection.execute(`
                    INSERT INTO coding_problems 
                    (title, description, difficulty, tags, input_format, output_format, constraints, example_input, example_output, starter_code, test_cases)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `, [
                    p.title, p.description, p.difficulty, p.tags,
                    p.input_format, p.output_format, p.constraints,
                    p.example_input, p.example_output, p.starter_code, p.test_cases
                ]);
                console.log(`Inserted: ${p.title}`);
            } else {
                console.log(`Skipped: ${p.title} (Exists)`);
            }
        }

        console.log('Done.');
        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

init();
