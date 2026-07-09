const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { run: initDb } = require('./src/db/init');
const { getSettingsMap } = require('./src/db/queries');
const SqliteSessionStore = require('./src/db/sessionStore');
const fmt = require('./src/utils/format');
const publicRouter = require('./src/routes/public');
const adminRouter = require('./src/routes/admin');

// Dam bao database va tai khoan admin da san sang truoc khi server nhan request
initDb();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://*.googleapis.com', 'https://*.gstatic.com', 'https://*.ggpht.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      frameSrc: ["'self'", 'https://www.google.com'],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SqliteSessionStore(),
  secret: process.env.SESSION_SECRET || 'insecure-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8, // 8 gio
  },
}));

// Gioi han so lan submit form de chong spam
const formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });

app.use((req, res, next) => {
  res.locals.settings = getSettingsMap();
  res.locals.currentPath = req.path;
  res.locals.fmt = fmt;
  next();
});

app.use('/lien-he', formLimiter);
app.use('/admin/login', loginLimiter);

app.use('/', publicRouter);
app.use('/admin', adminRouter);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render('error', {
    title: 'Đã có lỗi xảy ra',
    message: isProd ? 'Đã có lỗi xảy ra, vui lòng thử lại sau.' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Cozy House website dang chay tai http://localhost:${PORT}`);
});
