const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');

// Find the local IP address
function getLocalExternalIP() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                // Prefer 192.168.x.x or 10.x.x.x (common local networks)
                // specific for the user's current network 10.176.x.x
                return net.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback
}

const myIP = getLocalExternalIP();
const apiFilePath = path.join(__dirname, '..', 'constants', 'Api.ts');

const content = `// ==================================================================
// API CONNECTION SETTINGS
// ==================================================================
// 1. ANDROID EMULATOR: Use 'http://10.0.2.2:3000'
// 2. PHYSICAL PHONE:   Use your PC's IP below (Automatically Updated)
// ==================================================================

export const API_URL = 'http://${myIP}:3000';

console.log('[API] Configured URL:', API_URL);
`;

fs.writeFileSync(apiFilePath, content, 'utf8');
console.log(`✅ Updated API_URL to http://${myIP}:3000`);
