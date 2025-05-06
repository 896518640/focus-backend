// authController.js
// 认证控制器，处理用户登录、注册和授权

import BaseController from './BaseController.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.js';
import createLogger from '../utils/logger.js';

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'speakflow-secret-key';
const JWT_EXPIRES_IN = '24h';

/**
 * 认证控制器
 * 处理用户认证、登录、注册等功能
 */
class AuthController extends BaseController {
  /**
   * 构造函数
   */
  constructor() {
    super('AuthController');
  }

  /**
   * 处理用户登录请求
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // 查找用户
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email: username }
          ]
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          password: true,
          role: true,
          isActive: true
        }
      });

      // 检查用户是否存在
      if (!user) {
        this.logger.warn(`登录失败: 用户"${username}"不存在`);
        return this.fail(res, '用户名或密码错误', null, 401);
      }

      // 检查用户状态
      if (!user.isActive) {
        this.logger.warn(`登录失败: 用户"${username}"已被禁用`);
        return this.fail(res, '账户已被禁用，请联系管理员', null, 403);
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`登录失败: 用户"${username}"密码错误`);
        return this.fail(res, '用户名或密码错误', null, 401);
      }

      // 创建JWT令牌
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      this.logger.info(`用户"${username}"登录成功`);
      return this.success(res, '登录成功', { token });
    } catch (error) {
      this.logger.error('登录处理发生错误:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 处理用户注册请求
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async register(req, res) {
    try {
      const { username, email, password, displayName } = req.body;

      // 检查用户名是否已存在
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email },
          ],
        },
      });

      if (existingUser) {
        const field = existingUser.username === username ? '用户名' : '邮箱';
        this.logger.warn(`注册失败：${field} 已被使用`);
        return this.fail(res, `${field}已被使用`, null, 400);
      }

      // 生成默认显示名称（FOX_时间戳后6位）
      const timestamp = Date.now().toString();
      const defaultDisplayName = `FOX_${timestamp.substring(timestamp.length - 6)}`;

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          displayName: displayName || defaultDisplayName, // 优先使用提供的displayName，否则使用生成的默认名称
          role: 'user',
        },
      });

      this.logger.info(`新用户注册成功: ${username}, 显示名称: ${newUser.displayName}`);
      return this.success(res, '注册成功', {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        email: newUser.email,
      }, 201);
    } catch (error) {
      this.logger.error('注册处理发生错误:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 获取当前登录用户信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试获取当前用户信息，userId: ${userId}`);
      
      if (!userId) {
        this.logger.warn('获取用户信息失败：用户ID不存在');
        return this.fail(res, '未授权，无法获取用户信息', null, 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        this.logger.warn(`获取用户信息失败：用户ID ${userId} 不存在`);
        return this.fail(res, '用户不存在', null, 404);
      }

      this.logger.info(`成功获取用户信息，userId: ${userId}`);
      return this.success(res, '获取用户信息成功', user);
    } catch (error) {
      this.logger.error('获取当前用户信息失败:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * JWT Token验证中间件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件函数
   */
  verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.warn('Token验证失败：未提供授权头或格式错误');
        return this.fail(res, '未提供有效的授权令牌', null, 401);
      }
      
      const token = authHeader.split(' ')[1];
      
      if (!token) {
        this.logger.warn('Token验证失败：令牌为空');
        return this.fail(res, '未提供有效的授权令牌', null, 401);
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          this.logger.warn('Token验证失败：令牌已过期');
          return this.fail(res, '授权令牌已过期，请重新登录', null, 401);
        }
        
        this.logger.warn('Token验证失败：无效的令牌');
        return this.fail(res, '无效的授权令牌', null, 401);
      }
    } catch (error) {
      this.logger.error('Token验证过程发生错误:', error);
      return this.fail(res, '服务器错误，请稍后再试', error, 500);
    }
  }

  /**
   * 生成JWT令牌
   * @private
   * @param {Object} user - 用户对象
   * @returns {String} JWT令牌
   */
  _generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }
}

// 创建实例
const authController = new AuthController();

// 导出与原接口保持兼容的函数
export const login = authController.login.bind(authController);
export const register = authController.register.bind(authController);
export const getCurrentUser = authController.getCurrentUser.bind(authController);
export const verifyToken = authController.verifyToken.bind(authController);

// 导出默认实例
export default authController;