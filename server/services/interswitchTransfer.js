const axios = require('axios');
const crypto = require('crypto');

// Web Checkout base (qa) — used only for payment verification
const CHECKOUT_BASE = process.env.INTERSWITCH_BASE_URL || 'https://qa.interswitchng.com';

// Marketplace base (sandbox) — used for account verification and transfers
const TRANSFER_BASE = process.env.INTERSWITCH_TRANSFER_BASE_URL || 'https://sandbox.interswitchng.com';

const TERMINAL_ID = process.env.INTERSWITCH_TERMINAL_ID || '3PBL0001';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function logAxiosError(label, err) {
  if (err.response) {
    console.error(`${label} HTTP ${err.response.status}`);
    console.error('  Body:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error(`${label}:`, err.message);
  }
}

// ─── OAuth — Web Checkout credentials (for payment verify) ───────────────────
async function getCheckoutAccessToken() {
  const credentials = Buffer.from(
    `${process.env.INTERSWITCH_CLIENT_ID}:${process.env.INTERSWITCH_CLIENT_SECRET}`
  ).toString('base64');

  try {
    const res = await axios.post(
      `${CHECKOUT_BASE}/passport/oauth/token`,
      'grant_type=client_credentials',
      { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('[Checkout OAuth] token acquired');
    return res.data.access_token;
  } catch (err) {
    logAxiosError('[Checkout OAuth] token error', err);
    throw err;
  }
}

// ─── OAuth — Marketplace credentials (for account verify + transfers) ────────
// Uses the API Gateway endpoint with ?env=test for sandbox testing
async function getTransferAccessToken() {
  const credentials = Buffer.from(
    `${process.env.INTERSWITCH_TRANSFER_CLIENT_ID}:${process.env.INTERSWITCH_TRANSFER_CLIENT_SECRET}`
  ).toString('base64');

  const url = `${TRANSFER_BASE}/passport/oauth/token`;
  console.log(`[Transfer OAuth] POST ${url}`);

  try {
    const res = await axios.post(
      url,
      'grant_type=client_credentials',
      { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('[Transfer OAuth] token acquired:', JSON.stringify(res.data, null, 2));
    return res.data.access_token;
  } catch (err) {
    logAxiosError('[Transfer OAuth] token error', err);
    throw err;
  }
}

// ─── Bank account verification (Marketplace) ─────────────────────────────────
async function verifyAccount(bankCode, accountNumber) {
  const token = await getTransferAccessToken();

  const url = `${TRANSFER_BASE}/api/v1/identity/account/validate`;

  console.log(`[verifyAccount] POST ${url}`, { bankCode, accountNumber });

  try {
    const res = await axios.post(url, { bankCode, accountNumber }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('[verifyAccount] response:', JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err) {
    logAxiosError('[verifyAccount] error', err);
    throw err;
  }
}

// ─── Single transfer / payout ─────────────────────────────────────────────────
async function transferFunds({ amountKobo, accountNumber, bankCode, workerName, jobId }) {
  const token = await getTransferAccessToken();

  const parts = (workerName || 'Worker').trim().split(' ');
  const lastname = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  const othernames = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';

  const amountStr = String(amountKobo);
  const transferCode = `${bankCode}+WL${Date.now()}${jobId.slice(-6)}`;

  // MAC: SHA512(initiatingAmount + "566" + "CA" + terminatingAmount + "566" + "AC" + "NG")
  const mac = crypto
    .createHash('sha512')
    .update(`${amountStr}566CA${amountStr}566ACNG`)
    .digest('hex');

  const body = {
    transferCode,
    mac,
    termination: {
      amount: amountStr,
      accountReceivable: { accountNumber, accountType: '00' },
      entityCode: bankCode,
      currencyCode: '566',
      paymentMethodCode: 'AC',
      countryCode: 'NG',
    },
    sender: {
      phone: '08000000000',
      email: 'worklink@worklink.com',
      lastname: 'WorkLink',
      othernames: 'Platform',
    },
    initiatingEntityCode: 'PBL',
    initiation: { amount: amountStr, currencyCode: '566', paymentMethodCode: 'CA', channel: '7' },
    beneficiary: { lastname, othernames },
  };

  const url = `${TRANSFER_BASE}/quicktellerservice/api/v5/transactions/TransferFunds`;
  console.log(`[transferFunds] POST ${url} — amount: ${amountStr} kobo, to: ${bankCode}/${accountNumber}`);

  try {
    const res = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        TerminalId: TERMINAL_ID,
      },
    });
    console.log('[transferFunds] response:', JSON.stringify(res.data, null, 2));
    return { ...res.data, transferCode };
  } catch (err) {
    logAxiosError('[transferFunds] error', err);
    throw err;
  }
}

module.exports = { getCheckoutAccessToken, getTransferAccessToken, verifyAccount, transferFunds };
