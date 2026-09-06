// Stats routes: /api/stats (all require a valid JWT)
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { heatmap, summary, dayDetail } = require('../controllers/statsController');

router.use(protect);

router.get('/heatmap', heatmap);
router.get('/summary', summary);
router.get('/day/:date', dayDetail);

module.exports = router;
