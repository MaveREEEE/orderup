import express from "express"
import { 
  getSettings, 
  updateSettings,
  updateBranding,
  updateFavicon
} from "../controllers/settingsController.js"
import { brandingUpload } from "../config/multer.js"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const settingsRouter = express.Router()

// Routes 
settingsRouter.get("/", getSettings)
settingsRouter.put("/update", authMiddleware, checkRole(['superadmin']), updateSettings)
settingsRouter.put(
  "/branding", 
  authMiddleware, 
  checkRole(['superadmin']), 
  brandingUpload.single('logo'),
  updateBranding
)

settingsRouter.put(
  "/favicon", 
  authMiddleware, 
  checkRole(['superadmin']), 
  brandingUpload.single('favicon'),
  updateFavicon
)

export default settingsRouter