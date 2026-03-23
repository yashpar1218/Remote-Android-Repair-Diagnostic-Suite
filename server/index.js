const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'rads-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// MongoDB Connection (use your own MongoDB URI)
const MONGO_URI = 'mongodb://localhost:27017/rads';

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'TECHNICIAN', 'CUSTOMER'], default: 'CUSTOMER' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  // Profile fields
  phone: { type: String },
  address: { type: String },
  profile_picture: { type: String }
});

// Drop old username index if it exists (for backwards compatibility)
userSchema.index({ username: 1 }, { unique: true, sparse: true });

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
  ticket_id: { type: String, index: true, sparse: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer_id: String,
  customer_name: String,
  customer_email: String,
  device_id: String,
  device_name: String,
  device_brand: String,
  device_model: String,
  issue_category: String,
  issue: String,
  diagnosis_summary: String,
  actions_taken: [String],
  commands_executed: [String],
  firmware_used: [String],
  repair_notes: [String],
  cost: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  progress: { type: Number, default: 0 },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technician_id: String,
  technician_name: String,
  started_at: { type: Date, default: Date.now },
  completed_at: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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

// Firmware Schema
const firmwareSchema = new mongoose.Schema({
  name: String,
  version: String,
  brand: String,
  model: String,
  filePath: String,
  fileSize: Number,
  androidVersion: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'deprecated', 'testing'], default: 'active' }
});

// Partition Schema
const partitionSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  device_id: { type: String, index: true },
  partitionName: String,
  partitionType: String,
  size: Number,
  usedSpace: Number,
  freeSpace: Number,
  fileSystem: String,
  mountPoint: String,
  status: { type: String, enum: ['healthy', 'warning', 'critical'], default: 'healthy' },
  lastChecked: { type: Date, default: Date.now }
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  customerName: String,
  customerEmail: String,
  ticket_id: { type: String },
  device_id: { type: String },
  repairId: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  experience: String,
  recommend: String,
  highlights: [String],
  comment: String,
  response: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'responded', 'archived'], default: 'pending' }
});

// Knowledge Base Article Schema
const knowledgeArticleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  device_brand: { type: String, required: true, trim: true },
  issue_category: { type: String, required: true, trim: true },
  summary: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  tags: { type: [String], default: [] },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  collection: 'knowledge_articles',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

knowledgeArticleSchema.index({
  title: 'text',
  device_brand: 'text',
  issue_category: 'text',
  summary: 'text',
  content: 'text',
  tags: 'text'
});

// ===================== TICKET MANAGEMENT SCHEMAS =====================

// Ticket Schema - Main support request record
const ticketSchema = new mongoose.Schema({
  ticket_id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true }, // Changed from ObjectId to String
  customer_name: { type: String, required: true },
  customer_email: { type: String, required: true },
  customer_phone: { type: String },
  device_id: { type: String },
  device_name: { type: String },
  device_brand: { type: String, required: true },
  device_model: { type: String, required: true },
  issue_category: { type: String, required: true },
  issue_description: { type: String, required: true },
  urgency_level: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  status: {
    type: String,
    enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'PAYMENT_PENDING'],
    default: 'OPEN'
  },
  amount: { type: Number, default: null },
  payment_status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  assigned_technician_id: { type: String }, // Changed from ObjectId to String
  assigned_technician_name: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});


// Payment Schema
const paymentSchema = new mongoose.Schema({
  ticket_id: { type: String, required: true, index: true },
  customer_id: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, enum: ['card', 'netbanking'], required: true },
  payment_status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  transaction_id: { type: String },
  paid_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});
// Ticket Update Schema - Tracks status changes and comments
const ticketUpdateSchema = new mongoose.Schema({
  update_id: { type: String, required: true, unique: true },
  ticket_id: { type: String, required: true },
  updated_by: { type: String }, // Changed from ObjectId to String
  updated_by_name: { type: String },
  update_type: { 
    type: String, 
    enum: ['status_change', 'comment', 'repair_note', 'created', 'assigned'], 
    required: true 
  },
  update_message: { type: String, required: true },
  old_status: { type: String },
  new_status: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Repair Note Schema - Stores detailed repair/diagnostic information
const repairNoteSchema = new mongoose.Schema({
  repair_id: { type: String, required: true, unique: true },
  ticket_id: { type: String, required: true },
  technician_id: { type: String }, // Changed from ObjectId to String
  technician_name: { type: String },
  diagnosis_summary: { type: String },
  actions_taken: { type: String },
  commands_executed: { type: String },
  firmware_used: { type: String },
  repair_status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'failed'], 
    default: 'in_progress' 
  },
  created_at: { type: Date, default: Date.now }
});

const deviceHealthLogSchema = new mongoose.Schema({
  device_id: { type: String, required: true, index: true, trim: true },
  ticket_id: { type: String, index: true, sparse: true, trim: true },
  battery_health: { type: Number, min: 0, max: 100 },
  battery_temperature: { type: Number },
  storage_total: { type: Number },
  storage_used: { type: Number },
  ram_total: { type: Number },
  ram_used: { type: Number },
  cpu_usage: { type: Number, min: 0, max: 100 },
  device_temperature: { type: Number },
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'device_health_logs',
  versionKey: false
});

deviceHealthLogSchema.index({ device_id: 1, created_at: -1 });
deviceHealthLogSchema.index({ ticket_id: 1, created_at: -1 });

