const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = 5000;
const JWT_SECRET = 'mock-secret-key';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ============ IN-MEMORY DATA ============

let users = [
  { _id: 'u1', name: 'Admin User', email: 'admin@test.com', role: 'HOD', password: 'admin123' },
  { _id: 'u2', name: 'John Employee', email: 'employee@test.com', role: 'Employee', password: 'emp123' },
  { _id: 'u3', name: 'Finance User', email: 'audit@test.com', role: 'Audit Department', password: 'audit123' }
];

let documents = [
  {
    _id: 'd1',
    name: 'Project Proposal Q1',
    description: 'Quarterly project proposal for the engineering department',
    date: new Date('2026-03-15').toISOString(),
    category: 'Quote',
    extranotes: 'Urgent review needed',
    attachment: null,
    status: 'Pending',
    statusHistory: [
      { status: 'Pending', timestamp: new Date('2026-03-15T09:00:00').toISOString() }
    ],
    paymentDetails: {}
  },
  {
    _id: 'd2',
    name: 'Invoice #2024-001',
    description: 'Monthly service invoice for IT infrastructure',
    date: new Date('2026-03-10').toISOString(),
    category: 'Invoice',
    extranotes: '',
    attachment: null,
    status: 'Approved',
    statusHistory: [
      { status: 'Pending', timestamp: new Date('2026-03-10T10:00:00').toISOString() },
      { status: 'Approved', timestamp: new Date('2026-03-12T14:30:00').toISOString() }
    ],
    paymentDetails: {}
  },
  {
    _id: 'd3',
    name: 'Budget Report 2026',
    description: 'Annual budget allocation report',
    date: new Date('2026-03-01').toISOString(),
    category: 'CS',
    extranotes: 'Reviewed by finance team',
    attachment: null,
    status: 'In Review by Finance Department',
    statusHistory: [
      { status: 'Pending', timestamp: new Date('2026-03-01T08:00:00').toISOString() },
      { status: 'Approved', timestamp: new Date('2026-03-05T11:00:00').toISOString() },
      { status: 'In Review by Finance Department', timestamp: new Date('2026-03-06T09:00:00').toISOString() }
    ],
    paymentDetails: {}
  },
  {
    _id: 'd4',
    name: 'Vendor Agreement',
    description: 'Service level agreement with cloud vendor',
    date: new Date('2026-02-20').toISOString(),
    category: 'Quote',
    extranotes: '',
    attachment: null,
    status: 'Rejected',
    statusHistory: [
      { status: 'Pending', timestamp: new Date('2026-02-20T10:00:00').toISOString() },
      { status: 'Rejected', timestamp: new Date('2026-02-22T16:00:00').toISOString() }
    ],
    paymentDetails: {}
  },
  {
    _id: 'd5',
    name: 'Office Supplies Invoice',
    description: 'Monthly office supplies purchase order',
    date: new Date('2026-03-18').toISOString(),
    category: 'Invoice',
    extranotes: 'Standard monthly order',
    attachment: null,
    status: 'Paid',
    statusHistory: [
      { status: 'Pending', timestamp: new Date('2026-03-18T09:00:00').toISOString() },
      { status: 'Approved', timestamp: new Date('2026-03-19T10:00:00').toISOString() },
      { status: 'In Review by Finance Department', timestamp: new Date('2026-03-20T11:00:00').toISOString() },
      { status: 'Paid', timestamp: new Date('2026-03-21T14:00:00').toISOString() }
    ],
    paymentDetails: { amount: 15000, paymentDate: '2026-03-21', bankName: 'HBL', transactionId: 'TXN-98765' }
  },
  {
    _id: 'd6',
    name: 'Equipment Request',
    description: 'New laptop request for development team',
    date: new Date('2026-03-20').toISOString(),
    category: 'Quote',
    extranotes: 'High priority',
    attachment: null,
    status: 'Pending',
    statusHistory: [
      { status: 'Pending', timestamp: new Date('2026-03-20T08:30:00').toISOString() }
    ],
    paymentDetails: {}
  }
];

let nextDocId = 7;
let nextUserId = 4;

// ============ AUTH ROUTES ============

app.get('/login', (req, res) => {
  const { email, password } = req.query;
  const user = users.find(u => u.email === email);

  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.password !== password) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user._id, username: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '9h' }
  );

  res.json({ token });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.password !== password) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user._id, username: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '9h' }
  );

  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

// ============ DOCUMENT ROUTES ============

app.get('/docu', (req, res) => {
  res.json(documents);
});

app.get('/docu/status/pending', (req, res) => {
  res.json(documents.filter(d => d.status === 'Pending'));
});

app.get('/docu/:id', (req, res) => {
  const doc = documents.find(d => d._id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json(doc);
});

app.post('/docu', upload.single('attachment'), (req, res) => {
  const { name, description, date, category, extranotes, status } = req.body;
  const newDoc = {
    _id: 'd' + (nextDocId++),
    name,
    description,
    date: date || new Date().toISOString(),
    category,
    extranotes: extranotes || '',
    attachment: req.file ? req.file.path : null,
    status: status || 'Pending',
    statusHistory: [{ status: status || 'Pending', timestamp: new Date().toISOString() }],
    paymentDetails: {}
  };
  documents.push(newDoc);
  res.status(201).json(newDoc);
});

app.put('/docu/:id', (req, res) => {
  const doc = documents.find(d => d._id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });

  const { status } = req.body;
  doc.status = status;
  doc.statusHistory.push({ status, timestamp: new Date().toISOString() });

  res.json(doc);
});

app.put('/docu/:id/payment', (req, res) => {
  const doc = documents.find(d => d._id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });

  const { amount, paymentDate, bankName, transactionId } = req.body;
  doc.paymentDetails = { amount, paymentDate, bankName, transactionId };
  doc.status = 'Paid';
  doc.statusHistory.push({ status: 'Paid', timestamp: new Date().toISOString() });

  res.json(doc);
});

app.delete('/docu/:id', (req, res) => {
  const index = documents.findIndex(d => d._id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Document not found' });
  documents.splice(index, 1);
  res.json({ message: 'Document deleted successfully' });
});

// ============ USER ROUTES ============

app.get('/users', (req, res) => {
  res.json(users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role })));
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
});

app.post('/users', (req, res) => {
  const { name, email, role, password } = req.body;
  const newUser = {
    _id: 'u' + (nextUserId++),
    name,
    email,
    role,
    password
  };
  users.push(newUser);
  res.status(201).json({ _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role });
});

app.delete('/users/:id', (req, res) => {
  const index = users.findIndex(u => u._id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'User not found' });
  users.splice(index, 1);
  res.json({ message: 'User deleted' });
});

// ============ START SERVER ============

app.listen(port, () => {
  console.log(`\n  Mock server running at http://localhost:${port}`);
  console.log(`\n  Test accounts:`);
  console.log(`    HOD:              admin@test.com     / admin123`);
  console.log(`    Employee:         employee@test.com  / emp123`);
  console.log(`    Audit Department: audit@test.com     / audit123\n`);
});
