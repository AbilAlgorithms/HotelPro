// Wrap async handlers so rejected promises reach the error middleware (Express 4).
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier supplied.'; }
  else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = field === 'email' ? 'An account with this email already exists.' : field === 'roomNumber' ? 'A room with this number already exists.' : `Duplicate ${field}.`;
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 2 MB or smaller.' : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can upload at most 5 images.' : err.message;
  } else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON body.'; }

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${err.stack || err}`);
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong on the server.';
  }
  const body = { message };
  if (process.env.NODE_ENV !== 'production' && status >= 500) body.stack = err.stack;
  res.status(status).json(body);
};

module.exports = { asyncHandler, notFound, errorHandler };
