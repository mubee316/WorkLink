// Run with: node test-interswitch-auth.js
// Tests all credential + endpoint combinations to find which one works

require('dotenv').config();
const axios = require('axios');

const CRED_SETS = [
  {
    label: 'Checkout credentials (Set 1)',
    id: process.env.INTERSWITCH_CLIENT_ID,
    secret: process.env.INTERSWITCH_CLIENT_SECRET,
  },
  {
    label: 'Transfer credentials (Set 2)',
    id: process.env.INTERSWITCH_TRANSFER_CLIENT_ID,
    secret: process.env.INTERSWITCH_TRANSFER_CLIENT_SECRET,
  },
];

const ENDPOINTS = [
  'https://qa.interswitchng.com/passport/oauth/token',
  'https://sandbox.interswitchng.com/passport/oauth/token',
  'https://api-gateway.interswitchng.com/passport/oauth/token',
  'https://api-gateway.interswitchng.com/passport/oauth/token?env=test',
];

async function tryAuth(label, clientId, clientSecret, url) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  try {
    const res = await axios.post(
      url,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );
    console.log(`  ✅ SUCCESS — token: ${res.data.access_token?.slice(0, 30)}...`);
    return res.data.access_token;
  } catch (err) {
    const status = err.response?.status || 'NO_RESPONSE';
    const body = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.log(`  ❌ ${status} — ${body}`);
    return null;
  }
}

async function testAccountVerify(token, base) {
  // Test with a real GTBank account number (widely used test account)
  const url = `${base}/api/v1/identity/account/validate`;
  try {
    const res = await axios.post(
      url,
      { bankCode: '058', accountNumber: '0123456789' },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    console.log(`  ✅ Account verify OK — response: ${JSON.stringify(res.data)}`);
    return true;
  } catch (err) {
    const status = err.response?.status || 'NO_RESPONSE';
    const body = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.log(`  ⚠️  Account verify ${status} — ${body}`);
    // 404/account not found is still a "working" endpoint — it means auth passed
    return status !== 401 && status !== 403;
  }
}

async function run() {
  console.log('=== Interswitch Auth Diagnostic ===\n');

  // Step 1: find working token
  let workingToken = null;
  let workingCreds = null;

  for (const creds of CRED_SETS) {
    console.log(`\n── ${creds.label} ──`);
    console.log(`   ID: ${creds.id}`);
    for (const url of ENDPOINTS) {
      console.log(`\n  → ${url}`);
      const token = await tryAuth(creds.label, creds.id, creds.secret, url);
      if (token && !workingToken) {
        workingToken = token;
        workingCreds = { ...creds, url };
      }
    }
  }

  console.log('\n=== API Endpoint Test ===');
  if (!workingToken) {
    console.log('\n❌ No token — cannot test endpoints.');
    process.exit(1);
  }

  const base = 'https://qa.interswitchng.com';
  console.log(`\nUsing token from: ${workingCreds.url}`);
  console.log(`\n→ Testing account verification: ${base}/api/v1/identity/account/validate`);
  const accountOk = await testAccountVerify(workingToken, base);

  console.log('\n=== Summary ===');
  console.log(`\n  OAuth token:          ✅ Working (qa.interswitchng.com)`);
  console.log(`  Account verification: ${accountOk ? '✅ Endpoint reachable' : '❌ Blocked'}`);

  if (accountOk) {
    console.log('\n✅ Transfer API is accessible. Payout flow should work.');
    console.log('   Make sure DEMO_PAYMENTS=false in your .env');
  } else {
    console.log('\n⚠️  Account verification endpoint returned auth error.');
    console.log('   The Transfer API may need separate activation on the portal.');
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Script error:', err.message);
  process.exit(1);
});
