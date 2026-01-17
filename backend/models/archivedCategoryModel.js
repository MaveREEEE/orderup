import mongoose from "mongoose";

const archivedCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String 
  },
  deletedAt: { 
    type: Date, 
    default: Date.now 
  },
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  }
}, {
  timestamps: true
});

const archivedCategoryModel = mongoose.models.archivedCategory || mongoose.model("archivedCategory", archivedCategorySchema);

export default archivedCategoryModel;