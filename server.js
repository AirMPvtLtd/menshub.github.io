require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');

// Import routes
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const communityRoutes = require('./routes/communityRoutes');
const documentRoutes = require('./routes/documentRoutes');
const supportRoutes = require('./routes/supportRoutes');

// Initialize app
const app = express();

// Database connection
require('./config/db');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/support', supportRoutes);

// Error handling middleware
app.use(require('./middleware/error'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
