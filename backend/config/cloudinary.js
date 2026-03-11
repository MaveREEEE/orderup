import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for food items
const foodStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'orderup/items',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Storage for categories
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'orderup/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'limit' }]
  }
});

// Storage for branding (logo/favicon)
const brandingStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'orderup/branding',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'ico', 'svg']
  }
});

// Storage for GCash payment proof uploads
const gcashProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'orderup/gcash-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
  }
});

export const foodUpload = multer({ storage: foodStorage });
export const categoryUpload = multer({ storage: categoryStorage });
export const brandingUpload = multer({ storage: brandingStorage });
export const gcashProofUpload = multer({ storage: gcashProofStorage });
export { cloudinary };
