import jwt from "jsonwebtoken";
import * as User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authenticate = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch actual user from DB (optional but recommended for /me)
    // If your JWT already has all user data, you can skip this
    const user = await User.findById(decoded.id || decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user; // or req.user = decoded if you prefer
    next();
  } catch (error) {
    // ✅ 401, not 400 — invalid/expired token is an auth failure
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

// const authenticate = (req, res, next) => {
//   const token = req.cookies?.token; // req.cookies is undefined without cookie-parser!

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.user = decoded; // This is what your `me` controller uses
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

export { authenticate, authorizeAdmin };
