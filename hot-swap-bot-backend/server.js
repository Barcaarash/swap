const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import routes
const walletRoutes = require('./routes/walletRoutes');
const tradingRoutes = require('./routes/tradingRoutes');
const priceRoutes = require('./routes/priceRoutes');

// Import trading scheduler
const { initScheduler } = require('./services/tradingScheduler');

// Import logger
const logger = require('./utils/logger');

// Ensure config directory exists
const configDir = path.join(__dirname, '../config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  logger.info('Config directory created');
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/wallets', walletRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/price', priceRoutes);

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  // Initialize trading scheduler
  initScheduler();
}); 