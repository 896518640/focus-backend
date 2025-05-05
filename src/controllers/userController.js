// userController.js
// 用户控制器，处理用户资料、活动和设置管理

import BaseController from './BaseController.js';
import { PrismaClient } from '@prisma/client';

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
   * 获取用户详细资料
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserProfile(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试获取用户资料，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('获取用户资料失败：用户ID不存在');
        return this.fail(res, '未授权，无法获取用户资料', null, 401);
      }
      
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          settings: true,
          usageStats: true
        }
      });

      if (!userProfile) {
        this.logger.warn(`获取用户资料失败：未找到用户，userId: ${userId}`);
        return this.fail(res, '用户不存在', null, 404);
      }

      // 获取用户最近活动记录
      const recentActivities = await prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // 获取会员状态
      const membership = await prisma.membership.findUnique({
        where: { userId }
      });

      this.logger.info(`用户 ${userId} 资料获取成功`);
      return this.success(res, '获取用户资料成功', {
        ...userProfile,
        recentActivities,
        membership
      });
    } catch (error) {
      this.logger.error('获取用户资料失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 更新用户个人资料
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateUserProfile(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试更新用户资料，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('更新用户资料失败：用户ID不存在');
        return this.fail(res, '未授权，无法更新用户资料', null, 401);
      }
      
      const { username, displayName, avatar } = req.body;

      // 如果尝试将displayName设置为空，则生成默认显示名称
      let finalDisplayName = displayName;
      if (displayName !== undefined && (!displayName || displayName.trim() === '')) {
        const timestamp = Date.now().toString();
        finalDisplayName = `FOX_${timestamp.substring(timestamp.length - 6)}`;
        this.logger.info(`用户 ${userId} 尝试将显示名称设为空，已自动生成新名称: ${finalDisplayName}`);
      }

      // 更新用户基本信息
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(username && { username }),
          ...(displayName !== undefined && { displayName: finalDisplayName }),
          ...(avatar && { avatar }),
        },
      });

      this.logger.info(`用户 ${userId} 资料更新成功`);
      return this.success(res, '更新用户资料成功', {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        avatar: updatedUser.avatar,
      });
    } catch (error) {
      this.logger.error('更新用户资料失败:', error);
      if (error.code === 'P2002') {
        return this.fail(res, '用户名已存在', error, 400);
      }
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 获取用户活动记录
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserActivities(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试获取用户活动记录，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('获取用户活动记录失败：用户ID不存在');
        return this.fail(res, '未授权，无法获取用户活动记录', null, 401);
      }
      
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

      this.logger.info(`用户 ${userId} 活动记录获取成功，共 ${activities.length} 条`);
      return this.success(res, '获取活动记录成功', {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      this.logger.error('获取活动记录失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 获取用户使用统计
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试获取用户使用统计，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('获取用户使用统计失败：用户ID不存在');
        return this.fail(res, '未授权，无法获取用户使用统计', null, 401);
      }

      // 获取或创建用户统计数据
      let stats = await prisma.usageStats.findUnique({
        where: { userId },
      });

      if (!stats) {
        stats = await prisma.usageStats.create({
          data: { userId },
        });
      }

      this.logger.info(`用户 ${userId} 使用统计获取成功`);
      return this.success(res, '获取使用统计成功', stats);
    } catch (error) {
      this.logger.error('获取使用统计失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 更新用户设置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateUserSettings(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试更新用户设置，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('更新用户设置失败：用户ID不存在');
        return this.fail(res, '未授权，无法更新用户设置', null, 401);
      }
      
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

      this.logger.info(`用户 ${userId} 设置更新成功`);
      return this.success(res, '更新设置成功', updatedSettings);
    } catch (error) {
      this.logger.error('更新设置失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 记录用户活动
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async recordActivity(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试记录用户活动，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('记录用户活动失败：用户ID不存在');
        return this.fail(res, '未授权，无法记录用户活动', null, 401);
      }
      
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

      this.logger.info(`用户 ${userId} 活动记录成功，类型: ${type}`);
      return this.success(res, '记录活动成功', activity);
    } catch (error) {
      this.logger.error('记录活动失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
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
