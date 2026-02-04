const jwt = require('jsonwebtoken');

// Existing code...

// Change on line 53-57
const token = jwt.sign({
    id: user.id,
    email: user.email,
    role: admin.role // Updated to include role in JWT payload
}, process.env.JWT_SECRET, { expiresIn: '1h' });

// More existing code...

// Around line 95, when issuing customer tokens
const customerToken = jwt.sign({
    id: user.id,
    email: user.email,
    role: 'customer' // Added role for customer tokens
}, process.env.JWT_SECRET, { expiresIn: '1h' });

// Existing code...