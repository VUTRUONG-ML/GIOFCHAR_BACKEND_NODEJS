export function validateCartOwner({ userId, guestToken }) {
  console.log("checkvalidate", userId);
  if (userId && guestToken) {
    throw new Error("Cart cannot belong to both user and guest");
  }

  if (!userId && !guestToken) {
    throw new Error("Cart must have an owner");
  }
}
