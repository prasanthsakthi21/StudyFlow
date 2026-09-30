const http = require('http');

function check(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                console.log(`[${url}] Status: ${res.statusCode}`);
                console.log(`Preview: ${data.substring(0, 100)}`);
                resolve();
            });
        }).on('error', (e) => {
            console.log(`[${url}] Error: ${e.message}`);
            resolve();
        });
    });
}

async function run() {
    await check('http://localhost:3000/');
    await check('http://localhost:3000/roadmap/DS');
    // Try 5000 just in case
    await check('http://localhost:5000/');
    await check('http://localhost:5000/roadmap/DS');
    // Try 8081
    await check('http://localhost:8081/');
}

run();
