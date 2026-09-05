require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const collegeRoutes = require('./routes/colleges');
const programRoutes = require('./routes/programs');
const applicationRoutes = require('./routes/applications');
const documentRoutes = require('./routes/documents');
const paymentRoutes = require('./routes/payments');
const taskRoutes = require('./routes/tasks');
const communicationRoutes = require('./routes/communications');
const attendanceRoutes = require('./routes/attendance');
const analyticsRoutes = require('./routes/analytics');
const portalRoutes = require('./routes/portal');
const deletionRequestRoutes = require('./routes/deletionRequests');
const adCampaignRoutes = require('./routes/adCampaigns');
const feesRoutes = require('./src/modules/fees/routes');

const app = express();

// Trust the first proxy hop (Render/Heroku/behind a load balancer) so
// secure cookies and req.ip work correctly.
app.set('trust proxy', 1);

// --- Security & core middleware -------------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // allow uploaded files to load cross-origin from the client dev server

// Vite auto-bumps to the next free port (5174, 5175, ...) whenever
// something else — another project, a stray process — is already holding
// 5173, silently breaking a CORS config hardcoded to one exact origin (the
// browser gets no usable error, just a blocked/failed request). In dev,
// accept a small range of localhost ports instead of just CLIENT_URL;
// production stays locked to the exact configured origin.
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = new Set([process.env.CLIENT_URL || 'http://localhost:5173']);
if (!isProd) {
  for (let port = 5173; port <= 5183; port++) allowedOrigins.add(`http://localhost:${port}`);
}
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' })); // generous enough for full CRM profile updates (education history, test scores, etc.)
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from req.body/query/params to prevent NoSQL injection
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(generalLimiter);

// Uploaded documents (Phase 1: local disk storage — see middleware/upload.js)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes -----------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/deletion-requests', deletionRequestRoutes);
app.use('/api/ad-campaigns', adCampaignRoutes);
app.use('/api/fees', feesRoutes);

// --- Error handling (must be last) -------------------------------------------------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`CanadaDigitoba API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

start();

module.exports = app;
