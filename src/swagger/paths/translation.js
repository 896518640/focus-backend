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
        201: {
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
                    $ref: '#/components/schemas/TranslationDetailResponse'
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
                    example: '保存翻译记录失败：必要参数缺失'
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
                    example: '未授权或登录已过期'
                  }
                }
              }
            }
          }
        },
        500: {
          description: '服务器错误',
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
                    example: '保存翻译记录失败：服务器错误'
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
      description: '分页获取当前用户的翻译记录列表',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: '页码',
          required: false,
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          }
        },
        {
          name: 'pageSize',
          in: 'query',
          description: '每页条数',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 50
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
                    example: '未授权或登录已过期'
                  }
                }
              }
            }
          }
        },
        500: {
          description: '服务器错误',
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
                    example: '获取翻译记录列表失败：服务器错误'
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
          description: '翻译记录ID',
          required: true,
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
                    $ref: '#/components/schemas/TranslationDetailResponse'
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
                    example: '记录ID不能为空'
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
                    example: '未授权或登录已过期'
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
                  }
                }
              }
            }
          }
        },
        500: {
          description: '服务器错误',
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
                    example: '获取翻译记录详情失败：服务器错误'
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
          description: '翻译记录ID',
          required: true,
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
                    example: '翻译记录删除成功'
                  },
                  data: {
                    $ref: '#/components/schemas/OperationResult'
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
                    example: '记录ID不能为空'
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
                    example: '未授权或登录已过期'
                  }
                }
              }
            }
          }
        },
        403: {
          description: '禁止操作',
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
                  }
                }
              }
            }
          }
        },
        500: {
          description: '服务器错误',
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
                    example: '删除翻译记录失败：服务器错误'
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