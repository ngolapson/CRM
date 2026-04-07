import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import employeesRouter from "./employees";
import customerStatusesRouter from "./customerStatuses";
import customerSourcesRouter from "./customerSources";
import productTypesRouter from "./productTypes";
import supplySourcesRouter from "./supplySources";
import productsRouter from "./products";
import stockReceiptsRouter from "./stockReceipts";
import customersRouter from "./customers";
import reportsRouter from "./reports";
import operationsRouter from "./operations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employeesRouter);
router.use(customerStatusesRouter);
router.use(customerSourcesRouter);
router.use(productTypesRouter);
router.use(supplySourcesRouter);
router.use(productsRouter);
router.use(stockReceiptsRouter);
router.use(customersRouter);
router.use(reportsRouter);
router.use(operationsRouter);

export default router;