// Models
const User = mongoose.model('User', userSchema);
const Device = mongoose.model('Device', deviceSchema);
const Repair = mongoose.model('Repair', repairSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const AuditLog = mongoose.model('AuditLog', auditSchema);
const Firmware = mongoose.model('Firmware', firmwareSchema);
const Partition = mongoose.model('Partition', partitionSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const KnowledgeArticle = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);

// Ticket Models
const Ticket = mongoose.model('Ticket', ticketSchema);
const TicketUpdate = mongoose.model('TicketUpdate', ticketUpdateSchema);
const RepairNote = mongoose.model('RepairNote', repairNoteSchema);
const DeviceHealthLog = mongoose.model('DeviceHealthLog', deviceHealthLogSchema);

// Helper function to generate unique IDs
const generateTicketId = () => 'TKT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
const generateUpdateId = () => 'UPD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
const generateRepairId = () => 'REP-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();

const logAuditEvent = async ({ user = 'System', action, target = 'System', command = '-', ip = '-', status = 'success' }) => {
  try {
    await AuditLog.create({
      user,
      action,
      target,
      command,
      ip,
      status,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

const reconcileTicketsWithPayments = async (tickets) => {
  const ticketList = Array.isArray(tickets) ? tickets : [];
  const ticketIds = ticketList.map((ticket) => ticket.ticket_id).filter(Boolean);
  if (ticketIds.length === 0) return ticketList;

  const completedPayments = await Payment.find(
    { ticket_id: { $in: ticketIds }, payment_status: 'Completed' },
    { ticket_id: 1, paid_at: 1 }
  ).lean();

  if (!completedPayments.length) return ticketList;

  const completedMap = new Map(completedPayments.map((payment) => [payment.ticket_id, payment]));
  const now = new Date();
  const ticketsToUpdate = [];
  const ticketUpdates = [];
  const ticketsToSync = [];

  ticketList.forEach((ticket) => {
    const payment = completedMap.get(ticket.ticket_id);
    if (!payment) return;
    if (ticket.payment_status === 'PAID' && ticket.status === 'RESOLVED') return;

    const previousStatus = ticket.status;
    ticket.payment_status = 'PAID';
    ticket.status = 'RESOLVED';
    ticket.updated_at = now;
    ticketsToUpdate.push(ticket.ticket_id);

    ticketUpdates.push({
      update_id: generateUpdateId(),
      ticket_id: ticket.ticket_id,
      updated_by: ticket.customer_id || 'system',
      updated_by_name: ticket.customer_name || 'System',
      update_type: 'status_change',
      update_message: 'Payment reconciled automatically',
      old_status: previousStatus || 'PAYMENT_PENDING',
      new_status: 'RESOLVED',
      created_at: now
    });
    ticketsToSync.push(ticket);
  });

  if (ticketsToUpdate.length) {
    await Ticket.updateMany(
      { ticket_id: { $in: ticketsToUpdate } },
      { $set: { payment_status: 'PAID', status: 'RESOLVED', updated_at: now } }
    );
    if (ticketUpdates.length) {
      await TicketUpdate.insertMany(ticketUpdates);
    }
    if (ticketsToSync.length) {
      await Promise.all(ticketsToSync.map((ticket) => syncRepairRecordFromTicket({ ticket })));
    }
  }

  return ticketList;
};
const normalizeLegacyTicketStatuses = async () => {
  const legacyTickets = await Ticket.find({ status: { $in: ['CLOSED', 'CLOSE'] } }).lean();
  if (!legacyTickets.length) return;

  const now = new Date();
  const ticketIds = legacyTickets.map((ticket) => ticket.ticket_id).filter(Boolean);
  if (ticketIds.length) {
    await Ticket.updateMany(
      { ticket_id: { $in: ticketIds } },
      { $set: { status: 'RESOLVED', updated_at: now } }
    );
  }

  const updates = legacyTickets.map((ticket) => ({
    update_id: generateUpdateId(),
    ticket_id: ticket.ticket_id,
    updated_by: ticket.customer_id || 'system',
    updated_by_name: ticket.customer_name || 'System',
    update_type: 'status_change',
    update_message: 'Legacy status migrated to RESOLVED',
    old_status: ticket.status,
    new_status: 'RESOLVED',
    created_at: now
  }));

  if (updates.length) {
    await TicketUpdate.insertMany(updates);
  }

  await Promise.all(
    legacyTickets.map((ticket) =>
      syncRepairRecordFromTicket({ ticket: { ...ticket, status: 'RESOLVED', updated_at: now } })
    )
  );
};
const defaultKnowledgeArticles = [
  {
    title: 'How to Enable USB Debugging',
    device_brand: 'Android',
    issue_category: 'Diagnostics',
    summary: 'Steps to turn on Developer Options and USB debugging on Android devices.',
    content: 'Open Settings, go to About phone, tap Build number seven times, then return to Settings and open Developer Options. Enable USB debugging, connect the device to the workstation, and approve the authorization prompt on the phone. If the prompt does not appear, reconnect the cable, change the USB mode to File Transfer, and repeat the authorization step.',
    tags: ['USB Debugging', 'Android', 'Diagnostics']
  },
  {
    title: 'Samsung Galaxy Firmware Flash Guide',
    device_brand: 'Samsung',
    issue_category: 'Firmware',
    summary: 'A technician workflow for preparing and flashing Samsung firmware safely.',
    content: 'Confirm the exact model number, download the matching firmware package, back up customer data when possible, and verify battery charge before flashing. Boot the device into Download Mode, connect it to the workstation, load the BL, AP, CP, and CSC files into the flashing tool, then start the flash and wait for automatic reboot. After boot, confirm baseband, IMEI visibility, and network connectivity.',
    tags: ['Samsung', 'Firmware', 'Flashing']
  },
  {
    title: 'Common ADB Commands Reference',
    device_brand: 'Android',
    issue_category: 'Reference',
    summary: 'Frequently used ADB commands for diagnostics, file transfer, and recovery tasks.',
    content: 'Use adb devices to confirm connectivity, adb reboot bootloader to enter bootloader mode, adb shell for an interactive device shell, adb pull to copy files from the device, and adb sideload to install signed update packages from recovery. Always confirm the device is authorized before running diagnostics, and record critical commands in the repair notes for traceability.',
    tags: ['ADB', 'Reference', 'Commands']
  },
  {
    title: 'Bootloop Fix Guide',
    device_brand: 'Android',
    issue_category: 'Bootloop',
    summary: 'A staged troubleshooting path for devices stuck on the boot animation or logo.',
    content: 'Start with a forced reboot and safe mode test. If the device still bootloops, disconnect external accessories, clear cache from recovery, and review the last known software change. When software corruption is suspected, capture logs if possible, verify the correct firmware package, and reflash the device using the manufacturer-approved method. After repair, validate boot stability, storage health, and network registration.',
    tags: ['Bootloop', 'Troubleshooting', 'Recovery']
  },
  {
    title: 'FRP Bypass Methods 2024',
    device_brand: 'Android',
    issue_category: 'Security Lock',
    summary: 'Guidance for handling FRP-locked devices within approved service and ownership rules.',
    content: 'Verify proof of ownership and service authorization before attempting any FRP-related action. Document the customer identity, the device serial or IMEI, and the reason for the reset. Use brand-approved service procedures whenever available. If escalation is required, involve a senior technician or service manager before proceeding. Never perform FRP removal on unverified devices.',
    tags: ['FRP', 'Security', 'Authorization']
  },
  {
    title: 'Fastboot Mode Explained',
    device_brand: 'Android',
    issue_category: 'Boot Mode',
    summary: 'An overview of Fastboot mode, when to use it, and what technicians should verify first.',
    content: 'Fastboot mode is used for low-level maintenance tasks such as unlocking the bootloader, flashing partitions, and checking device variables. Before using it, confirm the correct drivers are installed, verify the device battery is stable, and review whether unlocking or flashing will affect data retention. Use fastboot devices to confirm detection and keep a written record of any flashing command used during service.',
    tags: ['Fastboot', 'Bootloader', 'Flashing']
  }
];

const normalizeKnowledgeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
};

const buildKnowledgeArticlePayload = (payload = {}) => {
  const article = {
    title: String(payload.title || '').trim(),
    device_brand: String(payload.device_brand || '').trim(),
    issue_category: String(payload.issue_category || '').trim(),
    summary: String(payload.summary || '').trim(),
    content: String(payload.content || '').trim(),
    tags: normalizeKnowledgeTags(payload.tags)
  };

  const missingFields = Object.entries(article)
    .filter(([key, value]) => key !== 'tags' && !value)
    .map(([key]) => key);

  return { article, missingFields };
};

const ensureKnowledgeArticles = async () => {
  const technician = await User.findOne({ role: 'TECHNICIAN' }).select('_id');
  const existingArticles = await KnowledgeArticle.find({}, 'title').lean();
  const existingTitles = new Set(existingArticles.map((article) => String(article.title || '').trim().toLowerCase()).filter(Boolean));

  const totalArticles = await KnowledgeArticle.countDocuments();
  if (totalArticles > 0) {
    return;
  }

  const seededArticles = defaultKnowledgeArticles
    .filter((article) => !existingTitles.has(article.title.toLowerCase()))
    .map((article) => ({
      ...article,
      created_by: technician?._id
    }));

  if (seededArticles.length > 0) {
    await KnowledgeArticle.insertMany(seededArticles);
    console.log(`Seeded ${seededArticles.length} knowledge base articles`);
  }
};

const appendUniqueRepairValues = (existingValues = [], nextValues = []) => {
  const safeExisting = Array.isArray(existingValues)
    ? existingValues
    : typeof existingValues === 'string' && existingValues.trim()
      ? splitRepairText(existingValues)
      : [];
  const merged = [...safeExisting];
  nextValues.filter(Boolean).forEach((value) => {
    if (!merged.includes(value)) {
      merged.push(value);
    }
  });
  return merged;
};

const splitRepairText = (value = '') => String(value)
  .split(/\r?\n|,/)
  .map((item) => item.trim())
  .filter(Boolean);

const parseMetricNumber = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  const normalized = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(normalized) ? normalized : undefined;
};

const roundMetric = (value) => {
  const parsed = parseMetricNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed * 10) / 10;
};

const toPercent = (used, total) => {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((used / total) * 100);
};

const formatDeviceHealthLog = (log = {}) => {
  const storageUsagePercent = toPercent(log.storage_used, log.storage_total);
  const ramUsagePercent = toPercent(log.ram_used, log.ram_total);

  return {
    _id: log._id,
    device_id: log.device_id || '',
    ticket_id: log.ticket_id || '',
    battery_health: log.battery_health ?? null,
    battery_health_label: log.battery_health !== undefined && log.battery_health !== null ? (Math.round(log.battery_health) + '%') : 'N/A',
    battery_temperature: log.battery_temperature ?? null,
    battery_temperature_label: log.battery_temperature !== undefined && log.battery_temperature !== null ? (log.battery_temperature.toFixed(1) + 'C') : 'N/A',
    storage_total: log.storage_total ?? null,
    storage_total_label: log.storage_total !== undefined && log.storage_total !== null ? (log.storage_total.toFixed(1) + ' GB') : 'N/A',
    storage_used: log.storage_used ?? null,
    storage_used_label: log.storage_used !== undefined && log.storage_used !== null ? (log.storage_used.toFixed(1) + ' GB') : 'N/A',
    storage_usage_percent: storageUsagePercent,
    ram_total: log.ram_total ?? null,
    ram_total_label: log.ram_total !== undefined && log.ram_total !== null ? (log.ram_total.toFixed(1) + ' GB') : 'N/A',
    ram_used: log.ram_used ?? null,
    ram_used_label: log.ram_used !== undefined && log.ram_used !== null ? (log.ram_used.toFixed(1) + ' GB') : 'N/A',
    ram_usage_percent: ramUsagePercent,
    cpu_usage: log.cpu_usage ?? null,
    cpu_usage_label: log.cpu_usage !== undefined && log.cpu_usage !== null ? (Math.round(log.cpu_usage) + '%') : 'N/A',
    device_temperature: log.device_temperature ?? null,
    device_temperature_label: log.device_temperature !== undefined && log.device_temperature !== null ? (log.device_temperature.toFixed(1) + 'C') : 'N/A',
    created_at: log.created_at
  };
};

const buildDeviceHealthInsights = (logs = []) => {
  const poorBatteryLogs = logs.filter((log) => Number.isFinite(log.battery_health) && log.battery_health < 80);
  const highStorageLogs = logs.filter((log) => toPercent(log.storage_used, log.storage_total) >= 85);
  const overheatingLogs = logs.filter((log) => {
    const deviceTemp = parseMetricNumber(log.device_temperature);
    const batteryTemp = parseMetricNumber(log.battery_temperature);
    return (deviceTemp !== undefined && deviceTemp >= 45) || (batteryTemp !== undefined && batteryTemp >= 45);
  });

  return {
    totalLogs: logs.length,
    poorBatteryCount: poorBatteryLogs.length,
    highStorageCount: highStorageLogs.length,
    overheatingCount: overheatingLogs.length,
    poorBatteryDevices: [...new Set(poorBatteryLogs.map((log) => log.device_id).filter(Boolean))],
    highStorageDevices: [...new Set(highStorageLogs.map((log) => log.device_id).filter(Boolean))],
    overheatingDevices: [...new Set(overheatingLogs.map((log) => log.device_id).filter(Boolean))]
  };
};

const resolveRepairStatus = (ticketStatus = 'OPEN', repairStatus = 'in_progress') => {
  if (repairStatus === 'failed') return 'cancelled';
  if (repairStatus === 'completed') return 'completed';
  if (ticketStatus === 'RESOLVED' || ticketStatus === 'PAYMENT_PENDING') return 'completed';
  if (ticketStatus === 'OPEN') return 'pending';
  return 'in-progress';
};

const syncRepairRecordFromTicket = async ({ ticket, repairNote = null }) => {
  if (!ticket) {
    return null;
  }

  const repair = await Repair.findOne({ ticket_id: ticket.ticket_id }) || new Repair({ ticket_id: ticket.ticket_id });
  const actionItems = repairNote ? splitRepairText(repairNote.actions_taken) : [];
  const commandItems = repairNote ? splitRepairText(repairNote.commands_executed) : [];
  const firmwareItems = repairNote ? splitRepairText(repairNote.firmware_used) : [];
  const noteMessages = repairNote ? [repairNote.diagnosis_summary].filter(Boolean) : [];
  const derivedStatus = resolveRepairStatus(ticket.status, repairNote?.repair_status);
  const derivedDeviceName = (ticket.device_brand || '') + ((ticket.device_brand || ticket.device_model) ? ' ' : '') + (ticket.device_model || '');

  repair.customer_id = ticket.customer_id || repair.customer_id || '';
  repair.customer_name = ticket.customer_name || repair.customer_name || '';
  repair.customer_email = ticket.customer_email || repair.customer_email || '';
  repair.device_id = ticket.device_id || repair.device_id || '';
  repair.device_name = ticket.device_name || repair.device_name || derivedDeviceName.trim();
  repair.device_brand = ticket.device_brand || repair.device_brand || '';
  repair.device_model = ticket.device_model || repair.device_model || '';
  repair.issue_category = ticket.issue_category || repair.issue_category || '';
  repair.issue = ticket.issue_description || repair.issue || '';
  repair.technician_id = ticket.assigned_technician_id || repair.technician_id || repairNote?.technician_id || '';
  repair.technician_name = ticket.assigned_technician_name || repair.technician_name || repairNote?.technician_name || '';
  repair.diagnosis_summary = repairNote?.diagnosis_summary || repair.diagnosis_summary || '';
  repair.actions_taken = appendUniqueRepairValues(repair.actions_taken || [], actionItems);
  repair.commands_executed = appendUniqueRepairValues(repair.commands_executed || [], commandItems);
  repair.firmware_used = appendUniqueRepairValues(repair.firmware_used || [], firmwareItems);
  repair.repair_notes = appendUniqueRepairValues(repair.repair_notes || [], noteMessages);
  const ticketAmount = Number(ticket.amount);
  if (Number.isFinite(ticketAmount)) {
    repair.cost = ticketAmount;
  }
  repair.status = derivedStatus;
  repair.progress = derivedStatus === 'completed' ? 100 : derivedStatus === 'in-progress' ? 60 : 0;
  repair.started_at = repair.started_at || ticket.created_at || new Date();
  repair.completed_at = derivedStatus === 'completed' ? (repair.completed_at || ticket.updated_at || new Date()) : repair.completed_at;
  repair.updatedAt = new Date();

  if (repair.technician_id && mongoose.Types.ObjectId.isValid(repair.technician_id)) {
    repair.technician = repair.technician_id;
  }

  if (repair.customer_id && mongoose.Types.ObjectId.isValid(repair.customer_id)) {
    repair.customerId = repair.customer_id;
  }

  if (repair.device_id && mongoose.Types.ObjectId.isValid(repair.device_id)) {
    repair.deviceId = repair.device_id;
  }

  await repair.save();
  return repair;
};
// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    // Drop old username index if it exists (for backwards compatibility)
    try {
      await mongoose.connection.db.collection('users').dropIndex('username_1');
      console.log('Dropped old username index');
    } catch (e) {
      // Index may not exist, that's fine
    }
    
    // Seed default admin if not exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Admin',
        email: 'admin@rads.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      });
      await admin.save();
      console.log('Default admin created: admin@rads.com / admin123');
    }

    await ensureKnowledgeArticles();
    await normalizeLegacyTicketStatuses();
  })
  .catch(err => console.log(err));

