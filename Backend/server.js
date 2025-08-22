// server.js
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const authRoutes = require('./routes/authRoute')


// Load environment variables FIRST - use only ONE method
require('dotenv').config();

console.log('=== Startup Debug ===');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('✓ dotenv.config() called');

// Check if environment variables are loaded
console.log('=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'UNDEFINED');
console.log('PORT:', process.env.PORT || 'UNDEFINED');
console.log('Total env vars:', Object.keys(process.env).length);

// Check Cloudinary environment variables
const cloudinaryVars = Object.keys(process.env).filter(k => k.includes('CLOUDINARY'));
console.log('Cloudinary vars found:', cloudinaryVars.length);
cloudinaryVars.forEach(key => {
  console.log(`${key}: ${process.env[key] ? 'SET ✓' : 'MISSING ✗'}`);
});

// Configure Cloudinary
console.log('=== Cloudinary Configuration ===');
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  console.log('✓ Cloudinary configured successfully');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set ✓' : 'Missing ✗');
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set ✓' : 'Missing ✗');
  
  // Test connection
  cloudinary.api.ping()
    .then(() => console.log('✓ Cloudinary connection successful'))
    .catch(err => {
      console.error('✗ Cloudinary connection failed:');
      console.error('Error:', err.message);
      console.error('HTTP Code:', err.http_code);
    });
} else {
  console.error('✗ Cloudinary configuration incomplete');
  console.log('Missing variables:');
  if (!process.env.CLOUDINARY_CLOUD_NAME) console.log('  - CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) console.log('  - CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) console.log('  - CLOUDINARY_API_SECRET');
}

// Connect to database
connectDB();

const app = express();

// === CORS setup ===
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(s => s.trim());

function originChecker(origin, callback) {
  if (!origin) return callback(null, true);
  if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
  return callback(new Error('CORS: origin not allowed'));
}

app.use(cors({
  origin: originChecker,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Create HTTP server and initialize socket
const server = http.createServer(app);
const { init } = require('./socket/index');
const io = init(server);

console.log('[server] socket.io initialized');

// Inject io into req for controllers
app.use((req, res, next) => { req.io = io; next(); });

// Mount routes
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');
const requestRoutes = require('./routes/requestRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const progressRoutes = require('./routes/progressRoute')

app.get('/', (req, res) => res.send('SkillSwap is live'));

app.use('/users', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes)
app.use("/api/progress", progressRoutes);


// Test endpoint for Cloudinary
app.get('/test-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({ 
      message: 'Cloudinary connected successfully', 
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      status: 'OK',
      result: result
    });
  } catch (error) {
    console.error('Cloudinary test endpoint failed:', error);
    res.status(500).json({ 
      message: 'Cloudinary connection failed', 
      error: error.message,
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
      }
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[server] error:', err.message || err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ message: 'CORS error: origin not allowed' });
  }
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`=== Server Started ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Test Cloudinary at: http://localhost:${PORT}/test-cloudinary`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});