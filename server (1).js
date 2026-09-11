/**
 * Sahkaar Seva — Backend API (single file, with persistence)
 * Cooperative Gig Services Platform — SIH PS ID 26089
 *
 * Captures real user input from the frontend:
 *   - service bookings (name, phone, location, date, slot, details)
 *   - worker/cooperative registrations
 *   - safety check-ins, emergency alerts, issue reports
 *
 * All of it is saved to a local JSON file (data/db.json) so it survives
 * server restarts — no external database required to get started.
 *
 * Run:  npm install   then   npm start
 * Server: http://localhost:5000
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* ------------------------------------------------------------------ */
/*  PERSISTENCE — flat JSON file, auto-created on first run            */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function seedWorkers() {
  return [
    { id: 'RK', name: 'Ramesh Kumar', service: 'Electrician', experience: '8 yrs', rating: 4.9, distance: '1.2 km', rate: '₹350–500', eta: '8 min', status: 'available', specialties: ['House wiring', 'AC installation', 'Inverter repair'], coop: 'Shakti Labour Cooperative', jobs: 186, lat: 23.215, lng: 72.636 },
    { id: 'SP', name: 'Savita Patel', service: 'Caregiver', experience: '6 yrs', rating: 4.8, distance: '0.8 km', rate: '₹300–450', eta: '5 min', status: 'available', specialties: ['Elder support', 'Home assistance', 'Care reminders'], coop: 'Gujarat Care Workers Co-op', jobs: 142, lat: 23.225, lng: 72.641 },
    { id: 'AI', name: 'Arjun Iyer', service: 'Plumber', experience: '10 yrs', rating: 4.9, distance: '2.1 km', rate: '₹400–650', eta: '14 min', status: 'busy', specialties: ['Leak detection', 'Bathroom fitting', 'Water tank service'], coop: 'Nirman Labour Cooperative', jobs: 231, lat: 23.203, lng: 72.651 },
    { id: 'MJ', name: 'Meena Joshi', service: 'Cleaning', experience: '5 yrs', rating: 4.7, distance: '1.6 km', rate: '₹250–400', eta: '11 min', status: 'available', specialties: ['Deep cleaning', 'Office sanitation', 'Move-in cleaning'], coop: 'Sahyog Safai Cooperative', jobs: 119, lat: 23.209, lng: 72.624 },
    { id: 'VK', name: 'Vikram Shah', service: 'Electrician', experience: '11 yrs', rating: 4.8, distance: '2.7 km', rate: '₹450–650', eta: '18 min', status: 'offline', specialties: ['Solar setup', 'Industrial wiring', 'Safety inspection'], coop: 'Udyam Electrical Workers Co-op', jobs: 264, lat: 23.233, lng: 72.620 },
    { id: 'FA', name: 'Farida Ansari', service: 'Cleaning', experience: '7 yrs', rating: 4.9, distance: '2.4 km', rate: '₹300–500', eta: '16 min', status: 'available', specialties: ['Kitchen cleaning', 'Hospitality', 'Eco-friendly cleaning'], coop: 'Nayi Disha Service Cooperative', jobs: 174, lat: 23.198, lng: 72.632 }
  ];
}

function defaultDb() {
  return { workers: seedWorkers(), bookings: {}, safetyEvents: [], safetyCounter: 1 };
}

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const fresh = defaultDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
      return fresh;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load database, starting fresh:', err.message);
    return defaultDb();
  }
}

let db = loadDb();

function saveDb() {
  fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), err => {
    if (err) console.error('Failed to save database:', err.message);
  });
}

/* ------------------------------------------------------------------ */
/*  STATIC DATA — service categories (no user data, no need to persist)*/
/* ------------------------------------------------------------------ */

