import express from 'express';
const router = express.Router();

import * as sseSendTimeController from "../controllers/sseSendTimeController.js";
import * as ssePrivateSessionController from "../controllers/ssePrivateSessionController.js";
// SSE endpoint for server time
router.get("/time", sseSendTimeController.time);
//router.get("/privatesession",null)


export default router;