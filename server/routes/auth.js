// Auth routes: /api/auth/…
const router = require('express').Router();
const { register, login, me, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/me', protect, updateMe);

module.exports = router;
