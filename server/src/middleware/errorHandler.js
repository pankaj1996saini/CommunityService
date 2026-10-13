const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ message: `Nothing here: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // our own errors
  if (err.status) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }

  // mongoose schema validation
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.values(err.errors).forEach((e) => (errors[e.path] = e.message));
    return res.status(400).json({ message: Object.values(errors)[0] || 'Invalid data', errors });
  }

  // bad ObjectId in the URL
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'That id does not look right' });
  }

  // unique index (email, mostly)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ message: `That ${field} is already in use`, errors: { [field]: 'Already in use' } });
  }

  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Each image must be 5 MB or smaller'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Too many images, the limit is 4'
        : err.message;
    return res.status(400).json({ message: msg });
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side' });
}

module.exports = { notFound, errorHandler };
