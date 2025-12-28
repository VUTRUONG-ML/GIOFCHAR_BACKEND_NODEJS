const pool = require("../config/db");

const getAllFoodsAdmin = async () => {
  try {
    // For pool initialization, see above
    const [foods] = await pool.execute(`
      SELECT 
        f.id as foodId,
        foodName, 
        foodDescription,
        price,
        stock,
        isActive,
        image,
        f.categoryID,
        
        c.categoryName
      FROM foods f
      JOIN categories c ON f.categoryID = c.id`);
    return foods;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const getAllFoods = async ({ option = "default" }) => {
  // const typeOption = "default" | "bestSelling" | "promotion";
  console.log(">>> check option:", option);
  let field;
  let optionGet;
  switch (option) {
    case "bestSelling":
      field = `
        , 
        SUM(oi.quantity) as quantityOrdered 
      `;
      optionGet = `
        JOIN order_items oi ON f.id = oi.foodID
        GROUP BY f.id
        ORDER BY quantityOrdered DESC
        `;
      break;
    default:
      field = "";
      optionGet = "";
      break;
  }

  console.log(">>> check field:", field);
  console.log(">>> check optionget:", optionGet);

  try {
    const [foods] = await pool.execute(`
      SELECT 
        f.id as foodId,
        foodName, 
        price,
        discount,
        rating,
        isActive,
        image,
        f.categoryID,
        
        c.categoryName ${field}
      FROM foods f
      JOIN categories c ON f.categoryID = c.id
      ${optionGet}
    `);
    return foods;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const createFood = async (
  foodName,
  foodDescription,
  ingredients,
  price,
  discount,
  rating,
  stock,
  isActive,
  categoryID,
  image,
  imagePublicId
) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO foods (
            foodName,
            foodDescription,
            ingredients,
            price,
            discount,
            rating,
            stock,
            isActive,
            categoryID,
            image,
            imagePublicId
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
      [
        foodName,
        foodDescription,
        ingredients || [
          "Thịt heo tươi",
          "Da heo",
          "Lá chuối",
          "Gia vị truyền thống",
        ],
        price,
        discount ?? 0,
        rating ?? 0,
        stock ?? 0,
        isActive ?? true,
        categoryID,
        image || "",
        imagePublicId || "",
      ]
    );

    return { insertId: result.insertId };
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const getFoodById = async (foodId, { isAdmin = false }) => {
  const field = isAdmin
    ? "stock, imagePublicId, discount,"
    : "discount, rating, ingredients,";
  try {
    // For pool initialization, see above
    const [foods] = await pool.execute(
      `SELECT 
        f.id as foodId,
        foodName, 
        foodDescription,
        ${field}
        price,
        isActive,
        image,
        f.categoryID,
        
        c.categoryName
      FROM foods f
      JOIN categories c ON f.categoryID = c.id
      WHERE f.id = ?`,
      [foodId]
    );
    return foods.length > 0 ? foods[0] : null;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const updateFoodById = async (
  foodName,
  foodDescription,
  price,
  discount, //
  rating, //
  stock,
  isActive,
  categoryID,
  image,
  imagePublicId,
  foodId
) => {
  try {
    const [result] = await pool.execute(
      `UPDATE foods 
            SET foodName = ?,foodDescription = ?,price = ?,discount = ?,rating = ?,stock = ?,isActive = ?,categoryID = ?,image = ?, imagePublicId = ?
            WHERE id = ?`,
      [
        foodName,
        foodDescription,
        price,
        discount ?? 0,
        rating ?? 0,
        stock ?? 0,
        isActive ?? true,
        categoryID,
        image || "",
        imagePublicId || "",
        foodId,
      ]
    );

    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const deleteFoodById = async (foodId) => {
  try {
    // For pool initialization, see above
    const [result] = await pool.execute("DELETE FROM foods WHERE id = ?", [
      foodId,
    ]);
    return result;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const searchFood = async (key) => {
  try {
    const [result] = await pool.execute(
      `
      SELECT 
        f.id ,
        f.foodName,
        f.price ,
        f.image,
        f.stock,
        c.id as categoryId,
        c.categoryName 
      FROM foods f
      JOIN categories c ON f.categoryID = c.id 
      WHERE (f.foodName LIKE CONCAT("%", ?, "%") OR f.foodDescription LIKE CONCAT("%", ?, "%")) 
            AND f.stock  > 0`,
      [key, key]
    );

    return result;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR", error.message);
    throw error;
  }
};

const filterFood = async (preference, budget, quantity) => {
  try {
    const [foods] = await pool.execute(
      `
      SELECT
        f.id as foodId,
        f.foodName,
        f.foodDescription,
        f.price ,
        c.categoryName AS categoryName
      FROM foods f
      JOIN categories c ON f.categoryID = c.id
      WHERE f.isActive = TRUE
        AND (f.foodName LIKE CONCAT("%", ?, "%") OR f.foodDescription LIKE CONCAT("%", ?, "%") OR c.categoryName LIKE CONCAT("%", ?, "%"))
        AND f.price <= ?
        AND f.stock >= ?
      ORDER BY f.price ASC;
    `,
      [preference, preference, preference, budget, quantity]
    );
    return foods.length > 0 ? foods : null;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR:", error.message);
    throw error;
  }
};

const getStock = async (conn, foodId, { forUpdate = false }) => {
  try {
    const isLock = forUpdate ? "FOR UPDATE" : "";
    const [result] = await conn.execute(
      `SELECT stock FROM foods WHERE id = ? ${isLock}`,
      [foodId]
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR get stock:", error.message);
    throw error;
  }
};

const updateStock = async (conn, foodId, quantityOrder) => {
  try {
    const [result] = await conn.execute(
      `
      UPDATE foods
      SET stock = stock - ?
      WHERE id = ? AND stock >= ?
      `,
      [quantityOrder, foodId, quantityOrder]
    );
    return result.affectedRows === 1 ? true : false;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR update stock:", error.message);
    throw error;
  }
};

const deductStockForOrder = async (conn, cartItems) => {
  try {
    for (const item of cartItems) {
      const updated = await updateStock(conn, item.foodId, item.quantity);
      if (!updated) throw new Error("OUT_OF_STOCK");
    }
    return true;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR deduct stock:", error.message);
    throw error;
  }
};

module.exports = {
  getAllFoods,
  getAllFoodsAdmin,
  createFood,
  getFoodById,
  updateFoodById,
  deleteFoodById,
  searchFood,
  filterFood,
  getStock,
  updateStock,
  deductStockForOrder,
};
