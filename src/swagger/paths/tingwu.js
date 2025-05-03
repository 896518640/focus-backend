/**
 * 通义听悟相关API路径定义
 */

export default {
  '/tingwu/upload': {
    post: {
      summary: '上传音频文件',
      description: '上传音频文件并返回文件的URL，用于后续转录',
      tags: ['通义听悟'],
      consumes: ['multipart/form-data'],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                audio: {
                  type: 'string',
                  format: 'binary',
                  description: '音频文件（MP3、WAV等格式）'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: '文件上传成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/FileUploadResponse'
              }
            }
          }
        },
        400: {
          description: '请求无效，可能是缺少文件'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/tasks': {
    post: {
      summary: '创建转录任务',
      description: '创建音频转录任务，支持离线转录',
      tags: ['通义听悟'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/TranscriptionTask'
            }
          }
        }
      },
      responses: {
        200: {
          description: '转录任务创建成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaskCreationResponse'
              }
            }
          }
        },
        400: {
          description: '无效的请求参数'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/tasks/{taskId}': {
    get: {
      summary: '获取任务状态和结果',
      description: '根据任务ID获取转录任务的状态和结果',
      tags: ['通义听悟'],
      parameters: [
        {
          in: 'path',
          name: 'taskId',
          required: true,
          schema: {
            type: 'string'
          },
          description: '转录任务ID'
        }
      ],
      responses: {
        200: {
          description: '成功获取任务信息',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaskStatusResponse'
              }
            }
          }
        },
        400: {
          description: '请求无效，可能是缺少taskId'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/tasks/{taskId}/poll': {
    get: {
      summary: '轮询任务结果直到完成',
      description: '持续轮询任务状态直到任务完成或失败',
      tags: ['通义听悟'],
      parameters: [
        {
          in: 'path',
          name: 'taskId',
          required: true,
          schema: {
            type: 'string'
          },
          description: '转录任务ID'
        },
        {
          in: 'query',
          name: 'maxAttempts',
          schema: {
            type: 'integer',
            default: 30
          },
          description: '最大轮询次数'
        },
        {
          in: 'query',
          name: 'interval',
          schema: {
            type: 'integer',
            default: 3000
          },
          description: '轮询间隔(毫秒)'
        }
      ],
      responses: {
        200: {
          description: '转录任务完成',
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
                    example: '转录任务完成'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      taskId: {
                        type: 'string'
                      },
                      taskStatus: {
                        type: 'string'
                      },
                      transcription: {
                        type: 'string',
                        description: '转录结果URL'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: '请求无效，可能是缺少taskId'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/fetch-json': {
    post: {
      summary: '获取JSON文件内容',
      description: '从指定URL获取JSON文件内容',
      tags: ['通义听悟'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['url'],
              properties: {
                url: {
                  type: 'string',
                  description: 'JSON文件的URL'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: '成功获取JSON文件内容',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              }
            }
          }
        },
        400: {
          description: '请求无效，可能是缺少URL'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/vocabularies': {
    post: {
      summary: '创建热词表',
      description: '创建用于语音识别的热词表',
      tags: ['通义听悟'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'words'],
              properties: {
                name: {
                  type: 'string',
                  description: '热词表名称'
                },
                words: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: '热词列表'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: '热词表创建成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              }
            }
          }
        },
        400: {
          description: '请求无效，可能是缺少必要参数'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/realtime/start': {
    post: {
      summary: '创建实时翻译任务',
      description: '创建一个实时语音识别和翻译任务，支持多种转录和翻译参数配置',
      tags: ['通义听悟'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RealtimeTaskRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: '实时翻译任务创建成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              }
            }
          }
        },
        400: {
          description: '无效的请求参数'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/realtime/{taskId}/stop': {
    post: {
      summary: '停止实时翻译任务',
      description: '停止指定的实时语音翻译任务',
      tags: ['通义听悟'],
      parameters: [
        {
          in: 'path',
          name: 'taskId',
          required: true,
          schema: {
            type: 'string'
          },
          description: '实时翻译任务ID'
        }
      ],
      responses: {
        200: {
          description: '实时翻译任务停止成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              }
            }
          }
        },
        400: {
          description: '请求无效，可能是缺少taskId'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/realtime/websocket': {
    get: {
      summary: '获取WebSocket连接信息',
      description: '返回建立实时翻译WebSocket连接所需的相关信息',
      tags: ['通义听悟'],
      parameters: [
        {
          in: 'query',
          name: 'taskId',
          required: true,
          schema: {
            type: 'string'
          },
          description: '实时翻译任务ID'
        }
      ],
      responses: {
        200: {
          description: '获取连接信息成功',
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
                    example: '获取WebSocket连接信息成功'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      websocketUrl: {
                        type: 'string',
                        description: 'WebSocket连接地址'
                      },
                      taskId: {
                        type: 'string'
                      },
                      accessToken: {
                        type: 'string',
                        description: '建立连接所需的令牌'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: '请求无效，可能是缺少taskId'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  },
  
  '/tingwu/realtime/{taskId}/result': {
    get: {
      summary: '获取实时翻译任务结果',
      description: '获取实时翻译任务的摘要和结果信息',
      tags: ['通义听悟'],
      parameters: [
        {
          in: 'path',
          name: 'taskId',
          required: true,
          schema: {
            type: 'string'
          },
          description: '实时翻译任务ID'
        }
      ],
      responses: {
        200: {
          description: '获取任务结果成功',
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
                    example: '获取任务结果成功'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['processing', 'completed', 'failed']
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          paragraphs: {
                            type: 'array',
                            items: {
                              type: 'string'
                            }
                          },
                          conversations: {
                            type: 'array',
                            items: {
                              type: 'string'
                            }
                          },
                          questionsAnswering: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                question: {
                                  type: 'string'
                                },
                                answer: {
                                  type: 'string'
                                }
                              }
                            }
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
        400: {
          description: '请求无效，可能是缺少taskId'
        },
        404: {
          description: '未找到指定任务'
        },
        500: {
          description: '服务器错误'
        }
      }
    }
  }
}; 