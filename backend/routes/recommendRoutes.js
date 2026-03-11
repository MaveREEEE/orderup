import express from "express";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { top_n = 10 } = req.query;
    const recommenderBase =
      process.env.RECOMMENDER_URL ||
      process.env.VITE_RECOMMENDER_URL ||
      "https://orderuprecommender.onrender.com";
    const recommenderUrl = recommenderBase.replace(/\/$/, "");
    const url = new URL(`${recommenderUrl}/recommend/${userId}`);
    url.searchParams.set("top_n", top_n);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Upstream recommender failed (${response.status}): ${detail}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      recommendations: data.recommendations || [],
      count: (data.recommendations || []).length
    });
  } catch (err) {
    console.error("Recommendation proxy error:", err?.message || err);
    // Recommender unavailable — return empty gracefully but include debug message
    res.json({
      success: false,
      message: err?.message || "Recommender unavailable",
      recommendations: [],
      count: 0
    });
  }
});

export default router;
