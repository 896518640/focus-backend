// tests/services/mainTingwuService.test.js
import { jest } from '@jest/globals';
import mainTingwuService from '../../src/services/mainTingwuService.js';
import Tingwu from '@alicloud/tingwu20230930';

// 模拟通义听悟SDK响应
jest.mock('@alicloud/tingwu20230930', () => {
  const mockTingwu = {
    default: jest.fn().mockImplementation(() => ({
      createTaskWithOptions: jest.fn().mockResolvedValue({
        body: {
          code: '0',
          message: 'Success',
          requestId: 'mock-request-id',
          data: {
            taskId: 'mock-task-id',
            taskStatus: 'CREATED'
          }
        }
      }),
      getTaskInfoWithOptions: jest.fn().mockResolvedValue({
        body: {
          code: '0',
          message: 'Success',
          requestId: 'mock-request-id',
          data: {
            taskId: 'mock-task-id',
            taskStatus: 'COMPLETE',
            result: {
              transcription: '{"transcription": "测试转写内容"}'
            }
          }
        }
      })
    })),
    CreateTaskRequestInput: jest.fn().mockImplementation((options) => options),
    CreateTaskRequestParameters: jest.fn().mockImplementation((options) => options),
    CreateTaskRequest: jest.fn().mockImplementation((options) => options)
  };
  
  return mockTingwu;
});

// 模拟配置服务
jest.mock('../../src/config/configService.js', () => ({
  validateRequiredConfig: jest.fn().mockReturnValue(true),
  get: jest.fn().mockImplementation((key, defaultValue) => {
    const configValues = {
      'aliyun.accessKeyId': 'mock-access-key-id',
      'aliyun.accessKeySecret': 'mock-access-key-secret',
      'aliyun.tingwu.appKey': 'mock-app-key'
    };
    return configValues[key] || defaultValue;
  }),
  has: jest.fn().mockReturnValue(true)
}));

// 模拟日志服务
jest.mock('../../src/utils/logger.js', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }));
});

describe('MainTingwuService', () => {
  describe('createTask', () => {
    it('应该成功创建离线转写任务', async () => {
      // 准备测试数据
      const options = {
        type: 'offline',
        input: {
          fileUrl: 'https://example.com/audio.mp3',
          format: 'mp3',
          sampleRate: 16000,
          sourceLanguage: 'cn'
        },
        parameters: {
          transcriptionEnabled: true,
          transcription: {
            outputLevel: 2
          }
        }
      };
      
      // 执行测试
      const result = await mainTingwuService.createTask(options);
      
      // 验证结果
      expect(result).toBeDefined();
      expect(result.code).toBe('0');
      expect(result.data.taskId).toBe('mock-task-id');
    });
    
    it('应该在缺少必要参数时抛出错误', async () => {
      // 准备测试数据 - 缺少input
      const options = {
        type: 'offline'
      };
      
      // 执行测试并验证结果
      await expect(mainTingwuService.createTask(options)).rejects.toThrow('缺少必要参数: input');
    });
    
    it('应该在type无效时抛出错误', async () => {
      // 准备测试数据 - 无效type
      const options = {
        type: 'invalid-type',
        input: {
          fileUrl: 'https://example.com/audio.mp3'
        }
      };
      
      // 执行测试并验证结果
      await expect(mainTingwuService.createTask(options)).rejects.toThrow('无效的任务类型');
    });
  });
  
  describe('getTaskInfo', () => {
    it('应该成功获取任务信息', async () => {
      // 准备测试数据
      const taskId = 'mock-task-id';
      
      // 执行测试
      const result = await mainTingwuService.getTaskInfo(taskId);
      
      // 验证结果
      expect(result).toBeDefined();
      expect(result.code).toBe('0');
      expect(result.data.taskStatus).toBe('COMPLETE');
    });
    
    it('应该在缺少taskId时抛出错误', async () => {
      // 执行测试并验证结果
      await expect(mainTingwuService.getTaskInfo()).rejects.toThrow('缺少必要参数: taskId');
    });
    
    it('应该在taskId不是字符串时抛出错误', async () => {
      // 执行测试并验证结果
      await expect(mainTingwuService.getTaskInfo(123)).rejects.toThrow('taskId必须为字符串');
    });
  });
  
  // 测试API错误响应处理
  describe('API错误处理', () => {
    beforeEach(() => {
      // 重置模拟以返回错误响应
      Tingwu.default.mockImplementation(() => ({
        createTaskWithOptions: jest.fn().mockResolvedValue({
          body: {
            code: '1001',
            message: 'Invalid parameter',
            requestId: 'mock-error-request-id'
          }
        }),
        getTaskInfoWithOptions: jest.fn().mockResolvedValue({
          body: {
            code: '1002',
            message: 'Task not found',
            requestId: 'mock-error-request-id'
          }
        })
      }));
    });
    
    it('应该处理创建任务时的API错误', async () => {
      const options = {
        type: 'offline',
        input: {
          fileUrl: 'https://example.com/audio.mp3'
        }
      };
      
      await expect(mainTingwuService.createTask(options)).rejects.toThrow('API返回错误');
    });
    
    it('应该处理获取任务信息时的API错误', async () => {
      await expect(mainTingwuService.getTaskInfo('mock-task-id')).rejects.toThrow('API返回错误');
    });
  });
}); 