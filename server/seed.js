// Run with: node seed.js
// Seeds 20 workers, 2 demo login accounts, and reviews into Firestore

require('dotenv').config();
const { admin, db } = require('./firebase-admin');

// ── 20 Worker profiles ────────────────────────────────────────────────────────
const workers = [
  {
    name: 'Emeka Okonkwo',
    email: 'emeka.okonkwo@worklink.ng',
    bio: 'Certified electrician with 8 years of experience in residential and commercial wiring, fault diagnosis, and installations.',
    skills: ['Electrician', 'Wiring', 'Fault Diagnosis'],
    hourlyRate: 2500,
    area: 'Yaba',
    avgRating: 4.8,
    totalJobs: 47,
    isAvailable: true,
  },
  {
    name: 'Tunde Adeyemi',
    email: 'tunde.adeyemi@worklink.ng',
    bio: 'Expert plumber specialising in pipe installation, leak repairs, and bathroom fitting across Lagos Island and Mainland.',
    skills: ['Plumber', 'Pipe Fitting', 'Leak Repair'],
    hourlyRate: 2000,
    area: 'Ikeja',
    avgRating: 4.6,
    totalJobs: 63,
    isAvailable: true,
  },
  {
    name: 'Chukwudi Eze',
    email: 'chukwudi.eze@worklink.ng',
    bio: 'Skilled carpenter and furniture maker. Custom wardrobes, doors, and general woodwork with quality finishing.',
    skills: ['Carpenter', 'Furniture', 'Woodwork'],
    hourlyRate: 1800,
    area: 'Surulere',
    avgRating: 4.9,
    totalJobs: 82,
    isAvailable: true,
  },
  {
    name: 'Biodun Fatunde',
    email: 'biodun.fatunde@worklink.ng',
    bio: 'AC installation, servicing, and repair. Handles split units, cassette ACs, and industrial cooling systems.',
    skills: ['AC Technician', 'HVAC', 'Refrigeration'],
    hourlyRate: 3000,
    area: 'Lekki',
    avgRating: 4.7,
    totalJobs: 35,
    isAvailable: true,
  },
  {
    name: 'Segun Lawal',
    email: 'segun.lawal@worklink.ng',
    bio: 'Professional painter offering interior and exterior painting, texture finishes, and wallpaper installation.',
    skills: ['Painter', 'Interior Design', 'Wallpaper'],
    hourlyRate: 1500,
    area: 'Maryland',
    avgRating: 4.5,
    totalJobs: 54,
    isAvailable: true,
  },
  {
    name: 'Ifeanyi Obiora',
    email: 'ifeanyi.obiora@worklink.ng',
    bio: 'Certified welder with expertise in iron gates, burglary proofing, railings, and structural steelwork.',
    skills: ['Welder', 'Fabrication', 'Iron Gates'],
    hourlyRate: 2200,
    area: 'Apapa',
    avgRating: 4.6,
    totalJobs: 41,
    isAvailable: true,
  },
  {
    name: 'Kunle Oduya',
    email: 'kunle.oduya@worklink.ng',
    bio: 'Electrician and generator technician. Inverter installation, solar panels, and generator maintenance.',
    skills: ['Electrician', 'Generator Repair', 'Solar Installer'],
    hourlyRate: 2800,
    area: 'Yaba',
    avgRating: 4.7,
    totalJobs: 29,
    isAvailable: false,
  },
  {
    name: 'Amaka Nwosu',
    email: 'amaka.nwosu@worklink.ng',
    bio: 'Professional tiler with experience in floor and wall tiling, bathroom renovations, and waterproofing.',
    skills: ['Tiler', 'Bathroom Renovation', 'Waterproofing'],
    hourlyRate: 1700,
    area: 'Ikeja',
    avgRating: 4.8,
    totalJobs: 66,
    isAvailable: true,
  },
  {
    name: 'Babajide Sanni',
    email: 'babajide.sanni@worklink.ng',
    bio: 'Plumber and drainage specialist. Borehole installation, sewage systems, and overhead tank fittings.',
    skills: ['Plumber', 'Drainage', 'Borehole'],
    hourlyRate: 2300,
    area: 'Surulere',
    avgRating: 4.4,
    totalJobs: 38,
    isAvailable: true,
  },
  {
    name: 'Obinna Mgbemena',
    email: 'obinna.mgbemena@worklink.ng',
    bio: 'Experienced mason and building contractor. Block laying, plastering, screed, and minor construction works.',
    skills: ['Mason', 'Plastering', 'Block Laying'],
    hourlyRate: 2000,
    area: 'Lekki',
    avgRating: 4.5,
    totalJobs: 57,
    isAvailable: true,
  },
  {
    name: 'Yusuf Abdullahi',
    email: 'yusuf.abdullahi@worklink.ng',
    bio: 'Mobile phone and electronics technician. Screen repairs, motherboard faults, and gadget servicing.',
    skills: ['Electronics Repair', 'Phone Repair', 'Appliance Repair'],
    hourlyRate: 1500,
    area: 'Maryland',
    avgRating: 4.3,
    totalJobs: 91,
    isAvailable: true,
  },
  {
    name: 'Chisom Anyanwu',
    email: 'chisom.anyanwu@worklink.ng',
    bio: 'Interior decorator and furniture arranger. Living room setups, office spaces, and event decoration.',
    skills: ['Interior Decorator', 'Furniture Arrangement', 'Event Decor'],
    hourlyRate: 3500,
    area: 'Victoria Island',
    avgRating: 4.9,
    totalJobs: 24,
    isAvailable: true,
  },
  // ── 8 new workers ──
  {
    name: 'Musa Danlami',
    email: 'musa.danlami@worklink.ng',
    bio: 'Solar energy specialist based in Abuja. Off-grid system design, panel installation, inverter setup, and battery bank configuration.',
    skills: ['Solar Installer', 'Electrician', 'Generator Repair'],
    hourlyRate: 4000,
    area: 'Maitama',
    avgRating: 4.8,
    totalJobs: 33,
    isAvailable: true,
  },
  {
    name: 'Grace Okonkwo',
    email: 'grace.okonkwo@worklink.ng',
    bio: 'Professional home cleaner offering deep cleaning, post-construction cleanup, and regular housekeeping services.',
    skills: ['Home Cleaning', 'Fumigation', 'Laundry'],
    hourlyRate: 1200,
    area: 'Gbagada',
    avgRating: 4.7,
    totalJobs: 112,
    isAvailable: true,
  },
  {
    name: 'Adeola Fashola',
    email: 'adeola.fashola@worklink.ng',
    bio: 'Security systems installer. CCTV cameras, access control, electric fences, and alarm systems for homes and offices.',
    skills: ['CCTV Installer', 'Security Systems', 'Gate Installer'],
    hourlyRate: 3500,
    area: 'Festac',
    avgRating: 4.6,
    totalJobs: 28,
    isAvailable: true,
  },
  {
    name: 'Nnamdi Okafor',
    email: 'nnamdi.okafor@worklink.ng',
    bio: 'Roofing contractor with 10 years of experience in roof laying, repair, waterproofing, and gutter installation.',
    skills: ['Roofing', 'Waterproofing', 'Mason'],
    hourlyRate: 2600,
    area: 'Port Harcourt',
    avgRating: 4.5,
    totalJobs: 44,
    isAvailable: true,
  },
  {
    name: 'Fatima Al-Hassan',
    email: 'fatima.alhassan@worklink.ng',
    bio: 'Interior decorator serving Abuja. Space planning, colour consulting, furniture sourcing, and full room transformations.',
    skills: ['Interior Decorator', 'POP / False Ceiling', 'Painter'],
    hourlyRate: 5000,
    area: 'Wuse',
    avgRating: 4.9,
    totalJobs: 19,
    isAvailable: true,
  },
  {
    name: 'Emmanuel Osei',
    email: 'emmanuel.osei@worklink.ng',
    bio: 'Mason and bricklayer with expertise in new builds, extensions, and renovation projects across northern Nigeria.',
    skills: ['Mason', 'Bricklayer', 'Plastering'],
    hourlyRate: 1800,
    area: 'Kano',
    avgRating: 4.4,
    totalJobs: 72,
    isAvailable: true,
  },
  {
    name: 'Chidi Nwachukwu',
    email: 'chidi.nwachukwu@worklink.ng',
    bio: 'Generator mechanic with experience on all brands — Elemax, Tiger, Sumec, Firman, and industrial gensets.',
    skills: ['Generator Repair', 'Electrician', 'Appliance Repair'],
    hourlyRate: 2000,
    area: 'Ikorodu',
    avgRating: 4.6,
    totalJobs: 58,
    isAvailable: true,
  },
  {
    name: 'Ngozi Obi',
    email: 'ngozi.obi@worklink.ng',
    bio: 'Licensed fumigation and pest control expert. Termites, rodents, bedbugs, cockroaches, and full property fumigation.',
    skills: ['Fumigation', 'Home Cleaning', 'Sewage / Drainage'],
    hourlyRate: 2500,
    area: 'Ajah',
    avgRating: 4.7,
    totalJobs: 83,
    isAvailable: true,
  },
];

