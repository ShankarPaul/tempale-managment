require('dotenv').config();
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const ejs = require('ejs');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Netlify, Render, Heroku)
app.set('trust proxy', 1);

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
    tableName: 'session'
  }),
  name: 'mandir.sid',
  secret: process.env.SESSION_SECRET || 'mandir-erp-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    sameSite: 'lax',
    secure: 'auto'
  }
}));

const fs = require('fs');

// Dynamic views directory resolver for local and serverless (Netlify/AWS Lambda)
function findViewsDir() {
  const candidates = [
    path.join(process.cwd(), 'views'),
    path.join(__dirname, '..', 'views'),
    path.join(__dirname, 'views'),
    path.join(__dirname, '..', '..', 'views'),
    path.join('/var/task', 'views'),
    path.join('/var/task', 'netlify', 'views'),
    path.join('/var/task', 'netlify', 'functions', 'views'),
    path.resolve('views')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch(e) {}
  }
  return path.join(process.cwd(), 'views');
}

// View engine
app.set('view engine', 'ejs');
app.set('views', findViewsDir());

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
    const currentViewsDir = findViewsDir();
    const standAloneViews = [
      'auth/login', 'auth/signup',
      'staff/salary-slip', 'donations/receipt', 'pooja/slip'
    ];

    if (standAloneViews.includes(view)) {
      const singleViewPath = path.join(currentViewsDir, view + '.ejs');
      if (fs.existsSync(singleViewPath)) {
        return ejs.renderFile(singleViewPath, { ...res.locals, ...data }, {}, (err, html) => {
          if (err) return res.status(500).send('<pre style="color:red">' + err.message + '</pre>');
          res.send(html);
        });
      }
      return originalRender(view, { ...res.locals, ...data }, callback);
    }

    const viewPath = path.join(currentViewsDir, view + '.ejs');
    const layoutPath = path.join(currentViewsDir, 'layout.ejs');
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
  const currentViewsDir = findViewsDir();
  if (fs.existsSync(path.join(currentViewsDir, 'error.ejs'))) {
    res.status(404).render('error', { message: 'Page not found', title: '404 — Not Found' });
  } else {
    res.status(404).send('<h1>404 — Not Found</h1><p>The requested page does not exist.</p>');
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const currentViewsDir = findViewsDir();
  if (fs.existsSync(path.join(currentViewsDir, 'error.ejs'))) {
    res.status(500).render('error', { message: err.message, title: 'Server Error' });
  } else {
    res.status(500).send(`<h1>Server Error</h1><p>${err.message}</p>`);
  }
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
