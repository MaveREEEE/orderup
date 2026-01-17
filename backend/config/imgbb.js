import multer from "multer";

// Multer storage config for ImgBB
// ImgBB will handle actual upload via API
const storage = multer.memoryStorage();

export const foodUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const categoryUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const brandingUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ImgBB upload function
export const uploadToImgBB = async (file) => {
  if (!file) return null;

  const FormData = await import("form-data").then(m => m.default);
  const fs = await import("fs");
  const path = await import("path");
  const fetch = await import("node-fetch").then(m => m.default);

  try {
    const formData = new FormData();
    formData.append("image", file.buffer);
    formData.append("key", process.env.IMGBB_API_KEY);

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url; // Returns the full image URL
    } else {
      throw new Error("ImgBB upload failed: " + (data.error?.message || "Unknown error"));
    }
  } catch (error) {
    console.error("ImgBB upload error:", error);
    throw error;
  }
};
