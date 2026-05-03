// Mock server — in-memory data, no MongoDB needed for local development
const JWT_SECRET    = process.env.JWT_SECRET    || 'dms-jwt-secret-key-2026';
const PORT          = process.env.PORT          || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const jwt     = require('jsonwebtoken');
const path    = require('path');

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ============ MIDDLEWARE ============

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires: ${roles.join(', ')}` });
    }
    next();
  };
}

// ============ IN-MEMORY DATA ============

let users = [
  { _id: 'u1', name: 'Admin User',   email: 'admin@test.com',    role: 'HOD',              password: 'admin123' },
  { _id: 'u2', name: 'John Employee',email: 'employee@test.com', role: 'Employee',          password: 'emp123'   },
  { _id: 'u3', name: 'Finance User', email: 'audit@test.com',    role: 'Audit Department',  password: 'audit123' }
];

let documents = [
  {
    _id: 'd1', name: 'Project Proposal Q1',
    description: 'Quarterly project proposal for the engineering department',
    date: '2026-03-15T00:00:00.000Z', category: 'Quote', extranotes: 'Urgent review needed',
    attachment: null, submittedBy: 'John Employee', deadline: '2026-04-01T00:00:00.000Z',
    status: 'Pending',
    statusHistory: [{ status: 'Pending', timestamp: '2026-03-15T09:00:00.000Z', comment: '' }],
    paymentDetails: {}, createdAt: '2026-03-15T09:00:00.000Z'
  },
  {
    _id: 'd2', name: 'Invoice #2024-001',
    description: 'Monthly service invoice for IT infrastructure',
    date: '2026-03-10T00:00:00.000Z', category: 'Invoice', extranotes: '',
    attachment: null, submittedBy: 'John Employee', deadline: null,
    status: 'Approved',
    statusHistory: [
      { status: 'Pending',  timestamp: '2026-03-10T10:00:00.000Z', comment: '' },
      { status: 'Approved', timestamp: '2026-03-12T14:30:00.000Z', comment: 'Looks good, approved.' }
    ],
    paymentDetails: {}, createdAt: '2026-03-10T10:00:00.000Z'
  },
  {
    _id: 'd3', name: 'Budget Report 2026',
    description: 'Annual budget allocation report',
    date: '2026-03-01T00:00:00.000Z', category: 'CS', extranotes: 'Reviewed by finance team',
    attachment: null, submittedBy: 'John Employee', deadline: null,
    status: 'In Review by Finance Department',
    statusHistory: [
      { status: 'Pending',                          timestamp: '2026-03-01T08:00:00.000Z', comment: '' },
      { status: 'Approved',                         timestamp: '2026-03-05T11:00:00.000Z', comment: 'Approved for finance review' },
      { status: 'In Review by Finance Department',  timestamp: '2026-03-06T09:00:00.000Z', comment: '' }
    ],
    paymentDetails: {}, createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    _id: 'd4', name: 'Vendor Agreement',
    description: 'Service level agreement with cloud vendor',
    date: '2026-02-20T00:00:00.000Z', category: 'Quote', extranotes: '',
    attachment: null, submittedBy: 'John Employee', deadline: null,
    status: 'Rejected',
    statusHistory: [
      { status: 'Pending',  timestamp: '2026-02-20T10:00:00.000Z', comment: '' },
      { status: 'Rejected', timestamp: '2026-02-22T16:00:00.000Z', comment: 'Missing vendor registration documents.' }
    ],
    paymentDetails: {}, createdAt: '2026-02-20T10:00:00.000Z'
  },
  {
    _id: 'd5', name: 'Office Supplies Invoice',
    description: 'Monthly office supplies purchase order',
    date: '2026-03-18T00:00:00.000Z', category: 'Invoice', extranotes: 'Standard monthly order',
    attachment: null, submittedBy: 'John Employee', deadline: null,
    status: 'Paid',
    statusHistory: [
      { status: 'Pending',                         timestamp: '2026-03-18T09:00:00.000Z', comment: '' },
      { status: 'Approved',                        timestamp: '2026-03-19T10:00:00.000Z', comment: 'Routine purchase, approved.' },
      { status: 'In Review by Finance Department', timestamp: '2026-03-20T11:00:00.000Z', comment: '' },
      { status: 'Paid',                            timestamp: '2026-03-21T14:00:00.000Z', comment: '' }
    ],
    paymentDetails: { amount: 15000, paymentDate: '2026-03-21', bankName: 'HBL', transactionId: 'TXN-98765' },
    createdAt: '2026-03-18T09:00:00.000Z'
  },
  {
    _id: 'd6', name: 'Equipment Request',
    description: 'New laptop request for development team',
    date: '2026-03-20T00:00:00.000Z', category: 'Quote', extranotes: 'High priority',
    attachment: null, submittedBy: 'John Employee', deadline: '2026-03-28T00:00:00.000Z',
    status: 'Pending',
    statusHistory: [{ status: 'Pending', timestamp: '2026-03-20T08:30:00.000Z', comment: '' }],
    paymentDetails: {}, createdAt: '2026-03-20T08:30:00.000Z'
  },
  {
    _id: 'd7', name: 'Software License Renewal',
    description: 'Annual software license renewal for design tools',
    date: '2026-04-01T00:00:00.000Z', category: 'Invoice', extranotes: '',
    attachment: null, submittedBy: 'Admin User', deadline: '2026-04-15T00:00:00.000Z',
    status: 'Processing Payment',
    statusHistory: [
      { status: 'Pending',                         timestamp: '2026-04-01T09:00:00.000Z', comment: '' },
      { status: 'Approved',                        timestamp: '2026-04-02T10:00:00.000Z', comment: 'Approved. Renew as usual.' },
      { status: 'In Review by Finance Department', timestamp: '2026-04-03T11:00:00.000Z', comment: '' },
      { status: 'Processing Payment',              timestamp: '2026-04-04T09:00:00.000Z', comment: '' }
    ],
    paymentDetails: {}, createdAt: '2026-04-01T09:00:00.000Z'
  }
];

let nextDocId  = 8;
let nextUserId = 4;

// ============ AUTH ============

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user)             return res.status(404).json({ message: 'User not found' });
  if (user.password !== password) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user._id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '9h' }
  );
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

// ============ DOCUMENT ROUTES ============

app.get('/docu', (req, res) => {
  res.json([...documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get('/docu/status/pending', (req, res) => {
  res.json(documents.filter(d => d.status === 'Pending'));
});

app.get('/docu/:id', (req, res) => {
  const doc = documents.find(d => d._id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json(doc);
});

app.post('/docu', verifyToken, upload.single('attachment'), (req, res) => {
  const { name, description, date, category, extranotes, submittedBy, deadline } = req.body;
  const doc = {
    _id: 'd' + (nextDocId++),
    name, description,
    date: date || new Date().toISOString(),
    category, extranotes: extranotes || '',
    attachment: req.file ? req.file.path : null,
    submittedBy: submittedBy || req.user.name,
    deadline: deadline || null,
    status: 'Pending',
    statusHistory: [{ status: 'Pending', timestamp: new Date().toISOString(), comment: '' }],
    paymentDetails: {},
    createdAt: new Date().toISOString()
  };
  documents.push(doc);
  res.status(201).json(doc);
});

app.put('/docu/:id', verifyToken, (req, res) => {
  const doc = documents.find(d => d._id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const { status, comment } = req.body;
  doc.status = status;
  doc.statusHistory.push({ status, timestamp: new Date().toISOString(), comment: comment || '' });
  res.json(doc);
});

app.put('/docu/:id/payment', verifyToken, requireRole('Audit Department', 'HOD'), (req, res) => {
  const doc = documents.find(d => d._id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const { amount, paymentDate, bankName, transactionId } = req.body;
  doc.paymentDetails = { amount, paymentDate, bankName, transactionId };
  doc.status = 'Paid';
  doc.statusHistory.push({ status: 'Paid', timestamp: new Date().toISOString(), comment: '' });
  res.json(doc);
});

app.delete('/docu/:id', verifyToken, requireRole('HOD'), (req, res) => {
  const idx = documents.findIndex(d => d._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Document not found' });
  documents.splice(idx, 1);
  res.json({ message: 'Document deleted successfully' });
});

// ============ USER ROUTES ============

app.get('/users', verifyToken, requireRole('HOD'), (req, res) => {
  res.json(users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role })));
});

app.get('/users/:id', verifyToken, (req, res) => {
  const user = users.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
});

app.post('/users', verifyToken, requireRole('HOD'), (req, res) => {
  const { name, email, role, password } = req.body;
  const newUser = { _id: 'u' + (nextUserId++), name, email, role, password };
  users.push(newUser);
  res.status(201).json({ _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role });
});

app.delete('/users/:id', verifyToken, requireRole('HOD'), (req, res) => {
  const idx = users.findIndex(u => u._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  users.splice(idx, 1);
  res.json({ message: 'User deleted' });
});

// ============ START ============

app.listen(PORT, () => {
  console.log(`\n  Mock server running at http://localhost:${PORT}`);
  console.log(`\n  Test accounts:`);
  console.log(`    HOD:              admin@test.com     / admin123`);
  console.log(`    Employee:         employee@test.com  / emp123`);
  console.log(`    Audit Department: audit@test.com     / audit123\n`);
});
