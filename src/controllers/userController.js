// userController.js
// 用户控制器，处理用户资料、活动和设置管理

import BaseController from './BaseController.js';
import prisma from '../services/prisma.js';

/**
 * 用户控制器类
 * 处理用户相关操作：个人资料、使用统计、设置等
 */
class UserController extends BaseController {
  constructor() {
    super('UserController');
  }

  /**
   * 获取用户详细资料
   * 整合了会员信息、使用统计和功能设置
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
      
      // 获取用户基本信息、设置和使用统计
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
          usageStats: true,
          membership: true,
          translations: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              title: true,
              createdAt: true,
              status: true,
              sourceLanguage: true,
              targetLanguage: true,
              duration: true
            }
          }
        }
      });

      if (!userProfile) {
        this.logger.warn(`获取用户资料失败：未找到用户，userId: ${userId}`);
        return this.fail(res, '用户不存在', null, 404);
      }

      // 处理会员信息
      const membership = userProfile.membership || {
        level: 'free',
        nextResetTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalMinutes: 90,
        usedMinutes: 0
      };

      // 处理功能配置
      const features = {
        translationEnabled: userProfile.settings?.translationEnabled ?? true
      };

      // 处理使用情况统计
      const usage = {
        transcribeMinutesUsed: userProfile.usageStats?.transcribeMinutesUsed ?? 0,
        translateMinutesUsed: userProfile.usageStats?.translateMinutesUsed ?? 0,
        translationCount: userProfile.usageStats?.translationCount ?? 0
      };

      // 计算剩余可用时间
      const remainingMinutes = membership.totalMinutes - membership.usedMinutes;

      // 准备默认设置
      const defaultSettings = {
        sourceLanguage: 'cn',
        targetLanguage: 'en',
        autoSave: true,
        theme: 'system',
        translationEnabled: true
      };
      
      // 用户设置（使用默认值填充缺失字段）
      const userSettings = userProfile.settings || defaultSettings;

      this.logger.info(`用户 ${userId} 资料获取成功`);
      return this.success(res, '获取用户资料成功', {
        user_id: userProfile.id,
        username: userProfile.username,
        displayName: userProfile.displayName,
        email: userProfile.email,
        avatar: userProfile.avatar,
        role: userProfile.role,
        createdAt: userProfile.createdAt,
        lastLoginAt: userProfile.lastLoginAt,
        
        // 会员信息
        membership: {
          level: membership.level || 'free',
          next_reset_time: membership.nextResetTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          total_minutes: membership.totalMinutes || 90,
          used_minutes: membership.usedMinutes || 0,
          remaining_minutes: remainingMinutes > 0 ? remainingMinutes : 0
        },
        
        // 功能开关
        features,
        
        // 使用统计
        usage,
        
        // 用户设置
        settings: {
          sourceLanguage: userSettings.sourceLanguage || 'cn',
          targetLanguage: userSettings.targetLanguage || 'en',
          autoSave: userSettings.autoSave !== undefined ? userSettings.autoSave : true,
          theme: userSettings.theme || 'system',
          translationEnabled: userSettings.translationEnabled !== undefined ? userSettings.translationEnabled : true
        },
        
        // 最近翻译记录
        recent_translations: userProfile.translations || []
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

      const { 
        sourceLanguage,
        targetLanguage, 
        autoSave,
        theme,
        translationEnabled 
      } = req.body;

      // 确保对象存在合法值
      const settingsToUpdate = {};
      
      if (sourceLanguage !== undefined) settingsToUpdate.sourceLanguage = sourceLanguage;
      if (targetLanguage !== undefined) settingsToUpdate.targetLanguage = targetLanguage;
      if (autoSave !== undefined) settingsToUpdate.autoSave = !!autoSave;
      if (theme !== undefined) settingsToUpdate.theme = theme;
      if (translationEnabled !== undefined) settingsToUpdate.translationEnabled = !!translationEnabled;

      // 使用upsert确保即使用户设置不存在也会创建一个
      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: settingsToUpdate,
        create: {
          userId,
          ...settingsToUpdate,
          sourceLanguage: settingsToUpdate.sourceLanguage || 'cn',
          targetLanguage: settingsToUpdate.targetLanguage || 'en',
          autoSave: settingsToUpdate.autoSave !== undefined ? settingsToUpdate.autoSave : true,
          theme: settingsToUpdate.theme || 'system',
          translationEnabled: settingsToUpdate.translationEnabled !== undefined ? settingsToUpdate.translationEnabled : true
        },
      });

      this.logger.info(`用户 ${userId} 设置更新成功`);
      return this.success(res, '更新用户设置成功', updatedSettings);
    } catch (error) {
      this.logger.error('更新用户设置失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }
  
  /**
   * 切换翻译功能开关
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async toggleTranslation(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试切换翻译功能，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('切换翻译功能失败：用户ID不存在');
        return this.fail(res, '未授权，无法切换翻译功能', null, 401);
      }
      
      const { enabled } = req.body;
      
      // 验证参数
      if (enabled === undefined) {
        this.logger.warn('切换翻译功能失败：缺少enabled参数');
        return this.fail(res, '缺少参数：enabled', null, 400);
      }

      let settings;
      try {
        // 更新用户设置中的翻译功能开关
        settings = await prisma.userSettings.upsert({
          where: { userId },
          update: {
            translationEnabled: !!enabled
          },
          create: {
            userId,
            translationEnabled: !!enabled,
            sourceLanguage: 'cn',
            targetLanguage: 'en',
            autoSave: true,
            theme: 'system'
          }
        });
      } catch (err) {
        this.logger.error(`切换翻译功能失败，数据库错误: ${err.message}`, err);
        return this.fail(res, '服务器错误，请稍后再试', err, 500);
      }

      this.logger.info(`用户 ${userId} 翻译功能已${enabled ? '开启' : '关闭'}`);
      return this.success(res, `翻译功能已${enabled ? '开启' : '关闭'}`, {
        translationEnabled: settings.translationEnabled
      });
    } catch (error) {
      this.logger.error('切换翻译功能失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }
}

export default new UserController();
