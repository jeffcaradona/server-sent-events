import express from 'express';
const router = express.Router();

import * as sseSendTimeController from "../controllers/sseSendTimeController.js";

// SSE endpoint for server time
router.get("/time", sseSendTimeController.time);



export default router;