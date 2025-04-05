// tingwuRoutes.js
// 通义听悟相关路由配置

import express from 'express';
import tingwuController from '../../controllers/tingwuController.js';
import multer from 'multer';
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
router.post('/upload', upload.single('audio'), tingwuController.uploadFile);

// 上传并转录路由
router.post('/upload-and-transcribe', upload.single('audio'), tingwuController.uploadAndTranscribe);

// 创建转录任务路由
router.post('/tasks', tingwuController.createTask);

// 获取任务信息路由
router.get('/tasks/:taskId', tingwuController.getTaskInfo);

// 轮询任务结果路由
router.get('/tasks/:taskId/poll', tingwuController.pollTaskResult);

// 获取JSON文件内容路由
router.post('/fetch-json', tingwuController.fetchJsonContent);

// 创建热词表路由
router.post('/vocabularies', tingwuController.createVocabulary);

export default router;