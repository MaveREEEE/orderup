import mongoose from "mongoose";
import adminModel from "../models/adminModel.js";
import dotenv from "dotenv";

dotenv.config();

const updateAdminRole = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Update all superadmin roles to itadmin
    const result = await adminModel.updateMany(
      { role: "superadmin" },
      { $set: { role: "itadmin" } }
    );

    console.log(`Updated ${result.modifiedCount} admin(s) from superadmin to itadmin`);

    // Verify the update
    const admins = await adminModel.find({});
    console.log("All admins after update:");
    admins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email}): ${admin.role}`);
    });

    await mongoose.connection.close();
    console.log("Done!");
  } catch (error) {
    console.error("Error updating admin roles:", error);
    process.exit(1);
  }
};

updateAdminRole();
