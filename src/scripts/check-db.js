import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('开始测试数据库连接...');
    
    // 尝试连接数据库并计数用户表
    const userCount = await prisma.user.count();
    console.log(`连接成功！数据库中有 ${userCount} 个用户记录`);
    
    // 测试查询
    if (userCount > 0) {
      const firstUser = await prisma.user.findFirst({
        select: {
          id: true,
          username: true,
          createdAt: true
        }
      });
      console.log('找到第一个用户:', firstUser);
    }
    
    console.log('数据库测试完成，一切正常！');
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

main(); 