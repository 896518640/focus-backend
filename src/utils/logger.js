import log from 'log4node';
import config from '../config/index.js';

// 设置日志级别
log.setLogLevel(config.log.level);

class Logger {
  constructor(module) {
    this.module = module;
  }

  formatMessage(message) {
    return `[${this.module}] ${message}`;
  }

  info(message, ...args) {
    log.info(this.formatMessage(message), ...args);
  }

  warn(message, ...args) {
    log.warning(this.formatMessage(message), ...args);
  }

  error(message, ...args) {
    log.error(this.formatMessage(message), ...args);
  }

  debug(message, ...args) {
    log.debug(this.formatMessage(message), ...args);
  }
}

export default function createLogger(module) {
  return new Logger(module);
} 