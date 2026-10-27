const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? 'Internal server error'
        : err.message || 'Request failed',
  });
};

export default errorHandler;
