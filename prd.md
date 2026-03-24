# WorkLink — Product Requirements Document

**Version:** 1.2
**Date:** March 2026
**Status:** In Development (Hackathon Prototype)

---

## 1. Overview

### 1.1 Product Summary
WorkLink is a digital marketplace that formalises Nigeria's informal skilled labour market. It connects customers who need home and commercial services with verified artisans across Lagos — providing a structured hiring flow, pre-booking chat, secure escrow payments via Interswitch, and a trust-building review system.

### 1.2 Problem Statement
Nigeria's informal labour market is largely unstructured. Customers struggle to find reliable, fairly priced artisans. Workers have no platform to showcase their skills or build a verifiable reputation. Payments are cash-based with no protection for either party, and disputes have no resolution path.

### 1.3 Solution
WorkLink provides:
- A searchable directory of vetted artisans with ratings and skills
- Pre-booking real-time chat so customers can negotiate scope before committing
- A structured job booking flow with pricing agreed upfront
- Escrow-based payments via Interswitch Inline Checkout (funds held until job completion)
- Post-booking real-time chat within each active job
- A review system that builds worker reputation over time

### 1.4 Target Users
| User Type | Description |
|---|---|
| **Customer** | Nigerian residents and businesses needing skilled services (repairs, installations, renovation) |
| **Artisan (Worker)** | Skilled tradespeople across Nigeria — electricians, plumbers, carpenters, AC technicians, painters, welders, etc. |

---

## 2. Goals & Success Metrics

### 2.1 Hackathon Goals
- Demonstrate the full customer-to-payment journey end-to-end
- Show real Interswitch Inline Checkout integration (TEST mode)
- Pre-booking chat with real-time unread message badges
- Post-booking job chat via Socket.io
- Polished, mobile-responsive UI

### 2.2 Product Goals (Post-Hackathon)
- Onboard 500 verified artisans in Lagos within 3 months of launch
- Achieve ₦5M in total transaction volume in the first 6 months
- Maintain average worker rating ≥ 4.3 across the platform
- Target 30% repeat customer rate within 90 days

### 2.3 Key Metrics
| Metric | Target |
|---|---|
| Booking conversion (search → book) | ≥ 25% |
| Payment completion rate | ≥ 85% |
| Job completion rate | ≥ 90% |
| Average review rating | ≥ 4.2 / 5 |
| Customer retention (2nd booking) | ≥ 30% |

---

## 3. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | Fast setup, clean component model |
| Backend | Node.js + Express | Familiar, rapid API development |
| Database | Firebase Firestore | Flexible NoSQL, real-time onSnapshot support |
| Auth | Firebase Authentication | Secure, handles email/password + token management |
| Real-time Chat | Socket.io | WebSocket abstraction for job and pre-booking chat |
| Real-time Badges | Firestore onSnapshot | Live unread message counts without polling |
| Payments | Interswitch Inline Checkout | Nigerian payment gateway — modal stays in-page |
| Hosting | Render (backend) + Vercel (frontend) | Free tier, easy CI/CD deploy |

---

## 4. User Roles

### 4.1 Customer
- Registers with name, email, phone, password
- Searches for artisans by skill, area, and price range
- Starts a pre-booking conversation to negotiate before committing
- Books an artisan for a specified number of hours
- Pays via Interswitch Inline Checkout (funds held in escrow)
- Chats with worker in real time within the job
- Marks job complete to release escrow
- Leaves a review after completion

### 4.2 Artisan (Worker)
- Registers with name, email, phone, password (role: worker)
- Creates and edits a profile: bio, skills, hourly rate, service area
- Toggles availability on/off
- Receives and responds to pre-booking messages from customers
- Receives job booking notifications with badge counts
- Chats with customer in real time within each active job
- Gets paid once customer marks job complete (minus 12% commission)

---

## 5. Features & Requirements

### 5.1 Authentication
| # | Requirement | Priority |
|---|---|---|
| F1.1 | User can register as Customer or Worker | Must Have |
| F1.2 | User can log in with email and password | Must Have |
| F1.3 | Firebase ID token persists across page refresh via onAuthStateChanged | Must Have |
| F1.4 | Protected routes redirect unauthenticated users to login | Must Have |
| F1.5 | Socket.io connection authenticated via Firebase ID token on handshake | Must Have |

