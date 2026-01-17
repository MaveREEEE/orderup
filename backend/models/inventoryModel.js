import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  quantity: { type: Number, required: true, min: 0 },
  productionDate: { type: Date, required: true },
  expirationDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const inventorySchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
  batches: [batchSchema],
  lowStockThreshold: { type: Number, default: 10 }
}, { timestamps: true });

// Virtual for total stock
inventorySchema.virtual('totalStock').get(function() {
  return this.batches.reduce((sum, batch) => sum + batch.quantity, 0);
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const inventoryModel = mongoose.models.inventory || mongoose.model("inventory", inventorySchema);
export default inventoryModel;