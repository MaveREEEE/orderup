import express from "express";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { top_n = 10 } = req.query;
    const recommenderUrl = process.env.RECOMMENDER_URL || "http://127.0.0.1:8000";

    // Dynamic import of node-fetch or use http module
    const https = await import("node:https");
    const http = await import("node:http");
    const url = new URL(`${recommenderUrl}/recommend/${userId}`);
    url.searchParams.set("top_n", top_n);

    const client = url.protocol === "https:" ? https.default : http.default;

    const data = await new Promise((resolve, reject) => {
      const request = client.get(url.toString(), { timeout: 25000 }, (response) => {
        let body = "";
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error("Invalid JSON from recommender"));
          }
        });
      });
      request.on("timeout", () => {
        request.destroy();
        reject(new Error("Recommender service timeout"));
      });
      request.on("error", reject);
    });

    res.json({
      success: true,
      recommendations: data.recommendations || [],
      count: (data.recommendations || []).length
    });
  } catch (err) {
    // Recommender unavailable — return empty gracefully (no error to client)
    res.json({ success: false, recommendations: [], count: 0 });
  }
});

export default router;
