require('dotenv').config();
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const ejs = require('ejs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const pgSession = require('connect-pg-simple')(session);
const pool = require('./config/db');

// Session Store (Persistent in Neon Postgres)
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'mandir-erp-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
};

// Inject user + layout renderer
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
    templeName: req.session.templeName || 'Shri Mandir Trust',
  } : null;

  const originalRender = res.render.bind(res);

  res.render = function(view, data = {}, callback) {
    const standAloneViews = [
      'auth/login', 'auth/signup',
      'staff/salary-slip', 'donations/receipt', 'pooja/slip'
    ];
    if (standAloneViews.includes(view)) {
      return originalRender(view, { ...res.locals, ...data }, callback);
    }
    const viewPath = path.join(__dirname, '..', 'views', view + '.ejs');
    const layoutPath = path.join(__dirname, '..', 'views', 'layout.ejs');
    const locals = { ...res.locals, ...data };

    ejs.renderFile(viewPath, locals, {}, (err, body) => {
      if (err) return res.status(500).send('<pre style="color:red">' + err.message + '</pre>');
      ejs.renderFile(layoutPath, { ...locals, body }, {}, (err2, html) => {
        if (err2) return res.status(500).send('<pre style="color:red">' + err2.message + '</pre>');
        res.send(html);
      });
    });
  };
  next();
});

// Public routes (no auth)
app.use('/auth', require('./routes/auth'));

// Protected routes
app.use('/', requireAuth, require('./routes/dashboard'));
app.use('/staff', requireAuth, require('./routes/staff'));
app.use('/donations', requireAuth, require('./routes/donations'));
app.use('/inventory', requireAuth, require('./routes/inventory'));
app.use('/expenses', requireAuth, require('./routes/expenses'));
app.use('/pooja', requireAuth, require('./routes/pooja'));
app.use('/reports', requireAuth, require('./routes/reports'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found', title: '404 — Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: err.message, title: 'Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Mandir ERP running at http://localhost:${PORT}`);
    console.log(`🔐 Login:       http://localhost:${PORT}/auth/login`);
    console.log(`📝 Signup:      http://localhost:${PORT}/auth/signup`);
    console.log(`📊 Dashboard:   http://localhost:${PORT}/\n`);
  });
}

module.exports = app;
