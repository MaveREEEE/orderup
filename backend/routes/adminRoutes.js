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

// Admin authentication
adminRouter.post("/register", registerAdmin);
adminRouter.post("/login", loginAdmin);

// Admin profile
adminRouter.get("/profile", authMiddleware, getAdminProfile);

// Admin management (superadmin only)
adminRouter.get("/list", authMiddleware, checkRole(['superadmin']), listAdmins);
adminRouter.get(":id", authMiddleware, checkRole(['superadmin']), getAdminById);
adminRouter.post("/create", authMiddleware, checkRole(['superadmin']), registerAdmin);
adminRouter.put("/update/:id", authMiddleware, checkRole(['superadmin']), updateAdmin);
adminRouter.delete("/delete/:id", authMiddleware, checkRole(['superadmin']), deleteAdmin);

export default adminRouter;