// 404 handler for unmatched routes
function notFound(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
}

export default notFound;