const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notifications.routes');
const padadhikariRoutes = require('./routes/padadhikari.routes');
const posterRoutes = require('./routes/poster.routes');
const reelsRoutes = require('./routes/reels.routes');
const trainingRoutes = require('./routes/videos.routes');
const stampPadRoutes = require('./routes/stamppad.routes');
const idCardRoutes = require('./routes/idcard.routes');
const homeRoutes = require('./routes/home.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || '*').split(',').map((item) => item.trim());

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/padadhikari', padadhikariRoutes);
app.use('/api/poster', posterRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/training-videos', trainingRoutes);
app.use('/api/stamp-pad', stampPadRoutes);
app.use('/api/id-card', idCardRoutes);
app.use('/api/verify', idCardRoutes);
app.use('/api/home', homeRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
