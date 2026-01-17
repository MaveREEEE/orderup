import jwt from "jsonwebtoken"

const authMiddleware = (req, res, next) => {
  const token =
    req.headers.token ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // role must be present here!
    next();
  } catch (e) {
    console.error("Token verification failed:", e.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authMiddleware;