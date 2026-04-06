import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(documentsRouter);
router.use(dashboardRouter);

export default router;
