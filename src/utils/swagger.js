// swagger.js
// Swagger/OpenAPI 文档生成工具

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import createLogger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = createLogger('SwaggerUtil');

/**
 * Swagger配置选项
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Focus API 文档',
      version: '1.0.0',
      description: 'Focus项目API接口文档',
      contact: {
        name: 'Focus开发团队'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API V1 - 开发环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: '通义听悟',
        description: '音频转录相关API'
      },
      {
        name: '用户管理',
        description: '用户账户管理API'
      },
      {
        name: '认证',
        description: '用户登录和认证API'
      }
    ]
  },
  // 扫描带有JSDoc注释的路由和控制器文件
  apis: [
    path.join(__dirname, '../routes/**/*.js'),
    path.join(__dirname, '../controllers/**/*.js')
  ]
};

// 生成Swagger规范
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * 在Express应用中设置Swagger UI
 * @param {Object} app - Express应用实例
 */
export const setupSwagger = (app) => {
  try {
    // 提供Swagger UI
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }', // 隐藏顶部栏
        customSiteTitle: 'Focus API 文档',
        customfavIcon: '/favicon.ico'
      })
    );

    // 提供Swagger JSON端点
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // 保存Swagger规范到文件
    const swaggerOutputDir = path.join(process.cwd(), 'docs', 'swagger');
    if (!fs.existsSync(swaggerOutputDir)) {
      fs.mkdirSync(swaggerOutputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(swaggerOutputDir, 'swagger.json'),
      JSON.stringify(swaggerSpec, null, 2)
    );

    logger.info('Swagger API文档已生成');
  } catch (error) {
    logger.error('设置Swagger文档时出错:', error);
  }
};

/**
 * API注释示例
 */
export const apiDocExamples = {
  controllerClass: `
/**
 * @swagger
 * tags:
 *   name: 用户管理
 *   description: 用户管理相关API
 */`,

  route: `
/**
 * @swagger
 * /users:
 *   get:
 *     summary: 获取所有用户
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 */`,

  schema: `
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: 用户ID
 *         name:
 *           type: string
 *           description: 用户名
 *         email:
 *           type: string
 *           format: email
 *           description: 用户邮箱
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 */`
};

export default { setupSwagger, apiDocExamples };
