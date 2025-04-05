// fileUploadService.js
// 文件上传服务，负责文件的上传和存储

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import OSS from 'ali-oss';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 文件上传服务类
 * 负责处理文件上传到本地或OSS
 */
class FileUploadService {
  constructor() {
    // 检查必要的环境变量
    if (!process.env.ALIYUN_ACCESS_KEY_ID || !process.env.ALIYUN_ACCESS_KEY_SECRET) {
      throw new Error('缺少阿里云AccessKey配置，请在.env文件中设置ALIYUN_ACCESS_KEY_ID和ALIYUN_ACCESS_KEY_SECRET');
    }

    // 初始化OSS客户端
    this.ossClient = this.createOssClient();
    this.ossBucket = process.env.ALIYUN_OSS_BUCKET || 'focus-01';

    // 是否使用本地文件
    this.useLocalFiles = process.env.USE_LOCAL_FILES === 'true';

    // 设置上传文件存储目录
    this.uploadDir = path.join(process.cwd(), 'tmp', 'uploads');

    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 创建阿里云OSS客户端
   * @returns {Object} OSS客户端实例
   */
  createOssClient() {
    return new OSS({
      region: process.env.ALIYUN_OSS_REGION || 'oss-cn-beijing',
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      bucket: process.env.ALIYUN_OSS_BUCKET || 'focus-01',
      timeout: 60000 // 超时时间: 60秒
    });
  }

  /**
   * 处理文件上传
   * @param {Object} file - 上传的文件对象
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(file) {
    // 生成唯一文件名
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const fileName = `audio/${timestamp}-${uuidv4()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, path.basename(fileName));

    try {
      // 将文件写入本地目录
      await fs.promises.writeFile(filePath, file.buffer);

      let fileUrl = '';
      let ossObjectKey = '';

      // 判断是否使用本地文件
      if (this.useLocalFiles) {
        // 使用本地文件URL
        const baseUrl = process.env.NODE_ENV === 'production'
          ? process.env.BASE_URL || `https://${process.env.HOST || 'localhost'}`
          : `http://localhost:${process.env.PORT || 3000}`;

        fileUrl = `${baseUrl}/uploads/${path.basename(fileName)}`;
        console.log(`文件上传到本地成功: ${fileName}, URL: ${fileUrl}`);
      } else {
        // 上传到OSS
        try {
          // 设置文件的访问权限为公共读取
          const options = {
            headers: {
              'x-oss-object-acl': 'public-read'
            }
          };

          // 上传文件并设置ACL
          const result = await this.ossClient.put(fileName, filePath, options);

          // 构建可公开访问的URL
          const region = process.env.ALIYUN_OSS_REGION || 'oss-cn-beijing';
          const bucket = this.ossBucket;
          fileUrl = `https://${bucket}.${region}.aliyuncs.com/${fileName}`;

          ossObjectKey = fileName;
          console.log("oss result:", JSON.stringify(result, null, 2));
          console.log(`文件上传到OSS成功: ${fileName}, URL: ${fileUrl}`);
        } catch (ossError) {
          console.error('OSS上传失败:', ossError);
          throw new Error(`文件上传到OSS失败: ${ossError.message}`);
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
    } catch (error) {
      console.error("文件上传处理失败:", error.message);
      throw error;
    }
  }
}

// 创建单例实例
const fileUploadService = new FileUploadService();

export default fileUploadService;