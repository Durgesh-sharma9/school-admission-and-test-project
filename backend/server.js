const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Force local .env configurations to override system environment variables
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  dotenv.config();
}
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const localityRoutes = require('./routes/localityRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const otpRoutes = require('./routes/otpRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const planRoutes = require('./routes/planRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const collegeRoutes = require('./routes/collegeRoutes');

const SuperAdmin = require('./models/SuperAdmin');

// Auto-seed default Super Admin on server startup if not present
const initSuperAdmin = async () => {
  try {
    const adminEmail = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@crm.com').trim().toLowerCase();
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin@08afupc4';
    const existing = await SuperAdmin.findOne({ email: adminEmail });
    if (!existing) {
      await SuperAdmin.create({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'super-admin',
        isActive: true,
      });
      console.log(`[SEED] Super Admin auto-initialized: ${adminEmail}`);
    } else {
      console.log(`[SEED] Super Admin verified: ${adminEmail}`);
    }
  } catch (err) {
    console.error('[SEED] Super Admin check/init error:', err.message);
  }
};

// Connect to Database
connectDB().then(() => {
  initSuperAdmin();
});

const app = express();

// Enable Trust Proxy for reverse proxy hosting (Nginx, Vercel, Render, Heroku, AWS)
app.set('trust proxy', 1);

// Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.warn(`[WARNING] Missing critical environment variables: ${missingEnvVars.join(', ')}`);
}

// Production & Development CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''))
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    const isRenderApp = normalizedOrigin.endsWith('.onrender.com');
    const isLocalhost = normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1');
    const isExplicitlyAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin);

    if (isExplicitlyAllowed || isRenderApp || isLocalhost || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests for all endpoints
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded files with CORS enabled for canvas capture
app.use('/uploads', cors(), express.static(path.join(__dirname, 'public/uploads')));

// Normalize accidental double /api prefixes from misconfigured proxies or baseURLs (e.g. /api/api/v1/...)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api\//, '/api/');
  }
  next();
});

// Routes (supports both /api/v1 and /api aliases)
app.use(['/api/v1/auth', '/api/auth'], authRoutes);
app.use(['/api/v1/auth', '/api/auth'], googleAuthRoutes);
app.use(['/api/v1/otp', '/api/otp'], otpRoutes);
app.use('/api/v1/enquiries', enquiryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/localities', localityRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1', announcementRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/plans', planRoutes); // Fallback alias
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/college', collegeRoutes);

// Root & Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'Campus CRM API',
    status: 'online',
    message: 'Campus CRM API is running smoothly 🚀',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Campus CRM API is running' });
});

// Fallback for page not found
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
