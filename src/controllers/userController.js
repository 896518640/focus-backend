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
      let membership = null;
      try {
        membership = await prisma.membership.findUnique({
          where: { userId }
        });
      } catch (err) {
        this.logger.warn(`获取会员信息失败，可能是数据库结构问题: ${err.message}`);
        // 不阻止继续执行，使用默认会员信息
      }

      // 处理功能配置
      const features = {
        translationEnabled: userProfile.settings?.translationEnabled ?? true
      };

      // 处理使用情况统计
      const usage = {
        transcribeMinutesUsed: userProfile.usageStats?.transcribeMinutesUsed ?? 0,
        translateMinutesUsed: userProfile.usageStats?.translateMinutesUsed ?? 0
      };

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
        membership: membership ? {
          level: membership.level || 'free',
          next_reset_time: membership.nextResetTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          total_minutes: membership.totalMinutes || 90,
          used_minutes: membership.usedMinutes || 0
        } : {
          level: 'free',
          next_reset_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认30天后
          total_minutes: 90,
          used_minutes: 0
        },
        features,
        usage,
        recentActivities
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

  /**
   * 获取用户会员信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserMembership(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试获取用户会员信息，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('获取会员信息失败：用户ID不存在');
        return this.fail(res, '未授权，无法获取会员信息', null, 401);
      }
      
      // 获取会员状态
      let membership = null;
      try {
        membership = await prisma.membership.findUnique({
          where: { userId }
        });
      } catch (err) {
        this.logger.warn(`获取会员信息失败，可能是数据库结构问题: ${err.message}`);
        // 数据库结构可能有问题，直接创建一个新的会员记录作为替代
      }

      // 如果会员记录不存在或获取失败，则创建一个默认的免费会员记录
      if (!membership) {
        try {
          // 设置30天后的重置时间
          const resetDate = new Date();
          resetDate.setDate(resetDate.getDate() + 30);
          
          membership = await prisma.membership.create({
            data: {
              userId,
              level: 'free',
              nextResetTime: resetDate,
              totalMinutes: 90,
              usedMinutes: 0,
              isActive: true
            }
          });
          
          this.logger.info(`为用户 ${userId} 创建了默认免费会员记录`);
        } catch (createErr) {
          this.logger.error(`创建默认会员记录失败: ${createErr.message}`);
          // 如果创建也失败，使用内存中的默认值
          membership = {
            level: 'free',
            nextResetTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            totalMinutes: 90,
            usedMinutes: 0,
            isActive: true
          };
        }
      }

      // 计算剩余分钟数和剩余天数
      const level = membership.level || 'free';
      const totalMinutes = membership.totalMinutes || 90;
      const usedMinutes = membership.usedMinutes || 0;
      const nextResetTime = membership.nextResetTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const remainingMinutes = totalMinutes - usedMinutes;
      const now = new Date();
      const resetDate = new Date(nextResetTime);
      const remainingDays = Math.max(0, Math.ceil((resetDate - now) / (1000 * 60 * 60 * 24)));

      this.logger.info(`用户 ${userId} 会员信息获取成功`);
      return this.success(res, '获取会员信息成功', {
        level,
        next_reset_time: nextResetTime,
        total_minutes: totalMinutes,
        used_minutes: usedMinutes,
        remaining_minutes: remainingMinutes,
        remaining_days: remainingDays,
        is_active: membership.isActive || true
      });
    } catch (error) {
      this.logger.error('获取会员信息失败:', error);
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
            translationEnabled: !!enabled
          }
        });
      } catch (err) {
        this.logger.warn(`更新翻译功能开关失败，可能是数据库结构问题: ${err.message}`);
        // 如果数据库更新失败，返回前端开关状态，但不需要导致整个请求失败
        return this.success(res, `翻译功能已${!!enabled ? '开启' : '关闭'}`, {
          translationEnabled: !!enabled
        });
      }

      this.logger.info(`用户 ${userId} 翻译功能已${settings.translationEnabled ? '开启' : '关闭'}`);
      return this.success(res, `翻译功能已${settings.translationEnabled ? '开启' : '关闭'}`, {
        translationEnabled: settings.translationEnabled
      });
    } catch (error) {
      this.logger.error('切换翻译功能失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 获取用户使用情况统计
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUserUsage(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试获取用户使用情况，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('获取使用情况失败：用户ID不存在');
        return this.fail(res, '未授权，无法获取使用情况', null, 401);
      }
      
      // 获取使用情况统计
      let usageStats = null;
      try {
        usageStats = await prisma.usageStats.findUnique({
          where: { userId }
        });
      } catch (err) {
        this.logger.warn(`获取使用情况统计失败，可能是数据库结构问题: ${err.message}`);
        // 继续执行，使用默认值
      }

      // 如果没有记录或获取失败，创建一个默认记录
      if (!usageStats) {
        try {
          usageStats = await prisma.usageStats.create({
            data: {
              userId,
              studyHours: 0,
              recognitionCount: 0,
              fileCount: 0,
              translationCount: 0,
              summaryCount: 0,
              transcribeMinutesUsed: 0,
              translateMinutesUsed: 0
            }
          });
          
          this.logger.info(`为用户 ${userId} 创建了默认使用情况记录`);
        } catch (createErr) {
          this.logger.error(`创建默认使用情况记录失败: ${createErr.message}`);
          // 如果创建也失败，使用内存中的默认值
          usageStats = {
            studyHours: 0,
            recognitionCount: 0,
            fileCount: 0,
            translationCount: 0,
            summaryCount: 0,
            transcribeMinutesUsed: 0,
            translateMinutesUsed: 0
          };
        }
      }

      // 获取会员信息
      let membership = null;
      try {
        membership = await prisma.membership.findUnique({
          where: { userId }
        });
      } catch (err) {
        this.logger.warn(`获取会员信息失败，可能是数据库结构问题: ${err.message}`);
        // 继续执行，使用默认值
      }

      // 计算总使用分钟数和剩余分钟数
      const transcribeMinutesUsed = usageStats.transcribeMinutesUsed || 0;
      const translateMinutesUsed = usageStats.translateMinutesUsed || 0;
      const totalUsedMinutes = transcribeMinutesUsed + translateMinutesUsed;
      const totalAllowedMinutes = membership?.totalMinutes || 90;
      const remainingMinutes = Math.max(0, totalAllowedMinutes - totalUsedMinutes);

      this.logger.info(`用户 ${userId} 使用情况获取成功`);
      return this.success(res, '获取使用情况成功', {
        study_hours: usageStats.studyHours || 0,
        recognition_count: usageStats.recognitionCount || 0,
        file_count: usageStats.fileCount || 0,
        translation_count: usageStats.translationCount || 0,
        summary_count: usageStats.summaryCount || 0,
        transcribe_minutes_used: transcribeMinutesUsed,
        translate_minutes_used: translateMinutesUsed,
        total_used_minutes: totalUsedMinutes,
        total_allowed_minutes: totalAllowedMinutes,
        remaining_minutes: remainingMinutes
      });
    } catch (error) {
      this.logger.error('获取使用情况失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }
}

// 创建控制器实例
const userController = new UserController();

// 导出方法
export const getUserProfile = userController.getUserProfile.bind(userController);
export const updateUserProfile = userController.updateUserProfile.bind(userController);
export const getUserActivities = userController.getUserActivities.bind(userController);
export const recordActivity = userController.recordActivity.bind(userController);
export const getUserStats = userController.getUserStats.bind(userController);
export const updateUserSettings = userController.updateUserSettings.bind(userController);
export const getUserMembership = userController.getUserMembership.bind(userController);
export const toggleTranslation = userController.toggleTranslation.bind(userController);
export const getUserUsage = userController.getUserUsage.bind(userController);

// 导出默认实例
export default userController;
