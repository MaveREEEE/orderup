import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Define schemas
const foodSchema = new mongoose.Schema({}, { strict: false });
const categorySchema = new mongoose.Schema({}, { strict: false });
const settingsSchema = new mongoose.Schema({}, { strict: false });
const archivedFoodSchema = new mongoose.Schema({}, { strict: false });
const archivedCategorySchema = new mongoose.Schema({}, { strict: false });

const Food = mongoose.model('food', foodSchema);
const Category = mongoose.model('categories', categorySchema);
const Settings = mongoose.model('settings', settingsSchema);
const ArchivedFood = mongoose.model('archivedfood', archivedFoodSchema);
const ArchivedCategory = mongoose.model('archivedcategory', archivedCategorySchema);

// Upload image to Cloudinary
const uploadToCloudinary = async (localPath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: `orderup/${folder}`,
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${localPath}:`, error.message);
    return null;
  }
};

// Migrate food items
const migrateFoodItems = async () => {
  console.log('\n📦 Migrating food items...');
  const foods = await Food.find({});
  let migrated = 0;
  let skipped = 0;

  for (const food of foods) {
    // Skip if already a Cloudinary URL
    if (food.image && food.image.startsWith('http')) {
      skipped++;
      continue;
    }

    if (!food.image) {
      skipped++;
      continue;
    }

    const localPath = path.join(__dirname, '../uploads/items', food.image);
    
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  Image not found: ${food.image} for ${food.name}`);
      skipped++;
      continue;
    }

    const cloudinaryUrl = await uploadToCloudinary(localPath, 'items');
    
    if (cloudinaryUrl) {
      food.image = cloudinaryUrl;
      await food.save();
      console.log(`✅ Migrated: ${food.name}`);
      migrated++;
    } else {
      skipped++;
    }
  }

  console.log(`Food items: ${migrated} migrated, ${skipped} skipped`);
};

// Migrate archived food items
const migrateArchivedFoodItems = async () => {
  console.log('\n📦 Migrating archived food items...');
  const foods = await ArchivedFood.find({});
  let migrated = 0;
  let skipped = 0;

  for (const food of foods) {
    if (food.image && food.image.startsWith('http')) {
      skipped++;
      continue;
    }

    if (!food.image) {
      skipped++;
      continue;
    }

    const localPath = path.join(__dirname, '../uploads/items', food.image);
    
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  Image not found: ${food.image} for archived ${food.name}`);
      skipped++;
      continue;
    }

    const cloudinaryUrl = await uploadToCloudinary(localPath, 'items');
    
    if (cloudinaryUrl) {
      food.image = cloudinaryUrl;
      await food.save();
      console.log(`✅ Migrated archived: ${food.name}`);
      migrated++;
    } else {
      skipped++;
    }
  }

  console.log(`Archived food items: ${migrated} migrated, ${skipped} skipped`);
};

// Migrate categories
const migrateCategories = async () => {
  console.log('\n📂 Migrating categories...');
  const categories = await Category.find({});
  let migrated = 0;
  let skipped = 0;

  for (const category of categories) {
    if (category.image && category.image.startsWith('http')) {
      skipped++;
      continue;
    }

    if (!category.image) {
      skipped++;
      continue;
    }

    const localPath = path.join(__dirname, '../uploads/categories', category.image);
    
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  Image not found: ${category.image} for ${category.name}`);
      skipped++;
      continue;
    }

    const cloudinaryUrl = await uploadToCloudinary(localPath, 'categories');
    
    if (cloudinaryUrl) {
      category.image = cloudinaryUrl;
      await category.save();
      console.log(`✅ Migrated: ${category.name}`);
      migrated++;
    } else {
      skipped++;
    }
  }

  console.log(`Categories: ${migrated} migrated, ${skipped} skipped`);
};

// Migrate archived categories
const migrateArchivedCategories = async () => {
  console.log('\n📂 Migrating archived categories...');
  const categories = await ArchivedCategory.find({});
  let migrated = 0;
  let skipped = 0;

  for (const category of categories) {
    if (category.image && category.image.startsWith('http')) {
      skipped++;
      continue;
    }

    if (!category.image) {
      skipped++;
      continue;
    }

    const localPath = path.join(__dirname, '../uploads/categories', category.image);
    
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  Image not found: ${category.image} for archived ${category.name}`);
      skipped++;
      continue;
    }

    const cloudinaryUrl = await uploadToCloudinary(localPath, 'categories');
    
    if (cloudinaryUrl) {
      category.image = cloudinaryUrl;
      await category.save();
      console.log(`✅ Migrated archived: ${category.name}`);
      migrated++;
    } else {
      skipped++;
    }
  }

  console.log(`Archived categories: ${migrated} migrated, ${skipped} skipped`);
};

// Migrate branding (logo & favicon)
const migrateBranding = async () => {
  console.log('\n🎨 Migrating branding...');
  const settings = await Settings.findOne({});
  
  if (!settings) {
    console.log('No settings found');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  // Migrate logo
  if (settings.logo && !settings.logo.startsWith('http')) {
    const localPath = path.join(__dirname, '../uploads/branding', settings.logo);
    
    if (fs.existsSync(localPath)) {
      const cloudinaryUrl = await uploadToCloudinary(localPath, 'branding');
      if (cloudinaryUrl) {
        settings.logo = cloudinaryUrl;
        console.log(`✅ Migrated logo`);
        migrated++;
      } else {
        skipped++;
      }
    } else {
      console.log(`⚠️  Logo not found: ${settings.logo}`);
      skipped++;
    }
  } else {
    skipped++;
  }

  // Migrate favicon
  if (settings.favicon && !settings.favicon.startsWith('http')) {
    const localPath = path.join(__dirname, '../uploads/branding', settings.favicon);
    
    if (fs.existsSync(localPath)) {
      const cloudinaryUrl = await uploadToCloudinary(localPath, 'branding');
      if (cloudinaryUrl) {
        settings.favicon = cloudinaryUrl;
        console.log(`✅ Migrated favicon`);
        migrated++;
      } else {
        skipped++;
      }
    } else {
      console.log(`⚠️  Favicon not found: ${settings.favicon}`);
      skipped++;
    }
  } else {
    skipped++;
  }

  if (migrated > 0) {
    await settings.save();
  }

  console.log(`Branding: ${migrated} migrated, ${skipped} skipped`);
};

// Main migration function
const runMigration = async () => {
  console.log('🚀 Starting Cloudinary migration...\n');
  console.log('Cloudinary Config:');
  console.log(`  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT SET'}`);
  console.log(`  API Key: ${process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`  API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET'}\n`);

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary credentials not configured in .env file');
    process.exit(1);
  }

  try {
    await connectDB();
    
    await migrateFoodItems();
    await migrateArchivedFoodItems();
    await migrateCategories();
    await migrateArchivedCategories();
    await migrateBranding();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 You can now safely delete the local uploads folder if needed.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run the migration
runMigration();
