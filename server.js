const express = require('express');
const forceSSL = require('express-force-ssl');
const hsts = require('hsts');
const morgan = require('morgan');
const serveStatic = require('serve-static');
const path = require('path');


const app = express();

// Trust the X-Forwarded-Proto header. If this isn't enabled, Heroku will enter
// an infinite redirect loop.
app.set('forceSSLOptions', { trustXFPHeader: true });

// Log requests
app.use(morgan('common'));

// Permanently redirect from HTTP to HTTPS and add the HSTS header
app.use(forceSSL);
app.use(hsts());

// Serve the static site
app.use(serveStatic(path.join(__dirname, 'static')));

// Listen on port process.env.PORT
app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}...`);
});
