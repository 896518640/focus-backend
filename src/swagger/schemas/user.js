/**
 * 用户相关的Swagger模型定义
 */

export const userProfile = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000'
    },
    username: {
      type: 'string',
      example: 'user123'
    },
    displayName: {
      type: 'string',
      example: '张三'
    },
    email: {
      type: 'string',
      example: 'user@example.com'
    },
    avatar: {
      type: 'string',
      example: 'https://example.com/avatar.png'
    },
    role: {
      type: 'string',
      example: 'user'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    lastLoginAt: {
      type: 'string',
      format: 'date-time'
    }
  }
};

export const userSettings = {
  type: 'object',
  properties: {
    defaultSourceLanguage: {
      type: 'string',
      example: 'zh_cn'
    },
    defaultTargetLanguage: {
      type: 'string',
      example: 'en_us'
    },
    autoTranslate: {
      type: 'boolean',
      example: true
    },
    autoSpeak: {
      type: 'boolean',
      example: false
    },
    speechRate: {
      type: 'number',
      example: 1
    },
    theme: {
      type: 'string',
      example: 'system'
    }
  }
};

export const usageStats = {
  type: 'object',
  properties: {
    studyHours: {
      type: 'number',
      example: 10.5
    },
    recognitionCount: {
      type: 'integer',
      example: 25
    },
    fileCount: {
      type: 'integer',
      example: 15
    },
    translationCount: {
      type: 'integer',
      example: 30
    },
    summaryCount: {
      type: 'integer',
      example: 20
    }
  }
};

export const activity = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000'
    },
    title: {
      type: 'string',
      example: '上传了音频文件'
    },
    description: {
      type: 'string',
      example: '用户上传了一个音频文件进行转写'
    },
    type: {
      type: 'string',
      example: 'upload'
    },
    icon: {
      type: 'string',
      example: 'upload'
    },
    iconBg: {
      type: 'string',
      example: '#4caf50'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    }
  }
};

export default {
  userProfile,
  userSettings,
  usageStats,
  activity
}; 