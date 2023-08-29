const https = require('https');

const sendPushoverNotification = (message) => {
    if (process.env.PUSHOVER_USER_KEY && process.env.PUSHOVER_API_TOKEN) {
        return new Promise((resolve, reject) => {
            const postData = `token=${process.env.PUSHOVER_API_TOKEN}&user=${process.env.PUSHOVER_USER_KEY}&message=${message}`;
            console.log(postData);
            const options = {
                hostname: 'api.pushover.net',
                port: 443,
                path: '/1/messages.json',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
    
            const req = https.request(options, (res) => {
                let data = '';
    
                res.on('data', (chunk) => {
                    data += chunk;
                });
    
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`Received ${res.statusCode}: ${data}`));
                    }
                });
            });
    
            req.on('error', (error) => {
                reject(error);
            });
    
            req.write(postData);
            req.end();
        });
    } else {
        console.error('Pushover User Key Or Pushover Api Token not set');
    }
};

module.exports = { sendPushoverNotification };
