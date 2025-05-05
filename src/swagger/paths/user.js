/**
 * 用户相关的API路径定义
 */

export const userPaths = {
  '/api/user/profile': {
    get: {
      summary: '获取用户个人资料',
      description: '获取当前登录用户的详细个人资料，包括基本信息、会员状态、使用统计和最近活动',
      tags: ['用户管理'],
      security: [
        { bearerAuth: [] }
      ],
      responses: {
        200: {
          description: '成功获取用户资料',
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
                    example: '获取用户资料成功'
                  },
                  data: {
                    type: 'object',
                    allOf: [
                      { $ref: '#/components/schemas/userProfile' },
                      { 
                        properties: {
                          settings: { $ref: '#/components/schemas/userSettings' },
                          usageStats: { $ref: '#/components/schemas/usageStats' }
                        } 
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权，需要登录'
        },
        404: {
          description: '用户不存在'
        },
        500: {
          description: '服务器错误'
        }
      }
    },
    put: {
      summary: '更新用户个人资料',
      description: '更新当前登录用户的基本个人资料信息',
      tags: ['用户管理'],
      security: [
        { bearerAuth: [] }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: '用户名（登录账号）',
                  example: 'newUsername123'
                },
                displayName: {
                  type: 'string',
                  description: '用户显示名称',
                  example: '张三'
                },
                avatar: {
                  type: 'string',
                  description: '头像URL',
                  example: 'https://example.com/new-avatar.png'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: '成功更新用户资料',
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
                    example: '更新用户资料成功'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: '123e4567-e89b-12d3-a456-426614174000'
                      },
                      username: {
                        type: 'string',
                        example: 'newUsername123'
                      },
                      displayName: {
                        type: 'string',
                        example: '张三'
                      },
                      avatar: {
                        type: 'string',
                        example: 'https://example.com/new-avatar.png'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: '用户名已存在'
        },
        401: {
          description: '未授权，需要登录'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  '/api/user/activities': {
    get: {
      summary: '获取用户活动记录',
      description: '分页获取当前登录用户的活动记录',
      tags: ['用户管理'],
      security: [
        { bearerAuth: [] }
      ],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1
          },
          description: '页码，默认为1'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 10
          },
          description: '每页条数，默认为10'
        }
      ],
      responses: {
        200: {
          description: '成功获取活动记录',
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
                    example: '获取活动记录成功'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      activities: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/activity'
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: {
                            type: 'integer',
                            example: 1
                          },
                          limit: {
                            type: 'integer',
                            example: 10
                          },
                          total: {
                            type: 'integer',
                            example: 25
                          },
                          pages: {
                            type: 'integer',
                            example: 3
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权，需要登录'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  '/api/user/stats': {
    get: {
      summary: '获取用户使用统计',
      description: '获取当前登录用户的使用统计数据',
      tags: ['用户管理'],
      security: [
        { bearerAuth: [] }
      ],
      responses: {
        200: {
          description: '成功获取使用统计',
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
                    example: '获取使用统计成功'
                  },
                  data: {
                    $ref: '#/components/schemas/usageStats'
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权，需要登录'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  '/api/user/settings': {
    put: {
      summary: '更新用户设置',
      description: '更新当前登录用户的应用设置',
      tags: ['用户管理'],
      security: [
        { bearerAuth: [] }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/userSettings'
            }
          }
        }
      },
      responses: {
        200: {
          description: '成功更新设置',
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
                    example: '更新设置成功'
                  },
                  data: {
                    $ref: '#/components/schemas/userSettings'
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权，需要登录'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  '/api/user/activity': {
    post: {
      summary: '记录用户活动',
      description: '为当前登录用户创建一条新的活动记录',
      tags: ['用户管理'],
      security: [
        { bearerAuth: [] }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'type'],
              properties: {
                title: {
                  type: 'string',
                  description: '活动标题',
                  example: '上传了音频文件'
                },
                description: {
                  type: 'string',
                  description: '活动详细描述',
                  example: '用户上传了一个音频文件进行转写'
                },
                type: {
                  type: 'string',
                  description: '活动类型',
                  example: 'upload'
                },
                icon: {
                  type: 'string',
                  description: '活动图标',
                  example: 'upload'
                },
                iconBg: {
                  type: 'string',
                  description: '活动图标背景色',
                  example: '#4caf50'
                },
                audioJobId: {
                  type: 'string',
                  description: '关联的音频任务ID',
                  example: 'job_123456'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: '成功记录活动',
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
                    example: '记录活动成功'
                  },
                  data: {
                    allOf: [
                      { $ref: '#/components/schemas/activity' },
                      {
                        properties: {
                          userId: {
                            type: 'string',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                          },
                          audioJobId: {
                            type: 'string',
                            example: 'job_123456'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        401: {
          description: '未授权，需要登录'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  }
}; 