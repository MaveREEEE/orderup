import express from "express"
import { 
  registerAdmin, 
  loginAdmin, 
  listAdmins, 
  updateAdmin, 
  deleteAdmin,
  getAdminById
} from "../controllers/adminController.js"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const adminRouter = express.Router()

// Public routes
adminRouter.post("/create", registerAdmin)
adminRouter.post("/login", loginAdmin)

// Protected routes - only superadmin can manage admins
adminRouter.get("/list", authMiddleware, checkRole(['superadmin']), listAdmins)
adminRouter.get("/:id", authMiddleware, checkRole(['superadmin']), getAdminById)
adminRouter.put("/update/:id", authMiddleware, checkRole(['superadmin']), updateAdmin)
adminRouter.delete("/delete/:id", authMiddleware, checkRole(['superadmin']), deleteAdmin)

export default adminRouter