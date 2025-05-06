import prisma from '../services/prisma.js';

/**
 * 测试 Prisma 连接和查询功能
 */
async function testPrisma() {
  try {
    // 测试连接
    console.log('开始测试 Prisma 连接...');
    
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
    
    console.log('Prisma 连接测试完成，一切正常！');
  } catch (error) {
    console.error('Prisma 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行测试
testPrisma(); 