function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Session expired. Please login again.';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid authentication token';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate record already exists';
  } else if (err.name === 'MulterError') {
    status = 400;
  } else if (typeof err.message === 'string' && err.message.startsWith('Unsupported file type')) {
    status = 400;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('API error:', {
      status,
      message,
      stack: err.stack,
    });
  }

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : message,
  });
}

module.exports = { notFound, errorHandler };
