class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // optional { field: 'message' } map for forms
  }
}

module.exports = HttpError;
