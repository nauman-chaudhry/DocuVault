// Load environment variables (use dotenv in production: require('dotenv').config())
// These values should live in a .env file and never be committed to source control
const JWT_SECRET = process.env.JWT_SECRET || 'dms-jwt-secret-key-2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.2bhr1.mongodb.net/docu?retryWrites=true&w=majority&appName=Cluster0';
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();

// --- CORS: only allow requests from the frontend origin ---
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());

// --- File upload ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- MongoDB ---
mongoose.connect(MONGODB_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// ===================== SCHEMAS =====================

const docuSchema = new mongoose.Schema(
    {
        name:        { type: String, required: true },
        description: { type: String, required: true },
        date:        { type: Date,   required: true },
        category:    { type: String, required: true, enum: ['Quote', 'CS', 'Invoice'] },
        extranotes:  { type: String },
        attachment:  { type: String },
        submittedBy: { type: String },
        deadline:    { type: Date },
        status: {
            type: String,
            default: 'Pending',
            enum: ['Pending', 'Approved', 'Rejected', 'In Review by Finance Department', 'Processing Payment', 'Paid']
        },
        statusHistory: [
            {
                status:    { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                comment:   { type: String, default: '' }
            }
        ],
        paymentDetails: {
            amount:        { type: Number },
            paymentDate:   { type: Date },
            bankName:      { type: String },
            transactionId: { type: String }
        }
    },
    { timestamps: true }   // adds createdAt and updatedAt automatically
);

const userSchema = new mongoose.Schema(
    {
        name:     { type: String, required: true },
        email:    { type: String, required: true, unique: true },
        role:     { type: String, required: true, enum: ['Employee', 'HOD', 'Audit Department'] },
        password: { type: String, required: true, select: false }  // never returned in queries by default
    },
    { timestamps: true }
);

const Docu = mongoose.model('Docu', docuSchema);
const User  = mongoose.model('User',  userSchema);

// ===================== MIDDLEWARE =====================

// JWT verification — attach req.user if token is valid
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
}

// Role guard — call after verifyToken
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Requires one of: ${roles.join(', ')}` });
        }
        next();
    };
}

// ===================== AUTH ROUTES =====================

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // .select('+password') needed because password has select:false
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Legacy fallback: plain-text password stored before hashing was added
            if (user.password === password) {
                isMatch = true;
                user.password = await bcrypt.hash(password, 10);
                await user.save();
            }
        }
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '9h' }
        );

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ===================== DOCUMENT ROUTES =====================

// Public reads
app.get('/docu', async (req, res) => {
    try {
        res.json(await Docu.find().sort({ createdAt: -1 }));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/docu/status/pending', async (req, res) => {
    try {
        res.json(await Docu.find({ status: 'Pending' }));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/docu/:id', async (req, res) => {
    try {
        const doc = await Docu.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Protected writes — must be logged in
app.post('/docu', verifyToken, upload.single('attachment'), async (req, res) => {
    const { name, description, date, category, extranotes, submittedBy, deadline } = req.body;
    const attachment = req.file ? req.file.path : null;
    try {
        const doc = await new Docu({
            name, description, date, category, extranotes, attachment,
            submittedBy: submittedBy || req.user.name,
            deadline: deadline || null,
            status: 'Pending',
            statusHistory: [{ status: 'Pending' }]
        }).save();
        res.status(201).json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/docu/:id', verifyToken, async (req, res) => {
    const { status, comment } = req.body;
    try {
        const doc = await Docu.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        doc.status = status;
        doc.statusHistory.push({ status, timestamp: new Date(), comment: comment || '' });
        res.json(await doc.save());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/docu/:id/payment', verifyToken, requireRole('Audit Department', 'HOD'), async (req, res) => {
    const { amount, paymentDate, bankName, transactionId } = req.body;
    try {
        const doc = await Docu.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        doc.paymentDetails = { amount, paymentDate, bankName, transactionId };
        doc.status = 'Paid';
        doc.statusHistory.push({ status: 'Paid', timestamp: new Date() });
        res.json(await doc.save());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/docu/:id', verifyToken, requireRole('HOD'), async (req, res) => {
    try {
        const doc = await Docu.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ===================== USER ROUTES =====================

app.get('/users', verifyToken, requireRole('HOD'), async (req, res) => {
    try {
        res.json(await User.find());  // password excluded by select:false
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/users/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/users', verifyToken, requireRole('HOD'), async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await new User({ name, email, role, password: hashedPassword }).save();
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/users/:id', verifyToken, requireRole('HOD'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ===================== START =====================

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
