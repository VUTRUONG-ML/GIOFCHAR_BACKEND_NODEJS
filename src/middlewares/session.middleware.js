import dotenv from "dotenv";
dotenv.config();

const allowedOrigins = process.env.CLIENT_ORIGINS.split(",");

export const checkOrigin = (req, res, next) => {
  const origin = req.headers.origin;

  if (!origin && process.env.NODE_ENV === "development") {
    return next();
  }

  if (!origin) {
    return res.status(403).json({ message: "Missing origin" });
  }

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "Forbidden origin" });
  }

  next();
};

// check xem có phải là client của mình không
