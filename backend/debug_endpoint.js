const axios = require('axios'); // Assuming axios might be installed or use http
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000, // Assuming port 5000 based on standard Express defaults, checking server.js would confirm
    path: '/roadmap/DS',
    method: 'GET',
};

// Check server.js port
// I'll assume 3000 or 5000. Let's try 5000 first, or read from server.js if needed.
// Actually, let's just use a simple fetch if node > 18 or http.

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        console.log('BODY:', data.substring(0, 500)); // Print start of json
    });
});

req.on('error', error => {
    console.error('ERROR:', error);
});

req.end();
