import { SpeechServiceError } from '../../../utils/errors.js';
import createLogger from '../../../utils/logger.js';

const logger = createLogger('BaseSpeechService');

/**
 * 语音识别服务的抽象基类
 * 所有具体实现必须继承此类并实现其方法
 */
export default class BaseSpeechService {
  constructor() {
    this.socket = null;
    if (this.constructor === BaseSpeechService) {
      throw new SpeechServiceError('不能直接实例化抽象类');
    }
  }

  /**
   * 设置Socket.IO实例，用于向客户端发送结果
   * @param {Object} socket - Socket.IO实例
   */
  setSocket(socket) {
    this.socket = socket;
    logger.info('Socket设置成功');
  }

  /**
   * 处理识别结果并发送给客户端
   * @param {Object} result - 原始识别结果
   */
  handleResult(result) {
    if (!this.socket) {
      logger.warn('没有设置socket，无法发送结果');
      return;
    }
    
    try {
      const parsedResult = this.parseResult(result);
      logger.info('识别结果:', parsedResult);
      this.socket.emit('translation', {
        original: result,
        text: parsedResult
      });
    } catch (err) {
      logger.error('处理识别结果时出错:', err);
      this.socket.emit('error', { 
        message: '处理识别结果时出错',
        details: err.message
      });
    }
  }

  /**
   * 发送音频数据块 - 子类必须实现
   * @param {Buffer} chunk - 音频数据块
   */
  sendAudioChunk(chunk) {
    throw new SpeechServiceError('方法未实现: sendAudioChunk');
  }

  /**
   * 结束音频流 - 子类必须实现
   */
  endAudioStream() {
    throw new SpeechServiceError('方法未实现: endAudioStream');
  }

  /**
   * 解析识别结果 - 子类必须实现
   * @param {Object} result - 原始识别结果
   * @returns {String} 解析后的文本
   */
  parseResult(result) {
    throw new SpeechServiceError('方法未实现: parseResult');
  }
} 