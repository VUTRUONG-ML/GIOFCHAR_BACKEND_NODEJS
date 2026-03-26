import crypto from "crypto";
import qs from "qs";
import dayjs from "dayjs";

import { vnpayConfig } from "../../config/vnpay.js";
import { sortObject } from "../../utils/payment.js";
import orderService from "../order.service.js";
import paymentService from "../payment.service.js";
import logger from "../../config/logger.js";

export function buildVnpayPaymentUrl({
  orderId,
  amount,
  orderInfo = `Thanh_toan_don_hang_${orderId}`,
  orderType = "other",
  bankCode,
  ipAddr,
  locale = "vn",
}) {
  const createDate = dayjs().format("YYYYMMDDHHmmss");
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: amount * 100, // VNPay yêu cầu *100
    vnp_ReturnUrl: vnpayConfig.returnUrl,
    vnp_CreateDate: createDate,
  };

  vnp_Params.vnp_IpAddr = ipAddr === "::1" ? "127.0.0.1" : ipAddr;

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  const secureHash = signVnpayParams(vnp_Params);

  vnp_Params.vnp_SecureHash = secureHash;

  const url = `${vnpayConfig.vnpUrl}?${qs.stringify(vnp_Params, {
    encode: false,
  })}`;
  logger.debug("BUILD_VNPAY_URL_SUCCESS", { orderId, amount, ipAddr });
  return url;
}

export function signVnpayParams(vnp_Params) {
  vnp_Params = sortObject(vnp_Params);
  const signData = qs.stringify(vnp_Params, { encode: false });

  const hmac = crypto.createHmac("sha512", vnpayConfig.secretKey);
  const signed = hmac.update(signData, "utf-8").digest("hex");
  return signed;
}

export async function processIpn({ order, payment, vnp_Params, connection }) {
  if (payment.paymentStatus !== "pending") {
    return {
      RspCode: "02",
      Message: "This payment has been updated to the payment status",
    };
  }
  const rspCode = vnp_Params.vnp_ResponseCode;
  const transactionId = vnp_Params.vnp_TransactionNo;

  const newPaymentStatus = rspCode === "00" ? "success" : "failed";

  await orderService.updatePaymentStatus(
    {
      orderId: order.orderId,
      paymentStatus: newPaymentStatus,
    },
    connection,
  );
  await paymentService.updatePaymentById(
    {
      paymentId: payment.paymentId,
      paymentStatus: newPaymentStatus,
      paymentType: payment.paymentType,
      transactionId: transactionId,
    },
    connection,
  );

  return { RspCode: "00", Message: "Success" };
}
