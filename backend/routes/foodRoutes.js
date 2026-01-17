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
import { foodUpload } from "../config/multer.js"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const foodRouter = express.Router()

// PUBLIC routes (no auth)
foodRouter.get("/list", listFood)
foodRouter.post("/rate", rateFood)
foodRouter.get("/ratings/:id", getFoodRatings)

// ARCHIVE routes - MUST BE BEFORE /:id route
foodRouter.get("/archived/list", authMiddleware, checkRole(['superadmin', 'admin']), getArchivedFood)
foodRouter.post("/restore", authMiddleware, checkRole(['superadmin', 'admin']), restoreFood)
foodRouter.post("/permanently-delete", authMiddleware, checkRole(['superadmin', 'admin']), permanentlyDeleteFood)

// PROTECTED routes (require auth)
foodRouter.post("/add", authMiddleware, checkRole(['superadmin', 'admin']), foodUpload.single("image"), addFood)
foodRouter.post("/remove", authMiddleware, checkRole(['superadmin', 'admin']), removeFood)
foodRouter.put("/update/:id", authMiddleware, checkRole(['superadmin', 'admin']), foodUpload.single("image"), updateFood)
foodRouter.delete("/ratings/:foodId/:ratingId",authMiddleware,checkRole(['superadmin', 'admin']),deleteFoodRating)
// DYNAMIC route - MUST BE LAST
foodRouter.get("/:id", getFoodById)

export default foodRouter