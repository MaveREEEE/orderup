import express from "express";

const router = express.Router();

// Recommendation endpoint - currently disabled as recommender service is not deployed
// The frontend will fall back to default recommendations when this fails
router.get("/:userId", async (req, res) => {
  try {
    // Return empty recommendations to allow frontend fallback
    res.json({ 
      success: false, 
      message: "Recommender service not available",
      recommendations: []
    });
  } catch (err) {
    console.error("Recommendation error", err);
    res.status(500).json({ message: "Error fetching recommendations", recommendations: [] });
  }
});

export default router;
