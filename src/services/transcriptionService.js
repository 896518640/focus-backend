// transcriptionService.js
// 音频转录服务，负责音频转录流程管理

import tingwuService from './tingwuService.js';
import path from 'path';

/**
 * 音频转录服务类
 * 协调文件上传和通义听悟API转录流程
 */
class TranscriptionService {
  /**
   * 上传并转录音频文件
   * @param {Object} taskOptions - 转录任务选项
   * @returns {Promise<Object>} 转录任务信息
   */
  async uploadAndTranscribe(taskOptions) {
    // 仅创建转录任务，假设上传逻辑已在上游完成
    console.log('创建转录任务...', taskOptions);
    const taskResult = await tingwuService.createTranscriptionTask(taskOptions);
    console.log('创建转录任务结果:', taskResult);
    return {
      taskId: taskResult.data.taskId,
      status: taskResult.data.taskStatus,
    };
  }
  
  /**
   * 查询转录任务结果
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 转录结果
   */
  async getTranscriptionResult(taskId) {
    try {
      return await tingwuService.getTaskResult(taskId);
    } catch (error) {
      console.error('获取转录结果失败:', error);
      throw new Error(`获取转录结果失败: ${error.message}`);
    }
  }
  
  /**
   * 轮询任务结果直到完成
   * @param {string} taskId - 任务ID
   * @param {number} [maxAttempts=30] - 最大尝试次数
   * @param {number} [interval=3000] - 间隔时间(毫秒)
   * @returns {Promise<Object>} 转录结果
   */
  async pollUntilComplete(taskId, maxAttempts = 30, interval = 3000) {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          // 获取任务结果
          const result = await this.getTranscriptionResult(taskId);
          console.log('轮询获取任务状态:', result);
          
          // 判断任务状态
          if (result.Data?.TaskStatus === 'SUCCESS') {
            // 任务成功完成
            resolve(result);
            return;
          } else if (result.Data?.TaskStatus === 'FAILED') {
            // 任务失败
            reject(new Error(`转录任务失败: ${result.Data?.ErrorMessage || '未知错误'}`));
            return;
          }
          
          // 任务仍在进行中，继续等待
          attempts++;
          
          if (attempts >= maxAttempts) {
            // 超过最大尝试次数
            reject(new Error(`转录任务超时: 已等待${maxAttempts * interval / 1000}秒`));
            return;
          }
          
          // 继续轮询
          setTimeout(checkStatus, interval);
        } catch (error) {
          reject(error);
        }
      };
      
      // 开始首次检查
      checkStatus();
    });
  }
}

// 创建单例实例
const transcriptionService = new TranscriptionService();

export default transcriptionService; 