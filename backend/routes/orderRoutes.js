import express from "express";
import authMiddleware from "../middleware/auth.js";
import { checkRole } from "../middleware/roleAuth.js";
import { 
    placeOrder,
    placeDineInOrder, 
    listOrders, 
    updateStatus, 
    userOrders,
    cancelOrder 
} from "../controllers/orderController.js";
import { gcashProofUpload } from "../config/cloudinary.js";

const orderRouter = express.Router();

// User routes
orderRouter.post("/place", authMiddleware, gcashProofUpload.single("paymentProofImage"), placeOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/cancel", authMiddleware, cancelOrder);

// Admin routes
orderRouter.get("/list", authMiddleware, checkRole(['itadmin', 'admin', 'staff']), listOrders);
orderRouter.post("/status", authMiddleware, checkRole(['itadmin', 'admin', 'staff']), updateStatus);
orderRouter.post("/dinein/place", authMiddleware, checkRole(['itadmin', 'admin', 'staff']), placeDineInOrder);
export default orderRouter;