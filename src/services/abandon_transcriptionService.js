// transcriptionService.js
// 音频转录服务，负责音频转录流程管理

import tingwuService from './abandon_tingwuService.js';
import path from 'path';
import BaseService from './BaseService.js';

/**
 * 音频转录服务类
 * 协调文件上传和通义听悟API转录流程
 */
class TranscriptionService extends BaseService {
  constructor() {
    super('TranscriptionService');
  }
  
  /**
   * 上传并转录音频文件
   * @param {Object} taskOptions - 转录任务选项
   * @returns {Promise<Object>} 转录任务信息
   */
  async uploadAndTranscribe(taskOptions) {
    return this.executeWithErrorHandling(async () => {
      // 任务参数验证
      if (!taskOptions || !taskOptions.input) {
        throw new Error('缺少必要的任务参数');
      }
      
      this.logger.info('创建转录任务...', taskOptions);
      const taskResult = await tingwuService.createTranscriptionTask(taskOptions);
      
      this.logger.info('创建转录任务结果:', taskResult);
      return {
        taskId: taskResult.data.taskId,
        status: taskResult.data.taskStatus,
      };
    }, [], '创建转录任务失败');
  }
  
  /**
   * 查询转录任务结果
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 转录结果
   */
  async getTranscriptionResult(taskId) {
    return this.executeWithErrorHandling(async () => {
      // 参数验证
      if (!taskId) {
        throw new Error('缺少必要参数: taskId');
      }
      
      return await tingwuService.getTaskResult(taskId);
    }, [], '获取转录结果失败');
  }
  
  /**
   * 轮询任务结果直到完成
   * @param {string} taskId - 任务ID
   * @param {number} [maxAttempts=30] - 最大尝试次数
   * @param {number} [interval=3000] - 间隔时间(毫秒)
   * @returns {Promise<Object>} 转录结果
   */
  async pollUntilComplete(taskId, maxAttempts = 30, interval = 3000) {
    return this.executeWithErrorHandling(async () => {
      // 参数验证
      if (!taskId) {
        throw new Error('缺少必要参数: taskId');
      }
      
      let attempts = 0;
      
      return new Promise((resolve, reject) => {
        const checkStatus = async () => {
          try {
            // 获取任务结果
            const result = await this.getTranscriptionResult(taskId);
            this.logger.debug('轮询获取任务状态:', result);
            
            // 判断任务状态
            if (result.data?.taskStatus === 'COMPLETED') {
              // 任务成功完成
              this.logger.info('转录任务完成:', { taskId });
              resolve(result);
              return;
            } else if (result.data?.taskStatus === 'FAILED') {
              // 任务失败
              const errorMessage = `转录任务失败: ${result.message || '未知错误'}`;
              this.logger.error(errorMessage);
              reject(new Error(errorMessage));
              return;
            }
            
            // 任务仍在进行中，继续等待
            attempts++;
            
            if (attempts >= maxAttempts) {
              // 超过最大尝试次数
              const timeoutMessage = `转录任务超时: 已等待${maxAttempts * interval / 1000}秒`;
              this.logger.warn(timeoutMessage);
              reject(new Error(timeoutMessage));
              return;
            }
            
            // 继续轮询
            setTimeout(checkStatus, interval);
          } catch (error) {
            this.logger.error('轮询过程中出错:', error);
            reject(error);
          }
        };
        
        // 开始首次检查
        checkStatus();
      });
    }, [], '轮询转录任务结果失败');
  }
}

// 创建单例实例
const transcriptionService = new TranscriptionService();

export default transcriptionService;