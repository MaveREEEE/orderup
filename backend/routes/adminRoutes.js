'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const adminRouter = express.Router();

const { getAdminProfile } = require('../../controllers/adminController');

// Other routes... 

adminRouter.get('/profile', authMiddleware, getAdminProfile);

module.exports = adminRouter;
