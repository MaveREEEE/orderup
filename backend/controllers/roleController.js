import adminModel from "../models/adminModel.js";

// Get all roles with their permissions
const getRoles = async (req, res) => {
  try {
    const roles = await adminModel.distinct('role');
    
    const roleData = [
      {
        name: 'superadmin',
        description: 'Full system access with all permissions',
        permissions: {
          canManageUsers: true,
          canManageOrders: true,
          canManageInventory: true,
          canManageMenu: true,
          canViewReports: true,
          canManageSettings: true,
          canManagePromoCodes: true
        },
        active: roles.includes('superadmin'),
        count: await adminModel.countDocuments({ role: 'superadmin' })
      },
      {
        name: 'admin',
        description: 'Standard admin access for daily operations',
        permissions: {
          canManageUsers: false,
          canManageOrders: true,
          canManageInventory: true,
          canManageMenu: true,
          canViewReports: true,
          canManageSettings: false,
          canManagePromoCodes: true
        },
        active: roles.includes('admin'),
        count: await adminModel.countDocuments({ role: 'admin' })
      },
      {
        name: 'staff',
        description: 'Limited staff access',
        permissions: {
          canManageUsers: false,
          canManageOrders: true,
          canManageInventory: false,
          canManageMenu: false,
          canViewReports: false,
          canManageSettings: false,
          canManagePromoCodes: false
        },
        active: roles.includes('staff'),
        count: await adminModel.countDocuments({ role: 'staff' })
      }
    ];
    
    res.json({ success: true, data: roleData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching roles" });
  }
};

// Create/Assign role to admin with custom permissions
const createRole = async (req, res) => {
  try {
    const { adminId, role, permissions } = req.body;
    
    if (!adminId || !role) {
      return res.json({ success: false, message: "Admin ID and role are required" });
    }
    
    const validRoles = ['superadmin', 'admin', 'staff'];
    if (!validRoles.includes(role)) {
      return res.json({ success: false, message: "Invalid role. Valid roles: " + validRoles.join(', ') });
    }
    
    const admin = await adminModel.findById(adminId);
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }
    
    admin.role = role;
    
    if (permissions) {
      admin.permissions = permissions;
    } else {
      if (role === 'superadmin') {
        admin.permissions = {
          canManageUsers: true,
          canManageOrders: true,
          canManageInventory: true,
          canManageMenu: true,
          canViewReports: true,
          canManageSettings: true,
          canManagePromoCodes: true
        };
      } else if (role === 'admin') {
        admin.permissions = {
          canManageUsers: false,
          canManageOrders: true,
          canManageInventory: true,
          canManageMenu: true,
          canViewReports: true,
          canManageSettings: false,
          canManagePromoCodes: true
        };
      } else if (role === 'staff') {
        admin.permissions = {
          canManageUsers: false,
          canManageOrders: true,
          canManageInventory: false,
          canManageMenu: false,
          canViewReports: false,
          canManageSettings: false,
          canManagePromoCodes: false
        };
      }
    }
    
    await admin.save();
    
    res.json({ 
      success: true, 
      message: `Role updated to ${role}`,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error creating role" });
  }
};

// Update role and permissions
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, permissions } = req.body;
    
    // Find admin
    const admin = await adminModel.findById(id);
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }
    
    // Prevent changing superadmin role
    if (admin.role === 'superadmin' && role && role !== 'superadmin') {
      return res.json({ success: false, message: "Cannot change superadmin role" });
    }
    
    // Update role if provided
    if (role) {
      const validRoles = ['superadmin', 'admin', 'staff'];
      if (!validRoles.includes(role)) {
        return res.json({ success: false, message: "Invalid role" });
      }
      admin.role = role;
    }
    
    // Update permissions if provided
    if (permissions) {
      admin.permissions = {
        ...admin.permissions,
        ...permissions
      };
    }
    
    await admin.save();
    
    res.json({ 
      success: true, 
      message: "Role updated successfully",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating role" });
  }
};

// Delete role (remove admin)
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find admin
    const admin = await adminModel.findById(id);
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }
    
    // Prevent deleting superadmin
    if (admin.role === 'superadmin') {
      return res.json({ success: false, message: "Cannot delete superadmin" });
    }
    
    // Delete admin
    await adminModel.findByIdAndDelete(id);
    
    res.json({ success: true, message: "Admin removed successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting admin" });
  }
};

// Get admins by role
const getAdminsByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const validRoles = ['superadmin', 'admin', 'staff'];
    if (!validRoles.includes(role)) {
      return res.json({ success: false, message: "Invalid role" });
    }
    
    const admins = await adminModel.find({ role }).select('-password');
    
    res.json({ 
      success: true, 
      data: admins,
      count: admins.length
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching admins by role" });
  }
};

// Update specific permissions for an admin
const updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = req.body;
    
    const admin = await adminModel.findById(id);
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }
    
    // Superadmin always has all permissions
    if (admin.role === 'superadmin') {
      return res.json({ success: false, message: "Cannot modify superadmin permissions" });
    }
    
    // Update only the provided permissions
    admin.permissions = {
      ...admin.permissions,
      ...permissions
    };
    
    await admin.save();
    
    res.json({ 
      success: true, 
      message: "Permissions updated successfully",
      data: {
        id: admin._id,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating permissions" });
  }
};

export { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole,
  getAdminsByRole,
  updatePermissions
};