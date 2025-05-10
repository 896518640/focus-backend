import WebSocket from 'ws';
import CryptoJS from 'crypto-js';
import BaseSpeechService from './BaseSpeechService.js';
import { SpeechServiceError, ConnectionError } from '../../utils/errors.js';
import createLogger from '../../utils/logger.js';
import config from '../../config/index.js';

const logger = createLogger('RTASRService');

export default class RTASRService extends BaseSpeechService {
  /**
   * 创建RTASR服务实例
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();
    this.config = {
      appId: options.appId || config.speech.rtasr.appId,
      apiKey: options.apiKey || config.speech.rtasr.apiKey,
      hostUrl: options.hostUrl || 'wss://rtasr.xfyun.cn/v1/ws',
      highWaterMark: options.highWaterMark || 1280,
    };
    
    this.ws = null;
    this.audioBuffer = [];
    this.bufferDuration = 5000;
    this.bufferTimestamps = [];
    
    // 验证必要的配置
    this.#validateConfig();
    
    // 连接WebSocket
    this.#connect();
  }

  /**
   * 验证配置是否有效
   * @private
   */
  #validateConfig() {
    if (!this.config.appId) {
      throw new SpeechServiceError('缺少RTASR所需的appId配置');
    }
    
    if (!this.config.apiKey) {
      throw new SpeechServiceError('缺少RTASR所需的apiKey配置');
    }
  }

  /**
   * 建立WebSocket连接
   * @private
   */
  #connect() {
    const ts = parseInt(new Date().getTime() / 1000);
    const wssUrl = `${this.config.hostUrl}?appid=${this.config.appId}&ts=${ts}&signa=${this.#getSigna(ts)}`;
    
    try {
      this.ws = new WebSocket(wssUrl);
      
      this.ws.on('open', () => {
        logger.info('WebSocket连接已建立');
      });
      
      this.ws.on('message', (data) => {
        try {
          const res = JSON.parse(data);
          
          if (res.action === 'error') {
            logger.error(`服务器错误 ${res.code}: ${res.desc}`);
            if (this.socket) {
              this.socket.emit('error', { 
                message: `服务器错误: ${res.desc}`,
                code: res.code
              });
            }
            return;
          }
          
          if (res.action === 'started') {
            logger.info(`会话已开始, sid: ${res.sid}`);
          }
          
          if (res.action === 'result') {
            this.handleResult(res);
          }
        } catch (err) {
          logger.error('处理WebSocket消息时出错:', err);
        }
      });
      
      this.ws.on('close', (code) => {
        logger.info(`WebSocket连接已关闭, 代码: ${code}`);
      });
      
      this.ws.on('error', (err) => {
        logger.error('WebSocket错误:', err);
        if (this.socket) {
          this.socket.emit('error', { 
            message: '语音识别服务连接错误',
            details: err.message
          });
        }
        throw new ConnectionError('WebSocket连接错误: ' + err.message);
      });
      
    } catch (err) {
      logger.error('创建WebSocket连接时出错:', err);
      throw new ConnectionError('创建WebSocket连接时出错: ' + err.message);
    }
  }

  /**
   * 生成签名
   * @private
   * @param {number} ts - 时间戳
   * @returns {string} 编码后的签名
   */
  #getSigna(ts) {
    const md5 = CryptoJS.MD5(this.config.appId + ts).toString();
    const sha1 = CryptoJS.HmacSHA1(md5, this.config.apiKey);
    const base64 = CryptoJS.enc.Base64.stringify(sha1);
    return encodeURIComponent(base64);
  }

  /**
   * 发送音频数据块
   * @param {Buffer} chunk - 音频数据块
   */
  sendAudioChunk(chunk) {
    const timestamp = Date.now();
    this.audioBuffer.push(chunk);
    this.bufferTimestamps.push(timestamp);

    // 移除超过缓冲时间的旧数据
    while (
      this.bufferTimestamps.length > 0 &&
      timestamp - this.bufferTimestamps[0] > this.bufferDuration
    ) {
      this.audioBuffer.shift();
      this.bufferTimestamps.shift();
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    } else {
      logger.error('WebSocket未连接或已关闭');
      throw new ConnectionError('WebSocket未连接或已关闭');
    }
  }

  /**
   * 结束音频流
   */
  endAudioStream() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('{"end": true}');
      this.ws.close();
    }
    
    // 清空缓冲区
    this.audioBuffer = [];
    this.bufferTimestamps = [];
  }

  /**
   * 解析识别结果
   * @param {Object} res - 服务返回的原始结果
   * @returns {string} 解析后的文本
   */
  parseResult(res) {
    try {
      const parsedData = JSON.parse(res.data);
      let result = '';
      parsedData.cn.st.rt.forEach((rt) => {
        rt.ws.forEach((ws) => {
          ws.cw.forEach((cw) => {
            result += cw.w;
          });
        });
      });
      return result;
    } catch (err) {
      logger.error('解析结果时出错:', err);
      throw new SpeechServiceError('解析结果时出错: ' + err.message);
    }
  }
} 