import { Router } from "express";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.post("/init", (req, res) => {
  const guestToken = uuidv4();

  return res.status(200).json({
    guest_token: guestToken,
  });
});

export default router;
