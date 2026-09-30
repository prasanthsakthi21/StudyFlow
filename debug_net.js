const fs = require('fs');
const os = require('os');
const nets = os.networkInterfaces();
const results = {};

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}

// Write the first found external IP to ip.txt
let foundIP = '127.0.0.1';
const interfaceNames = Object.keys(results);
if (interfaceNames.length > 0) {
    foundIP = results[interfaceNames[0]][0];
}

fs.writeFileSync('ip.txt', foundIP);
console.log('Found IP:', foundIP);
