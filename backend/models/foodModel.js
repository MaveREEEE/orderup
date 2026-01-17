import mongoose from "mongoose"

const batchSchema = new mongoose.Schema({
  quantity: { type: Number, required: true, min: 0 },
  productionDate: { type: Date, required: true },
  expirationDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
})

const ratingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  orderId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  date: { type: Date, default: Date.now }
})

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  allergens: { type: [String], default: [] },
  batches: [batchSchema],
  lowStockThreshold: { type: Number, default: 10 },
  available: { type: Boolean, default: true },
  ratings: [ratingSchema],
  averageRating: { type: Number, default: 0 }
  
}, { timestamps: true })

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema)
export default foodModel