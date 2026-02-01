const https = require('https');

const DOMAIN = 'upshiftai.dev';
const API_KEY = process.env.PORKBUN_API_KEY || 'pk1_2a487043cb36e69c59a1ee7d62222cb858513331b9026e712c7ba325716d1f06';
const SECRET_KEY = process.env.PORKBUN_SECRET_KEY || 'sk1_c0c8e1551adfd0cbb26eaf9b6993d4456570e644181498c3dc9b277c22c2139e';

const payload = { secretapikey: SECRET_KEY, apikey: API_KEY };

async function porkbunRequest(endpoint, body = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.porkbun.com',
      path: `/api/json/v3/${endpoint}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ ...payload, ...body }));
    req.end();
  });
}

async function check() {
  console.log(`Checking DNS records for ${DOMAIN}...`);
  const retrieve = await porkbunRequest(`dns/retrieve/${DOMAIN}`);
  
  if (retrieve.status === 'SUCCESS') {
    const apiRecords = retrieve.records.filter(r => r.name === `api.${DOMAIN}`);
    console.log('Current api records:', apiRecords);
    
    if (apiRecords.length > 0) {
      console.log('Deleting existing api records...');
      for (const r of apiRecords) {
        await porkbunRequest(`dns/delete/${DOMAIN}/${r.id}`);
        console.log(`Deleted ${r.id}`);
      }
    }
    
    console.log('Creating new api record...');
    const create = await porkbunRequest(`dns/create/${DOMAIN}`, {
      name: 'api',
      type: 'A',
      content: '76.76.21.21',
      ttl: "600"
    });
    console.log('Create result:', create);
  } else {
    console.error('Failed to retrieve:', retrieve);
  }
}

check().catch(console.error);