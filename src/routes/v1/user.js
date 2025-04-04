import express from 'express';
import { authenticate } from '../../middlewares/authMiddleware.js';
import {
  getUserProfile,
  updateUserProfile,
  getUserActivities,
  getUserStats,
  updateUserSettings,
  recordActivity
} from '../../controllers/userController.js';

const router = express.Router();

// 所有用户路由都需要验证token
router.use(authenticate);

// 用户资料相关路由
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// 用户活动记录相关路由
router.get('/activities', getUserActivities);
router.post('/activities', recordActivity);

// 用户统计相关路由
router.get('/stats', getUserStats);

// 用户设置相关路由
router.put('/settings', updateUserSettings);

export default router;
