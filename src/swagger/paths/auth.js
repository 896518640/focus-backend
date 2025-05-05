/**
 * 认证相关的API路径定义
 */

export const authPaths = {
  '/api/auth/login': {
    post: {
      summary: '用户登录',
      description: '处理用户登录请求，返回JWT令牌',
      tags: ['认证'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/loginRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: '登录成功',
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
                    example: '登录成功'
                  },
                  data: {
                    $ref: '#/components/schemas/loginResponse'
                  }
                }
              }
            }
          }
        },
        401: {
          description: '用户名或密码错误'
        },
        403: {
          description: '账户已被禁用'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  '/api/auth/register': {
    post: {
      summary: '用户注册',
      description: '创建新用户账号',
      tags: ['认证'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/registerRequest'
            }
          }
        }
      },
      responses: {
        201: {
          description: '注册成功',
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
                    example: '注册成功'
                  },
                  data: {
                    $ref: '#/components/schemas/registerResponse'
                  }
                }
              }
            }
          }
        },
        400: {
          description: '用户名或邮箱已被使用'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  '/api/auth/me': {
    get: {
      summary: '获取当前用户信息',
      description: '通过JWT令牌获取当前登录用户的信息',
      tags: ['认证'],
      security: [
        { bearerAuth: [] }
      ],
      responses: {
        200: {
          description: '成功获取用户信息',
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
                    example: '获取用户信息成功'
                  },
                  data: {
                    $ref: '#/components/schemas/userProfile'
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
    }
  }
}; 