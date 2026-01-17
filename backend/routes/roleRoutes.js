import express from "express"
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole,
  getAdminsByRole,
  updatePermissions
} from "../controllers/roleController.js"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const roleRouter = express.Router()

// All role routes require superadmin access
roleRouter.get("/", authMiddleware, checkRole(['superadmin']), getRoles)
roleRouter.get("/admins/:role", authMiddleware, checkRole(['superadmin']), getAdminsByRole)
roleRouter.post("/create", authMiddleware, checkRole(['superadmin']), createRole)
roleRouter.put("/update/:id", authMiddleware, checkRole(['superadmin']), updateRole)
roleRouter.put("/permissions/:id", authMiddleware, checkRole(['superadmin']), updatePermissions)
roleRouter.delete("/delete/:id", authMiddleware, checkRole(['superadmin']), deleteRole)

export default roleRouter