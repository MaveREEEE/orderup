import mongoose from "mongoose";

const archivedFoodSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    image: String,
    category: String,
    allergens: { type: [String], default: [] },
    deletedAt: { type: Date, default: Date.now }
});

export default mongoose.model("ArchivedFood", archivedFoodSchema);