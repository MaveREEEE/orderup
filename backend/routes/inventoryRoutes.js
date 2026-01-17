import express from "express"
import { listInventory, getLowStockItems, getExpiringItems, addBatch, removeBatch } from "../controllers/inventoryController.js"
import authMiddleware from "../middleware/auth.js"
import { checkRole } from "../middleware/roleAuth.js"

const inventoryRouter = express.Router()

// Get inventory endpoints
inventoryRouter.get("/list", authMiddleware, listInventory)
inventoryRouter.get("/low-stock", authMiddleware, getLowStockItems)
inventoryRouter.get("/expiring-soon", authMiddleware, getExpiringItems)

// Add/Remove batch endpoints
inventoryRouter.post("/add-batch", authMiddleware, checkRole(['superadmin', 'admin']), addBatch)
inventoryRouter.post("/remove-batch", authMiddleware, checkRole(['superadmin', 'admin']), removeBatch)

export default inventoryRouter