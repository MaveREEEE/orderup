import foodModel from "../models/foodModel.js"
import archivedFoodModel from "../models/archivedFoodModel.js"
import fs from 'fs'

// Normalize allergens from array, JSON string, or comma-separated string
const parseAllergens = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    // Try JSON parse first
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      // fall through
    }
    return input.split(',').map(a => a.trim()).filter(Boolean);
  }
  return [];
};

// Add food item
const addFood = async (req, res) => {
  try {
    // Get filename from multer
    let image_url = req.file ? req.file.filename : ""

    const allergens = parseAllergens(req.body.allergens)

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: image_url,
      allergens
    })

    await food.save()
    res.json({ success: true, message: "Food Added" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error adding food" })
  }
}

// List all food items
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({}).lean().sort({ name: 1 })
    const normalized = foods.map(f => ({
      ...f,
      allergens: parseAllergens(f.allergens)
    }))
    res.json({ success: true, data: normalized })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching foods" })
  }
}

// Get single food item
const getFoodById = async (req, res) => {
  try {
    const food = await foodModel.findById(req.params.id)
    if (!food) {
      return res.json({ success: false, message: "Food not found" })
    }
    const normalized = {
      ...food.toObject(),
      allergens: parseAllergens(food.allergens)
    }
    res.json({ success: true, data: normalized })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching food" })
  }
}

// Remove food item (archive it)
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id)
    
    if (!food) {
      return res.json({ success: false, message: "Food not found" })
    }

    // Archive the food item
    const archivedFood = new archivedFoodModel({
      name: food.name,
      description: food.description,
      price: food.price,
      image: food.image,
      category: food.category,
      allergens: food.allergens || [],
      deletedAt: new Date()
    })

    await archivedFood.save()

    // Delete from active foods
    await foodModel.findByIdAndDelete(req.body.id)
    
    // DON'T delete the image file - keep it for potential restore
    // fs.unlink(`uploads/items/${food.image}`, (err) => {
    //   if (err) console.log("Error deleting image:", err)
    // })

    res.json({ success: true, message: "Food Archived" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error removing food" })
  }
}

// Update food item
const updateFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.params.id)
    
    if (!food) {
      return res.json({ success: false, message: "Food not found" })
    }

    // If new image is uploaded, use filename
    if (req.file) {
      food.image = req.file.filename
    }

    // Update fields
    food.name = req.body.name || food.name
    food.description = req.body.description || food.description
    food.price = req.body.price || food.price
    food.category = req.body.category || food.category
    if (req.body.allergens !== undefined) {
      food.allergens = parseAllergens(req.body.allergens)
    }

    await food.save()
    res.json({ success: true, message: "Food Updated", data: food })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error updating food" })
  }
}

// Get archived food items
const getArchivedFood = async (req, res) => {
  try {
    const archivedFoods = await archivedFoodModel.find({}).lean().sort({ deletedAt: -1 })
    const normalized = archivedFoods.map(f => ({
      ...f,
      allergens: parseAllergens(f.allergens)
    }))
    res.json({ success: true, data: normalized })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching archived foods" })
  }
}

// Restore archived food item
const restoreFood = async (req, res) => {
  try {
    const archivedFood = await archivedFoodModel.findById(req.body.id)
    
    if (!archivedFood) {
      return res.json({ success: false, message: "Archived food not found" })
    }

    // Create new food item from archived
    const restoredFood = new foodModel({
      name: archivedFood.name,
      description: archivedFood.description,
      price: archivedFood.price,
      image: archivedFood.image,
      category: archivedFood.category,
      allergens: archivedFood.allergens || []
    })

    await restoredFood.save()

    // Delete from archived
    await archivedFoodModel.findByIdAndDelete(req.body.id)

    res.json({ success: true, message: "Food Restored" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error restoring food" })
  }
}

// Permanently delete archived food item (optional - for cleanup)
const permanentlyDeleteFood = async (req, res) => {
  try {
    const archivedFood = await archivedFoodModel.findById(req.body.id)
    
    if (!archivedFood) {
      return res.json({ success: false, message: "Archived food not found" })
    }

    // Delete the image file
    fs.unlink(`uploads/items/${archivedFood.image}`, (err) => {
      if (err) console.log("Error deleting image:", err)
    })

    // Delete from archived
    await archivedFoodModel.findByIdAndDelete(req.body.id)

    res.json({ success: true, message: "Food Permanently Deleted" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error permanently deleting food" })
  }
}

// Rate a food item
const rateFood = async (req, res) => {
  try {
    const { foodId, userId, rating, comment, orderId } = req.body

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Rating must be between 1 and 5" })
    }

    const food = await foodModel.findById(foodId)
    if (!food) {
      return res.json({ success: false, message: "Food not found" })
    }

    // Check if user already rated this item
    const existingRating = food.ratings.find(
      r => r.userId === userId && r.orderId === orderId
    )

    if (existingRating) {
      return res.json({ success: false, message: "You have already rated this item" })
    }

    // Add rating
    food.ratings.push({
      userId,
      orderId,
      rating,
      comment: comment || ""
    })

    // Calculate average rating
    const totalRating = food.ratings.reduce((sum, r) => sum + r.rating, 0)
    food.averageRating = (totalRating / food.ratings.length).toFixed(1)

    await food.save()
    res.json({ success: true, message: "Rating added successfully", data: food })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error adding rating" })
  }
}

// Get food ratings
const getFoodRatings = async (req, res) => {
  try {
    const food = await foodModel.findById(req.params.id)
    if (!food) {
      return res.json({ success: false, message: "Food not found" })
    }
    res.json({ 
      success: true, 
      ratings: food.ratings,
      averageRating: food.averageRating
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error fetching ratings" })
  }
}

// Delete a specific rating (admin)
const deleteFoodRating = async (req, res) => {
  try {
    const { foodId, ratingId } = req.params
    const food = await foodModel.findById(foodId)

    if (!food) {
      return res.json({ success: false, message: "Food not found" })
    }

    const initialCount = food.ratings.length
    food.ratings = food.ratings.filter(r => r._id.toString() !== ratingId)

    if (food.ratings.length === initialCount) {
      return res.json({ success: false, message: "Rating not found" })
    }

    const totalRating = food.ratings.reduce((sum, r) => sum + (r.rating || 0), 0)
    food.averageRating = food.ratings.length
      ? (totalRating / food.ratings.length).toFixed(1)
      : 0

    await food.save()

    res.json({
      success: true,
      message: "Rating removed",
      data: { ratings: food.ratings, averageRating: food.averageRating }
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Error deleting rating" })
  }
}

export { addFood, listFood, removeFood, updateFood, getFoodById, getArchivedFood, restoreFood, permanentlyDeleteFood, rateFood, getFoodRatings, deleteFoodRating }