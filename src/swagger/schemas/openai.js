// OpenAI API 相关Swagger模型定义

/**
 * OpenAI消息模型
 */
export const OpenAIMessage = {
  type: 'object',
  required: ['role', 'content'],
  properties: {
    role: {
      type: 'string',
      description: '消息角色',
      enum: ['system', 'user', 'assistant', 'function', 'tool'],
      example: 'user'
    },
    content: {
      type: 'string',
      description: '消息内容',
      example: '你好，请介绍一下自己'
    }
  }
};

/**
 * 聊天完成请求体
 */
export const ChatCompletionRequest = {
  type: 'object',
  required: ['messages'],
  properties: {
    model: {
      type: 'string',
      description: '使用的模型名称',
      example: 'openai/gpt-4o'
    },
    messages: {
      type: 'array',
      description: '消息列表',
      items: {
        $ref: '#/components/schemas/OpenAIMessage'
      },
      example: [
        {
          role: 'user',
          content: '你好，请介绍一下自己'
        }
      ]
    },
    temperature: {
      type: 'number',
      description: '生成文本的随机性，0-1之间',
      minimum: 0,
      maximum: 1,
      example: 0.7
    }
  }
};

/**
 * 文本完成请求体
 */
export const CompletionRequest = {
  type: 'object',
  required: ['prompt'],
  properties: {
    prompt: {
      type: 'string',
      description: '提示文本',
      example: '你好，请介绍一下自己'
    },
    model: {
      type: 'string',
      description: '使用的模型名称',
      example: 'openai/gpt-4o'
    },
    temperature: {
      type: 'number',
      description: '生成文本的随机性，0-1之间',
      minimum: 0,
      maximum: 1,
      example: 0.7
    }
  }
};

/**
 * AI完成响应
 */
export const AICompletionResponse = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      description: '请求是否成功',
      example: true
    },
    message: {
      type: 'string',
      description: '响应消息',
      example: 'AI响应生成成功'
    },
    data: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              description: '消息角色',
              example: 'assistant'
            },
            content: {
              type: 'string',
              description: '生成的内容',
              example: '你好！我是一个AI助手，我可以回答问题、提供信息、帮助完成各种任务。有什么我可以帮你的吗？'
            }
          }
        },
        usage: {
          type: 'object',
          properties: {
            prompt_tokens: {
              type: 'integer',
              description: '提示词的token数量',
              example: 10
            },
            completion_tokens: {
              type: 'integer',
              description: '生成内容的token数量',
              example: 42
            },
            total_tokens: {
              type: 'integer',
              description: '总共使用的token数量',
              example: 52
            }
          }
        },
        model: {
          type: 'string',
          description: '使用的模型',
          example: 'openai/gpt-4o'
        }
      }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: '响应时间戳',
      example: '2023-08-15T12:34:56.789Z'
    }
  }
};

/**
 * OpenAI配置响应
 */
export const OpenAIConfigResponse = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      description: '请求是否成功',
      example: true
    },
    message: {
      type: 'string',
      description: '响应消息',
      example: 'OpenAI配置获取成功'
    },
    data: {
      type: 'object',
      properties: {
        isInitialized: {
          type: 'boolean',
          description: 'OpenAI服务是否已初始化',
          example: true
        },
        defaultModel: {
          type: 'string',
          description: '默认使用的模型',
          example: 'openai/gpt-4o'
        },
        availableModels: {
          type: 'array',
          description: '可用的模型列表',
          items: {
            type: 'string'
          },
          example: [
            'openai/gpt-4o',
            'openai/gpt-4-turbo',
            'anthropic/claude-3-opus'
          ]
        }
      }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: '响应时间戳',
      example: '2023-08-15T12:34:56.789Z'
    }
  }
}; 