// transcriptionService.js
// 音频转录服务，负责音频转录流程管理

import fileUploadService from './fileUploadService.js';
import tingwuService from './tingwuService.js';
import path from 'path';

/**
 * 音频转录服务类
 * 协调文件上传和通义听悟API转录流程
 */
class TranscriptionService {
  /**
   * 上传并转录音频文件
   * @param {Object} file - 上传的音频文件
   * @param {Object} options - 转录选项
   * @param {string} [options.sourceLanguage='cn'] - 音频语言，默认中文
   * @param {string} [options.type='offline'] - 转录类型，默认离线转写
   * @returns {Promise<Object>} 转录任务信息
   */
  async uploadAndTranscribe(file, options = {}) {
    try {
      // 1. 上传文件
      console.log('开始上传文件...');
      const uploadResult = await fileUploadService.uploadFile(file);
      console.log('文件上传成功:', uploadResult.fileName);
      
      // 2. 准备转录参数
      const transcriptionOptions = {
        taskKey: `task_${Date.now()}`,
        sourceLanguage: options.sourceLanguage || 'cn',
        type: options.type || 'offline'
      };
      
      // 根据上传结果，决定使用文件URL或OSS对象
      if (uploadResult.fileUrl) {
        transcriptionOptions.fileUrl = uploadResult.fileUrl;
      }
      
      if (uploadResult.ossObjectKey && uploadResult.ossBucket) {
        transcriptionOptions.ossObjectKey = uploadResult.ossObjectKey;
        transcriptionOptions.ossBucket = uploadResult.ossBucket;
        transcriptionOptions.name = `转录任务-${path.basename(uploadResult.fileName)}`;
      }
      
      // 3. 创建转录任务
      console.log('创建转录任务...');
      const taskResult = await tingwuService.createTranscriptionTask(transcriptionOptions);
      
      // 4. 返回结果
      return {
        taskId: taskResult.data?.taskId,
        status: taskResult.data?.status || 'PENDING',
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        ossObjectKey: uploadResult.ossObjectKey,
        uploadResult,
        taskResult: taskResult.data
      };
    } catch (error) {
      console.error('上传并转录音频失败:', error);
      throw new Error(`上传并转录音频失败: ${error.message}`);
    }
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