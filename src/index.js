import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import "./config/db.js";
import express from "express";
import session from "express-session";
import userRoutes from "./routes/user.route.js";
import categoryRoutes from "./routes/category.route.js";
import foodRoutes from "./routes/food.route.js";
import cartRoutes from "./routes/cart.route.js";
import orderRoutes from "./routes/order.route.js";
import paymentRoutes from "./routes/payment.route.js";
import authRoutes from "./routes/auth.route.js";
import botChatRoutes from "./routes/botChat.route.js";
import statisticRoutes from "./routes/statistic.route.js";
import { checkOrigin } from "./middlewares/session.middleware.js";
import { errorHandler } from "./errors/errorHandler.js";
import promotionRoutes from "./routes/promotion.route.js";
import variantRoutes from "./routes/variant.route.js";

const app = express();
const port = process.env.PORT || 8081;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGINS.split(","),
    credentials: true, // cho gửi cookie / session
    exposedHeaders: ["X-Guest-Token"], // Cho phép frontend đọc header này
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(checkOrigin);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 60 * 1000 }, // 5p
    httpOnly: true,
    sameSite: "lax",
  }),
);

app.use("/api/variants", variantRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/statistic", statisticRoutes);
app.use("/api/botchat", botChatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/", (req, res) => {
  res.send("Hello world, this is GIOFCHAR WEBSITE");
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