### 5.2 Worker Profiles
| # | Requirement | Priority |
|---|---|---|
| F2.1 | Workers can edit their profile: bio, skills (tag input), hourly rate, service area | Must Have |
| F2.2 | Workers can toggle availability status with instant toggle UI | Must Have |
| F2.3 | Public profile page shows skills, bio, rating, total jobs, hourly rate | Must Have |
| F2.4 | Profile displays all reviews from past customers | Must Have |
| F2.5 | Average rating recalculates automatically on new review | Must Have |
| F2.6 | Customer can initiate a pre-booking conversation from the worker's public profile | Must Have |

### 5.3 Search & Discovery
| # | Requirement | Priority |
|---|---|---|
| F3.1 | Customer can search workers by skill keyword | Must Have |
| F3.2 | Customer can filter by Lagos area | Must Have |
| F3.3 | Customer can filter by min/max hourly rate | Must Have |
| F3.4 | Search results show only available workers by default | Must Have |
| F3.5 | Worker cards display name, area, skills, rating, hourly rate | Must Have |
| F3.6 | Clicking a worker card opens their public profile | Must Have |
| F3.7 | Search results cached client-side for instant revisits (stale-while-revalidate) | Should Have |

### 5.4 Booking Flow
| # | Requirement | Priority |
|---|---|---|
| F4.1 | Customer selects number of hours (1–24) with +/− controls | Must Have |
| F4.2 | Customer provides a job description | Must Have |
| F4.3 | System calculates total amount, 12% platform fee, and worker payout in real time | Must Have |
| F4.4 | Booking creates a job with status PENDING | Must Have |
| F4.5 | Customer is redirected to job details after booking | Must Have |

### 5.5 Payments (Interswitch Inline Checkout)
| # | Requirement | Priority |
|---|---|---|
| F5.1 | Client calls `POST /payments/initiate` to save a pending payment record and receive merchant config | Must Have |
| F5.2 | Frontend calls `window.webpayCheckout()` — payment modal opens inline, no page redirect | Must Have |
| F5.3 | `onComplete` callback fires when Interswitch is done; client calls `POST /payments/verify` | Must Have |
| F5.4 | Backend verifies via Interswitch Transaction Query API (`gettransaction.json`) using stored kobo amount | Must Have |
| F5.5 | On `ResponseCode === "00"`: payment status → `paid`, job status → `ACTIVE` | Must Have |
| F5.6 | Customer marks job complete → job → `COMPLETED`, payment → `RELEASED` | Must Have |
| F5.7 | Platform retains 12% commission; worker payout = 88% of total | Must Have |
| F5.8 | Demo mode (`DEMO_PAYMENTS=false` not set) skips Interswitch and marks payment instantly | Must Have |
| F5.9 | Payment amount stored in kobo server-side; verify uses stored amount, not client-supplied | Must Have |
| F5.10 | `/payment/callback` route acts as redirect fallback if modal cannot complete inline | Should Have |

### 5.6 Pre-Booking Conversations
| # | Requirement | Priority |
|---|---|---|
| F6.1 | Customer can start a conversation with a worker before booking | Must Have |
| F6.2 | One conversation per customer–worker pair (idempotent creation) | Must Have |
| F6.3 | Messages delivered in real time via Socket.io | Must Have |
| F6.4 | Conversation history persisted in Firestore and loaded on open | Must Have |
| F6.5 | Unread message count tracked per-user via atomic `FieldValue.increment(1)` on Firestore | Must Have |
| F6.6 | Unread count resets to 0 when conversation is opened (`PATCH /conversations/:id/read`) | Must Have |
| F6.7 | Sidebar message badge shows total unread count, updated in real time via Firestore `onSnapshot` | Must Have |
| F6.8 | Conversations list shows last message preview, bold when unread, green highlight on unread rows | Must Have |
| F6.9 | Chat header shows worker's area, hourly rate, skills, and "Book Now" button | Should Have |

### 5.7 Post-Booking Job Chat
| # | Requirement | Priority |
|---|---|---|
| F7.1 | Customer and worker can chat within an active job | Must Have |
| F7.2 | Messages delivered in real time via Socket.io (separate room per job) | Must Have |
| F7.3 | Message history persisted in Firestore and loaded on job details open | Must Have |
| F7.4 | Socket connection authenticated via Firebase ID token | Must Have |

### 5.8 Reviews
| # | Requirement | Priority |
|---|---|---|
| F8.1 | Customer can leave a star rating (1–5) and optional comment after job completion | Must Have |
| F8.2 | Review tied to a specific completed job (one review per job enforced) | Must Have |
| F8.3 | Worker's average rating and total job count recalculate on new review | Must Have |
| F8.4 | Reviews displayed on worker's public profile | Must Have |
| F8.5 | Attempting to re-review a job shows "already reviewed" state | Must Have |

