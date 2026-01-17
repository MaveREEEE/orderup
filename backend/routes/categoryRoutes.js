import express from "express";
import { 
    listCategory, 
    getCategoryById, 
    addCategory, 
    removeCategory, 
    updateCategory,
    restoreCategory,
    listArchivedCategories,
    permanentlyDeleteCategory
} from "../controllers/categoryController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import { checkRole } from "../middleware/roleAuth.js";

const categoryRouter = express.Router();

// Image storage
const storage = multer.diskStorage({
    destination: "uploads/categories",
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Public routes
categoryRouter.get("/list", listCategory);
categoryRouter.get("/:id", getCategoryById);

// Archive routes - MUST BE BEFORE /:id
categoryRouter.get("/archived/list", authMiddleware, checkRole(['superadmin', 'admin']), listArchivedCategories);
categoryRouter.post("/restore", authMiddleware, checkRole(['superadmin', 'admin']), restoreCategory);
categoryRouter.post("/permanently-delete", authMiddleware, checkRole(['superadmin', 'admin']), permanentlyDeleteCategory);

// Protected routes
categoryRouter.post("/add", authMiddleware, checkRole(['superadmin', 'admin']), upload.single("image"), addCategory);
categoryRouter.put("/update/:id", authMiddleware, checkRole(['superadmin', 'admin']), upload.single("image"), updateCategory);
categoryRouter.post("/remove", authMiddleware, checkRole(['superadmin', 'admin']), removeCategory);

export default categoryRouter;