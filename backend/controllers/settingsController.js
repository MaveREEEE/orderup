import settingsModel from "../models/settingsModel.js";
import fs from 'fs';
import path from 'path';

// Get settings
const getSettings = async (req, res) => {
  try {
    let settings = await settingsModel.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = new settingsModel({});
      await settings.save();
    }
    
    res.json({ success: true, data: settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching settings" });
  }
};

// Update settings (SuperAdmin only)
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = Date.now();
    
    // Remove logo and favicon from update if not provided
    if (!updates.logo) {
      delete updates.logo;
    }
    if (!updates.favicon) {
      delete updates.favicon;
    }
    
    let settings = await settingsModel.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, message: "Settings updated successfully", data: settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating settings" });
  }
};
// Update branding (logo and favicon)
const updateBranding = async (req, res) => {
  try {
    let settings = await settingsModel.findOne();
    
    if (!settings) {
      settings = new settingsModel({});
    }

    // Update logo if uploaded (using req.file, not req.files)
    if (req.file) {
      console.log("File received:", req.file.filename);
      settings.logo = req.file.filename;
    } else {
      console.log("No file in request");
    }

    // Update other branding fields from body
    if (req.body.siteName) settings.siteName = req.body.siteName;
    if (req.body.primaryColor) settings.primaryColor = req.body.primaryColor;
    if (req.body.secondaryColor) settings.secondaryColor = req.body.secondaryColor;
    if (req.body.accentColor) settings.accentColor = req.body.accentColor;
    if (req.body.textColor) settings.textColor = req.body.textColor;
    if (req.body.backgroundColor) settings.backgroundColor = req.body.backgroundColor;

    settings.updatedAt = Date.now();
    
    const savedSettings = await settings.save();
    console.log("Settings saved:", savedSettings);

    res.json({ 
      success: true, 
      message: "Branding updated successfully", 
      data: savedSettings 
    });
  } catch (error) {
    console.log("Error in updateBranding:", error);
    res.json({ success: false, message: "Error updating branding" });
  }
};

// Update favicon
const updateFavicon = async (req, res) => {
  try {
    let settings = await settingsModel.findOne();
    
    if (!settings) {
      settings = new settingsModel({});
    }

    // Update favicon if uploaded
    if (req.file) {
      console.log("Favicon file received:", req.file.filename);
      settings.favicon = req.file.filename;
    } else {
      console.log("No favicon file in request");
    }

    settings.updatedAt = Date.now();
    
    const savedSettings = await settings.save();
    console.log("Settings saved with favicon:", savedSettings);

    res.json({ 
      success: true, 
      message: "Favicon updated successfully", 
      data: savedSettings 
    });
  } catch (error) {
    console.log("Error in updateFavicon:", error);
    res.json({ success: false, message: "Error updating favicon" });
  }
};


export { 
  getSettings, 
  updateSettings, 
  updateBranding,
  updateFavicon
};