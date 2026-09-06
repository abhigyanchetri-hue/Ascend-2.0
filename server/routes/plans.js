// Plan routes: /api/plans (all require a valid JWT)
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  regeneratePlan,
} = require('../controllers/planController');

router.use(protect);

router.get('/', getPlans);
router.post('/', createPlan);
router.get('/:id', getPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);
router.post('/:id/generate', regeneratePlan);

module.exports = router;
