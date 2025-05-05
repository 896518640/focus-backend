// authController.js
// 认证控制器，处理用户登录、注册和授权

import BaseController from './BaseController.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import createLogger from '../utils/logger.js';
import { formatResponse } from '../utils/responseFormatter.js';

// 创建Prisma客户端实例
const prisma = new PrismaClient();

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
      const user = await prisma.user.findUnique({
        where: { username },
      });

      // 用户不存在
      if (!user) {
        this.logger.warn(`登录失败：用户 ${username} 不存在`);
        return res.status(401).json(formatResponse(401, '用户名或密码错误'));
      }

      // 用户被禁用
      if (!user.isActive) {
        this.logger.warn(`登录失败：用户 ${username} 已被禁用`);
        return res.status(403).json(formatResponse(403, '账户已被禁用，请联系管理员'));
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`登录失败：用户 ${username} 密码错误`);
        return res.status(401).json(formatResponse(401, '用户名或密码错误'));
      }

      // 生成JWT令牌
      const token = this._generateToken(user);

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      this.logger.info(`用户 ${username} 登录成功`);
      return res.json(formatResponse(0, '登录成功', { token }));
    } catch (error) {
      this.logger.error('登录处理发生错误:', error);
      return res.status(500).json(formatResponse(500, '服务器错误，请稍后再试'));
    }
  }

  /**
   * 处理用户注册请求
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

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
        return res.status(400).json(formatResponse(400, `${field}已被使用`));
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: 'user',
        },
      });

      this.logger.info(`新用户注册成功: ${username}`);
      return res.status(201).json(formatResponse(0, '注册成功', {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      }));
    } catch (error) {
      this.logger.error('注册处理发生错误:', error);
      return res.status(500).json(formatResponse(500, '服务器错误，请稍后再试'));
    }
  }

  /**
   * 获取当前用户信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user?.userId;
      
      this.logger.info(`尝试获取用户信息，userId: ${userId}`);
      
      // 检查用户ID是否存在
      if (!userId) {
        this.logger.warn('获取用户信息失败：用户ID不存在');
        return res.status(401).json(formatResponse(401, '未授权，无法获取用户信息'));
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        this.logger.warn(`获取用户信息失败：ID为 ${userId} 的用户不存在`);
        return res.status(404).json(formatResponse(404, '用户不存在'));
      }

      return res.json(formatResponse(0, '获取用户信息成功', user));
    } catch (error) {
      this.logger.error('获取用户信息发生错误:', error);
      return res.status(500).json(formatResponse(500, '服务器错误，请稍后再试'));
    }
  }

  /**
   * 验证JWT令牌
   * @param {String} token - JWT令牌
   * @returns {Object|null} - 解码的用户信息或null
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      this.logger.error('Token验证失败:', error);
      return null;
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