// CommonJS 模块，避免 ESM 相关问题
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

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
    
    console.log('=== Prisma 连接测试完成，一切正常！===');
  } catch (error) {
    console.error('Prisma 测试失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已断开');
  }
}

// 执行测试
testPrisma(); 