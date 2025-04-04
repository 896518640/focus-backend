import RTASRService from './RTASRService.js';
import IFlytekSTTService from './IFlytekSTTService.js';
import { SpeechServiceError } from '../../utils/errors.js';
import createLogger from '../../utils/logger.js';

const logger = createLogger('SpeechServiceFactory');

/**
 * 支持的语音服务类型
 */
export const SpeechServiceType = {
  IFLYTEK_STT: 'IFLYTEK_STT',
  RTASR: 'RTASR',
};

/**
 * 语音服务工厂类
 * 用于创建不同类型的语音识别服务实例
 */
export default class SpeechServiceFactory {
  /**
   * 创建语音服务实例
   * @param {string} type - 服务类型，见 SpeechServiceType
   * @param {Object} options - 服务配置选项
   * @returns {Object} 语音服务实例
   * @throws {SpeechServiceError} 当服务类型不支持时抛出错误
   */
  static createService(type, options = {}) {
    logger.info(`创建语音服务: ${options}`);
    
    switch (type) {
      case SpeechServiceType.IFLYTEK_STT:
        return new IFlytekSTTService(options);
        
      case SpeechServiceType.RTASR:
        return new RTASRService(options);
        
      default:
        logger.error(`不支持的语音服务类型: ${type}`);
        throw new SpeechServiceError(`不支持的语音服务类型: ${type}`);
    }
  }
} 