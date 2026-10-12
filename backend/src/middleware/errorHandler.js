// Centralized error handler
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // If it's a validation error, we might want to send 400
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Validation Error',
      message: message
    });
  }

  res.status(statusCode).json({
    error: message,
    // Don't send stack trace in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

export default errorHandler;