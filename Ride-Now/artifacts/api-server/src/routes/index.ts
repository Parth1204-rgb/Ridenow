import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ridesRouter from "./rides";
import driversRouter from "./drivers";
import bookingsRouter from "./bookings";
import usersRouter from "./users";
import vehiclesRouter from "./vehicles";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ridesRouter);
router.use(driversRouter);
router.use(bookingsRouter);
router.use(usersRouter);
router.use(vehiclesRouter);
router.use(adminRouter);

export default router;
