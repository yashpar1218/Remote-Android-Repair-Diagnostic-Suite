const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'rads-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (use your own MongoDB URI)
const MONGO_URI = 'mongodb://localhost:27017/rads';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'technician', 'customer'], default: 'customer' },
  createdAt: { type: Date, default: Date.now }
});

// Device Schema
const deviceSchema = new mongoose.Schema({
  name: String,
  model: String,
  brand: String,
  status: { type: String, enum: ['connected', 'disconnected', 'repairing'], default: 'disconnected' },
  androidVersion: String,
  imei: String,
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Repair Request Schema
const repairSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issue: String,
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  progress: { type: Number, default: 0 },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Audit Log Schema
const auditSchema = new mongoose.Schema({
  user: String,
  action: String,
  target: String,
  command: String,
  ip: String,
  status: String,
  timestamp: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Device = mongoose.model('Device', deviceSchema);
const Repair = mongoose.model('Repair', repairSchema);
const AuditLog = mongoose.model('AuditLog', auditSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device Routes
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/devices', async (req, res) => {
  try {
    const device = new Device(req.body);
    await device.save();
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Repair Routes
app.get('/api/repairs', async (req, res) => {
  try {
    const repairs = await Repair.find().populate('deviceId customerId technician');
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/repairs', async (req, res) => {
  try {
    const repair = new Repair(req.body);
    await repair.save();
    res.status(201).json(repair);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/repairs/:id', async (req, res) => {
  try {
    const repair = await Repair.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(repair);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit Routes
app.get('/api/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/audit', async (req, res) => {
  try {
    const log = new AuditLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics Routes
app.get('/api/analytics', async (req, res) => {
  try {
    const totalRepairs = await Repair.countDocuments();
    const completedRepairs = await Repair.countDocuments({ status: 'completed' });
    const activeRepairs = await Repair.countDocuments({ status: 'in-progress' });
    const pendingRepairs = await Repair.countDocuments({ status: 'pending' });
    
    res.json({
      totalRepairs,
      completedRepairs,
      activeRepairs,
      pendingRepairs,
      successRate: totalRepairs > 0 ? Math.round((completedRepairs / totalRepairs) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`RADS Server running on port ${PORT}`);
});
