import WebSocket from 'ws';
import CryptoJS from 'crypto-js';
import BaseSpeechService from './BaseSpeechService.js';
import { SpeechServiceError, ConnectionError } from '../../utils/errors.js';
import createLogger from '../../utils/logger.js';
import config from '../../config/index.js';

const logger = createLogger('IFlytekSTTService');

// 帧状态常量
const FRAME_STATUS = {
  FIRST: 0,
  CONTINUE: 1,
  LAST: 2,
};

export default class IFlytekSTTService extends BaseSpeechService {
  /**
   * 创建讯飞STT服务实例
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();
    this.config = {
      appId: options.appId || config.speech.iflytek.appId,
      apiKey: options.apiKey || config.speech.iflytek.apiKey,
      apiSecret: options.apiSecret || config.speech.iflytek.apiSecret,
      host: options.host || 'iat-api.xfyun.cn',
      uri: options.uri || '/v2/iat',
    };

    this.options = options.options;
    this.wsUrl = `wss://${this.config.host}${this.config.uri}`;
    this.status = FRAME_STATUS.FIRST;
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
      throw new SpeechServiceError('缺少讯飞STT所需的appId配置');
    }
    
    if (!this.config.apiKey) {
      throw new SpeechServiceError('缺少讯飞STT所需的apiKey配置');
    }
    
    if (!this.config.apiSecret) {
      throw new SpeechServiceError('缺少讯飞STT所需的apiSecret配置');
    }
  }

  /**
   * 建立WebSocket连接
   * @private
   */
  #connect() {
    try {
      const { url } = this.#generateAuthUrl();
      logger.debug('WebSocket连接URL:', url);
      
      this.ws = new WebSocket(url);
      
      this.ws.on('open', () => {
        logger.info('WebSocket连接已建立');
      });
      
      this.ws.on('message', (data) => {
        try {
          const res = JSON.parse(data);
          
          if (res.code !== 0) {
            logger.error(`错误码 ${res.code}: ${res.message}`);
            if (this.socket) {
              this.socket.emit('error', { 
                message: `服务器错误: ${res.message}`,
                code: res.code
              });
            }
            
            // 如果会话已结束，尝试重新连接
            if (res.code === 10165) {
              logger.info('当前会话已结束，重新开始新的会话');
              this.#restartSession();
            }
            return;
          }
          
          this.handleResult(res);
          
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
   * 重启会话
   * @private
   */
  #restartSession() {
    this.ws.close();
    this.status = FRAME_STATUS.FIRST;
    this.#connect();
    
    // 重新发送缓冲区中的音频数据
    setTimeout(() => {
      this.audioBuffer.forEach((chunk) => {
        this.sendAudioChunk(chunk);
      });
    }, 1000);
  }

  /**
   * 生成授权URL
   * @private
   * @returns {Object} 包含URL的对象
   */
  #generateAuthUrl() {
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${this.config.host}\ndate: ${date}\nGET ${this.config.uri} HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.config.apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    const authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin));
    
    return {
      url: `${this.wsUrl}?authorization=${authStr}&date=${date}&host=${this.config.host}`,
    };
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

    const frame = {
      data: {
        status: this.status,
        format: 'audio/L16;rate=16000',
        audio: chunk.toString('base64'),
        encoding: 'raw',
      },
    };

    // 首帧需要包含初始化参数
    if (this.status === FRAME_STATUS.FIRST) {
      Object.assign(frame, {
        common: { app_id: this.config.appId },
        business: {
          language: 'zh_cn',
          domain: 'iat',
          accent: 'mandarin',
          dwa: 'wpgs', // 动态修正
          sample_rate: '16000',
          vad_eos: 10000,
          ...this.options,
        },
      });
      this.status = FRAME_STATUS.CONTINUE;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
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
      this.status = FRAME_STATUS.LAST;
      const frame = {
        data: {
          status: this.status,
          format: 'audio/L16;rate=16000',
          audio: '',
          encoding: 'raw',
        },
      };
      this.ws.send(JSON.stringify(frame));
      this.ws.close();
    }
    
    // 重置状态和缓冲区
    this.status = FRAME_STATUS.FIRST;
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
      return res.data.result.ws
        .flatMap((w) => w.cw)
        .map((c) => c.w)
        .join('');
    } catch (err) {
      logger.error('解析结果时出错:', err);
      throw new SpeechServiceError('解析结果时出错: ' + err.message);
    }
  }
} 