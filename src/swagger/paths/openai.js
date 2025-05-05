// OpenAI API 相关Swagger路径定义

import * as schemas from '../schemas/openai.js';

/**
 * OpenAI接口路径定义
 */
export const openaiPaths = {
  // 聊天完成接口
  '/api/v1/openai/chat': {
    post: {
      tags: ['OpenAI API'],
      summary: '创建聊天完成',
      description: '使用OpenAI/OpenRouter API创建聊天完成（多轮对话）',
      operationId: 'createChatCompletion',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ChatCompletionRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'AI聊天响应生成成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AICompletionResponse'
              }
            }
          }
        },
        '400': {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '401': {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '500': {
          description: '服务器错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },

  // 文本完成接口
  '/api/v1/openai/completion': {
    post: {
      tags: ['OpenAI API'],
      summary: '创建文本完成',
      description: '使用OpenAI/OpenRouter API创建文本完成（单轮对话）',
      operationId: 'createCompletion',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CompletionRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'AI文本响应生成成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AICompletionResponse'
              }
            }
          }
        },
        '400': {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '401': {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '500': {
          description: '服务器错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },

  // 配置获取接口
  '/api/v1/openai/config': {
    get: {
      tags: ['OpenAI API'],
      summary: '获取OpenAI配置',
      description: '获取OpenAI/OpenRouter服务配置信息',
      operationId: 'getOpenAIConfig',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'OpenAI配置获取成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OpenAIConfigResponse'
              }
            }
          }
        },
        '401': {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '500': {
          description: '服务器错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  }
}; 