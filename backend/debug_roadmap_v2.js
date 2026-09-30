const http = require('http');

console.log('Testing Roadmap Endpoint for DS V2 (Port 3001)...');
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/roadmap/DS',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log('TOPICS COUNT:', parsedData.topics ? parsedData.topics.length : 0);
            console.log('DEPENDENCIES COUNT:', parsedData.dependencies ? parsedData.dependencies.length : 0);
            console.log('SAMPLE TOPIC:', parsedData.topics ? parsedData.topics[0] : 'None');
        } catch (e) {
            console.error(e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
