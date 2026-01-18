import categoryModel from "../models/categoryModel.js";
import archivedCategoryModel from "../models/archivedCategoryModel.js";
import fs from "fs";
import path from "path";

//Fetch all categories
const listCategory = async (req, res) => {
    try {
        console.log("📂 Fetching categories...");
        const categories = await categoryModel.find({}).sort({ name: 1 });
        console.log(`✅ Found ${categories.length} categories`);
        res.json({ success: true, data: categories, categories });
    } catch (error) {
        console.log("❌ Error fetching categories:", error);
        res.json({ success: false, message: "Failed to fetch categories" });
    }
};

//Get single category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await categoryModel.findById(id);
        
        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }
        
        res.json({ success: true, data: category });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to fetch category" });
    }
};

//Add a new category
const addCategory = async (req, res) => {
    const { name } = req.body;
    const image = req.file ? (req.file.path || req.file.filename) : "";
    
    if (!name || !name.trim()) {
        return res.json({ success: false, message: "Category name is required" });
    }
    
    try {
        // Check for duplicate
        const categoryExists = await categoryModel.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });
        
        if (categoryExists) {
            return res.json({ success: false, message: "Category already exists" });
        }

        const newCategory = new categoryModel({
            name: name.trim(),
            image
        });

        await newCategory.save();

        res.json({
            success: true,
            message: "Category added successfully",
            data: newCategory
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to add category" });
    }
};

//Update a category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const category = await categoryModel.findById(id);
        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }

        // Prepare update data
        const updateData = {};
        
        if (name && name.trim()) {
            // Check if new name conflicts with existing category
            const existingCategory = await categoryModel.findOne({
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
                _id: { $ne: id }
            });
            
            if (existingCategory) {
                return res.json({ success: false, message: "Category name already exists" });
            }
            updateData.name = name.trim();
        }

        // Check if new image is uploaded
        if (req.file) {
            // Use Cloudinary URL/path when available
            updateData.image = req.file.path || req.file.filename;
        }

        const updatedCategory = await categoryModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.json({ 
            success: true, 
            message: "Category updated successfully",
            data: updatedCategory
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to update category" });
    }
};

//Remove/Archive a category
const removeCategory = async (req, res) => {
    try {
        const { id } = req.body;
        const category = await categoryModel.findById(id);
        
        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }

        // Archive before deleting - KEEP THE IMAGE
        await archivedCategoryModel.create({
            name: category.name,
            image: category.image, // Save image filename
            originalId: category._id,
            deletedAt: new Date()
        });

        // Delete from active categories
        await categoryModel.findByIdAndDelete(id);
        
        // DON'T delete the image file - keep it for restore
        // The image stays in uploads/categories folder
        
        res.json({ success: true, message: "Category archived successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to archive category" });
    }
};

//Restore archived category
const restoreCategory = async (req, res) => {
    try {
        const { id } = req.body;
        const archivedCategory = await archivedCategoryModel.findById(id);
        
        if (!archivedCategory) {
            return res.json({ success: false, message: "Archived category not found" });
        }

        // Check if category with same name already exists
        const exists = await categoryModel.findOne({ 
            name: { $regex: new RegExp(`^${archivedCategory.name}$`, 'i') }
        });
        
        if (exists) {
            return res.json({ success: false, message: "Category with this name already exists" });
        }

        // Restore to active categories with image
        const restoredCategory = new categoryModel({
            name: archivedCategory.name,
            image: archivedCategory.image // Restore with original image
        });

        await restoredCategory.save();
        await archivedCategoryModel.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: "Category restored successfully",
            data: restoredCategory
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error restoring category" });
    }
};

//Fetch archived categories
const listArchivedCategories = async (req, res) => {
    try {
        const archived = await archivedCategoryModel.find({}).sort({ deletedAt: -1 });
        res.json({ success: true, data: archived });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to fetch archived categories" });
    }
};

//Permanently delete archived category (optional - for cleanup)
const permanentlyDeleteCategory = async (req, res) => {
    try {
        const { id } = req.body;
        const archivedCategory = await archivedCategoryModel.findById(id);
        
        if (!archivedCategory) {
            return res.json({ success: false, message: "Archived category not found" });
        }

        // Delete the image file if it exists
        if (archivedCategory.image && !archivedCategory.image.startsWith("http")) {
            const imagePath = path.join(process.cwd(), "uploads/categories", archivedCategory.image);
            fs.unlink(imagePath, (err) => {
                if (err) console.log("Failed to delete image:", err);
            });
        }

        // Delete from archived
        await archivedCategoryModel.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: "Category permanently deleted"
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to permanently delete category" });
    }
};

export { 
    listCategory, 
    getCategoryById,
    addCategory, 
    removeCategory, 
    updateCategory, 
    restoreCategory, 
    listArchivedCategories,
    permanentlyDeleteCategory
};