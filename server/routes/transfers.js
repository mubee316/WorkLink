const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { verifyAccount } = require('../services/interswitchTransfer');

const router = express.Router();

// ─── POST /transfers/verify-account ──────────────────────────────────────────
// Worker-only. Calls Interswitch Name Enquiry to validate a bank account.
// Returns the account holder name so the worker can confirm before saving.
router.post('/verify-account', verifyToken, async (req, res) => {
  const { bankCode, accountNumber } = req.body;

  if (!bankCode || !accountNumber) {
    return res.status(400).json({ error: 'bankCode and accountNumber are required' });
  }
  if (!/^\d{10}$/.test(accountNumber)) {
    return res.status(400).json({ error: 'Account number must be exactly 10 digits' });
  }

  try {
    const result = await verifyAccount(bankCode, accountNumber);

    // Marketplace API may return accountName, AccountName, or account_name
    const name = result.accountName || result.AccountName || result.account_name;

    if (name) {
      return res.json({ success: true, accountName: name });
    }

    // Non-200 response shape — surface the raw response for debugging
    res.json({
      success: false,
      error: 'Account not found or could not be verified',
      raw: result,
    });
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    res.status(500).json({ error: 'Account verification failed', detail });
  }
});

module.exports = router;
