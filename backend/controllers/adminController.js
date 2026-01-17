import adminModel from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// Create token
const createToken = (id, role) => {
    return jwt.sign({ id, role, type: "admin" }, process.env.JWT_SECRET);
};

// Register admin
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role, permissions, isActive } = req.body
    const exists = await adminModel.findOne({ email })
    if (exists) return res.json({ success: false, message: "Admin already exists" })
    const hash = await bcrypt.hash(password, 10)
    const admin = new adminModel({
      name,
      email,
      password: hash,
      role: role || "staff",
      permissions: permissions || {},
      isActive: isActive !== undefined ? isActive : true
    })
    await admin.save()
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: "Error creating admin" })
  }
};

// Login admin
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await adminModel.findOne({ email });

        if (!admin) {
            return res.json({ success: false, message: "Admin doesn't exist" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(admin._id, admin.role);
        res.json({ 
            success: true, 
            token,
            userType: 'admin',
            role: admin.role,
            name: admin.name,
            message: "Login successful"
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error logging in" });
    }
};

// List all admins
const listAdmins = async (req, res) => {
    try {
        const admins = await adminModel.find({}).select('-password');
        res.json({ success: true, data: admins });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching admins" });
    }
};

// Get single admin by ID
const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await adminModel.findById(id).select('-password');
        
        if (!admin) {
            return res.json({ success: false, message: "Admin not found" });
        }
        
        res.json({ success: true, data: admin });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching admin" });
    }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, password, role, permissions, isActive } = req.body
    const admin = await adminModel.findById(id)
    if (!admin) return res.json({ success: false, message: "Admin not found" })
    admin.name = name || admin.name
    admin.email = email || admin.email
    admin.role = role || admin.role
    admin.permissions = permissions || admin.permissions
    admin.isActive = isActive !== undefined ? isActive : admin.isActive
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      admin.password = hash
    }
    await admin.save()
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: "Error updating admin" })
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (req.body.userId === id) {
            return res.json({ success: false, message: "Cannot delete your own account" });
        }

        const admin = await adminModel.findById(id);
        if (!admin) {
            return res.json({ success: false, message: "Admin not found" });
        }

        // Prevent deleting superadmin
        if (admin.role === 'superadmin') {
            return res.json({ success: false, message: "Cannot delete superadmin account" });
        }

        await adminModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Admin deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error deleting admin" });
    }
};

export { 
    registerAdmin, 
    loginAdmin, 
    listAdmins, 
    getAdminById,  // ← Added this export
    updateAdmin, 
    deleteAdmin 
};