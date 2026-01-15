import crypto from "crypto";
import qs from "qs";
import dayjs from "dayjs";

import { vnpayConfig } from "../../config/vnpay.js";
import { sortObject } from "../../utils/payment.js";

export function buildVnpayPaymentUrl({
  orderId,
  amount,
  orderInfo = `Thanh toan don hang ${orderId}`,
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
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  const sortedVnpParams = sortObject(vnp_Params);

  const signData = qs.stringify(sortedVnpParams, { encode: false });

  const hmac = crypto.createHmac("sha512", vnpayConfig.secretKey);
  const secureHash = hmac.update(signData, "utf-8").digest("hex");

  vnp_Params.vnp_SecureHash = secureHash;

  return `${vnpayConfig.vnpUrl}?${qs.stringify(vnp_Params, { encode: false })}`;
}
