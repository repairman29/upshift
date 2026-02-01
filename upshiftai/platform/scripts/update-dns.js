const https = require('https');

const DOMAIN = 'upshiftai.dev';
const VERCEL_IP = '76.76.21.21';

// Read keys from args or env
const API_KEY = process.env.PORKBUN_API_KEY || process.argv[2];
const SECRET_KEY = process.env.PORKBUN_SECRET_KEY || process.argv[3];

if (!API_KEY || !SECRET_KEY) {
  console.error('Usage: node update-dns.js <API_KEY> <SECRET_KEY>');
  console.error('Or set PORKBUN_API_KEY and PORKBUN_SECRET_KEY env vars');
  process.exit(1);
}

const payload = {
  secretapikey: SECRET_KEY,
  apikey: API_KEY
};

async function porkbunRequest(endpoint, body) {
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
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ ...payload, ...body }));
    req.end();
  });
}

async function updateRecord(subdomain, type, content) {
  console.log(`Updating ${subdomain || '@'}.${DOMAIN} to ${content}...`);
  
  // 1. Delete existing records for this subdomain
  const retrieve = await porkbunRequest(`dns/retrieve/${DOMAIN}`);
  if (retrieve.status === 'SUCCESS') {
    const records = retrieve.records.filter(r => 
      r.name === (subdomain ? `${subdomain}.${DOMAIN}` : DOMAIN) && r.type === type
    );
    
    for (const record of records) {
      console.log(`  Deleting existing record: ${record.id} (${record.content})`);
      await porkbunRequest(`dns/delete/${DOMAIN}/${record.id}`);
    }
  }

  // 2. Create new record
  const create = await porkbunRequest(`dns/create/${DOMAIN}`, {
    name: subdomain || '',
    type: type,
    content: content,
    ttl: "600"
  });

  if (create.status === 'SUCCESS') {
    console.log(`✅ Success: ${subdomain || '@'}.${DOMAIN} -> ${content}`);
  } else {
    console.error(`❌ Failed: ${create.message}`);
  }
}

async function main() {
  console.log(`Configuring DNS for ${DOMAIN}...`);
  
  // Update root (@)
  await updateRecord('', 'A', VERCEL_IP);
  
  // Update api subdomain
  await updateRecord('api', 'A', VERCEL_IP);
  
  console.log('\nDNS update complete. Propagation may take 15-60 minutes.');
}

main().catch(console.error);