import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const r = await fetch(`http://localhost:8000/recommend/${userId}`);
    if (!r.ok) return res.status(502).json({ message: "Recommender service unavailable" });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching recommendations" });
  }
});

export default router;