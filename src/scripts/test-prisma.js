// 直接测试Prisma连接
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 测试 Prisma 连接和查询功能
 */
async function testPrisma() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== 开始测试 Prisma 连接 ===');
    
    // 尝试连接数据库
    console.log('测试数据库连接...');
    await prisma.$connect();
    console.log('连接成功！');
    
    // 查询用户数量
    const userCount = await prisma.user.count();
    console.log(`数据库中有 ${userCount} 个用户记录`);
    
    // 获取第一个用户的信息（如果有）
    if (userCount > 0) {
      const firstUser = await prisma.user.findFirst({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        }
      });
      console.log('第一个用户信息:', firstUser);
    }
    
    console.log('=== Prisma 连接测试完成，一切正常！===');
  } catch (error) {
    console.error('Prisma 测试失败:', error);
  } finally {
    try {
      await prisma.$disconnect();
      console.log('数据库连接已断开');
    } catch (error) {
      console.error('断开连接失败:', error);
    }
  }
}

// 执行测试
testPrisma(); 