import jwt from "jsonwebtoken"
import adminModel from "../models/adminModel.js"

// Check if user has required role
export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.json({ success: false, message: "Not Authorized" })
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find admin user
      const admin = await adminModel.findById(decoded.id);
      
      if (!admin) {
        return res.json({ success: false, message: "Admin not found" })
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.json({ success: false, message: "Account is inactive" })
      }

      // Check if admin's role is in allowedRoles
      if (!allowedRoles.includes(admin.role)) {
        return res.json({ 
          success: false, 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        })
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Authorization error" })
    }
  }
}

// Check if user has specific permission
export const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.json({ success: false, message: "Not Authorized" })
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await adminModel.findById(decoded.id);
      
      if (!admin) {
        return res.json({ success: false, message: "Admin not found" })
      }

      // Superadmin always has all permissions
      if (admin.role === 'superadmin') {
        req.admin = admin;
        return next();
      }

      // Check specific permission
      if (!admin.permissions || !admin.permissions[permission]) {
        return res.json({ 
          success: false, 
          message: `Permission denied: ${permission} required` 
        })
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Authorization error" })
    }
  }
}