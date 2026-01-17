import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  // Site Information
  siteName: {
    type: String,
    default: "OrderUP"
  },
  siteDescription: {
    type: String,
    default: "Online Food Ordering System"
  },
  aboutUs: {
    type: String,
    default: ""
  },
  
  // Branding
  logo: {
    type: String,
    default: ""
  },
  favicon: {
    type: String,
    default: ""
  },
  primaryColor: {
    type: String,
    default: "#ff6b6b"
  },
  secondaryColor: {
    type: String,
    default: "#4ecdc4"
  },
  accentColor: {
    type: String,
    default: "#e85a4f"
  },
  textColor: {
    type: String,
    default: "#333333"
  },
  backgroundColor: {
    type: String,
    default: "#fcfcfc"
  },
  
  // Contact Information
  email: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    default: ""
  },
  privacyPolicy: {
    type: String,
    default: ""
  },
  termsAndConditions: {
    type: String,
    default: ""
  },
  
  // Feature Flags
  enableDelivery: {
    type: Boolean,
    default: true
  },
  enablePickup: {
    type: Boolean,
    default: true
  },
  enableDineIn: {
    type: Boolean,
    default: true
  },
  enableReservations: {
    type: Boolean,
    default: true
  },
  
  // Social Media
  socialMedia: {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    x: { type: String, default: "" },
  },
  
  // Metadata
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const settingsModel = mongoose.models.settings || mongoose.model("settings", settingsSchema);

export default settingsModel;