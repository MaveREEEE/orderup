import inventoryModel from "../models/inventoryModel.js"
import foodModel from "../models/foodModel.js"
import mongoose from "mongoose"

// Get all inventory (grouped by food item)
const listInventory = async (req, res) => {
  try {
    const foods = await foodModel.find().populate('batches')
    res.json({ success: true, data: foods })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching inventory" })
  }
}

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const foods = await foodModel.find()
    const lowStockItems = foods.filter(food => {
      const totalStock = food.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
      const threshold = food.lowStockThreshold || 10
      return totalStock <= threshold
    })
    res.json({ success: true, data: lowStockItems })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching low stock items" })
  }
}

// Get expiring items (within 7 days)
const getExpiringItems = async (req, res) => {
  try {
    const foods = await foodModel.find()
    const expiringItems = []
    const today = new Date()
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    foods.forEach(food => {
      if (food.batches && food.batches.length > 0) {
        food.batches.forEach(batch => {
          if (batch.expirationDate) {
            const expDate = new Date(batch.expirationDate)
            if (expDate >= today && expDate <= sevenDaysFromNow) {
              expiringItems.push({
                _id: food._id,
                batchId: batch._id,
                name: food.name,
                image: food.image,
                category: food.category,
                quantity: batch.quantity,
                productionDate: batch.productionDate,
                expirationDate: batch.expirationDate
              })
            }
          }
        })
      }
    })

    res.json({ success: true, data: expiringItems })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching expiring items" })
  }
}

// Add batch to food item
const addBatch = async (req, res) => {
  try {
    const { itemId, quantity, productionDate, expirationDate } = req.body

    const food = await foodModel.findById(itemId)
    if (!food) {
      return res.json({ success: false, message: "Food item not found" })
    }

    const newBatch = {
      _id: new mongoose.Types.ObjectId(), // ← Fixed: use imported mongoose
      quantity: parseInt(quantity),
      productionDate: new Date(productionDate),
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      createdAt: new Date()
    }

    if (!food.batches) {
      food.batches = []
    }
    food.batches.push(newBatch)
    await food.save()

    res.json({ success: true, message: "Batch added successfully", data: food })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error adding batch" })
  }
}

// Remove batch from food item
const removeBatch = async (req, res) => {
  try {
    const { itemId, batchId } = req.body

    const food = await foodModel.findById(itemId)
    if (!food) {
      return res.json({ success: false, message: "Food item not found" })
    }

    food.batches = food.batches.filter(batch => batch._id.toString() !== batchId)
    await food.save()

    res.json({ success: true, message: "Batch removed successfully", data: food })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error removing batch" })
  }
}

export { listInventory, getLowStockItems, getExpiringItems, addBatch, removeBatch }