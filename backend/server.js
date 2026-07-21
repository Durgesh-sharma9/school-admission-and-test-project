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

// Connect to Database
connectDB();

const app = express();

// Middleware
// Rate Limiter configuration ready (e.g. npm install express-rate-limit)
// const rateLimit = require('express-rate-limit');
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests from this IP' });
// app.use('/api/', limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files with CORS enabled for canvas capture
app.use('/uploads', cors(), express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', googleAuthRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/enquiries', enquiryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/localities', localityRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1', announcementRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/payment', paymentRoutes);

// Root Check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'School Admission CRM API is running' });
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