### 5.9 Dashboards & Navigation
| # | Requirement | Priority |
|---|---|---|
| F9.1 | Customer dashboard shows stats (active jobs, completed, total spent) and quick-action CTAs | Must Have |
| F9.2 | Worker dashboard shows stats (pending requests, active jobs, total earned) and quick-action CTAs | Must Have |
| F9.3 | My Jobs page lists all jobs with status badges, cached for instant revisits | Must Have |
| F9.4 | Job details page shows full cost breakdown, escrow status, available actions, and job chat | Must Have |
| F9.5 | Sidebar job badge shows PENDING count (worker) or PENDING+ACTIVE count (customer) | Must Have |
| F9.6 | Sidebar message badge updates in real time via Firestore onSnapshot — no navigation required | Must Have |

---

## 6. Data Models

### User
```
id            String   (Firebase UID)
name          String
email         String   (unique)
phoneNumber   String
role          Enum     customer | worker
bio           String?
skills        String[]
hourlyRate    Number
area          String
avatarUrl     String?
avgRating     Float
totalJobs     Int
isAvailable   Boolean
createdAt     DateTime
updatedAt     DateTime?
```

### Job
```
id            String
customerId    String   (ref: User)
customerName  String
workerId      String   (ref: User)
workerName    String
workerArea    String
description   String
hours         Int
hourlyRate    Number
totalAmount   Number   (hours × hourlyRate)
commission    Number   (totalAmount × 0.12)
workerPayout  Number   (totalAmount − commission)
status        Enum     PENDING | ACTIVE | COMPLETED | CANCELLED
createdAt     DateTime
completedAt   DateTime?
```

### Payment
```
id          String
jobId       String   (ref: Job)
uid         String   (ref: User — customer)
amount      Number   (in kobo, naira × 100)
txnRef      String   (Interswitch transaction reference — unique)
status      Enum     pending | paid | RELEASED | REFUNDED
paidAt      DateTime?
createdAt   DateTime
```

### Conversation
```
id                String
customerId        String   (ref: User)
customerName      String
workerId          String   (ref: User)
workerName        String
workerArea        String
workerSkills      String[]
workerHourlyRate  Number
lastMessage       String
lastMessageAt     DateTime
unreadCount       Map<uid, Int>   (per-user unread counter)
createdAt         DateTime
```

### Message  *(shared by job chat and pre-booking conversations)*
```
id              String
jobId           String?            (set for job chat messages)
conversationId  String?            (set for pre-booking messages)
senderId        String   (ref: User)
senderName      String
content         String
createdAt       DateTime
```

### Review
```
id            String
jobId         String   (ref: Job — unique, one review per job)
customerId    String   (ref: User)
customerName  String
workerId      String   (ref: User)
rating        Int      (1–5)
comment       String?
createdAt     DateTime
```

---

## 7. API Reference

### Workers — `/workers`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/search?skill=&area=&minRate=&maxRate=` | Public | Search + filter available workers |
| GET | `/:id` | Public | Worker public profile + reviews |
| POST | `/profile` | Worker | Create / patch profile fields |
| PUT | `/profile` | Worker | Full profile update (bio, skills, rate, area) |
| PATCH | `/availability` | Worker | Toggle `isAvailable` |

### Jobs — `/jobs`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Customer | Create a job booking |
| GET | `/my` | Any | List caller's jobs |
| GET | `/:id` | Job participant | Job details + payment record |
| PATCH | `/:id/complete` | Customer | Mark complete → job COMPLETED |
| PATCH | `/:id/cancel` | Any | Cancel a PENDING job |

### Payments — `/payments`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/initiate` | Customer | Save pending payment record; demo mode auto-completes; real mode returns merchant config |
| POST | `/verify` | Customer | Query Interswitch, update payment + job on success |

### Messages — `/messages`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:jobId` | Job participant | Load job chat history |

### Reviews — `/reviews`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Customer | Submit review (completed job, one per job) |
| GET | `/worker/:workerId` | Public | All reviews for a worker |
| GET | `/job/:jobId` | Any | Check if a review exists for a job |

### Conversations — `/conversations`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Customer | Create or return existing conversation with a worker |
| GET | `/my` | Any | List all conversations for the caller |
| GET | `/:id` | Participant | Single conversation |
| PATCH | `/:id/read` | Participant | Reset `unreadCount[uid]` to 0 |
| GET | `/:id/messages` | Participant | Load pre-booking message history |

