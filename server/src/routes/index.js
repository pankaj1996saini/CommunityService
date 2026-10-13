const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, allow } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const auth = require('../controllers/authController');
const complaints = require('../controllers/complaintController');
const users = require('../controllers/userController');
const stats = require('../controllers/statsController');
const notifications = require('../controllers/notificationController');

const router = express.Router();

// stops someone hammering the login endpoint, generous enough for demos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, try again in a few minutes' },
});

// ---- auth
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.me);
router.put('/auth/me', protect, auth.updateMe);

// ---- complaints
router.get('/complaints', protect, complaints.list);
router.post('/complaints', protect, allow('user'), upload.array('images', 3), complaints.create);
router.get('/complaints/:id', protect, complaints.getOne);
router.patch('/complaints/:id/assign', protect, allow('admin'), complaints.assign);
router.patch('/complaints/:id/priority', protect, allow('admin'), complaints.setPriority);
router.patch(
  '/complaints/:id/status',
  protect,
  allow('admin', 'staff'),
  upload.array('workImages', 3),
  complaints.updateStatus
);
router.post('/complaints/:id/feedback', protect, allow('user'), complaints.addFeedback);

// ---- stats (role aware, see controller)
router.get('/stats', protect, stats.get);

// ---- users and staff (admin only)
router.get('/users/staff', protect, allow('admin'), users.staff);
router.get('/users', protect, allow('admin'), users.list);
router.post('/users', protect, allow('admin'), users.create);
router.patch('/users/:id', protect, allow('admin'), users.update);

// ---- notifications
router.get('/notifications', protect, notifications.list);
router.patch('/notifications/read-all', protect, notifications.markAllRead);
router.patch('/notifications/:id/read', protect, notifications.markRead);

module.exports = router;