// ── Demo login accounts ───────────────────────────────────────────────────────
const DEMO_CUSTOMER = {
  email: 'customer@worklink.ng',
  password: 'Demo@1234',
  name: 'Demo Customer',
  phoneNumber: '+2348100000001',
  role: 'client',
};

const DEMO_WORKER = {
  email: 'worker@worklink.ng',
  password: 'Demo@1234',
  name: 'Adaeze Obi',
  phoneNumber: '+2348100000002',
  role: 'worker',
  bio: 'Experienced AC technician and electrical engineer. Handles installations, servicing, and fault diagnosis for all AC brands.',
  skills: ['AC Technician', 'Electrician', 'HVAC'],
  hourlyRate: 3500,
  area: 'Lekki',
  avgRating: 4.8,
  totalJobs: 22,
  isAvailable: true,
};

// ── Review templates ──────────────────────────────────────────────────────────
const REVIEWERS = [
  'Tolu Adeyemi', 'Kemi Balogun', 'Chidi Okonkwo', 'Amara Eze',
  'Suleiman Musa', 'Funmi Adeleke', 'Bola Adesanya', 'Nkechi Anyanwu',
  'Emeka Nwosu', 'Joke Olatunji', 'Remi Fashola', 'Ada Obi',
];

const REVIEW_SETS = {
  Electrician: [
    { rating: 5, comment: 'Fixed our wiring issue in under 2 hours. Very professional and knowledgeable.' },
    { rating: 5, comment: 'Came on time, sorted the fault quickly, and cleaned up after. Will definitely use again.' },
    { rating: 4, comment: 'Good job on the panel upgrade. Explained everything clearly.' },
    { rating: 5, comment: 'Excellent work. My generator connection issue is fully resolved.' },
  ],
  Plumber: [
    { rating: 5, comment: 'Solved our burst pipe emergency same day. An absolute lifesaver!' },
    { rating: 4, comment: 'Very thorough. Fixed the leak properly — previous plumber could not sort it.' },
    { rating: 5, comment: 'Fast response and clean work. No mess left behind at all.' },
    { rating: 4, comment: 'Sorted out my bathroom fitting in a few hours. Fair pricing.' },
  ],
  Carpenter: [
    { rating: 5, comment: 'Beautiful wardrobe — exceeded my expectations completely. Top quality finish.' },
    { rating: 5, comment: 'Very detailed and precise work. Will hire again for the kitchen cabinets.' },
    { rating: 4, comment: 'Good quality work and fair pricing. Completed on schedule.' },
    { rating: 5, comment: 'Built exactly what I described. Very happy with the result.' },
  ],
  'AC Technician': [
    { rating: 5, comment: 'AC is blowing cold again. Fast and professional service.' },
    { rating: 4, comment: 'Serviced 2 units in under 2 hours. Excellent and efficient.' },
    { rating: 5, comment: 'Diagnosed the fault immediately and had the part the same day. Impressive.' },
  ],
  Painter: [
    { rating: 5, comment: 'Transformed my apartment completely. Very neat and precise edges.' },
    { rating: 4, comment: 'Good quality paint job. Finished on time and within budget.' },
    { rating: 5, comment: 'Used excellent materials and the finish is still looking great months later.' },
  ],
  Welder: [
    { rating: 5, comment: 'Fabricated my gate exactly as designed. Strong and clean welding.' },
    { rating: 4, comment: 'Good work on the burglary proofing. Fair price for the quality.' },
    { rating: 5, comment: 'Railings came out perfectly. Professional and reliable.' },
  ],
  Tiler: [
    { rating: 5, comment: 'Bathroom tiling is immaculate. Perfect grout lines and no chips.' },
    { rating: 5, comment: 'Tiled my entire living room floor in 2 days. Exceptional work.' },
    { rating: 4, comment: 'Great attention to detail. Would recommend to anyone needing tiling.' },
  ],
  Mason: [
    { rating: 4, comment: 'Block work is solid and level. Completed the extension on schedule.' },
    { rating: 5, comment: 'Excellent plastering work. Smooth walls and professional finish.' },
    { rating: 4, comment: 'Reliable mason. Shows up on time and works hard.' },
  ],
  default: [
    { rating: 5, comment: 'Excellent work. Very professional and delivered on time.' },
    { rating: 4, comment: 'Good service and fair pricing. Would recommend.' },
    { rating: 5, comment: 'Reliable and skilled. Will definitely hire again.' },
    { rating: 4, comment: 'Did a great job. Cleaned up after and was very courteous.' },
  ],
};

