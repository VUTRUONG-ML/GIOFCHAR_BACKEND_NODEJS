require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/user.route");
const categoryRoutes = require("./routes/category.route");
const foodRoutes = require("./routes/food.route");
const cartRoutes = require("./routes/cart.route");
const orderRoutes = require("./routes/order.route");
const paymentRoutes = require("./routes/payment.route");
const authRoutes = require("./routes/auth.route");

const app = express();
const port = process.env.PORT || 8081;

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
