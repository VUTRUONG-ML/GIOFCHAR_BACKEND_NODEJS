const pool = require("../config/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const userService = require("./user.service");
require("dotenv").config();

const register = async (userName, email, phone, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.execute(
      `INSERT INTO users (userName, email, phone, password)
                                            VALUES (?, ?, ?, ?)`,
      [userName, email, phone, hashedPassword]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

const login = async (email, password) => {
  try {
    const user = await userService.getUserByEmail(email);

    const errorLogin = new Error("Email/password không chính xác!");
    errorLogin.statusCode = 401;
    if (!user) throw errorLogin;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw errorLogin;

    const payload = {
      userId: user.id,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const { password: _, ...userWithoutPassword } = user;
    return {
      access_token: token,
      user: userWithoutPassword,
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  register,
  login,
};
