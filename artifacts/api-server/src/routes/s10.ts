import { Router, type IRouter } from "express";
import { getS10Configs, getS10ConfigsByYear } from "../lib/s10-database";
import { GetS10ConfigsByYearParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/s10/configs", async (_req, res): Promise<void> => {
  res.json(getS10Configs());
});

router.get("/s10/configs/:year", async (req, res): Promise<void> => {
  const params = GetS10ConfigsByYearParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const year = params.data.year;
  if (year < 1982 || year > 2004) {
    res.status(404).json({ error: `No S10 configurations found for year ${year}. Valid range: 1982–2004.` });
    return;
  }

  const configs = getS10ConfigsByYear(year);
  if (configs.length === 0) {
    res.status(404).json({ error: `No S10 configurations found for year ${year}.` });
    return;
  }

  res.json(configs);
});

export default router;
