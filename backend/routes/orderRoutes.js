import express from "express";
import authMiddleware from "../middleware/auth.js";
import { checkRole } from "../middleware/roleAuth.js";
import { 
    placeOrder,
    placeDineInOrder, 
    listOrders, 
    updateStatus, 
    userOrders 
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// User routes
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);

// Admin routes
orderRouter.get("/list", authMiddleware, checkRole(['superadmin', 'admin', 'staff']), listOrders);
orderRouter.post("/status", authMiddleware, checkRole(['superadmin', 'admin', 'staff']), updateStatus);
orderRouter.post("/dinein/place", authMiddleware, checkRole(['superadmin', 'admin', 'staff']), placeDineInOrder);
export default orderRouter;