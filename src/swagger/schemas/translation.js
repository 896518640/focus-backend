// translation.js
// 翻译记录相关的Swagger模型定义

/**
 * Swagger schema 翻译记录相关定义
 */
export default {
  /**
   * 保存翻译记录请求参数
   */
  SaveTranslationParams: {
    type: 'object',
    required: ['title', 'sourceLanguage', 'targetLanguage', 'originalText', 'translatedText', 'duration', 'timestamp'],
    properties: {
      taskId: {
        type: 'string',
        nullable: true,
        description: '任务ID（可选）'
      },
      title: {
        type: 'string',
        description: '标题'
      },
      sourceLanguage: {
        type: 'string',
        description: '源语言'
      },
      targetLanguage: {
        type: 'string',
        description: '目标语言'
      },
      originalText: {
        type: 'string',
        description: '原文内容'
      },
      translatedText: {
        type: 'string',
        description: '翻译内容'
      },
      duration: {
        type: 'number',
        description: '录音时长（秒）'
      },
      timestamp: {
        type: 'number',
        description: '时间戳'
      },
      taskStatus: {
        type: 'string',
        description: '任务状态',
        enum: ['success', 'processing', 'failed']
      },
      outputMp3Path: {
        type: 'string',
        nullable: true,
        description: '输出MP3文件路径'
      },
      errorMessage: {
        type: 'string',
        nullable: true,
        description: '错误信息'
      },
      tags: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: '标签（可选）'
      }
    }
  },

  /**
   * 翻译记录响应
   */
  TranslationResponse: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: '记录ID'
      },
      title: {
        type: 'string',
        description: '标题'
      },
      sourceText: {
        type: 'string',
        description: '原文内容'
      },
      translatedText: {
        type: 'string',
        description: '翻译内容'
      },
      originalText: {
        type: 'string',
        description: '原文内容（兼容字段）'
      },
      sourceLanguage: {
        type: 'string',
        description: '源语言'
      },
      targetLanguage: {
        type: 'string',
        description: '目标语言'
      },
      taskId: {
        type: 'string',
        nullable: true,
        description: '任务ID'
      },
      taskStatus: {
        type: 'string',
        nullable: true,
        description: '任务状态',
        enum: ['success', 'processing', 'failed']
      },
      duration: {
        type: 'number',
        description: '录音时长（秒）'
      },
      timestamp: {
        type: 'number',
        description: '时间戳'
      },
      outputMp3Path: {
        type: 'string',
        nullable: true,
        description: '输出MP3文件路径'
      },
      errorMessage: {
        type: 'string',
        nullable: true,
        description: '错误信息'
      },
      tags: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: '标签'
      },
      isFavorite: {
        type: 'boolean',
        description: '是否收藏'
      },
      isVoice: {
        type: 'boolean',
        description: '是否语音翻译'
      },
      status: {
        type: 'string',
        description: '记录状态',
        enum: ['success', 'processing', 'failed']
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: '创建时间'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: '更新时间'
      }
    }
  },

  /**
   * 翻译记录列表响应
   */
  TranslationListResponse: {
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description: '总记录数'
      },
      list: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/TranslationResponse'
        },
        description: '翻译记录列表'
      }
    }
  },

  /**
   * 删除翻译记录响应
   */
  DeleteTranslationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: '操作是否成功'
      }
    }
  }
}; 