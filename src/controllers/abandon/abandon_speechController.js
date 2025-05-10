// speechController.js
// 语音识别控制器，处理Socket.IO连接和语音识别会话

import BaseController from '../BaseController.js';
import SpeechServiceFactory, { SpeechServiceType } from '../services/speech/SpeechServiceFactory.js';
import { SpeechServiceError } from '../../utils/errors.js';

/**
 * 处理Socket.IO连接和语音识别会话
 */
class SpeechController extends BaseController {
  /**
   * 初始化控制器
   * @param {Object} io - Socket.IO实例
   */
  constructor(io) {
    super('SpeechController');
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * 设置Socket.IO事件处理器
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      this.logger.info(`客户端已连接: ${socket.id}`);
      
      // 保存当前的语音服务实例
      let speechService = null;
      
      // 开始新的录音会话
      socket.on('start-recording', (config) => {
        this.logger.info('开始录音:', config);
        
        if (speechService) {
          this.logger.warn('录音会话已经在运行中');
          socket.emit('warning', { message: '录音会话已经在运行中' });
          return;
        }
        
        // 如果没有指定服务类型，默认使用RTASR
        const { serviceType = SpeechServiceType.RTASR } = config || {};
        
        try {
          // 创建语音服务实例
          speechService = SpeechServiceFactory.createService(serviceType, config);
          speechService.setSocket(socket);
          
          this.logger.info(`语音识别会话已开始, 服务类型: ${serviceType}`);
          socket.emit('recording-started', { serviceType });
          
        } catch (err) {
          this.logger.error('创建语音服务失败:', err);
          socket.emit('error', { 
            message: '初始化语音服务失败',
            details: err.message
          });
        }
      });
      
      // 处理音频数据块
      socket.on('audio-chunk', (chunk) => {
        if (!speechService) {
          this.logger.warn('收到音频数据但没有活动的语音服务实例');
          socket.emit('warning', { message: '请先启动录音会话' });
          return;
        }
        
        try {
          speechService.sendAudioChunk(chunk);
        } catch (err) {
          this.logger.error('处理音频数据失败:', err);
          socket.emit('error', { 
            message: '处理音频数据失败',
            details: err.message
          });
          
          // 如果是连接错误，尝试清理资源
          if (err instanceof SpeechServiceError) {
            speechService = null;
          }
        }
      });
      
      // 结束录音会话
      socket.on('audio-end', () => {
        this.logger.info('结束录音');
        
        if (!speechService) {
          this.logger.warn('收到结束录音指令但没有活动的语音服务实例');
          return;
        }
        
        try {
          speechService.endAudioStream();
          speechService = null;
          
          this.logger.info('录音会话已结束');
          socket.emit('recording-ended');
          
        } catch (err) {
          this.logger.error('结束录音会话失败:', err);
          socket.emit('error', { 
            message: '结束录音会话失败',
            details: err.message
          });
          speechService = null;
        }
      });
      
      // 客户端断开连接
      socket.on('disconnect', () => {
        this.logger.info(`客户端已断开连接: ${socket.id}`);
        
        if (speechService) {
          try {
            speechService.endAudioStream();
          } catch (err) {
            this.logger.error('客户端断开连接时清理资源失败:', err);
          } finally {
            speechService = null;
          }
        }
      });
    });
  }
}

export default SpeechController;