// translation.js
// 翻译记录相关的Swagger路径定义

/**
 * Swagger paths 翻译记录相关路径定义
 */
export default {
  /**
   * 保存翻译记录
   */
  '/api/v1/translation/save': {
    post: {
      tags: ['翻译管理'],
      summary: '保存翻译记录',
      description: '保存新的翻译记录到系统',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SaveTranslationParams'
            }
          }
        }
      },
      responses: {
        200: {
          description: '保存成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: '翻译记录保存成功'
                  },
                  data: {
                    $ref: '#/components/schemas/TranslationResponse'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        400: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '缺少必要参数'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '用户未登录或token已过期'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  /**
   * 获取翻译记录列表
   */
  '/api/v1/translation/list': {
    get: {
      tags: ['翻译管理'],
      summary: '获取翻译记录列表',
      description: '分页获取用户的翻译记录列表',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: '页码（从1开始）',
          schema: {
            type: 'integer',
            default: 1
          }
        },
        {
          name: 'pageSize',
          in: 'query',
          description: '每页条数',
          schema: {
            type: 'integer',
            default: 10
          }
        }
      ],
      responses: {
        200: {
          description: '获取成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: '获取翻译记录列表成功'
                  },
                  data: {
                    $ref: '#/components/schemas/TranslationListResponse'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '用户未登录或token已过期'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  /**
   * 获取翻译记录详情
   */
  '/api/v1/translation/detail/{id}': {
    get: {
      tags: ['翻译管理'],
      summary: '获取翻译记录详情',
      description: '根据ID获取特定翻译记录的详细信息',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: '翻译记录ID',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: '获取成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: '获取翻译记录详情成功'
                  },
                  data: {
                    $ref: '#/components/schemas/TranslationResponse'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '用户未登录或token已过期'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        403: {
          description: '禁止访问',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '无权访问此翻译记录'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        404: {
          description: '记录不存在',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '翻译记录不存在'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  /**
   * 删除翻译记录
   */
  '/api/v1/translation/delete/{id}': {
    delete: {
      tags: ['翻译管理'],
      summary: '删除翻译记录',
      description: '根据ID删除特定的翻译记录',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: '翻译记录ID',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: '删除成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: '删除翻译记录成功'
                  },
                  data: {
                    $ref: '#/components/schemas/DeleteTranslationResponse'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '用户未登录或token已过期'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        403: {
          description: '禁止访问',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '无权删除此翻译记录'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        404: {
          description: '记录不存在',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: '翻译记录不存在'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}; 