// tingwuRoutes.js
// 通义听悟相关路由配置

import express from 'express';
import tingwuController from '../../controllers/tingwuController.js';
import multer from 'multer';
import asyncHandler from '../../utils/asyncHandler.js';
// import { authenticate } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 配置文件上传中间件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 限制文件大小为100MB
  },
});

// 开发测试阶段暂时禁用认证
// router.use(authenticate);

// 文件上传路由
router.post('/upload', upload.single('audio'), asyncHandler(tingwuController.uploadFile));

// 创建听悟 任务
router.post('/tasks', asyncHandler(tingwuController.createTask));

// 查询听悟 状态
router.get('/tasks/:taskId', asyncHandler(tingwuController.getTaskInfo));

// 轮询听悟 任务结果
router.get('/tasks/:taskId/poll', asyncHandler(tingwuController.pollTaskResult));

// 获取JSON文件内容路由
router.post('/fetch-json', asyncHandler(tingwuController.fetchJsonContent));

// 创建热词表路由
router.post('/vocabularies', asyncHandler(tingwuController.createVocabulary));

export default router;