const services = [
  { id: 'electrician', icon: '⚡', name: 'Electrician', description: 'House wiring, AC, inverter and safety inspection.', skills: ['House wiring', 'AC installation', 'Inverter repair'] },
  { id: 'plumber', icon: '🔧', name: 'Plumber', description: 'Leak detection, fittings, tanks and water systems.', skills: ['Leak detection', 'Bathroom fitting', 'Water tank service'] },
  { id: 'carpenter', icon: '🪚', name: 'Carpenter', description: 'Furniture, doors, modular fittings and repairs.', skills: ['Furniture repair', 'Door fitting', 'Custom woodwork'] },
  { id: 'painter', icon: '🎨', name: 'Painter', description: 'Residential, office and community painting.', skills: ['Interior painting', 'Wall finishing', 'Exterior work'] },
  { id: 'cleaning', icon: '🧹', name: 'Cleaning', description: 'Deep, move-in, office and sanitation services.', skills: ['Deep cleaning', 'Office sanitation', 'Eco cleaning'] },
  { id: 'gardener', icon: '🌿', name: 'Gardener', description: 'Plant care, landscaping and routine maintenance.', skills: ['Garden care', 'Landscaping', 'Plant maintenance'] },
  { id: 'driver', icon: '🚗', name: 'Driver', description: 'Scheduled local and institutional driving support.', skills: ['Local driving', 'Institutional trips', 'Scheduled service'] },
  { id: 'caregiver', icon: '❤️', name: 'Caregiver', description: 'Elder and assisted home-support services.', skills: ['Elder support', 'Home assistance', 'Care reminders'] },
  { id: 'appliance-repair', icon: '❄️', name: 'Appliance Repair', description: 'AC, refrigerator, washing machine and appliance service.', skills: ['AC repair', 'Refrigerator', 'Washing machine'] },
  { id: 'construction', icon: '🏗️', name: 'Construction', description: 'Masonry, tiling, civil repairs and maintenance.', skills: ['Masonry', 'Tiling', 'Civil repair'] },
  { id: 'digital-help', icon: '💻', name: 'Digital Help', description: 'Computer, documentation and digital assistance.', skills: ['Computer help', 'Documentation', 'Online services'] },
  { id: 'community-work', icon: '🏘️', name: 'Community Work', description: 'Institutional and cooperative project support.', skills: ['Society work', 'Event support', 'Maintenance'] }
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                             */
/* ------------------------------------------------------------------ */

const genBookingId = () => 'SS-' + Math.floor(100000 + Math.random() * 899999);
const genOtp = () => String(Math.floor(1000 + Math.random() * 9000));
const genWorkerId = () => 'W-' + Math.floor(1000 + Math.random() * 8999);

function assignWorker(service) {
  const candidates = db.workers.filter(w => w.service.toLowerCase() === String(service).toLowerCase() && w.status !== 'offline');
  const sorted = candidates.sort((a, b) => {
    const rank = w => (w.status === 'available' ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return parseFloat(a.distance) - parseFloat(b.distance);
  });
  return sorted[0] || db.workers.find(w => w.service.toLowerCase() === String(service).toLowerCase()) || db.workers[0];
}

function logSafetyEvent(type, payload) {
  const event = { id: 'SFT-' + db.safetyCounter++, type, ...payload, createdAt: new Date().toISOString() };
  db.safetyEvents.push(event);
  saveDb();
  return event;
}

/* ------------------------------------------------------------------ */
/*  ROUTES                                                              */
/* ------------------------------------------------------------------ */

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Sahkaar Seva API is running', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Services ----
app.get('/api/services', (req, res) => {
  res.json({ success: true, data: services });
});

app.get('/api/services/:id', (req, res) => {
  const service = services.find(s => s.id === req.params.id || s.name.toLowerCase() === req.params.id.toLowerCase());
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, data: service });
});

// ---- Workers ----
app.get('/api/workers', (req, res) => {
  const { service, status, q } = req.query;
  let list = db.workers;

  if (q) {
    const query = String(q).toLowerCase().trim();
    list = list.filter(w =>
      w.service.toLowerCase().includes(query) ||
      w.name.toLowerCase().includes(query) ||
      w.specialties.some(s => s.toLowerCase().includes(query))
    );
  }
  if (service && service !== 'all' && service !== 'All services') {
    list = list.filter(w => w.service.toLowerCase() === String(service).toLowerCase());
  }
  if (status) {
    list = list.filter(w => w.status === status);
  }

  res.json({ success: true, count: list.length, data: list });
});

app.get('/api/workers/map/pins', (req, res) => {
  const { service } = req.query;
  let list = db.workers;
  if (service && service !== 'all') {
    list = list.filter(w => w.service.toLowerCase() === String(service).toLowerCase());
  }
  const available = list.filter(w => w.status === 'available').length;
  res.json({ success: true, count: list.length, available, data: list });
});

// Captures a worker/cooperative registration submitted from the frontend
app.post('/api/workers/register', (req, res) => {
  const { name, service, phone, coop, experience, specialties } = req.body;
  if (!name || !service || !phone) {
    return res.status(400).json({ success: false, message: 'name, service and phone are required' });
  }

  const worker = {
    id: genWorkerId(),
    name,
    service,
    experience: experience || 'New',
    rating: 0,
    distance: '—',
    rate: '—',
    eta: '—',
    status: 'offline', // becomes 'available' after verification
    specialties: Array.isArray(specialties) ? specialties : [],
    coop: coop || 'Independent (unverified)',
    jobs: 0,
    lat: null,
    lng: null,
    phone,
    verified: false,
    registeredAt: new Date().toISOString()
  };

  db.workers.push(worker);
  saveDb();
  res.status(201).json({ success: true, message: 'Registration received — pending verification', data: worker });
});

