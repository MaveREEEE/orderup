import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      _id: { type: String },
      name: String,
      description: String,
      price: Number,
      image: String,
      category: String,
      quantity: Number
    }
  ],
  amount: { type: Number, required: true },
  subtotal: { type: Number },
  discount: { type: Number, default: 0 },
  promoCode: { type: String },
  address: {
    name: String,
    address: String,
    tableNumber: String,
    reservationDate: String,
    reservationTime: String,
    partySize: Number,
    email: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
    phone: String
  },
  orderType: { type: String },
  paymentMethod: { type: String },
  notes: { type: String },
  status: { type: String, default: "Food Processing" },
  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false }
});

const orderModel = mongoose.models.order || mongoose.model("order",orderSchema)

export default orderModel;