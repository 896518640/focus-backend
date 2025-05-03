/**
 * 通义听悟相关数据模型定义
 */

export default {
  TranscriptionTask: {
    type: 'object',
    required: ['type', 'input'],
    properties: {
      type: {
        type: 'string',
        enum: ['offline'],
        description: '转录任务类型，目前支持离线转录'
      },
      input: {
        type: 'object',
        properties: {
          sourceLanguage: {
            type: 'string',
            enum: ['cn', 'en'],
            description: '音频源语言，cn为中文，en为英文'
          },
          fileUrl: {
            type: 'string',
            description: '音频文件URL'
          }
        }
      },
      parameters: {
        type: 'object',
        properties: {
          transcription: {
            type: 'object',
            properties: {
              diarizationEnabled: {
                type: 'boolean',
                description: '是否启用说话人分离'
              },
              diarization: {
                type: 'object',
                properties: {
                  speakerCount: {
                    type: 'integer',
                    description: '说话人数量'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  
  // 通用响应模型
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        example: '操作成功'
      },
      data: {
        type: 'object'
      }
    }
  },
  
  // 文件上传响应
  FileUploadResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        example: '文件上传成功'
      },
      data: {
        type: 'object',
        properties: {
          fileName: {
            type: 'string'
          },
          fileUrl: {
            type: 'string'
          },
          size: {
            type: 'number'
          }
        }
      }
    }
  },
  
  // 创建任务响应
  TaskCreationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        example: '创建转录任务成功'
      },
      data: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string'
          },
          status: {
            type: 'string'
          }
        }
      }
    }
  },
  
  // 任务状态响应
  TaskStatusResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        example: '获取任务信息成功'
      },
      data: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string'
          },
          taskStatus: {
            type: 'string',
            enum: ['ONGOING', 'COMPLETED', 'FAILED']
          },
          result: {
            type: 'object',
            properties: {
              transcription: {
                type: 'string',
                description: '转录结果URL'
              }
            }
          }
        }
      }
    }
  },
  
  // 实时翻译任务请求
  RealtimeTaskRequest: {
    type: 'object',
    required: ['sourceLanguage', 'format', 'sampleRate'],
    properties: {
      sourceLanguage: {
        type: 'string',
        enum: ['cn', 'en', 'multilingual', 'yue', 'ja', 'ko'],
        description: '音频源语言，cn为中文，en为英文，multilingual为多语种'
      },
      languageHints: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: '指定多语言模型时需语音识别出文字的语种列表，仅当sourceLanguage为multilingual时有效'
      },
      format: {
        type: 'string',
        enum: ['pcm', 'opus', 'aac', 'speex', 'mp3'],
        description: '音频流数据的编码格式'
      },
      sampleRate: {
        type: 'string',
        enum: ['16000', '8000'],
        description: '音频流数据的采样率'
      },
      translationEnabled: {
        type: 'boolean',
        default: true,
        description: '是否启用翻译功能'
      },
      targetLanguages: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['cn', 'en', 'ja', 'ko', 'de', 'fr', 'ru']
        },
        description: '目标翻译语言列表'
      },
      diarizationEnabled: {
        type: 'boolean',
        default: false,
        description: '是否启用说话人分离'
      },
      speakerCount: {
        type: 'integer',
        description: '说话人数量，仅当启用说话人分离时有效'
      },
      transcription: {
        type: 'object',
        properties: {
          outputLevel: {
            type: 'integer',
            enum: [1, 2],
            default: 2,
            description: '设置语音识别结果返回等级：1-识别出完整句子时返回；2-识别出中间结果及完整句子时返回'
          },
          phraseId: {
            type: 'string',
            description: '热词词表ID'
          }
        }
      },
      translation: {
        type: 'object',
        properties: {
          outputLevel: {
            type: 'integer',
            enum: [1, 2],
            default: 2,
            description: '设置翻译结果返回等级：1-完整；2-中间结果'
          }
        }
      },
      autoChaptersEnabled: {
        type: 'boolean',
        default: false,
        description: '是否开启章节速览功能'
      },
      summarizationEnabled: {
        type: 'boolean',
        default: false,
        description: '是否开启摘要总结功能'
      },
      summarization: {
        type: 'object',
        properties: {
          types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ["Paragraph", "Conversational", "QuestionsAnswering", "MindMap"]
            },
            description: '摘要类型列表'
          }
        }
      },
      textPolishEnabled: {
        type: 'boolean',
        default: false,
        description: '是否开启口语书面化功能'
      },
      customPromptEnabled: {
        type: 'boolean',
        default: false,
        description: '是否开启自定义prompt功能'
      }
    }
  }
}; 