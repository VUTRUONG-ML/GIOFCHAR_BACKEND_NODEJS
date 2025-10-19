const paymentService = require("../services/payment.service");

const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments();

    res.status(200).json({ payments: payments });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getPaymentById = async (req, res) => {
  const paymentId = req.params.paymentId;
  try {
    const payment = await paymentService.getPaymentById(paymentId);
    if (payment.length === 0)
      return res.status(404).json({ message: "Payment not found" });

    res.status(200).json({ payment });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createPayment = async (req, res) => {
  const { orderId, paymentType, amount, transactionId, paymentStatus } =
    req.body;
  if (!orderId || !amount || !transactionId)
    return res.status(400).json({ message: "Missing field" });
  const validPaymentTypes = ["COD", "CARD"];
  const validStatuses = ["success", "failed", "pending"];

  if (
    !validPaymentTypes.includes(paymentType) ||
    !validStatuses.includes(paymentStatus)
  ) {
    return res
      .status(400)
      .json({ message: "Invalid paymentType or paymentStatus" });
  }

  try {
    const result = await paymentService.createPayment(
      orderId,
      paymentType,
      amount,
      transactionId,
      paymentStatus
    );

    res.status(201).json({
      message: "Create payment successful",
      paymentId: result.insertId,
    });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updatePayment = async (req, res) => {
  const paymentId = req.params.paymentId;
  const { paymentStatus, paymentType } = req.body;
  if (!paymentStatus || !paymentType)
    return res.status(400).json({ message: "Missing field" });

  try {
    const result = await paymentService.updatePaymentById(
      paymentId,
      paymentStatus,
      paymentType
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Payment not found" });
    res.status(200).json({ message: "Update payment successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deletePayment = async (req, res) => {
  const paymentId = req.params.paymentId;
  try {
    const result = await paymentService.deletePayment(paymentId);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Payment not found" });
    res
      .status(200)
      .json({ message: "Delete payment successful", payment: paymentId });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};
