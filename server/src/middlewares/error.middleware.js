import logger from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

export default errorMiddleware;
