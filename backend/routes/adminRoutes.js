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

// Admin management - specific routes first (itadmin only)
adminRouter.get("/list", authMiddleware, checkRole(['itadmin']), listAdmins);
adminRouter.post("/create", authMiddleware, checkRole(['itadmin']), registerAdmin);
adminRouter.put("/update/:id", authMiddleware, checkRole(['itadmin']), updateAdmin);
adminRouter.delete("/delete/:id", authMiddleware, checkRole(['itadmin']), deleteAdmin);

// Get admin by ID - must be last to avoid catching /list, /create, etc
adminRouter.get("/:id", authMiddleware, checkRole(['itadmin']), getAdminById);

export default adminRouter;