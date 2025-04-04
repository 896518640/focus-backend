import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const prisma = new PrismaClient();

/**
 * 创建默认管理员用户
 */
async function createAdminUser() {
  try {
    // 检查管理员用户是否已存在
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { email: 'admin@speakflow.app' },
        ],
      },
    });

    if (existingAdmin) {
      console.log('管理员用户已存在，跳过创建');
      return;
    }

    // 默认管理员密码
    const password = '12345678';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建管理员用户
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@speakflow.app',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });

    console.log('管理员用户创建成功:', {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    });

    // 创建普通测试用户
    const userPassword = await bcrypt.hash('12345678', 10);
    
    const testUser = await prisma.user.create({
      data: {
        username: 'editor',
        email: 'editor@speakflow.app',
        password: userPassword,
        role: 'user',
        isActive: true,
      },
    });

    console.log('测试用户创建成功:', {
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role,
    });

  } catch (error) {
    console.error('创建管理员用户失败:', error);
  } finally {
    // 关闭数据库连接
    await prisma.$disconnect();
  }
}

// 执行初始化
createAdminUser(); 