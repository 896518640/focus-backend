// routeHelper.js
// 路由助手工具，简化路由配置

import asyncHandler from './asyncHandler.js';
import createLogger from './logger.js';

const logger = createLogger('RouteHelper');

/**
 * 创建路由辅助工具，简化控制器方法的包装
 * @param {Object} controller - 控制器实例
 * @returns {Object} 包装后的控制器方法对象
 */
export const createRouteHelper = (controller) => {
  const wrappedMethods = {};
  
  // 如果是类实例（包含原型链的对象）
  if (controller && typeof controller === 'object') {
    // 获取所有方法名
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
      .filter(prop => 
        typeof controller[prop] === 'function' && 
        prop !== 'constructor' && 
        !prop.startsWith('_')
      );
    
    // 为每个方法创建异步包装
    methodNames.forEach(methodName => {
      wrappedMethods[methodName] = asyncHandler(controller[methodName].bind(controller));
    });
  }
  // 如果是包含多个函数的对象（导入的多个函数）
  else if (controller && typeof controller === 'object') {
    Object.keys(controller).forEach(key => {
      if (typeof controller[key] === 'function') {
        wrappedMethods[key] = asyncHandler(controller[key]);
      }
    });
  }
  
  return wrappedMethods;
};

/**
 * 创建函数处理器
 * @param {Function} fn - 要包装的函数
 * @returns {Function} 包装后的函数
 */
export const createHandler = (fn) => {
  return asyncHandler(fn);
};

/**
 * 路由注册助手
 * @param {Object} router - Express路由实例
 * @param {String} path - 路由路径
 * @param {String} method - HTTP方法 (get, post, put, delete)
 * @param {Function} handler - 路由处理函数
 * @param {Array} middlewares - 中间件数组 (可选)
 */
export const routeRegister = (router, path, method, handler, middlewares = []) => {
  router[method.toLowerCase()](path, ...middlewares, handler);
};

/**
 * 批量注册路由
 * @param {Object} router - Express路由实例
 * @param {Array} routes - 路由配置数组
 */
export const registerRoutes = (router, routes) => {
  routes.forEach(route => {
    const { path, method, handler, middlewares = [] } = route;
    
    if (!path || !method || !handler) {
      logger.warn('无效的路由配置:', route);
      return;
    }
    
    routeRegister(router, path, method, handler, middlewares);
    logger.info(`已注册路由: ${method.toUpperCase()} ${path}`);
  });
};

/**
 * 为函数式控制器创建路由助手
 * @param {Object} functionsObject - 包含多个处理函数的对象
 * @returns {Object} 包装后的处理函数对象
 */
export const createFunctionHelper = (functionsObject) => {
  const wrappedFunctions = {};
  
  Object.keys(functionsObject).forEach(key => {
    if (typeof functionsObject[key] === 'function') {
      wrappedFunctions[key] = asyncHandler(functionsObject[key]);
    }
  });
  
  return wrappedFunctions;
};

export default {
  createRouteHelper,
  createHandler,
  routeRegister,
  registerRoutes,
  createFunctionHelper
};
