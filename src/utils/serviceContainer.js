// serviceContainer.js
// 简单的服务容器，实现依赖注入和服务管理

import createLogger from './logger.js';

/**
 * 服务容器类
 * 用于管理服务实例和依赖注入
 */
class ServiceContainer {
  constructor() {
    this.logger = createLogger('ServiceContainer');
    this.services = new Map();
    this.factories = new Map();
    this.instances = new Map();
    this.logger.info('服务容器已初始化');
  }

  /**
   * 注册服务
   * @param {string} name - 服务名称
   * @param {Function|Object} service - 服务构造函数或实例
   * @param {boolean} [singleton=true] - 是否为单例
   * @param {Array} [dependencies=[]] - 依赖的其他服务名称
   */
  register(name, service, singleton = true, dependencies = []) {
    if (this.services.has(name)) {
      this.logger.warn(`服务 ${name} 已经注册，将被覆盖`);
    }

    this.services.set(name, { service, singleton, dependencies });
    this.logger.info(`服务 ${name} 已注册${singleton ? ' (单例)' : ''}`);
    
    // 如果已经有实例，删除它
    if (this.instances.has(name)) {
      this.instances.delete(name);
    }
  }

  /**
   * 注册工厂函数
   * @param {string} name - 服务名称
   * @param {Function} factory - 创建服务实例的工厂函数
   */
  registerFactory(name, factory) {
    if (this.factories.has(name)) {
      this.logger.warn(`服务工厂 ${name} 已经注册，将被覆盖`);
    }

    this.factories.set(name, factory);
    this.logger.info(`服务工厂 ${name} 已注册`);
  }

  /**
   * 获取服务实例
   * @param {string} name - 服务名称
   * @returns {Object} 服务实例
   */
  get(name) {
    // 检查是否已经有创建好的实例（单例情况）
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // 检查是否有工厂函数
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const instance = factory();
      this.instances.set(name, instance);
      return instance;
    }

    // 检查服务是否注册
    if (!this.services.has(name)) {
      this.logger.error(`服务 ${name} 未注册`);
      throw new Error(`服务 ${name} 未注册`);
    }

    const { service, singleton, dependencies } = this.services.get(name);

    // 解析依赖
    const resolvedDependencies = dependencies.map(dep => this.get(dep));

    // 创建服务实例
    let instance;

    if (typeof service === 'function') {
      // 如果是构造函数，使用 new 创建实例
      instance = new service(...resolvedDependencies);
    } else {
      // 如果是对象，直接返回
      instance = service;
    }

    // 如果是单例，保存实例
    if (singleton) {
      this.instances.set(name, instance);
    }

    return instance;
  }

  /**
   * 检查服务是否已注册
   * @param {string} name - 服务名称
   * @returns {boolean} 是否已注册
   */
  has(name) {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * 获取所有已注册的服务名称
   * @returns {Array<string>} 服务名称数组
   */
  getServiceNames() {
    return [...this.services.keys()];
  }

  /**
   * 清理容器
   * 移除所有服务和实例
   */
  clear() {
    this.services.clear();
    this.factories.clear();
    this.instances.clear();
    this.logger.info('服务容器已清理');
  }
}

// 创建全局服务容器实例
const container = new ServiceContainer();

export default container;
