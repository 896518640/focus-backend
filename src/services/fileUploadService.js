// fileUploadService.js
// 文件上传服务，负责文件的上传和存储

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import OSS from 'ali-oss';
import BaseService from './BaseService.js';
import configService from '../config/configService.js';
import { ConfigError, AppError } from '../utils/errors.js';
import cacheService from './cacheService.js';

/**
 * 文件上传服务类
 * 负责处理文件上传到本地或OSS
 */
class FileUploadService extends BaseService {
  constructor() {
    super('FileUploadService');
    
    // 检查必要的配置项
    try {
      const requiredConfig = ['aliyun.accessKeyId', 'aliyun.accessKeySecret'];
      const validation = configService.validateRequiredConfig(requiredConfig);
      
      if (!validation.isValid) {
        throw new ConfigError(
          `缺少阿里云AccessKey配置: ${validation.missingKeys.join(', ')}`,
          500,
          { missingKeys: validation.missingKeys }
        );
      }
    } catch (error) {
      this.logger.error('初始化配置错误', error);
      throw error;
    }

    // 初始化OSS客户端
    this.ossClient = this.createOssClient();
    this.ossBucket = configService.get('aliyun.oss.bucket', 'focus-01');

    // 是否使用本地文件
    this.useLocalFiles = configService.get('storage.useLocalFiles', false);

    // 设置上传文件存储目录
    this.uploadDir = configService.get('storage.uploadDir', path.join(process.cwd(), 'tmp', 'uploads'));

    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    this.logger.info('文件上传服务已初始化');
  }

  /**
   * 创建阿里云OSS客户端
   * @returns {Object} OSS客户端实例
   */
  createOssClient() {
    return new OSS({
      region: configService.get('aliyun.oss.region', 'oss-cn-beijing'),
      accessKeyId: configService.get('aliyun.accessKeyId'),
      accessKeySecret: configService.get('aliyun.accessKeySecret'),
      bucket: configService.get('aliyun.oss.bucket', 'focus-01'),
      timeout: configService.get('aliyun.oss.timeout', 60000)
    });
  }

  /**
   * 处理文件上传
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(file) {
    return this.executeWithErrorHandling(async () => {
      // 参数验证
      if (!file || !file.buffer) {
        throw new AppError('无效的文件对象', 400);
      }
      
      // 生成唯一文件名
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
      const fileName = `audio/${timestamp}-${uuidv4()}-${file.originalname}`;
      const filePath = path.join(this.uploadDir, path.basename(fileName));

      // 将文件写入本地目录
      await fs.promises.writeFile(filePath, file.buffer);

      let fileUrl = '';
      let ossObjectKey = '';

      // 判断是否使用本地文件
      if (this.useLocalFiles) {
        // 使用本地文件URL
        const baseUrl = configService.get('server.baseUrl', 
          `http://localhost:${configService.get('server.port', 3000)}`);

        fileUrl = `${baseUrl}/uploads/${path.basename(fileName)}`;
        this.logger.info(`文件上传到本地成功: ${fileName}, URL: ${fileUrl}`);
      } else {
        // 上传到OSS
        try {
          // 检查缓存中是否有相同内容的文件
          const fileHash = await this.calculateFileHash(file.buffer);
          const cachedFile = cacheService.get(`file:${fileHash}`);
          
          if (cachedFile) {
            this.logger.info(`文件内容已存在于缓存，重用现有URL: ${cachedFile.fileUrl}`);
            return cachedFile;
          }
          
          // 设置文件的访问权限为公共读取
          const options = {
            headers: {
              'x-oss-object-acl': 'public-read'
            }
          };

          // 上传文件并设置ACL
          const result = await this.ossClient.put(fileName, filePath, options);

          // 构建可公开访问的URL
          const region = configService.get('aliyun.oss.region', 'oss-cn-beijing');
          const bucket = this.ossBucket;
          fileUrl = `https://${bucket}.${region}.aliyuncs.com/${fileName}`;

          ossObjectKey = fileName;
          this.logger.info("OSS上传结果:", result);
          this.logger.info(`文件上传到OSS成功: ${fileName}, URL: ${fileUrl}`);
          
          // 计算文件的MD5哈希值并缓存上传结果
          const uploadResult = {
            fileName: path.basename(fileName),
            filePath,
            fileUrl,
            ossObjectKey,
            ossBucket: this.ossBucket,
            size: file.size,
            mimeType: file.mimetype
          };
          
          // 缓存文件信息，有效期24小时
          cacheService.set(`file:${fileHash}`, uploadResult, 24 * 60 * 60 * 1000);
        } catch (ossError) {
          this.logger.error('OSS上传失败:', ossError);
          throw new AppError(`文件上传到OSS失败: ${ossError.message}`, 500);
        }
      }

      return {
        fileName: path.basename(fileName),
        filePath,
        fileUrl,
        ossObjectKey,
        ossBucket: this.ossBucket,
        size: file.size,
        mimeType: file.mimetype
      };
    }, [], '文件上传处理失败');
  }
  
  /**
   * 计算文件的哈希值
   * @param {Buffer} buffer - 文件内容
   * @returns {Promise<string>} 哈希值
   */
  async calculateFileHash(buffer) {
    // 简单实现，实际项目中可以使用更好的哈希算法
    const crypto = await import('crypto');
    return crypto.createHash('md5').update(buffer).digest('hex');
  }
  
  /**
   * 根据URL获取文件名
   * @param {string} url - 文件URL
   * @returns {string} 文件名
   */
  getFileNameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathName = urlObj.pathname;
      return pathName.split('/').pop();
    } catch (error) {
      this.logger.error('从URL解析文件名失败:', error);
      return '';
    }
  }
}

// 创建单例实例
const fileUploadService = new FileUploadService();

export default fileUploadService;