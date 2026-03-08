const jwt = require('jsonwebtoken');

require('dotenv').config();

const adminauthenticate = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; 

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; 

    
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        next(); 
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

module.exports = adminauthenticate;