app.get('/api/workers/:id', (req, res) => {
  const worker = db.workers.find(w => w.id === req.params.id);
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
  res.json({ success: true, data: worker });
});

// ---- Bookings — this is the main "fetch details from the user" flow ----
app.post('/api/bookings', (req, res) => {
  const { name, phone, location, date, slot, service, details } = req.body;
  if (!name || !phone || !location || !date || !slot || !service) {
    return res.status(400).json({ success: false, message: 'name, phone, location, date, slot and service are required' });
  }

  const id = genBookingId();
  const worker = assignWorker(service);
  const otp = genOtp();

  const booking = {
    id, name, phone, location, date, slot, service,
    details: details || '',
    worker,
    otp,
    status: 'CONFIRMED', // CONFIRMED -> IN_PROGRESS -> COMPLETED
    steps: { requestCreated: true, workerAssigned: true, onTheWay: false, otpVerifiedAndStarted: false, completed: false },
    progress: 45,
    createdAt: new Date().toISOString()
  };

  db.bookings[id] = booking;
  saveDb();
  res.status(201).json({ success: true, data: booking });
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = db.bookings[req.params.id];
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, data: booking });
});

app.post('/api/bookings/:id/otp/regenerate', (req, res) => {
  const booking = db.bookings[req.params.id];
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  booking.otp = genOtp();
  saveDb();
  res.json({ success: true, message: 'New OTP generated', data: { id: booking.id, otp: booking.otp } });
});

app.post('/api/bookings/:id/start', (req, res) => {
  const booking = db.bookings[req.params.id];
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (booking.status !== 'CONFIRMED') {
    return res.status(400).json({ success: false, message: 'This booking has already started or completed' });
  }
  if (String(req.body.otp) !== String(booking.otp)) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP — service has not started' });
  }

  booking.status = 'IN_PROGRESS';
  booking.steps.onTheWay = true;
  booking.steps.otpVerifiedAndStarted = true;
  booking.progress = 75;
  saveDb();
  res.json({ success: true, message: 'OTP verified — service started', data: booking });
});

app.post('/api/bookings/:id/complete', (req, res) => {
  const booking = db.bookings[req.params.id];
  if (!booking || booking.status !== 'IN_PROGRESS') {
    return res.status(400).json({ success: false, message: 'Booking not found or not currently in progress' });
  }
  booking.status = 'COMPLETED';
  booking.steps.completed = true;
  booking.progress = 100;
  saveDb();
  res.json({ success: true, message: 'Service marked as completed', data: booking });
});

// ---- Safety Centre ----
app.post('/api/safety/emergency', (req, res) => {
  const { type, bookingId } = req.body;
  const allowed = ['112', 'Police', 'Ambulance', 'Fire'];
  if (!allowed.includes(type)) {
    return res.status(400).json({ success: false, message: `type must be one of: ${allowed.join(', ')}` });
  }
  const event = logSafetyEvent('EMERGENCY', { emergencyType: type, bookingId: bookingId || null });
  res.status(201).json({ success: true, message: `Emergency alert (${type}) logged`, data: event });
});

app.post('/api/safety/checkin', (req, res) => {
  const event = logSafetyEvent('CHECK_IN', { bookingId: req.body.bookingId || null });
  res.status(201).json({ success: true, message: 'Safety check-in sent to platform support', data: event });
});

app.post('/api/safety/report', (req, res) => {
  const { bookingId, category, description } = req.body;
  if (!description) return res.status(400).json({ success: false, message: 'description is required' });
  const event = logSafetyEvent('REPORT', { bookingId: bookingId || null, category: category || 'General', description });
  res.status(201).json({ success: true, message: 'Issue reported for cooperative review', data: event });
});

// ---- Stats ----
app.get('/api/stats', (req, res) => {
  const available = db.workers.filter(w => w.status === 'available').length;
  const coops = new Set(db.workers.map(w => w.coop)).size;
  const avgRating = db.workers.length ? (db.workers.reduce((sum, w) => sum + w.rating, 0) / db.workers.length).toFixed(1) : '0.0';

  res.json({
    success: true,
    data: {
      totalWorkers: db.workers.length,
      availableNow: available,
      cooperativeClusters: coops,
      communityRating: avgRating,
      averageEtaRange: '8-18 min',
      fairRateRange: '₹250-650'
    }
  });
});

// ---- 404 + error handling ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Sahkaar Seva backend running on http://localhost:${PORT}`);
  console.log(`Data persisted to ${DB_FILE}`);
});
