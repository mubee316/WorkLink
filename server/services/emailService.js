const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendDisputeOpenedEmail({ customerEmail, customerName, workerEmail, workerName, jobDescription, reason, disputeId }) {
  const subject = `WorkLink — Dispute Opened (#${disputeId.slice(-6).toUpperCase()})`;

  const customerHtml = `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#16a34a">WorkLink</h2>
      <p>Hi ${customerName},</p>
      <p>Your dispute has been received and is now under review.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
        <tr><td style="padding:8px 0;color:#666;width:140px">Job</td><td style="padding:8px 0;font-weight:600">${jobDescription}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Reason</td><td style="padding:8px 0">${reason}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Reference</td><td style="padding:8px 0">#${disputeId.slice(-6).toUpperCase()}</td></tr>
      </table>
      <p style="color:#666;font-size:13px">Your payment is on hold while we review this. We will contact you with a resolution shortly.</p>
      <p style="color:#666;font-size:13px">— The WorkLink Team</p>
    </div>
  `;

  const workerHtml = `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#16a34a">WorkLink</h2>
      <p>Hi ${workerName},</p>
      <p>A dispute has been raised by your customer for the following job:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
        <tr><td style="padding:8px 0;color:#666;width:140px">Job</td><td style="padding:8px 0;font-weight:600">${jobDescription}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Reason</td><td style="padding:8px 0">${reason}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Reference</td><td style="padding:8px 0">#${disputeId.slice(-6).toUpperCase()}</td></tr>
      </table>
      <p style="color:#666;font-size:13px">Payment is currently on hold. Our team is reviewing the dispute and will contact both parties with a resolution.</p>
      <p style="color:#666;font-size:13px">— The WorkLink Team</p>
    </div>
  `;

  await Promise.all([
    transporter.sendMail({ from: `"WorkLink" <${process.env.EMAIL_USER}>`, to: customerEmail, subject, html: customerHtml }),
    transporter.sendMail({ from: `"WorkLink" <${process.env.EMAIL_USER}>`, to: workerEmail, subject, html: workerHtml }),
  ]);
}

async function sendDisputeResolvedEmail({ customerEmail, customerName, workerEmail, workerName, jobDescription, resolution, disputeId }) {
  const subject = `WorkLink — Dispute Resolved (#${disputeId.slice(-6).toUpperCase()})`;
  const outcomeText = resolution === 'release'
    ? 'The dispute has been resolved in favour of the worker. Payment has been released.'
    : 'The dispute has been resolved in favour of the customer. A refund has been initiated.';

  const makeHtml = (name) => `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#16a34a">WorkLink</h2>
      <p>Hi ${name},</p>
      <p>${outcomeText}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
        <tr><td style="padding:8px 0;color:#666;width:140px">Job</td><td style="padding:8px 0;font-weight:600">${jobDescription}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Reference</td><td style="padding:8px 0">#${disputeId.slice(-6).toUpperCase()}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Outcome</td><td style="padding:8px 0;font-weight:600;color:${resolution === 'release' ? '#16a34a' : '#dc2626'}">${resolution === 'release' ? 'Released to Worker' : 'Refunded to Customer'}</td></tr>
      </table>
      <p style="color:#666;font-size:13px">Thank you for using WorkLink.</p>
      <p style="color:#666;font-size:13px">— The WorkLink Team</p>
    </div>
  `;

  await Promise.all([
    transporter.sendMail({ from: `"WorkLink" <${process.env.EMAIL_USER}>`, to: customerEmail, subject, html: makeHtml(customerName) }),
    transporter.sendMail({ from: `"WorkLink" <${process.env.EMAIL_USER}>`, to: workerEmail, subject, html: makeHtml(workerName) }),
  ]);
}

module.exports = { sendDisputeOpenedEmail, sendDisputeResolvedEmail };
