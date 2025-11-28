import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import userRoutes from "./routes/user.route.js";
import categoryRoutes from "./routes/category.route.js";
import foodRoutes from "./routes/food.route.js";
import cartRoutes from "./routes/cart.route.js";
import orderRoutes from "./routes/order.route.js";
import paymentRoutes from "./routes/payment.route.js";
import authRoutes from "./routes/auth.route.js";

const app = express();
const port = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
