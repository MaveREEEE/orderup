'use strict';

import adminModel from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// Existing functions
const createToken = () => {...}; // Assuming this exists
const registerAdmin = async (req, res) => {...}; // Assuming this exists
const loginAdmin = async (req, res) => {...}; // Assuming this exists

const getAdminProfile = async (req, res) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.json({ success: false, message: "Not Authorized" });
        }
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await adminModel.findById(token_decode.id).select('-password');
        
        if (!admin) {
            return res.json({ success: false, message: "Admin not found" });
        }
        
        res.json({ 
            success: true, 
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                isActive: admin.isActive
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching admin profile" });
    }
};

// Keeping existing functions: listAdmins, updateAdmin, deleteAdmin, getAdminById
const listAdmins = async (req, res) => {...}; // Existing function
const updateAdmin = async (req, res) => {...}; // Existing function
const deleteAdmin = async (req, res) => {...}; // Existing function
const getAdminById = async (req, res) => {...}; // Existing function

// Update exports
export { 
  registerAdmin, 
  loginAdmin, 
  getAdminProfile,
  listAdmins, 
  updateAdmin, 
  deleteAdmin,
  getAdminById
};