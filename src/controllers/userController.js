import { PrismaClient } from '@prisma/client';
import { formatResponse } from '../utils/responseFormatter.js';

const prisma = new PrismaClient();

/**
 * 获取用户个人资料
 */
export const getUserProfile = async (req, res) => {
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
    console.error('获取用户资料失败:', error);
    return res.status(500).json(formatResponse(500, '服务器错误'));
  }
};

/**
 * 更新用户个人资料
 */
export const updateUserProfile = async (req, res) => {
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
    console.error('更新用户资料失败:', error);
    if (error.code === 'P2002') {
      return res.status(400).json(formatResponse(400, '用户名已存在'));
    }
    return res.status(500).json(formatResponse(500, '服务器错误'));
  }
};

/**
 * 获取用户活动记录
 */
export const getUserActivities = async (req, res) => {
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
    console.error('获取活动记录失败:', error);
    return res.status(500).json(formatResponse(500, '服务器错误'));
  }
};

/**
 * 获取用户使用统计
 */
export const getUserStats = async (req, res) => {
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
    console.error('获取使用统计失败:', error);
    return res.status(500).json(formatResponse(500, '服务器错误'));
  }
};

/**
 * 更新用户设置
 */
export const updateUserSettings = async (req, res) => {
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
    console.error('更新设置失败:', error);
    return res.status(500).json(formatResponse(500, '服务器错误'));
  }
};

/**
 * 记录用户活动
 */
export const recordActivity = async (req, res) => {
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
    console.error('记录活动失败:', error);
    return res.status(500).json(formatResponse(500, '服务器错误'));
  }
};
