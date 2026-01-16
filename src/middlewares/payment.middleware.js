import { signVnpayParams } from "../services/payments/vnpay.service.js";
import orderService from "../services/order.service.js";
import paymentService from "../services/payment.service.js";

export function verifyVnpaySignature(req, res, next) {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  if (vnp_Params.vnp_SecureHashType) {
    delete vnp_Params.vnp_SecureHashType;
  }

  const signed = signVnpayParams(vnp_Params);

  if (secureHash !== signed) {
    console.log("INVALID SIGNATURE");
    return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }

  req.vnpayParams = vnp_Params; // attach sang request
  next();
}

export async function checkVnpayOrder(req, res, next) {
  const { vnp_TxnRef, vnp_Amount } = req.vnpayParams;
  const amount = Number(vnp_Amount) / 100;

  const order = await orderService.getByOrderCode({ orderCode: vnp_TxnRef });
  if (!order) {
    console.log(">>> Payment for order not found");
    return res.json({ RspCode: "01", Message: "Order not found" });
  }

  const payment = await paymentService.getByOrderId(order.orderId);
  if (!payment) {
    console.log(">>> Payment not found");
    return res.json({ RspCode: "01", Message: "Payment not found" });
  }

  if (Number(order.amount) !== amount || Number(payment.amount) !== amount) {
    console.log(">>> Invalid amount");
    return res.json({ RspCode: "04", Message: "Amount invalid" });
  }

  req.order = order;
  req.payment = payment;
  next();
}
