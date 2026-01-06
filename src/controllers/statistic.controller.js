import { revenue } from "../services/statistic.service.js";
import pool from "../config/db.js";
export const getRevenue = async (req, res) => {
  const day = req.query.range;
  console.log(day);
  try {
    const result = await revenue({ conn: pool, range: Number(day) });
    return res.status(200).json({ revenue: result });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
