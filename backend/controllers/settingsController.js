import settingsModel from "../models/settingsModel.js";

const saveSettingsUpdate = async (updateData) => {
  const savedSettings = await settingsModel.findOneAndUpdate(
    {},
    { $set: updateData },
    { new: true, upsert: true, runValidators: false }
  );

  return savedSettings;
};

//Get settings
const getSettings = async (req, res) => {
  try {
    let settings = await settingsModel.findOne();
    
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

//Update settings
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = Date.now();
    console.log("[Settings Update] Payload received:", updates);
    if (!updates.logo) {
      delete updates.logo;
    }
    if (!updates.favicon) {
      delete updates.favicon;
    }
    let settings = await saveSettingsUpdate(updates);
    res.json({ success: true, message: "Settings updated successfully", data: settings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating settings" });
  }
};

//Update hero background image, title, and subtitle
const updateHeroBackground = async (req, res) => {
  try {
    const updateData = {};

    if (req.file) {
      console.log("Hero background file received:", req.file.path || req.file.filename);
      updateData.heroBackground = req.file.path || req.file.filename;
    }

    if (req.body.heroTitle !== undefined) updateData.heroTitle = req.body.heroTitle;
    if (req.body.heroSubtitle !== undefined) updateData.heroSubtitle = req.body.heroSubtitle;

    updateData.updatedAt = Date.now();

    console.log("Attempting to update hero background/title/subtitle with:", updateData);

    const savedSettings = await saveSettingsUpdate(updateData);
    console.log("MongoDB returned:", savedSettings);
    console.log("Hero background in response:", savedSettings.heroBackground);

    const verified = await settingsModel.findById(savedSettings._id);
    console.log("Verified from DB:", verified.heroBackground, verified.heroTitle, verified.heroSubtitle);

    res.json({
      success: true,
      message: "Hero background/title/subtitle updated successfully",
      data: savedSettings
    });
  } catch (error) {
    console.log("Error in updateHeroBackground:", error);
    res.json({ success: false, message: "Error updating hero background: " + error.message });
  }
};
//Update branding
const updateBranding = async (req, res) => {
  try {
    const updateData = {};

    if (req.file) {
      console.log("File received:", req.file.path || req.file.filename);
      updateData.logo = req.file.path || req.file.filename;
    }

    if (req.body.siteName) updateData.siteName = req.body.siteName;
    if (req.body.primaryColor) updateData.primaryColor = req.body.primaryColor;
    if (req.body.secondaryColor) updateData.secondaryColor = req.body.secondaryColor;
    if (req.body.accentColor) updateData.accentColor = req.body.accentColor;
    if (req.body.textColor) updateData.textColor = req.body.textColor;
    if (req.body.backgroundColor) updateData.backgroundColor = req.body.backgroundColor;

    updateData.updatedAt = Date.now();

    console.log("Attempting to update with:", updateData);

    const savedSettings = await saveSettingsUpdate(updateData);
    
    console.log("MongoDB returned:", savedSettings);
    console.log("Logo in response:", savedSettings.logo);

    const verified = await settingsModel.findById(savedSettings._id);
    console.log("Verified from DB:", verified.logo);


    res.json({ 
      success: true, 
      message: "Branding updated successfully", 
      data: savedSettings 
    });
  } catch (error) {
    console.log("Error in updateBranding:", error);
    res.json({ success: false, message: "Error updating branding: " + error.message });
  }
};

//Update favicon
const updateFavicon = async (req, res) => {
  try {
    const updateData = {};

    if (req.file) {
      console.log("Favicon file received:", req.file.path || req.file.filename);
      updateData.favicon = req.file.path || req.file.filename;
    }

    updateData.updatedAt = Date.now();

    console.log("Attempting to update favicon with:", updateData);

    const savedSettings = await saveSettingsUpdate(updateData);
    
    console.log("MongoDB returned:", savedSettings);
    console.log("Favicon in response:", savedSettings.favicon);

    const verified = await settingsModel.findById(savedSettings._id);
    console.log("Verified from DB:", verified.favicon);

    res.json({ 
      success: true, 
      message: "Favicon updated successfully", 
      data: savedSettings 
    });
  } catch (error) {
    console.log("Error in updateFavicon:", error);
    res.json({ success: false, message: "Error updating favicon: " + error.message });
  }
};


export { 
  getSettings, 
  updateSettings, 
  updateBranding,
  updateFavicon,
  updateHeroBackground
};