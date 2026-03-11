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

// All role routes require itadmin access
roleRouter.get("/", authMiddleware, checkRole(['itadmin']), getRoles)
roleRouter.get("/admins/:role", authMiddleware, checkRole(['itadmin']), getAdminsByRole)
roleRouter.post("/create", authMiddleware, checkRole(['itadmin']), createRole)
roleRouter.put("/update/:id", authMiddleware, checkRole(['itadmin']), updateRole)
roleRouter.put("/permissions/:id", authMiddleware, checkRole(['itadmin']), updatePermissions)
roleRouter.delete("/delete/:id", authMiddleware, checkRole(['itadmin']), deleteRole)

export default roleRouter