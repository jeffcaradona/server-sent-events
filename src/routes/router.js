import express from 'express';
const router = express.Router();


import indexRouter from "./indexRouter.js";
import sseRouter from "./sseRouter.js";


router.use("/", indexRouter);

// Add the SSE router for handling server-sent events
// This will handle routes like /sse and /sse/sendToAll
router.use("/sse", sseRouter);




export default router;