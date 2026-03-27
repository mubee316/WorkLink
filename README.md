# WorkLink — Nigeria's Skilled Labour Platform

WorkLink connects customers with verified skilled artisans (electricians, plumbers, carpenters, cleaners, and more) across Nigeria. Customers can discover workers, book them, pay securely into escrow, and release payment only when satisfied — with AI-powered matching, real-time chat, and a full dispute resolution system.

---

## Live Demo

- **Frontend:** https://work-link-three.vercel.app
- **Backend:** https://worklink-backend.onrender.com

---

## Team

### Mubarak Olalekan — Lead Developer
Full-stack development of the entire WorkLink platform:
- Architected and built the React 18 + Vite frontend and Node.js + Express backend
- Integrated Firebase Authentication and Firestore for user management and data storage
- Built the Interswitch inline checkout (web popup) for customer payments with escrow PIN system
- Integrated Interswitch API Marketplace for worker payout transfers and NIN identity verification
- Implemented AI-powered worker search and AI booking/negotiation using Claude (Anthropic)
- Built real-time chat between customers and workers using Socket.io
- Developed the full dispute flow: customer raises dispute → worker responds → admin resolves → emails sent
- Integrated Nodemailer + Gmail SMTP for transactional email notifications
- Deployed frontend to Vercel and backend to Render with environment-based configuration

### Abdul-Raheem Abdul-Rofeeq — Researcher & Tester
- Researched the Nigerian skilled labour market and defined platform requirements
- Investigated Interswitch API Marketplace capabilities, sandbox credentials, and available endpoints
- Sourced relevant API documentation and Postman collections from the hackathon resources
- Conducted end-to-end testing of all user flows (booking, payment, disputes, reviews)
- Identified and reported bugs including CORS mismatches, credential mismatches on Render, and payment errors
- Verified the live deployed application across different devices and browsers

### Kelani Abdul-martin — Designer & Tester
- Designed the overall UI/UX direction including layout, colour system, and component patterns
- Defined the green brand identity and visual design language used throughout the app
- Designed key screens: landing page, worker search, job details, dispute flow, and admin panel
- Contributed to usability testing and provided feedback on user experience improvements
- Tested the worker onboarding flow (NIN verification, profile setup, availability toggle)

---

## Features

### For Customers
- **Worker Discovery** — Search and filter artisans by skill, location, and hourly rate
- **AI Search** — Natural language search powered by Claude AI ("find a cheap plumber in Lekki")
- **Booking** — Book a worker with job description and hours; see full cost breakdown with 12% platform fee
- **Secure Escrow Payment** — Pay via Interswitch inline checkout; funds held in escrow until job is done
- **Escrow PIN Release** — Customer receives a 4-digit PIN and shares it with worker to release payment
- **Dispute System** — Raise a dispute if unhappy; payment frozen until admin resolves
- **Reviews** — Leave star ratings and comments after completed jobs

> **Customer Disclaimer:** The escrow PIN is the sole authorisation to release payment to a worker. By sharing your PIN with a worker before the job is fully completed and you are satisfied, you accept full responsibility for the released funds. WorkLink will not be liable for any loss arising from early or premature PIN disclosure. If you have a concern about a job in progress, use the **Report a Problem** feature to freeze payment and open a dispute before releasing your PIN.

### For Workers
- **NIN Verification** — Identity verified via Interswitch API Marketplace (NIMC check)
- **Profile Setup** — Set skills, area, hourly rate, bio, and bank account for payouts
- **Availability Toggle** — Go online/offline to control search visibility
- **Job Management** — View pending, active, and completed jobs on dashboard
- **Dispute Response** — See customer complaint and submit your own side of the story
- **Automatic Payout** — Receive payment to bank account via Interswitch transfer on job completion

> **Worker Disclaimer:** Payment is only released after the customer confirms job completion with their escrow PIN. Workers must ensure the agreed scope of work is fully completed before requesting the PIN. Any dispute raised by a customer will freeze the payout pending admin review. WorkLink is not liable for withheld payments arising from incomplete, unsatisfactory, or disputed work. Persistent disputes or verified misconduct may result in removal from the platform.

### Platform
- **Real-time Chat** — Socket.io powered messaging between customer and worker on every job
- **AI Booking Agent** — AI negotiates job details with worker on customer's behalf via chat
- **Admin Dashboard** — View all disputes side by side (customer complaint + worker response), resolve with one click
- **Email Notifications** — Automated emails on dispute opened and dispute resolved
- **Payment History** — Full transaction log with amounts, dates, and job references

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Real-time | Socket.io |
| Payments | Interswitch Inline Checkout (Web Popup) |
| Payouts | Interswitch API Marketplace Transfer |
| Identity | Interswitch API Marketplace NIN Verification |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Email | Nodemailer + Gmail SMTP |
| Deployment | Vercel (frontend), Render (backend) |

---

## Interswitch Integration

WorkLink uses **three** Interswitch products:

1. **Inline Checkout (Web Popup)** — Customer pays for a job; funds held in escrow
2. **API Marketplace — NIN Verification** — Worker identity verified against NIMC during onboarding (`POST /marketplace-routing/api/v1/verify/identity/nin`)
3. **API Marketplace — Fund Transfer** — Worker receives payout to their bank account after job completion

---

## Local Setup

### Prerequisites
- Node.js 18+
- Firebase project (Firestore + Authentication enabled)
- Interswitch QTB account (sandbox)

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in your credentials
node index.js
```

### Frontend
```bash
cd client
npm install
# create client/.env with:
# VITE_API_URL=http://localhost:5000
npm run dev
```

### Environment Variables (Backend)
```
PORT=5000
ANTHROPIC_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
DEMO_PAYMENTS=false
DEMO_PAYOUT=true
EMAIL_USER=
EMAIL_PASS=
INTERSWITCH_MERCHANT_CODE=
INTERSWITCH_PAY_ITEM_ID=
INTERSWITCH_BASE_URL=https://qa.interswitchng.com
INTERSWITCH_CLIENT_ID=
INTERSWITCH_CLIENT_SECRET=
INTERSWITCH_TRANSFER_CLIENT_ID=
INTERSWITCH_TRANSFER_CLIENT_SECRET=
INTERSWITCH_TRANSFER_BASE_URL=https://qa.interswitchng.com
INTERSWITCH_TERMINAL_ID=3PBL0001
```

---

## User Flows

```
Customer registers → searches for worker → books worker → pays via Interswitch
→ job goes ACTIVE → worker completes job → customer enters escrow PIN
→ payment released → worker receives payout → customer leaves review
```

```
Customer raises dispute → payment frozen → worker submits response
→ admin reviews both sides → admin releases to worker OR refunds customer
→ email sent to both parties
```
