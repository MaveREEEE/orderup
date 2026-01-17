import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const recommenderBase = process.env.RECOMMENDER_URL || "http://localhost:8000";

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await fetch(`${recommenderBase}/recommend/${encodeURIComponent(userId)}`);
    if (!response.ok) {
      return res.status(502).json({ message: "Recommender service unavailable" });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Recommendation fetch failed", err);
    res.status(500).json({ message: "Error fetching recommendations" });
  }
});

export default router;
