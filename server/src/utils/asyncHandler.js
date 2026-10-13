// Express 4 doesn't catch rejected promises on its own, so wrap every async handler.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