function getReviews(worker) {
  const primarySkill = worker.skills[0];
  return REVIEW_SETS[primarySkill] || REVIEW_SETS.default;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function createOrGetAuthUser(email, password, name, phone) {
  try {
    const existing = await admin.auth().getUserByEmail(email);
    return existing.uid;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const user = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone,
      });
      return user.uid;
    }
    throw err;
  }
}

async function workerExists(email) {
  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

// ── Main seed ─────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 WorkLink Seed Script\n');

  // 1. Seed workers (Firestore docs only — no Auth needed for browsing)
  console.log('── Seeding workers ──');
  const workerIds = {};

  for (const worker of workers) {
    const existing = await workerExists(worker.email);
    if (existing) {
      console.log(`  ↩  Already exists: ${worker.name}`);
      workerIds[worker.email] = existing;
      continue;
    }
    const ref = db.collection('users').doc();
    const data = {
      uid: ref.id,
      role: 'worker',
      photoURL: '',
      reviewCount: 0,
      yearsOfExperience: '',
      createdAt: new Date().toISOString(),
      ...worker,
    };
    await ref.set(data);
    workerIds[worker.email] = ref.id;
    console.log(`  ✓  ${worker.name} (${worker.area}) — ${worker.skills[0]}`);
  }

  // 2. Seed demo login accounts (Firebase Auth + Firestore)
  console.log('\n── Seeding demo accounts ──');

  // Demo customer
  const customerId = await createOrGetAuthUser(
    DEMO_CUSTOMER.email,
    DEMO_CUSTOMER.password,
    DEMO_CUSTOMER.name,
    DEMO_CUSTOMER.phoneNumber
  );
  const customerDocRef = db.collection('users').doc(customerId);
  const customerSnap = await customerDocRef.get();
  if (!customerSnap.exists) {
    await customerDocRef.set({
      uid: customerId,
      name: DEMO_CUSTOMER.name,
      email: DEMO_CUSTOMER.email,
      phoneNumber: DEMO_CUSTOMER.phoneNumber,
      role: 'client',
      createdAt: new Date().toISOString(),
    });
    console.log(`  ✓  Customer: ${DEMO_CUSTOMER.email} / ${DEMO_CUSTOMER.password}`);
  } else {
    console.log(`  ↩  Already exists: ${DEMO_CUSTOMER.email}`);
  }

  // Demo worker (can log in and test worker dashboard)
  const demoWorkerId = await createOrGetAuthUser(
    DEMO_WORKER.email,
    DEMO_WORKER.password,
    DEMO_WORKER.name,
    DEMO_WORKER.phoneNumber
  );
  const demoWorkerDocRef = db.collection('users').doc(demoWorkerId);
  const demoWorkerSnap = await demoWorkerDocRef.get();
  if (!demoWorkerSnap.exists) {
    await demoWorkerDocRef.set({
      uid: demoWorkerId,
      role: 'worker',
      photoURL: '',
      reviewCount: 0,
      yearsOfExperience: '3-5',
      createdAt: new Date().toISOString(),
      ...DEMO_WORKER,
    });
    workerIds[DEMO_WORKER.email] = demoWorkerId;
    console.log(`  ✓  Worker:   ${DEMO_WORKER.email} / ${DEMO_WORKER.password}`);
  } else {
    workerIds[DEMO_WORKER.email] = demoWorkerId;
    console.log(`  ↩  Already exists: ${DEMO_WORKER.email}`);
  }

  // 3. Seed reviews for first 10 workers
  console.log('\n── Seeding reviews ──');
  const allWorkers = [...workers, DEMO_WORKER];
  let reviewerIndex = 0;

  for (const worker of allWorkers.slice(0, 10)) {
    const workerId = workerIds[worker.email];
    if (!workerId) continue;

    // Skip if reviews already exist for this worker
    const existingReviews = await db.collection('reviews')
      .where('workerId', '==', workerId)
      .limit(1)
      .get();
    if (!existingReviews.empty) {
      console.log(`  ↩  Reviews already exist: ${worker.name}`);
      continue;
    }

    const reviewTemplates = getReviews(worker);
    const count = Math.min(reviewTemplates.length, 3 + Math.floor(Math.random() * 2));
    let ratingSum = 0;

    for (let i = 0; i < count; i++) {
      const template = reviewTemplates[i % reviewTemplates.length];
      const reviewer = REVIEWERS[reviewerIndex % REVIEWERS.length];
      reviewerIndex++;

      const daysAgo = Math.floor(Math.random() * 90) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      const ref = db.collection('reviews').doc();
      await ref.set({
        id: ref.id,
        workerId,
        workerName: worker.name,
        customerId: customerId,
        customerName: reviewer,
        rating: template.rating,
        comment: template.comment,
        createdAt,
      });
      ratingSum += template.rating;
    }

    // Update worker's avgRating and reviewCount
    await db.collection('users').doc(workerId).update({
      avgRating: Math.round((ratingSum / count) * 10) / 10,
      reviewCount: count,
    });

    console.log(`  ✓  ${count} reviews → ${worker.name}`);
  }

  // 4. Print summary
  console.log('\n✅ Seed complete!\n');
  console.log('── Demo login credentials ──');
  console.log(`  Customer: ${DEMO_CUSTOMER.email}  /  ${DEMO_CUSTOMER.password}`);
  console.log(`  Worker:   ${DEMO_WORKER.email}  /  ${DEMO_WORKER.password}`);
  console.log(`\n  Total workers: ${workers.length + 1}`);
  console.log('────────────────────────────');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
