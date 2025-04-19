// userController.js
// 用户控制器，处理用户资料、活动和设置管理

import BaseController from './BaseController.js';
import { PrismaClient } from '@prisma/client';
import { formatResponse } from '../utils/responseFormatter.js';

const prisma = new PrismaClient();

/**
 * 用户控制器类
 * 处理用户相关操作：个人资料、活动记录、使用统计、设置等
 */
class UserController extends BaseController {
  constructor() {
    super('UserController');
  }

  /**
   * 获取用户个人资料
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * 
   * @swagger
   * /api/user/profile:
   *   get:
   *     summary: 获取用户个人资料
   *     description: 获取当前登录用户的详细个人资料，包括基本信息、会员状态、使用统计和最近活动
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取用户资料
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 获取用户资料成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     username:
   *                       type: string
   *                       example: user123
   *                     email:
   *                       type: string
   *                       example: user@example.com
   *                     avatar:
   *                       type: string
   *                       example: https://example.com/avatar.png
   *                     role:
   *                       type: string
   *                       example: user
   *                     isActive:
   *                       type: boolean
   *                       example: true
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     membership:
   *                       type: object
   *                       properties:
   *                         type:
   *                           type: string
   *                           example: premium
   *                         isActive:
   *                           type: boolean
   *                           example: true
   *                         startDate:
   *                           type: string
   *                           format: date-time
   *                         endDate:
   *                           type: string
   *                           format: date-time
   *                     usageStats:
   *                       type: object
   *                       properties:
   *                         studyHours:
   *                           type: number
   *                           example: 10.5
   *                         recognitionCount:
   *                           type: integer
   *                           example: 25
   *                         fileCount:
   *                           type: integer
   *                           example: 15
   *                         translationCount:
   *                           type: integer
   *                           example: 30
   *                         summaryCount:
   *                           type: integer
   *                           example: 20
   *                     settings:
   *                       type: object
   *                       properties:
   *                         defaultSourceLanguage:
   *                           type: string
   *                           example: zh_cn
   *                         defaultTargetLanguage:
   *                           type: string
   *                           example: en_us
   *                         autoTranslate:
   *                           type: boolean
   *                           example: true
   *                         autoSpeak:
   *                           type: boolean
   *                           example: false
   *                         speechRate:
   *                           type: number
   *                           example: 1
   *                         theme:
   *                           type: string
   *                           example: system
   *                     activities:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                             example: 1
   *                           title:
   *                             type: string
   *                             example: 上传了音频文件
   *                           description:
   *                             type: string
   *                             example: 用户上传了一个音频文件进行转写
   *                           type:
   *                             type: string
   *                             example: upload
   *                           icon:
   *                             type: string
   *                             example: upload
   *                           iconBg:
   *                             type: string
   *                             example: #4caf50
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *       401:
   *         description: 未授权，需要登录
   *       404:
   *         description: 用户不存在
   *       500:
   *         description: 服务器错误
   */
  async getUserProfile(req, res) {
    try {
      const userId = req.user.id;

      // 获取用户基本信息及关联数据
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          membership: true,
          usageStats: true,
          settings: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5, // 只获取最近5条活动
          },
        },
      });

      if (!user) {
        return res.status(404).json(formatResponse(404, '用户不存在'));
      }

      // 格式化返回数据，排除敏感信息
      const profile = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        membership: user.membership ? {
          type: user.membership.type,
          isActive: user.membership.isActive,
          startDate: user.membership.startDate,
          endDate: user.membership.endDate,
        } : null,
        usageStats: user.usageStats || {
          studyHours: 0,
          recognitionCount: 0,
          fileCount: 0,
          translationCount: 0,
          summaryCount: 0,
        },
        settings: user.settings || {
          defaultSourceLanguage: 'zh_cn',
          defaultTargetLanguage: 'en_us',
          autoTranslate: true,
          autoSpeak: false,
          speechRate: 1,
          theme: 'system',
        },
        activities: user.activities.map(activity => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.type,
          icon: activity.icon,
          iconBg: activity.iconBg,
          createdAt: activity.createdAt,
        })),
      };

      return res.json(formatResponse(0, '获取用户资料成功', profile));
    } catch (error) {
      this.logger.error('获取用户资料失败:', error);
      return res.status(500).json(formatResponse(500, '服务器错误'));
    }
  }

  /**
   * 更新用户个人资料
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * 
   * @swagger
   * /api/user/profile:
   *   put:
   *     summary: 更新用户个人资料
   *     description: 更新当前登录用户的基本个人资料信息
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *                 example: newUsername123
   *               avatar:
   *                 type: string
   *                 description: 头像URL
   *                 example: https://example.com/new-avatar.png
   *     responses:
   *       200:
   *         description: 成功更新用户资料
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 更新用户资料成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     username:
   *                       type: string
   *                       example: newUsername123
   *                     avatar:
   *                       type: string
   *                       example: https://example.com/new-avatar.png
   *       400:
   *         description: 用户名已存在
   *       401:
   *         description: 未授权，需要登录
   *       500:
   *         description: 服务器错误
   */
  async updateUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const { username, avatar } = req.body;

      // 更新用户基本信息
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(username && { username }),
          ...(avatar && { avatar }),
        },
      });

      return res.json(formatResponse(0, '更新用户资料成功', {
        id: updatedUser.id,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
      }));
    } catch (error) {
      this.logger.error('更新用户资料失败:', error);
      if (error.code === 'P2002') {
        return res.status(400).json(formatResponse(400, '用户名已存在'));
      }
      return res.status(500).json(formatResponse(500, '服务器错误'));
    }
  }

  /**
   * 获取用户活动记录
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * 
   * @swagger
   * /api/user/activities:
   *   get:
   *     summary: 获取用户活动记录
   *     description: 分页获取当前登录用户的活动记录
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 页码，默认为1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: 每页条数，默认为10
   *     responses:
   *       200:
   *         description: 成功获取活动记录
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 获取活动记录成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     activities:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                             example: 1
   *                           title:
   *                             type: string
   *                             example: 上传了音频文件
   *                           description:
   *                             type: string
   *                             example: 用户上传了一个音频文件进行转写
   *                           type:
   *                             type: string
   *                             example: upload
   *                           icon:
   *                             type: string
   *                             example: upload
   *                           iconBg:
   *                             type: string
   *                             example: #4caf50
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                           example: 1
   *                         limit:
   *                           type: integer
   *                           example: 10
   *                         total:
   *                           type: integer
   *                           example: 25
   *                         pages:
   *                           type: integer
   *                           example: 3
   *       401:
   *         description: 未授权，需要登录
   *       500:
   *         description: 服务器错误
   */
  async getUserActivities(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // 获取活动记录
      const activities = await prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      });

      // 获取总记录数
      const total = await prisma.activity.count({
        where: { userId },
      });

      return res.json(formatResponse(0, '获取活动记录成功', {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      }));
    } catch (error) {
      this.logger.error('获取活动记录失败:', error);
      return res.status(500).json(formatResponse(500, '服务器错误'));
    }
  }

  /**
   * 获取用户使用统计
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * 
   * @swagger
   * /api/user/stats:
   *   get:
   *     summary: 获取用户使用统计
   *     description: 获取当前登录用户的使用统计数据
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取使用统计
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 获取使用统计成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     studyHours:
   *                       type: number
   *                       example: 10.5
   *                     recognitionCount:
   *                       type: integer
   *                       example: 25
   *                     fileCount:
   *                       type: integer
   *                       example: 15
   *                     translationCount:
   *                       type: integer
   *                       example: 30
   *                     summaryCount:
   *                       type: integer
   *                       example: 20
   *       401:
   *         description: 未授权，需要登录
   *       500:
   *         description: 服务器错误
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      // 获取或创建用户统计数据
      let stats = await prisma.usageStats.findUnique({
        where: { userId },
      });

      if (!stats) {
        stats = await prisma.usageStats.create({
          data: { userId },
        });
      }

      return res.json(formatResponse(0, '获取使用统计成功', stats));
    } catch (error) {
      this.logger.error('获取使用统计失败:', error);
      return res.status(500).json(formatResponse(500, '服务器错误'));
    }
  }

  /**
   * 更新用户设置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * 
   * @swagger
   * /api/user/settings:
   *   put:
   *     summary: 更新用户设置
   *     description: 更新当前登录用户的应用设置
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               defaultSourceLanguage:
   *                 type: string
   *                 description: 默认源语言
   *                 example: zh_cn
   *               defaultTargetLanguage:
   *                 type: string
   *                 description: 默认目标语言
   *                 example: en_us
   *               autoTranslate:
   *                 type: boolean
   *                 description: 是否自动翻译
   *                 example: true
   *               autoSpeak:
   *                 type: boolean
   *                 description: 是否自动朗读
   *                 example: false
   *               speechRate:
   *                 type: number
   *                 description: 语音速率
   *                 example: 1
   *               theme:
   *                 type: string
   *                 description: 界面主题
   *                 example: dark
   *     responses:
   *       200:
   *         description: 成功更新设置
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 更新设置成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     defaultSourceLanguage:
   *                       type: string
   *                       example: zh_cn
   *                     defaultTargetLanguage:
   *                       type: string
   *                       example: en_us
   *                     autoTranslate:
   *                       type: boolean
   *                       example: true
   *                     autoSpeak:
   *                       type: boolean
   *                       example: false
   *                     speechRate:
   *                       type: number
   *                       example: 1
   *                     theme:
   *                       type: string
   *                       example: dark
   *       401:
   *         description: 未授权，需要登录
   *       500:
   *         description: 服务器错误
   */
  async updateUserSettings(req, res) {
    try {
      const userId = req.user.id;
      const settings = req.body;

      // 验证设置字段
      const validFields = [
        'defaultSourceLanguage',
        'defaultTargetLanguage',
        'autoTranslate',
        'autoSpeak',
        'speechRate',
        'theme',
      ];

      const validSettings = {};
      for (const key of validFields) {
        if (settings[key] !== undefined) {
          validSettings[key] = settings[key];
        }
      }

      // 更新或创建用户设置
      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: validSettings,
        create: {
          ...validSettings,
          userId,
        },
      });

      return res.json(formatResponse(0, '更新设置成功', updatedSettings));
    } catch (error) {
      this.logger.error('更新设置失败:', error);
      return res.status(500).json(formatResponse(500, '服务器错误'));
    }
  }

  /**
   * 记录用户活动
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * 
   * @swagger
   * /api/user/activity:
   *   post:
   *     summary: 记录用户活动
   *     description: 为当前登录用户创建一条新的活动记录
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - type
   *             properties:
   *               title:
   *                 type: string
   *                 description: 活动标题
   *                 example: 上传了音频文件
   *               description:
   *                 type: string
   *                 description: 活动详细描述
   *                 example: 用户上传了一个音频文件进行转写
   *               type:
   *                 type: string
   *                 description: 活动类型
   *                 example: upload
   *               icon:
   *                 type: string
   *                 description: 活动图标
   *                 example: upload
   *               iconBg:
   *                 type: string
   *                 description: 活动图标背景色
   *                 example: "#4caf50"
   *               audioJobId:
   *                 type: string
   *                 description: 关联的音频任务ID
   *                 example: job_123456
   *     responses:
   *       200:
   *         description: 成功记录活动
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 记录活动成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     title:
   *                       type: string
   *                       example: 上传了音频文件
   *                     description:
   *                       type: string
   *                       example: 用户上传了一个音频文件进行转写
   *                     type:
   *                       type: string
   *                       example: upload
   *                     icon:
   *                       type: string
   *                       example: upload
   *                     iconBg:
   *                       type: string
   *                       example: "#4caf50"
   *                     userId:
   *                       type: integer
   *                       example: 1
   *                     audioJobId:
   *                       type: string
   *                       example: job_123456
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: 未授权，需要登录
   *       500:
   *         description: 服务器错误
   */
  async recordActivity(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, type, icon, iconBg, audioJobId } = req.body;

      // 创建活动记录
      const activity = await prisma.activity.create({
        data: {
          title,
          description,
          type,
          icon,
          iconBg,
          userId,
          ...(audioJobId && { audioJobId }),
        },
      });

      return res.json(formatResponse(0, '记录活动成功', activity));
    } catch (error) {
      this.logger.error('记录活动失败:', error);
      return res.status(500).json(formatResponse(500, '服务器错误'));
    }
  }
}

// 创建实例
const userController = new UserController();

// 导出与原接口保持兼容的函数
export const getUserProfile = userController.getUserProfile.bind(userController);
export const updateUserProfile = userController.updateUserProfile.bind(userController);
export const getUserActivities = userController.getUserActivities.bind(userController);
export const getUserStats = userController.getUserStats.bind(userController);
export const updateUserSettings = userController.updateUserSettings.bind(userController);
export const recordActivity = userController.recordActivity.bind(userController);
