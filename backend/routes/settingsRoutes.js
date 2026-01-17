import express from "express"
import { 
  getSettings, 
  updateSettings,
  updateBranding,
  updateFavicon
} from "../controllers/settingsController.js"
import multer from "multer"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const settingsRouter = express.Router()

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "uploads/branding",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}_${file.originalname}`)
  }
})

const upload = multer({ storage: storage })

// Routes 
settingsRouter.get("/", getSettings)
settingsRouter.put("/update", authMiddleware, checkRole(['superadmin']), updateSettings)
settingsRouter.put(
  "/branding", 
  authMiddleware, 
  checkRole(['superadmin']), 
  upload.single('logo'), // multer handles logo upload
  updateBranding
)

settingsRouter.put(
  "/favicon", 
  authMiddleware, 
  checkRole(['superadmin']), 
  upload.single('favicon'), // multer handles favicon upload
  updateFavicon
)

export default settingsRouter