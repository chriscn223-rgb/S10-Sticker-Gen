import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vinRouter from "./vin";
import s10Router from "./s10";
import stickersRouter from "./stickers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vinRouter);
router.use(s10Router);
router.use(stickersRouter);

export default router;
