import './config/db.js'; // initializes pool + tests connection
import { PORT } from './config/env.js';
import app from './app.js';
import logger from './utils/logger.js';

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
