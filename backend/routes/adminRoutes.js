import express from "express";
import authMiddleware from "../middleware/auth.js";
import { checkRole } from "../middleware/roleAuth.js";
import { 
    registerAdmin, 
    loginAdmin,
    getAdminProfile,
    listAdmins, 
    getAdminById,
    updateAdmin, 
    deleteAdmin 
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// Admin authentication (no auth required)
adminRouter.post("/register", registerAdmin);
adminRouter.post("/login", loginAdmin);

// Admin profile (auth required, no role check)
adminRouter.get("/profile", authMiddleware, getAdminProfile);

// Admin management - specific routes first (superadmin only)
adminRouter.get("/list", authMiddleware, checkRole(['superadmin']), listAdmins);
adminRouter.post("/create", authMiddleware, checkRole(['superadmin']), registerAdmin);
adminRouter.put("/update/:id", authMiddleware, checkRole(['superadmin']), updateAdmin);
adminRouter.delete("/delete/:id", authMiddleware, checkRole(['superadmin']), deleteAdmin);

// Get admin by ID - must be last to avoid catching /list, /create, etc
adminRouter.get("/:id", authMiddleware, checkRole(['superadmin']), getAdminById);

export default adminRouter;