// ===================== AUTH MIDDLEWARE =====================

// Verify JWT token
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Role-based middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// ===================== AUTH ROUTES =====================

// Customer Registration (public) - CUSTOMER role only
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    // Always create as CUSTOMER - no other role can be registered via API
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: 'CUSTOMER',
      isActive: true
    });
    await user.save();
    
    res.status(201).json({ message: 'Customer registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login (for all roles)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      await logAuditEvent({
        user: email || 'Unknown',
        action: 'Login Failed',
        target: 'Authentication',
        command: 'POST /api/auth/login',
        ip: req.ip,
        status: 'error'
      });
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is active (for technicians and customers)
    if ((user.role === 'TECHNICIAN' || user.role === 'CUSTOMER') && !user.isActive) {
      await logAuditEvent({
        user: user.name || user.email,
        action: 'Login Blocked',
        target: user.role,
        command: 'POST /api/auth/login',
        ip: req.ip,
        status: 'warning'
      });
      return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAuditEvent({
        user: user.name || user.email,
        action: 'Login Failed',
        target: user.role,
        command: 'POST /api/auth/login',
        ip: req.ip,
        status: 'error'
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ 
      id: user._id.toString(), 
      role: user.role,
      name: user.name,
      email: user.email
    }, JWT_SECRET, { expiresIn: '1d' });

    await logAuditEvent({
      user: user.name || user.email,
      action: 'Login',
      target: user.role,
      command: 'POST /api/auth/login',
      ip: req.ip,
      status: 'success'
    });
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        phone: user.phone,
        address: user.address,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== USER PROFILE API =====================

// Get user profile
app.get('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (with optional profile picture upload)
app.put('/api/users/profile', authMiddleware, upload.single('profile_picture'), async (req, res) => {
  try {
    const { name, email, phone, address, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (req.file) {
      user.profile_picture = `/uploads/profile-pictures/${req.file.filename}`;
    }
    
    await user.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== TECHNICIAN MANAGEMENT (Admin only) =====================

// Create technician (admin only)
app.post('/api/technicians', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const technician = new User({
      name,
      email,
      password: hashedPassword,
      role: 'TECHNICIAN',
      isActive: true
    });
    
    await technician.save();
    res.status(201).json({ 
      message: 'Technician created successfully',
      technician: { id: technician._id, name: technician.name, email: technician.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all technicians (admin only)
app.get('/api/technicians', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const technicians = await User.find({ role: 'TECHNICIAN' }).select('-password');
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate/Activate technician (admin only)
app.put('/api/technicians/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const technician = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    
    res.json({ message: 'Technician updated successfully', technician });
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
    const { technician_id, status, ticket_id } = req.query;
    const filter = {};

    if (technician_id) {
      const techId = String(technician_id);
      const ticketIdsForTech = await Ticket.find({ assigned_technician_id: techId })
        .distinct('ticket_id');
      filter.$or = [
        { technician_id: techId },
        ...(mongoose.Types.ObjectId.isValid(technician_id) ? [{ technician: technician_id }] : []),
        ...(ticketIdsForTech.length ? [{ ticket_id: { $in: ticketIdsForTech } }] : [])
      ];
    }
    if (status) filter.status = status;
    if (ticket_id) filter.ticket_id = ticket_id;

    const repairs = await Repair.find(filter)
      .populate('deviceId customerId technician')
      .sort({ completed_at: -1, updatedAt: -1, createdAt: -1 })
      .lean();

    const ticketIds = repairs.map((repair) => repair.ticket_id).filter(Boolean);
    const tickets = ticketIds.length
      ? await Ticket.find({ ticket_id: { $in: ticketIds } }, { ticket_id: 1, amount: 1 }).lean()
      : [];
    const amountByTicketId = new Map(tickets.map((ticket) => [ticket.ticket_id, ticket.amount]));

    const enrichedRepairs = repairs.map((repair) => {
      const ticketAmount = amountByTicketId.get(repair.ticket_id);
      const parsedCost = Number(repair.cost);
      const normalizedCost = Number.isFinite(parsedCost)
        ? parsedCost
        : Number.isFinite(Number(ticketAmount))
          ? Number(ticketAmount)
          : 0;

      return {
        ...repair,
        cost: normalizedCost
      };
    });

    res.json(enrichedRepairs);
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

// Rebuild repair documents from tickets (fixes status/technician drift after logic changes)
app.post('/api/admin/repairs/sync-from-tickets', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const tickets = await Ticket.find({}).lean();
    let synced = 0;
    for (const t of tickets) {
      await syncRepairRecordFromTicket({ ticket: t });
      synced += 1;
    }
    await logAuditEvent({
      user: req.user?.email || req.user?.name || 'Admin',
      action: 'repairs_sync_from_tickets',
      target: 'repairs',
      command: `POST /api/admin/repairs/sync-from-tickets (${synced} tickets)`,
      ip: req.ip,
      status: 'success'
    });
    res.json({ message: 'Repair records synced from tickets', synced, ticketCount: tickets.length });
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
    const log = new AuditLog({
      ...req.body,
      timestamp: req.body.timestamp || new Date()
    });
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

// Admin Analytics with time range filter
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const { range } = req.query;
    let startDate = new Date();
    
    // Calculate start date based on range
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get ticket stats from MongoDB
    const totalTickets = await Ticket.countDocuments({ created_at: { $gte: startDate } });
    const resolvedTickets = await Ticket.countDocuments({ 
      created_at: { $gte: startDate },
      status: { $in: ['RESOLVED'] }
    });
    const openTickets = await Ticket.countDocuments({ 
      created_at: { $gte: startDate },
      status: 'OPEN'
    });
    const inProgressTickets = await Ticket.countDocuments({ 
      created_at: { $gte: startDate },
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
    });

    // Get technician performance
    const technicians = await User.find({ role: 'TECHNICIAN' });
    const techPerformance = await Promise.all(technicians.map(async (tech) => {
      const totalRepairs = await Ticket.countDocuments({
        assigned_technician_id: tech._id.toString(),
        created_at: { $gte: startDate }
      });
      const completedRepairs = await Ticket.countDocuments({
        assigned_technician_id: tech._id.toString(),
        created_at: { $gte: startDate },
        status: { $in: ['RESOLVED'] }
      });
      return {
        name: tech.name,
        totalRepairs,
        completedRepairs,
        completionRate: totalRepairs > 0 ? Math.round((completedRepairs / totalRepairs) * 100) : 0,
        avgTime: '2.5 hrs'
      };
    }));

    // Get device brand distribution
    const tickets = await Ticket.find({ created_at: { $gte: startDate } });
    const brandCounts = {};
    tickets.forEach(ticket => {
      const brand = ticket.device_brand || 'Other';
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    const brandDistribution = Object.entries(brandCounts).map(([name, repairs]) => ({
      name,
      repairs
    }));

    // Get issue categories
    const issueCounts = {};
    tickets.forEach(ticket => {
      const category = ticket.issue_category || 'Other';
      issueCounts[category] = (issueCounts[category] || 0) + 1;
    });
    const issueCategories = Object.entries(issueCounts).map(([name, value], index) => ({
      name,
      value,
      color: ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#64748b', '#ef4444'][index % 6]
    }));

    const healthLogs = await DeviceHealthLog.find({ created_at: { $gte: startDate } }).lean();
    const healthOverview = buildDeviceHealthInsights(healthLogs);

    // Generate daily stats for the past week
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const total = await Ticket.countDocuments({
        created_at: { $gte: date, $lt: nextDate }
      });
      const resolved = await Ticket.countDocuments({
        created_at: { $gte: date, $lt: nextDate },
        status: { $in: ['RESOLVED'] }
      });
      
      dailyStats.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        total,
        resolved
      });
    }

    const payments = await Payment.find({
      payment_status: 'Completed',
      $or: [
        { paid_at: { $gte: startDate } },
        { paid_at: { $exists: false }, created_at: { $gte: startDate } }
      ]
    }).lean();
    const revenue = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    res.json({
      totalTickets,
      resolvedTickets,
      openTickets,
      inProgressTickets,
      successRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
      avgRepairTime: 2.5,
      revenue,
      technicians: techPerformance,
      brandDistribution: brandDistribution.length > 0 ? brandDistribution : [
        { name: 'Samsung', repairs: 45 },
        { name: 'OnePlus', repairs: 20 },
        { name: 'Xiaomi', repairs: 15 },
        { name: 'Redmi', repairs: 10 },
        { name: 'Realme', repairs: 8 },
        { name: 'Other', repairs: 7 }
      ],
      issueCategories: issueCategories.length > 0 ? issueCategories : [
        { name: 'Screen Issues', value: 25, color: '#3b82f6' },
        { name: 'Battery', value: 20, color: '#22c55e' },
        { name: 'Software', value: 30, color: '#a855f7' },
        { name: 'Hardware', value: 15, color: '#f59e0b' },
        { name: 'Other', value: 10, color: '#64748b' }
      ],
      healthOverview,
      dailyStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Firmware Routes
app.get('/api/firmware', async (req, res) => {
  try {
    const firmware = await Firmware.find().populate('uploadedBy');
    res.json(firmware);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/firmware', async (req, res) => {
  try {
    const fw = new Firmware(req.body);
    await fw.save();
    res.status(201).json(fw);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Partition Routes
app.get('/api/partitions', async (req, res) => {
  try {
    const partitions = await Partition.find().populate('deviceId');
    res.json(partitions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/partitions/sync', async (req, res) => {
  try {
    const device_id = String(req.body.device_id || '').trim();
    const partitions = Array.isArray(req.body.partitions) ? req.body.partitions : [];

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    if (!partitions.length) {
      return res.status(400).json({ error: 'partitions array is required' });
    }

    const savedPartitions = [];
    for (const entry of partitions) {
      const payload = {
        device_id,
        partitionName: String(entry.partitionName || entry.filesystem || '').trim(),
        partitionType: String(entry.partitionType || 'filesystem').trim(),
        size: Number(entry.size) || 0,
        usedSpace: Number(entry.usedSpace) || 0,
        freeSpace: Number(entry.freeSpace) || 0,
        fileSystem: String(entry.fileSystem || entry.filesystem || '').trim(),
        mountPoint: String(entry.mountPoint || entry.mounted || '').trim(),
        status: ['healthy', 'warning', 'critical'].includes(entry.status) ? entry.status : 'healthy',
        lastChecked: new Date()
      };

      const saved = await Partition.findOneAndUpdate(
        {
          device_id,
          partitionName: payload.partitionName,
          mountPoint: payload.mountPoint
        },
        payload,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      savedPartitions.push(saved);
    }

    await logAuditEvent({
      user: req.body.technician_name || 'Technician',
      action: 'Partition Snapshot Synced',
      target: device_id,
      command: 'POST /api/partitions/sync',
      ip: req.ip,
      status: 'success'
    });

    res.status(201).json({
      message: 'Partition data synced successfully',
      count: savedPartitions.length,
      partitions: savedPartitions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/partitions', async (req, res) => {
  try {
    const partition = new Partition(req.body);
    await partition.save();
    res.status(201).json(partition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Feedback Routes
app.get('/api/feedback', async (req, res) => {
  try {
    const { customerId, ticket_id } = req.query;
    const filter = {};

    if (customerId) filter.customerId = customerId;
    if (ticket_id) filter.ticket_id = ticket_id;

    const feedback = await Feedback.find(filter).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'MongoDB is not connected' });
    }

    const {
      customerId,
      customerName,
      customerEmail,
      ticket_id,
      device_id,
      repairId,
      rating,
      experience,
      recommend,
      highlights,
      comment
    } = req.body;

    if (!customerId || !rating) {
      return res.status(400).json({ error: 'Customer and rating are required' });
    }

    const fb = new Feedback({
      customerId,
      customerName,
      customerEmail,
      ticket_id,
      device_id,
      repairId,
      rating,
      experience,
      recommend,
      highlights: Array.isArray(highlights) ? highlights : [],
      comment,
      status: 'pending'
    });

    await fb.save();
    res.status(201).json(fb);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Knowledge Base Routes
app.get('/api/knowledge', async (req, res) => {
  try {
    const { q, device_brand, issue_category, tag } = req.query;
    const filter = {};

    if (device_brand) filter.device_brand = device_brand;
    if (issue_category) filter.issue_category = issue_category;
    if (tag) filter.tags = tag;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { device_brand: { $regex: q, $options: 'i' } },
        { issue_category: { $regex: q, $options: 'i' } },
        { tags: { $elemMatch: { $regex: q, $options: 'i' } } }
      ];
    }

    const articles = await KnowledgeArticle.find(filter)
      .populate('created_by', 'name email role')
      .sort({ updated_at: -1, created_at: -1 });

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/knowledge/:id', async (req, res) => {
  try {
    const article = await KnowledgeArticle.findById(req.params.id).populate('created_by', 'name email role');
    if (!article) {
      return res.status(404).json({ error: 'Knowledge article not found' });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/knowledge', authMiddleware, requireRole('TECHNICIAN'), async (req, res) => {
  try {
    const { article, missingFields } = buildKnowledgeArticlePayload(req.body);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    const createdArticle = await KnowledgeArticle.create({
      ...article,
      created_by: req.user.id
    });

    const populatedArticle = await KnowledgeArticle.findById(createdArticle._id).populate('created_by', 'name email role');
    res.status(201).json(populatedArticle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/knowledge/:id', authMiddleware, requireRole('TECHNICIAN'), async (req, res) => {
  try {
    const { article, missingFields } = buildKnowledgeArticlePayload(req.body);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    const updatedArticle = await KnowledgeArticle.findByIdAndUpdate(
      req.params.id,
      article,
      { new: true, runValidators: true }
    ).populate('created_by', 'name email role');

    if (!updatedArticle) {
      return res.status(404).json({ error: 'Knowledge article not found' });
    }

    res.json(updatedArticle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/knowledge/:id', authMiddleware, requireRole('TECHNICIAN'), async (req, res) => {
  try {
    const deletedArticle = await KnowledgeArticle.findByIdAndDelete(req.params.id);
    if (!deletedArticle) {
      return res.status(404).json({ error: 'Knowledge article not found' });
    }

    res.json({ message: 'Knowledge article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== REPORTS API =====================

// 0. Payments Report
app.get('/api/reports/payments', async (req, res) => {
  try {
    const payments = await Payment.find({ payment_status: 'Completed' }).lean();

    const totalRevenue = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const totalPayments = payments.length;

    const methodCounts = {};
    const dailyRevenue = {};

    payments.forEach((payment) => {
      const method = payment.payment_method || 'unknown';
      methodCounts[method] = (methodCounts[method] || 0) + 1;

      const dateValue = payment.paid_at || payment.created_at || payment.createdAt || new Date();
      const dayKey = new Date(dateValue).toISOString().slice(0, 10);
      dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + (Number(payment.amount) || 0);
    });

    res.json({
      totalRevenue,
      totalPayments,
      methodCounts,
      dailyRevenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// 1. Device Status Report
app.get('/api/reports/device-status', async (req, res) => {
  try {
    const total = await Device.countDocuments();
    const connected = await Device.countDocuments({ status: 'connected' });
    const disconnected = await Device.countDocuments({ status: 'disconnected' });
    const repairing = await Device.countDocuments({ status: 'repairing' });
    
    res.json({
      total,
      connected,
      disconnected,
      repairing,
      connectionRate: total > 0 ? Math.round((connected / total) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Repair Summary Report
app.get('/api/reports/repair-summary', async (req, res) => {
  try {
    const total = await Repair.countDocuments();
    const completed = await Repair.countDocuments({ status: 'completed' });
    const inProgress = await Repair.countDocuments({ status: 'in-progress' });
    const pending = await Repair.countDocuments({ status: 'pending' });
    const cancelled = await Repair.countDocuments({ status: 'cancelled' });
    
    res.json({
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Technician Performance Report
app.get('/api/reports/technician-performance', async (req, res) => {
  try {
    const [technicians, tickets, repairNotes, repairs] = await Promise.all([
      User.find({ role: 'TECHNICIAN' }).lean(),
      Ticket.find({
        $or: [
          { assigned_technician_id: { $exists: true, $ne: '' } },
          { assigned_technician_name: { $exists: true, $ne: '' } }
        ]
      }).lean(),
      RepairNote.find({
        $or: [
          { technician_id: { $exists: true, $ne: '' } },
          { technician_name: { $exists: true, $ne: '' } }
        ]
      }).lean(),
      Repair.find().lean()
    ]);

    const performanceMap = new Map();

    const ensureTechEntry = ({ id = '', name = '', email = '' }) => {
      const key = id || email || name;
      if (!key) return null;
      if (!performanceMap.has(key)) {
        performanceMap.set(key, {
          id,
          name: name || 'Technician',
          email: email || '-',
          totalRepairs: 0,
          completedRepairs: 0,
          touchedTickets: new Set()
        });
      }
      const entry = performanceMap.get(key);
      if (name && (!entry.name || entry.name === 'Technician')) entry.name = name;
      if (email && entry.email === '-') entry.email = email;
      if (id && !entry.id) entry.id = id;
      return entry;
    };

    technicians.forEach((tech) => {
      ensureTechEntry({
        id: tech._id?.toString() || '',
        name: tech.name || tech.username || 'Technician',
        email: tech.email || '-'
      });
    });

    tickets.forEach((ticket) => {
      const entry = ensureTechEntry({
        id: ticket.assigned_technician_id || '',
        name: ticket.assigned_technician_name || 'Technician'
      });
      if (!entry) return;
      if (!entry.touchedTickets.has(ticket.ticket_id)) {
        entry.totalRepairs += 1;
        entry.touchedTickets.add(ticket.ticket_id);
      }
      if (['RESOLVED'].includes(ticket.status)) {
        entry.completedRepairs += 1;
      }
    });

    repairNotes.forEach((note) => {
      const entry = ensureTechEntry({
        id: note.technician_id || '',
        name: note.technician_name || 'Technician'
      });
      if (!entry) return;
      if (!entry.touchedTickets.has(note.ticket_id)) {
        entry.totalRepairs += 1;
        entry.touchedTickets.add(note.ticket_id);
      }
      if (note.repair_status === 'completed') {
        entry.completedRepairs += 1;
      }
    });

    repairs.forEach((repair) => {
      const entry = ensureTechEntry({ id: repair.technician?.toString?.() || repair.technician || '' });
      if (!entry) return;
      entry.totalRepairs += 1;
      if (repair.status === 'completed') {
        entry.completedRepairs += 1;
      }
    });

    const performance = Array.from(performanceMap.values())
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        email: entry.email,
        totalRepairs: entry.totalRepairs,
        completedRepairs: Math.min(entry.completedRepairs, entry.totalRepairs),
        completionRate: entry.totalRepairs > 0 ? Math.round((Math.min(entry.completedRepairs, entry.totalRepairs) / entry.totalRepairs) * 100) : 0
      }))
      .sort((a, b) => b.totalRepairs - a.totalRepairs || a.name.localeCompare(b.name));

    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Customer Satisfaction Report
app.get('/api/reports/customer-satisfaction', async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    const total = feedbacks.length;
    const avgRating = total > 0 ? feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / total : 0;
    const ratings = {
      '5star': feedbacks.filter(fb => fb.rating === 5).length,
      '4star': feedbacks.filter(fb => fb.rating === 4).length,
      '3star': feedbacks.filter(fb => fb.rating === 3).length,
      '2star': feedbacks.filter(fb => fb.rating === 2).length,
      '1star': feedbacks.filter(fb => fb.rating === 1).length
    };
    
    res.json({
      totalFeedbacks: total,
      averageRating: Math.round(avgRating * 10) / 10,
      ratings,
      satisfactionRate: Math.round(avgRating / 5 * 100)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Audit Log Report
app.get('/api/reports/audit-log', async (req, res) => {
  try {
    const { startDate, endDate, user, action } = req.query;
    const filter = {};
    if (user) filter.user = user;
    if (action) filter.action = action;
    if (startDate && endDate) {
      filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(500);
    const actionCounts = await AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);
    
    res.json({
      logs,
      actionCounts: actionCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Firmware Usage Report
app.get('/api/reports/firmware-usage', async (req, res) => {
  try {
    const firmware = await Firmware.find();
    const byBrand = firmware.reduce((acc, fw) => {
      acc[fw.brand] = (acc[fw.brand] || 0) + 1;
      return acc;
    }, {});
    const byStatus = firmware.reduce((acc, fw) => {
      acc[fw.status] = (acc[fw.status] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      total: firmware.length,
      byBrand,
      byStatus,
      totalSize: firmware.reduce((sum, fw) => sum + (fw.fileSize || 0), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Device Health Report
app.get('/api/reports/device-health', async (req, res) => {
  try {
    const logs = await DeviceHealthLog.find().sort({ created_at: -1 }).lean();
    const insights = buildDeviceHealthInsights(logs);
    const recentLogs = logs.slice(0, 50).map(formatDeviceHealthLog);

    const averageBatteryHealth = logs.length
      ? Math.round(logs.reduce((sum, log) => sum + (parseMetricNumber(log.battery_health) || 0), 0) / logs.length)
      : 0;
    const averageCpuUsage = logs.length
      ? Math.round(logs.reduce((sum, log) => sum + (parseMetricNumber(log.cpu_usage) || 0), 0) / logs.length)
      : 0;
    const averageStorageUsage = logs.length
      ? Math.round(logs.reduce((sum, log) => sum + toPercent(log.storage_used, log.storage_total), 0) / logs.length)
      : 0;

    res.json({
      totalLogs: logs.length,
      averageBatteryHealth,
      averageCpuUsage,
      averageStorageUsage,
      poorBatteryCount: insights.poorBatteryCount,
      highStorageCount: insights.highStorageCount,
      overheatingCount: insights.overheatingCount,
      poorBatteryDevices: insights.poorBatteryDevices,
      highStorageDevices: insights.highStorageDevices,
      overheatingDevices: insights.overheatingDevices,
      recentLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. User Activity Report
app.get('/api/reports/user-activity', async (req, res) => {
  try {
    const users = await User.find();
    const byRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    res.json({
      totalUsers: users.length,
      byRole,
      recentSignups,
      signupRate: Math.round((recentSignups / users.length) * 100) || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. System Analytics Report
app.get('/api/reports/system-analytics', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const devices = await Device.countDocuments();
    const repairs = await Repair.countDocuments();
    const firmware = await Firmware.countDocuments();
    const knowledgeBase = await KnowledgeArticle.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRepairs = await Repair.countDocuments({ createdAt: { $gte: today } });
    const todayDevices = await Device.countDocuments({ createdAt: { $gte: today } });
    
    res.json({
      totalUsers,
      totalDevices: devices,
      totalRepairs: repairs,
      totalFirmware: firmware,
      totalKnowledgeBase: knowledgeBase,
      todayRepairs,
      todayDevices,
      systemHealth: 'operational'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Pending Repairs Report
app.get('/api/reports/pending-repairs', async (req, res) => {
  try {
    const repairs = await Repair.find({ status: { $in: ['pending', 'in-progress'] } })
      .populate('deviceId customerId technician')
      .sort({ createdAt: 1 });
    
    const byPriority = repairs.reduce((acc, r) => {
      const daysOld = Math.floor((new Date() - r.createdAt) / (1000 * 60 * 60 * 24));
      const priority = daysOld > 7 ? 'high' : daysOld > 3 ? 'medium' : 'low';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalPending: repairs.length,
      repairs,
      byPriority
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Completed Repairs Report
app.get('/api/reports/completed-repairs', async (req, res) => {
  try {
    const repairs = await Repair.find({ status: 'completed' })
      .populate('deviceId customerId technician')
      .sort({ createdAt: -1 });
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentCompleted = repairs.filter(r => r.createdAt >= last30Days);
    
    res.json({
      totalCompleted: repairs.length,
      last30Days: recentCompleted.length,
      repairs: repairs.slice(0, 50)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Device Distribution Report
app.get('/api/reports/device-distribution', async (req, res) => {
  try {
    const devices = await Device.find();
    const byBrand = devices.reduce((acc, d) => {
      acc[d.brand] = (acc[d.brand] || 0) + 1;
      return acc;
    }, {});
    const byModel = devices.reduce((acc, d) => {
      acc[d.model] = (acc[d.model] || 0) + 1;
      return acc;
    }, {});
    const byAndroid = devices.reduce((acc, d) => {
      acc[d.androidVersion] = (acc[d.androidVersion] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalDevices: devices.length,
      byBrand,
      byModel,
      byAndroidVersion: byAndroid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== GSMArena API =====================

// Search devices on GSMArena
app.get('/api/gsmarena/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const response = await axios.get(`https://www.gsmarena.com/results.php3?nYearMin=2020&nYearMax=2025&sQuickSearch=yes&headerMenuGeo=IN&gHeadCountry=IN&gsmart_all=${encodeURIComponent(q)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.results .mutedList li').each((i, el) => {
      if (i >= 10) return;
      const $el = $(el);
      const $link = $el.find('a');
      const name = $link.text().trim();
      const href = $link.attr('href');
      
      if (name && href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.gsmarena.com/${href}`;
        const slug = href.replace('.php', '').replace(/\.php\?.*$/, '').replace(/-/g, '_');
        
        results.push({
          name,
          url: fullUrl,
          gsmarenaId: slug
        });
      }
    });

    res.json(results);
  } catch (error) {
    console.error('GSMArena search error:', error.message);
    res.status(500).json({ error: 'Failed to search devices from GSMArena' });
  }
});

// Get device specifications from GSMArena
app.get('/api/gsmarena/specs/:gsmarenaId', async (req, res) => {
  try {
    const { gsmarenaId } = req.params;
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'Device URL is required' });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    const deviceName = $('h1.specs-phone-name-title').text().trim() || $('.headline').first().text().trim();
    const mainImage = $('div.pic-cell img').attr('src') || $('div.specs-front-image img').attr('src') || '';
    
    const specs = {
      name: deviceName,
      images: mainImage ? [mainImage] : [],
      specs: {}
    };

    $('.specs-list').each((i, table) => {
      const $table = $(table);
      const category = $table.attr('data-category') || `category_${i}`;
      const specsData = {};
      
      $table.find('tr').each((j, row) => {
        const $row = $(row);
        const key = $row.find('td.ttl').text().trim();
        const value = $row.find('td.nfo').text().trim();
        
        if (key && value) {
          specsData[key] = value;
        }
      });
      
      if (Object.keys(specsData).length > 0) {
        specs.specs[category] = specsData;
      }
    });

    const images = [];
    $('.specs-photo-gallery a').each((i, el) => {
      const imgSrc = $(el).attr('data-src') || $(el).find('img').attr('src');
      if (imgSrc) {
        images.push(imgSrc);
      }
    });
    
    if (images.length > 0) {
      specs.images = images;
    }

    res.json(specs);
  } catch (error) {
    console.error('GSMArena specs error:', error.message);
    res.status(500).json({ error: 'Failed to fetch device specifications from GSMArena' });
  }
});


// ===================== PAYMENTS API =====================

// Create payment (Customer)
app.post('/api/payments', async (req, res) => {
  try {
    const { ticket_id, payment_method, amount } = req.body;
    const normalizedMethod = String(payment_method || '').trim().toLowerCase();
    if (!ticket_id || !['card', 'netbanking'].includes(normalizedMethod)) {
      return res.status(400).json({ error: 'Invalid payment request' });
    }

    const ticket = await Ticket.findOne({ ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'PAYMENT_PENDING') {
      return res.status(400).json({ error: 'Payment is only allowed when ticket is Payment Pending' });
    }

    if (ticket.payment_status === 'PAID') {
      return res.status(409).json({ error: 'Payment already completed for this ticket' });
    }

    const payableAmount = Number(ticket.amount);
    const requestedAmount = Number(amount);
    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      return res.status(400).json({ error: 'Ticket does not have a valid payable amount' });
    }

    if (!Number.isFinite(requestedAmount) || requestedAmount !== payableAmount) {
      return res.status(400).json({ error: 'Payment amount mismatch' });
    }

    const existing = await Payment.findOne({ ticket_id, payment_status: { $in: ['Pending', 'Completed'] } });
    if (existing) {
      return res.status(409).json({ error: 'Payment already initiated for this ticket' });
    }

    const payment = new Payment({
      ticket_id,
      customer_id: ticket.customer_id,
      amount: payableAmount,
      payment_method: normalizedMethod,
      payment_status: 'Pending',
      created_at: new Date()
    });

    // Simulate payment success
    payment.payment_status = 'Completed';
    payment.transaction_id = Math.random().toString(36).slice(2, 12).toUpperCase();
    payment.paid_at = new Date();

    await payment.save();

    ticket.payment_status = 'PAID';
    ticket.status = 'RESOLVED';
    ticket.updated_at = new Date();
    await ticket.save();

    const update_id = generateUpdateId();
    const ticketUpdate = new TicketUpdate({
      update_id,
      ticket_id,
      updated_by: ticket.customer_id,
      updated_by_name: ticket.customer_name,
      update_type: 'status_change',
      update_message: 'Payment completed and ticket resolved',
      old_status: 'PAYMENT_PENDING',
      new_status: 'RESOLVED'
    });
    await ticketUpdate.save();
    await syncRepairRecordFromTicket({ ticket });

    res.status(201).json({
      message: 'Payment completed',
      payment: {
        payment_id: payment._id,
        ticket_id: payment.ticket_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        transaction_id: payment.transaction_id,
        paid_at: payment.paid_at
      },
      ticket
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ===================== TICKET MANAGEMENT API =====================

// Delete a ticket (Admin)
app.delete('/api/admin/tickets/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne({ ticket_id: id }).lean();
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await Promise.all([
      Ticket.deleteOne({ ticket_id: id }),
      TicketUpdate.deleteMany({ ticket_id: id }),
      RepairNote.deleteMany({ ticket_id: id }),
      Repair.deleteMany({ ticket_id: id }),
      Payment.deleteMany({ ticket_id: id }),
      Feedback.deleteMany({ ticket_id: id }),
      DeviceHealthLog.deleteMany({ ticket_id: id })
    ]);

    await logAuditEvent({
      user: req.user?.name || 'Admin',
      action: 'delete_ticket',
      target: id,
      command: 'DELETE /api/admin/tickets/:id',
      ip: req.ip,
      status: 'success'
    });

    res.json({ message: 'Ticket deleted', ticket_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Create a new ticket (Customer)
app.post('/api/tickets', async (req, res) => {
  try {
    const { 
      customer_id, 
      customer_name, 
      customer_email, 
      customer_phone,
      device_id,
      device_name,
      device_brand, 
      device_model, 
      issue_category, 
      issue_description, 
      urgency_level 
    } = req.body;

    // Validate required fields
    if (!customer_id || !customer_name || !customer_email || !device_brand || !device_model || !issue_category || !issue_description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique ticket ID
    const ticket_id = generateTicketId();

    // Create the ticket
    const ticket = new Ticket({
      ticket_id,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      device_id,
      device_name,
      device_brand,
      device_model,
      issue_category,
      issue_description,
      urgency_level: urgency_level || 'normal',
      status: 'OPEN'
    });

    await ticket.save();

    // Create initial ticket update record
    const update_id = generateUpdateId();
    const ticketUpdate = new TicketUpdate({
      update_id,
      ticket_id,
      updated_by: customer_id,
      updated_by_name: customer_name,
      update_type: 'created',
      update_message: 'Ticket created by customer',
      old_status: null,
      new_status: 'OPEN'
    });

    await ticketUpdate.save();
    await syncRepairRecordFromTicket({ ticket });

    res.status(201).json({ 
      message: 'Ticket created successfully', 
      ticket_id,
      ticket 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tickets (with optional filters)
app.get('/api/tickets', async (req, res) => {
  try {
    const { status, urgency_level, customer_id, assigned_technician_id } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (urgency_level) filter.urgency_level = urgency_level;
    if (customer_id) filter.customer_id = customer_id;
    if (assigned_technician_id) filter.assigned_technician_id = assigned_technician_id;

    const tickets = await Ticket.find(filter).sort({ created_at: -1 }).lean();
    const ticketIds = tickets.map((ticket) => ticket.ticket_id).filter(Boolean);
    const repairs = ticketIds.length
      ? await Repair.find({ ticket_id: { $in: ticketIds } }, { ticket_id: 1, cost: 1 }).lean()
      : [];
    const costByTicketId = new Map(repairs.map((repair) => [repair.ticket_id, repair.cost]));

    const enrichedTickets = tickets.map((ticket) => {
      const parsedAmount = Number(ticket.amount);
      const repairCost = costByTicketId.get(ticket.ticket_id);
      if (!Number.isFinite(parsedAmount) && Number.isFinite(Number(repairCost))) {
        return { ...ticket, amount: Number(repairCost) };
      }
      return ticket;
    });

    await reconcileTicketsWithPayments(enrichedTickets);

    res.json(enrichedTickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket by ID
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticket_id: req.params.id }).lean();
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const parsedAmount = Number(ticket.amount);
    if (!Number.isFinite(parsedAmount)) {
      const repair = await Repair.findOne({ ticket_id: ticket.ticket_id }, { cost: 1 }).lean();
      if (Number.isFinite(Number(repair?.cost))) {
        ticket.amount = Number(repair.cost);
      }
    }
    const [reconciledTicket] = await reconcileTicketsWithPayments([ticket]);
    res.json(reconciledTicket || ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept ticket (Technician)
app.put('/api/tickets/:id/accept', async (req, res) => {
  try {
    const { technician_id, technician_name } = req.body;
    const { id } = req.params;

    const ticket = await Ticket.findOne({ ticket_id: id });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'OPEN') {
      return res.status(400).json({ error: 'Ticket is not open' });
    }

    const oldStatus = ticket.status;
    
    // Update ticket
    ticket.status = 'ASSIGNED';
    ticket.assigned_technician_id = technician_id;
    ticket.assigned_technician_name = technician_name;
    ticket.updated_at = new Date();
    
    await ticket.save();

    // Create ticket update record
    const update_id = generateUpdateId();
    const ticketUpdate = new TicketUpdate({
      update_id,
      ticket_id: id,
      updated_by: technician_id,
      updated_by_name: technician_name,
      update_type: 'assigned',
      update_message: `Technician ${technician_name} accepted the ticket`,
      old_status: oldStatus,
      new_status: 'ASSIGNED'
    });

    await ticketUpdate.save();
    await syncRepairRecordFromTicket({ ticket });

    await logAuditEvent({
      user: technician_name || 'Technician',
      action: 'Ticket Accepted',
      target: id,
      command: 'PUT /api/tickets/:id/accept',
      ip: req.ip,
      status: 'success'
    });

    res.json({ 
      message: 'Ticket accepted successfully', 
      ticket 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket status
app.put('/api/tickets/:id/status', async (req, res) => {
  try {
    const { status, technician_id, technician_name, message } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'PAYMENT_PENDING'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await Ticket.findOne({ ticket_id: id });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const oldStatus = ticket.status;

    if (status === 'PAYMENT_PENDING') {
      const ticketAmount = Number(ticket.amount);
      if (!Number.isFinite(ticketAmount) || ticketAmount <= 0) {
        return res.status(400).json({ error: 'Add a repair cost before setting Payment Pending.' });
      }
      ticket.payment_status = 'PENDING';
    }
    
    // Update ticket
    ticket.status = status;
    if (technician_id) ticket.assigned_technician_id = technician_id;
    if (technician_name) ticket.assigned_technician_name = technician_name;
    ticket.updated_at = new Date();
    
    await ticket.save();

    // Create ticket update record
    const update_id = generateUpdateId();
    const ticketUpdate = new TicketUpdate({
      update_id,
      ticket_id: id,
      updated_by: technician_id,
      updated_by_name: technician_name || 'System',
      update_type: 'status_change',
      update_message: message || `Status changed from ${oldStatus} to ${status}`,
      old_status: oldStatus,
      new_status: status
    });

    await ticketUpdate.save();
    await syncRepairRecordFromTicket({ ticket });

    await logAuditEvent({
      user: technician_name || 'Technician',
      action: 'Ticket Status Updated',
      target: id,
      command: oldStatus + ' -> ' + status,
      ip: req.ip,
      status: 'success'
    });

    res.json({ 
      message: 'Ticket status updated successfully', 
      ticket 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Undo last ticket status change (Technician)
app.put('/api/tickets/:id/undo-status', async (req, res) => {
  try {
    const { technician_id, technician_name } = req.body;
    const { id } = req.params;

    if (!technician_id) {
      return res.status(403).json({ error: 'Technician authorization required' });
    }

    const ticket = await Ticket.findOne({ ticket_id: id });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.payment_status === 'PAID') {
      return res.status(400).json({ error: 'Payment is completed. Status cannot be undone.' });
    }

    const lastUpdate = await TicketUpdate.findOne({ ticket_id: id, update_type: 'status_change' })
      .sort({ created_at: -1 })
      .lean();

    if (!lastUpdate || !lastUpdate.old_status) {
      return res.status(400).json({ error: 'No status change to undo' });
    }

    const currentStatus = ticket.status;
    const previousStatus = lastUpdate.old_status;

    ticket.status = previousStatus;
    ticket.updated_at = new Date();
    await ticket.save();

    const update_id = generateUpdateId();
    const ticketUpdate = new TicketUpdate({
      update_id,
      ticket_id: id,
      updated_by: technician_id,
      updated_by_name: technician_name || 'Technician',
      update_type: 'status_change',
      update_message: `Status reverted from ${currentStatus} to ${previousStatus}`,
      old_status: currentStatus,
      new_status: previousStatus
    });

    await ticketUpdate.save();
    await syncRepairRecordFromTicket({ ticket });

    await logAuditEvent({
      user: technician_name || 'Technician',
      action: 'Ticket Status Undone',
      target: id,
      command: currentStatus + ' -> ' + previousStatus,
      ip: req.ip,
      status: 'success'
    });

    res.json({ message: 'Ticket status reverted', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Resolve ticket with repair cost (Technician)
app.put('/api/tickets/:id/resolve', async (req, res) => {
  try {
    const { amount, technician_id, technician_name } = req.body;
    const { id } = req.params;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const ticket = await Ticket.findOne({ ticket_id: id });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (!['IN_PROGRESS', 'ASSIGNED', 'RESOLVED'].includes(ticket.status)) {
      return res.status(400).json({ error: 'Ticket must be in progress or resolved to set payment' });
    }

    const oldStatus = ticket.status;
    ticket.status = 'PAYMENT_PENDING';
    ticket.amount = numericAmount;
    ticket.payment_status = 'PENDING';
    if (technician_id) ticket.assigned_technician_id = technician_id;
    if (technician_name) ticket.assigned_technician_name = technician_name;
    ticket.updated_at = new Date();
    await ticket.save();

    const update_id = generateUpdateId();
    const ticketUpdate = new TicketUpdate({
      update_id,
      ticket_id: id,
      updated_by: technician_id,
      updated_by_name: technician_name || 'Technician',
      update_type: 'status_change',
      update_message: `Ticket resolved. Payment requested: ${numericAmount}`,
      old_status: oldStatus,
      new_status: 'PAYMENT_PENDING'
    });
    await ticketUpdate.save();
    await syncRepairRecordFromTicket({ ticket });

    await logAuditEvent({
      user: technician_name || 'Technician',
      action: 'Ticket Resolved - Payment Pending',
      target: id,
      command: `PUT /api/tickets/${id}/resolve`,
      ip: req.ip,
      status: 'success'
    });

    res.json({ message: 'Ticket marked as payment pending', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Add repair note
app.post('/api/tickets/:id/notes', async (req, res) => {
  try {
    const { 
      technician_id, 
      technician_name, 
      diagnosis_summary, 
      actions_taken, 
      commands_executed, 
      firmware_used,
      repair_status 
    } = req.body;
    const { id } = req.params;

    const ticket = await Ticket.findOne({ ticket_id: id });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (technician_id) ticket.assigned_technician_id = technician_id;
    if (technician_name) ticket.assigned_technician_name = technician_name;
    ticket.updated_at = new Date();
    if (repair_status === 'completed') {
      ticket.status = 'RESOLVED';
    } else if (ticket.status === 'ASSIGNED') {
      ticket.status = 'IN_PROGRESS';
    }
    await ticket.save();

    // Generate repair ID
    const repair_id = generateRepairId();

    // Create repair note
    const repairNote = new RepairNote({
      repair_id,
      ticket_id: id,
      technician_id,
      technician_name,
      diagnosis_summary,
      actions_taken,
      commands_executed,
      firmware_used,
      repair_status: repair_status || 'in_progress'
    });

    await repairNote.save();

    // Create ticket update record
    const update_id = generateUpdateId();
    const ticketUpdate = new TicketUpdate({
      update_id,
      ticket_id: id,
      updated_by: technician_id,
      updated_by_name: technician_name,
      update_type: 'repair_note',
      update_message: diagnosis_summary || 'Repair note added'
    });

    await ticketUpdate.save();
    await syncRepairRecordFromTicket({ ticket, repairNote });

    await logAuditEvent({
      user: technician_name || 'Technician',
      action: 'Repair Note Added',
      target: id,
      command: commands_executed || actions_taken || diagnosis_summary || 'Repair note update',
      ip: req.ip,
      status: repair_status === 'failed' ? 'warning' : 'success'
    });

    res.status(201).json({ 
      message: 'Repair note added successfully', 
      repair_note: repairNote 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket history/updates
app.get('/api/tickets/:id/updates', async (req, res) => {
  try {
    const { id } = req.params;

    const updates = await TicketUpdate.find({ ticket_id: id }).sort({ created_at: -1 });
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get repair notes for a ticket
app.get('/api/tickets/:id/repair-notes', async (req, res) => {
  try {
    const { id } = req.params;

    const repairNotes = await RepairNote.find({ ticket_id: id }).sort({ created_at: -1 });
    res.json(repairNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tickets/:id/live-status', async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOne({ ticket_id: id }).lean();
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const [updates, repairNotes, feedback] = await Promise.all([
      TicketUpdate.find({ ticket_id: id }).sort({ created_at: -1 }).lean(),
      RepairNote.find({ ticket_id: id }).sort({ created_at: -1 }).lean(),
      Feedback.find({ ticket_id: id }).sort({ createdAt: -1 }).lean()
    ]);

    const progressByStatus = {
      OPEN: 10,
      ASSIGNED: 25,
      IN_PROGRESS: 60,
      PAYMENT_PENDING: 90,
      RESOLVED: 100
    };

    const progress = progressByStatus[ticket.status] || 0;
    const latestNote = repairNotes[0] || null;
    const latestUpdate = updates[0] || null;

    res.json({
      ticket,
      updates,
      repairNotes,
      feedback,
      progress,
      currentAction: latestNote?.actions_taken || latestNote?.diagnosis_summary || latestUpdate?.update_message || 'Waiting for technician update',
      latestDiagnosis: latestNote?.diagnosis_summary || '',
      selectedDevice: {
        id: ticket.device_id || '',
        name: ticket.device_name || '',
        brand: ticket.device_brand || '',
        model: ticket.device_model || ''
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/device-health', async (req, res) => {
  try {
    const payload = {
      device_id: String(req.body.device_id || '').trim(),
      ticket_id: String(req.body.ticket_id || '').trim() || undefined,
      battery_health: roundMetric(req.body.battery_health),
      battery_temperature: roundMetric(req.body.battery_temperature),
      storage_total: roundMetric(req.body.storage_total),
      storage_used: roundMetric(req.body.storage_used),
      ram_total: roundMetric(req.body.ram_total),
      ram_used: roundMetric(req.body.ram_used),
      cpu_usage: roundMetric(req.body.cpu_usage),
      device_temperature: roundMetric(req.body.device_temperature),
      created_at: req.body.created_at ? new Date(req.body.created_at) : new Date()
    };

    if (!payload.device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const deviceHealthLog = await DeviceHealthLog.create(payload);

    await logAuditEvent({
      user: req.body.technician_name || 'Technician',
      action: 'Device Health Logged',
      target: payload.device_id,
      command: payload.ticket_id ? ('Ticket ' + payload.ticket_id) : 'Manual diagnostic scan',
      ip: req.ip,
      status: 'success'
    });

    res.status(201).json({
      message: 'Device health log stored successfully',
      log: formatDeviceHealthLog(deviceHealthLog.toObject())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/device-health/ticket/:ticket_id', async (req, res) => {
  try {
    const logs = await DeviceHealthLog.find({ ticket_id: req.params.ticket_id }).sort({ created_at: 1 }).lean();
    res.json({
      ticket_id: req.params.ticket_id,
      count: logs.length,
      logs: logs.map(formatDeviceHealthLog)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/device-health/:device_id', async (req, res) => {
  try {
    const logs = await DeviceHealthLog.find({ device_id: req.params.device_id }).sort({ created_at: 1 }).lean();
    const latest = logs[logs.length - 1] || null;

    res.json({
      device_id: req.params.device_id,
      count: logs.length,
      latest: latest ? formatDeviceHealthLog(latest) : null,
      logs: logs.map(formatDeviceHealthLog),
      insights: buildDeviceHealthInsights(logs)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tickets for a specific technician
app.get('/api/tickets/technician/:technicianId', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const { status } = req.query;
    
    const filter = { assigned_technician_id: technicianId };
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter).sort({ created_at: -1 }).lean();
    const ticketIds = tickets.map((ticket) => ticket.ticket_id).filter(Boolean);
    const repairs = ticketIds.length
      ? await Repair.find({ ticket_id: { $in: ticketIds } }, { ticket_id: 1, cost: 1 }).lean()
      : [];
    const costByTicketId = new Map(repairs.map((repair) => [repair.ticket_id, repair.cost]));

    const enrichedTickets = tickets.map((ticket) => {
      const parsedAmount = Number(ticket.amount);
      const repairCost = costByTicketId.get(ticket.ticket_id);
      if (!Number.isFinite(parsedAmount) && Number.isFinite(Number(repairCost))) {
        return { ...ticket, amount: Number(repairCost) };
      }
      return ticket;
    });

    await reconcileTicketsWithPayments(enrichedTickets);

    res.json(enrichedTickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket statistics
app.get('/api/tickets/stats', async (req, res) => {
  try {
    const total = await Ticket.countDocuments();
    const open = await Ticket.countDocuments({ status: 'OPEN' });
    const assigned = await Ticket.countDocuments({ status: 'ASSIGNED' });
    const inProgress = await Ticket.countDocuments({ status: 'IN_PROGRESS' });
    const resolved = await Ticket.countDocuments({ status: 'RESOLVED' });
    
    const highUrgency = await Ticket.countDocuments({ urgency_level: 'high', status: { $ne: 'RESOLVED' } });
    
    res.json({
      total,
      open,
      assigned,
      inProgress,
      resolved,
      highUrgency,
      completionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`RADS Server running on port ${PORT}`);
});











































