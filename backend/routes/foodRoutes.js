import express from "express"
import { 
  addFood, 
  listFood, 
  removeFood, 
  updateFood,
  getFoodById,
  getArchivedFood,
  restoreFood,
  permanentlyDeleteFood,
  rateFood,
  getFoodRatings,
  deleteFoodRating,
} from "../controllers/foodController.js"
import multer from "multer"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const foodRouter = express.Router()

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "uploads/items",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}_${file.originalname}`)
  }
})

const upload = multer({ storage: storage })

// PUBLIC routes (no auth)
foodRouter.get("/list", listFood)
foodRouter.post("/rate", rateFood)
foodRouter.get("/ratings/:id", getFoodRatings)

// ARCHIVE routes - MUST BE BEFORE /:id route
foodRouter.get("/archived/list", authMiddleware, checkRole(['superadmin', 'admin']), getArchivedFood)
foodRouter.post("/restore", authMiddleware, checkRole(['superadmin', 'admin']), restoreFood)
foodRouter.post("/permanently-delete", authMiddleware, checkRole(['superadmin', 'admin']), permanentlyDeleteFood)

// PROTECTED routes (require auth)
foodRouter.post("/add", authMiddleware, checkRole(['superadmin', 'admin']), upload.single("image"), addFood)
foodRouter.post("/remove", authMiddleware, checkRole(['superadmin', 'admin']), removeFood)
foodRouter.put("/update/:id", authMiddleware, checkRole(['superadmin', 'admin']), upload.single("image"), updateFood)
foodRouter.delete("/ratings/:foodId/:ratingId",authMiddleware,checkRole(['superadmin', 'admin']),deleteFoodRating)
// DYNAMIC route - MUST BE LAST
foodRouter.get("/:id", getFoodById)

export default foodRouter