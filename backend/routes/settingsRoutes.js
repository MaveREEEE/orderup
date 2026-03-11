import express from "express"

import { 
  getSettings, 
  updateSettings,
  updateBranding,
  updateFavicon,
  updateHeroBackground
} from "../controllers/settingsController.js"
import { brandingUpload } from "../config/cloudinary.js"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const settingsRouter = express.Router()

// Hero background upload
settingsRouter.put(
  "/hero-background",
  authMiddleware,
  checkRole(['itadmin']),
  brandingUpload.single('heroBackground'),
  updateHeroBackground
)

// Routes 
settingsRouter.get("/", getSettings)
settingsRouter.put("/update", authMiddleware, checkRole(['itadmin']), updateSettings)
settingsRouter.put(
  "/branding", 
  authMiddleware, 
  checkRole(['itadmin']), 
  brandingUpload.single('logo'),
  updateBranding
)

settingsRouter.put(
  "/favicon", 
  authMiddleware, 
  checkRole(['itadmin']), 
  brandingUpload.single('favicon'),
  updateFavicon
)

export default settingsRouter