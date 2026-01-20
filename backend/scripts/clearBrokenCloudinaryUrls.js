import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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
const archivedFoodSchema = new mongoose.Schema({}, { strict: false });
const archivedCategorySchema = new mongoose.Schema({}, { strict: false });

const Food = mongoose.model('food', foodSchema);
const Category = mongoose.model('categories', categorySchema);
const ArchivedFood = mongoose.model('archivedfood', archivedFoodSchema);
const ArchivedCategory = mongoose.model('archivedcategory', archivedCategorySchema);

// Clear broken Cloudinary URLs
const clearBrokenUrls = async () => {
  console.log('🧹 Clearing broken Cloudinary URLs...\n');

  try {
    // Clear food items with Cloudinary URLs
    const foodResult = await Food.updateMany(
      { image: { $regex: '^https://res.cloudinary.com' } },
      { $set: { image: '' } }
    );
    console.log(`✅ Cleared ${foodResult.modifiedCount} food items`);

    // Clear archived food items
    const archivedFoodResult = await ArchivedFood.updateMany(
      { image: { $regex: '^https://res.cloudinary.com' } },
      { $set: { image: '' } }
    );
    console.log(`✅ Cleared ${archivedFoodResult.modifiedCount} archived food items`);

    // Clear categories
    const categoryResult = await Category.updateMany(
      { image: { $regex: '^https://res.cloudinary.com' } },
      { $set: { image: '' } }
    );
    console.log(`✅ Cleared ${categoryResult.modifiedCount} categories`);

    // Clear archived categories
    const archivedCategoryResult = await ArchivedCategory.updateMany(
      { image: { $regex: '^https://res.cloudinary.com' } },
      { $set: { image: '' } }
    );
    console.log(`✅ Cleared ${archivedCategoryResult.modifiedCount} archived categories`);

    console.log('\n✅ All broken Cloudinary URLs cleared!');
    console.log('💡 You can now re-upload images through the admin panel.');

  } catch (error) {
    console.error('❌ Failed to clear URLs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await clearBrokenUrls();
};

run();