---

## 8. Socket.io Events

```
── Job Chat ────────────────────────────────────────────────────────────────────

Client emits:
  join_job          { jobId }               — join job-specific room
  send_message      { jobId, content }      — send a job chat message

Server emits:
  new_message       { id, jobId, senderId, senderName, content, createdAt }

── Pre-Booking Conversations ───────────────────────────────────────────────────

Client emits:
  join_conversation          { conversationId }        — join conversation room
  send_conversation_message  { conversationId, content }

Server emits:
  new_conversation_message   { id, conversationId, senderId, senderName, content, createdAt }

── Auth ────────────────────────────────────────────────────────────────────────
  All socket connections require a valid Firebase ID token passed via:
  socket.handshake.auth.token
  Token verified server-side via admin.auth().verifyIdToken()
```

---

## 9. Interswitch Inline Checkout Payment Flow

```
1. Customer clicks "Pay Now" on job details
   → Client generates txnRef = "WORKLINK_" + Date.now() + "_" + jobId
   → POST /payments/initiate { txnRef, jobId, amount (kobo) }
   → Server saves pending payment record in Firestore
   → Demo mode: instantly marks paid + job ACTIVE → returns { demo: true }
   → Real mode: returns { merchantCode, payItemId }

2. Client calls window.webpayCheckout({ merchant_code, pay_item_id, txn_ref,
     amount, currency: 566, cust_name, cust_email, mode: "TEST", onComplete })
   → Interswitch payment modal opens inline (no page redirect)

3. Customer completes payment inside modal
   → onComplete callback fires

4. Client calls POST /payments/verify { txnRef }
   → Server queries: GET /collections/api/v1/gettransaction.json
       ?merchantcode=&transactionreference=&amount= (stored kobo amount)
   → ResponseCode "00" → payment status → paid, job → ACTIVE
   → Client reloads job data in-place

5. Customer clicks "Mark as Complete"
   → PATCH /jobs/:id/complete
   → Job → COMPLETED, payment → RELEASED
   → Worker payout = totalAmount − commission (88%)

Fallback: if modal cannot complete inline, Interswitch redirects to
  /payment/callback?txnref=... → page calls POST /payments/verify same as step 4
```

---

## 10. Build Roadmap

| Day | Focus | Status |
|---|---|---|
| Day 1 | Auth, Register, Login, Dashboard shell, design system | ✅ Complete |
| Day 2 | Worker profiles, search & filter, seed data | ✅ Complete |
| Day 3 | Booking flow, Interswitch Inline Checkout, job management | ✅ Complete |
| Day 4 | Socket.io chat (job + pre-booking), reviews, dashboards, unread badges | ✅ Complete |
| Day 5 | Landing page, worker profile edit, mobile responsiveness, seed demo accounts, deploy | 🔄 In Progress |

---

## 11. Commission Model

| Party | Amount |
|---|---|
| Customer pays | ₦X (total) |
| Platform retains | ₦X × 12% |
| Worker receives | ₦X × 88% |

Commission is calculated and stored on the job record at booking time. It is non-negotiable in v1. Worker payout is currently a recorded figure — automated bank transfer via Interswitch disbursement API is a v2 feature.

---

## 12. Constraints & Assumptions

- **Nigeria-wide** — service areas cover major cities including Lagos, Abuja, Port Harcourt, Kano, Ibadan, and others; workers set their own area on their profile
- **No real bank transfers in demo** — escrow release updates Firestore status only; worker payout via Interswitch Transfer API is post-hackathon
- **No worker verification in v1** — artisan onboarding is self-serve; identity/credential verification is a v2 feature
- **Mobile web only** — no native app in scope; responsive web covers the mobile use case
- **No refund automation** — manual process in v1; automated refund flow is post-hackathon
- **Interswitch TEST mode** — `mode: "TEST"` is set in `webpayCheckout` call; switch to `mode: "LIVE"` and update `INTERSWITCH_BASE_URL` for production

---

## 13. Out of Scope (v1)

- Worker identity and credential verification
- Dispute resolution system
- Automated worker payouts via bank transfer (Interswitch disbursement API)
- Push notifications (email or SMS)
- In-app wallet or worker earnings balance
- Worker withdrawal flow
- Admin panel and moderation tools
- International expansion outside Nigeria
- Native mobile app (iOS / Android)
