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
import { foodUpload } from "../config/cloudinary.js"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const foodRouter = express.Router()

// PUBLIC routes (no auth)
foodRouter.get("/list", listFood)
foodRouter.post("/rate", rateFood)
foodRouter.get("/ratings/:id", getFoodRatings)

// ARCHIVE routes - MUST BE BEFORE /:id route
foodRouter.get("/archived/list", authMiddleware, checkRole(['itadmin', 'admin']), getArchivedFood)
foodRouter.post("/restore", authMiddleware, checkRole(['itadmin', 'admin']), restoreFood)
foodRouter.post("/permanently-delete", authMiddleware, checkRole(['itadmin', 'admin']), permanentlyDeleteFood)

// PROTECTED routes (require auth)
foodRouter.post("/add", authMiddleware, checkRole(['itadmin', 'admin']), foodUpload.single("image"), addFood)
foodRouter.post("/remove", authMiddleware, checkRole(['itadmin', 'admin']), removeFood)
foodRouter.put("/update/:id", authMiddleware, checkRole(['itadmin', 'admin']), foodUpload.single("image"), updateFood)
foodRouter.delete("/ratings/:foodId/:ratingId",authMiddleware,checkRole(['itadmin', 'admin']),deleteFoodRating)
// DYNAMIC route - MUST BE LAST
foodRouter.get("/:id", getFoodById)

export default foodRouter