export function validateOwner({ userId, guestToken }) {
  if (userId && guestToken) {
    throw new Error("Asset cannot belong to both user and guest");
  }

  if (!userId && !guestToken) {
    throw new Error("Asset must have an owner");
  }
}
