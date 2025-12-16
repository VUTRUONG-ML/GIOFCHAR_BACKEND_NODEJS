export const switchCustomer = ({ userId, guestToken }) => {
  return userId
    ? { field: "userID", value: userId }
    : { field: "guestToken", value: guestToken };
};
