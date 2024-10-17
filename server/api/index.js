const express = require('express');
const router = express.Router();

// Import your project routes here
const projects = require('./projects');

// Use the project routes
router.use('/projects', projects);

module.exports = router;
