const { exec } = require('child_process');
exec('netstat -ano | findstr :3000', (err, stdout) => {
    if (err) {
        console.log('No process found on 3000');
        return;
    }
    console.log('Process on 3000:');
    console.log(stdout);
});
