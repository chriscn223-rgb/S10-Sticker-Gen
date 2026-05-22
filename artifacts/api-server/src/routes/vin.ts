import { Router, type IRouter } from "express";
import { decodeVin } from "../lib/vin-decoder";
import { findBestConfig } from "../lib/s10-database";
import { DecodeVinBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/vin/decode", async (req, res): Promise<void> => {
  const parsed = DecodeVinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = decodeVin(parsed.data.vin);

  if (!result.isValid) {
    res.status(400).json({ error: "Invalid VIN: check digit verification failed or format is incorrect." });
    return;
  }

  if (!result.isS10) {
    res.status(400).json({ error: "This VIN does not appear to be a Chevrolet S10 (1982–2004). Only S10 pickups are supported." });
    return;
  }

  if (!result.year) {
    res.status(400).json({ error: "Could not determine model year from VIN. Ensure this is a 1982–2004 vehicle." });
    return;
  }

  const suggestedConfig = findBestConfig(
    result.year,
    result.trim,
    result.engineCode,
    result.drivetrainCode,
    result.cabConfig,
  );

  res.json({
    ...result,
    suggestedConfig: suggestedConfig ?? null,
  });
});

export default router;
