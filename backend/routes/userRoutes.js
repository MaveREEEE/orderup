import express from "express";
import authMiddleware from "../middleware/auth.js";
import { checkRole } from "../middleware/roleAuth.js";
import userModel from "../models/userModel.js";
import { loginUser, registerUser, getUserProfile, listUsers, createUser, updateUser, deleteUser, updateOwnProfile } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/profile", getUserProfile);

// Customer profile update (authenticated users)
userRouter.put("/profile/update/:id", authMiddleware, updateOwnProfile);

// User management endpoints (superadmin only)
userRouter.get("/list", authMiddleware, checkRole(['superadmin']), listUsers);
userRouter.post("/create", authMiddleware, checkRole(['superadmin']), createUser);
userRouter.put("/update/:id", authMiddleware, checkRole(['superadmin']), updateUser);
userRouter.delete("/delete/:id", authMiddleware, checkRole(['superadmin']), deleteUser);

// Get user by id (must be last to avoid catching /list)
userRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select("name email phone address");
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.json({ success: false, message: "Error fetching user data" });
  }
});

export default userRouter;