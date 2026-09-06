// Task routes: /api/tasks (all require a valid JWT)
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
} = require('../controllers/taskController');

router.use(protect);

router.get('/', listTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/complete', toggleComplete);

module.exports = router;
