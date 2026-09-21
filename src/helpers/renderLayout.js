const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

// Simple layout wrapper for EJS
module.exports = function renderWithLayout(res, view, data = {}) {
  const viewPath = path.join(__dirname, '..', 'views', view + '.ejs');
  const layoutPath = path.join(__dirname, '..', 'views', 'layout.ejs');
  
  ejs.renderFile(viewPath, { ...data, ...res.locals }, {}, (err, body) => {
    if (err) {
      console.error('View render error:', err);
      return res.status(500).send('View error: ' + err.message);
    }
    ejs.renderFile(layoutPath, { ...data, ...res.locals, body }, {}, (err2, html) => {
      if (err2) return res.status(500).send('Layout error: ' + err2.message);
      res.send(html);
    });
  });
};
