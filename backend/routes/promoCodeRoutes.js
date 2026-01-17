import express from "express";
import { 
    listPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    togglePromoStatus,
    applyPromoCode 
} from "../controllers/promoCodeController.js";
import authMiddleware from "../middleware/auth.js";
import { checkPermission } from "../middleware/roleAuth.js";

const promoCodeRouter = express.Router();

// Customer route
promoCodeRouter.post("/apply", authMiddleware, applyPromoCode);

// Admin routes (require canManagePromoCodes permission)
promoCodeRouter.get("/list", authMiddleware, checkPermission('canManagePromoCodes'), listPromoCodes);
promoCodeRouter.post("/create", authMiddleware, checkPermission('canManagePromoCodes'), createPromoCode);
promoCodeRouter.put("/update/:id", authMiddleware, checkPermission('canManagePromoCodes'), updatePromoCode);
promoCodeRouter.delete("/delete/:id", authMiddleware, checkPermission('canManagePromoCodes'), deletePromoCode);
promoCodeRouter.patch("/toggle/:id", authMiddleware, checkPermission('canManagePromoCodes'), togglePromoStatus);

export default promoCodeRouter;