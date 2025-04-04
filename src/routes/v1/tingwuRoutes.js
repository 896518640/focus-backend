// tingwuRoutes.js
// 阿里云通义听悟API路由

import express from 'express';
import tingwuController from '../../controllers/tingwuController.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 创建语音识别任务
router.post('/tasks', tingwuController.createTask);

// 获取任务信息
router.get('/tasks/:taskId', tingwuController.getTaskInfo);

// 创建热词词表
router.post('/vocabularies', tingwuController.createVocabulary);

export default router;