import express from 'express';
const router = express.Router();

import controller from '../controllers/indexController.js';

/* GET home page. */
router.get('/', controller.index);

// Add route for time SSE view
router.get('/time', (req, res) => res.render('time'));

export default router;