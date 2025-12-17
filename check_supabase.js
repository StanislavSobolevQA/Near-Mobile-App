const https = require('https');

const token = 'sbp_af1300fc1fda1f74ba478d366904e2e5ee90a2c3';
const projectId = 'vflrzslwbpscswbdcelu';

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectId}/api-keys`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
