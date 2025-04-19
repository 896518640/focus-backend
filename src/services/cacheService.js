// cacheService.js
// 内存缓存服务，提供高效的数据缓存能力

import BaseService from './BaseService.js';

/**
 * 缓存项类
 * 表示单个缓存项，包含值、过期时间等信息
 */
class CacheItem {
  /**
   * 创建新的缓存项
   * @param {*} value - 缓存的值
   * @param {number} ttl - 生存时间(毫秒)，0表示永不过期
   */
  constructor(value, ttl = 0) {
    this.value = value;
    this.createdAt = Date.now();
    this.ttl = ttl;
  }

  /**
   * 检查缓存项是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired() {
    if (this.ttl === 0) return false;
    return Date.now() - this.createdAt > this.ttl;
  }
}

/**
 * 内存缓存服务类
 * 提供应用内存缓存功能
 */
class CacheService extends BaseService {
  /**
   * 创建缓存服务实例
   */
  constructor() {
    super('CacheService');
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expirations: 0
    };

    // 设置自动清理任务
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
    this.logger.info('缓存服务已初始化');
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} ttl - 生存时间(毫秒)，0表示永不过期
   * @returns {boolean} 操作是否成功
   */
  set(key, value, ttl = 0) {
    try {
      this.cache.set(key, new CacheItem(value, ttl));
      this.stats.sets++;
      this.logger.debug(`缓存项已设置: ${key}, TTL: ${ttl}ms`);
      return true;
    } catch (error) {
      this.logger.error(`设置缓存项失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @param {*} defaultValue - 缓存项不存在或已过期时的默认值
   * @returns {*} 缓存值或默认值
   */
  get(key, defaultValue = null) {
    const item = this.cache.get(key);
    
    // 如果项不存在
    if (!item) {
      this.stats.misses++;
      this.logger.debug(`缓存未命中: ${key}`);
      return defaultValue;
    }
    
    // 如果项已过期
    if (item.isExpired()) {
      this.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      this.logger.debug(`缓存项已过期: ${key}`);
      return defaultValue;
    }
    
    // 缓存命中
    this.stats.hits++;
    this.logger.debug(`缓存命中: ${key}`);
    return item.value;
  }

  /**
   * 检查缓存项是否存在且未过期
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在且未过期
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.isExpired()) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @returns {boolean} 是否成功删除
   */
  delete(key) {
    const result = this.cache.delete(key);
    if (result) {
      this.stats.deletes++;
      this.logger.debug(`缓存项已删除: ${key}`);
    }
    return result;
  }

  /**
   * 清空所有缓存
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`已清空所有缓存项，共 ${size} 项`);
  }

  /**
   * 清理过期的缓存项
   * @returns {number} 清理的项数
   */
  cleanup() {
    let count = 0;
    for (const [key, item] of this.cache.entries()) {
      if (item.isExpired()) {
        this.delete(key);
        count++;
        this.stats.expirations++;
      }
    }
    
    if (count > 0) {
      this.logger.info(`自动清理已移除 ${count} 个过期缓存项`);
    }
    
    return count;
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
      
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * 用函数计算缓存值，如果已存在且未过期则直接返回
   * @param {string} key - 缓存键
   * @param {Function} fn - 生成值的函数
   * @param {number} ttl - 生存时间(毫秒)
   * @returns {*} 缓存值
   */
  async getOrSet(key, fn, ttl = 0) {
    // 检查缓存中是否已存在
    if (this.has(key)) {
      return this.get(key);
    }
    
    try {
      // 调用函数生成值
      const value = await fn();
      // 存入缓存
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`getOrSet操作失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 销毁缓存服务，清理定时器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    this.logger.info('缓存服务已销毁');
  }
}

// 创建单例实例
const cacheService = new CacheService();

export default cacheService;
