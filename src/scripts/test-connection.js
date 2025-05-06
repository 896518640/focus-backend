// 直接使用 Prisma 的 CLI 环境运行这个脚本
// 可以通过 pnpm exec prisma --enable-external-scripts run prisma/test-connection.js 运行

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始测试数据库连接...');
    
    // 尝试连接数据库并计数用户表
    const userCount = await prisma.user.count();
    console.log(`连接成功！数据库中有 ${userCount} 个用户记录`);
    
    // 测试查询其他表
    const settingsCount = await prisma.userSettings.count();
    console.log(`数据库中有 ${settingsCount} 个用户设置记录`);
    
    const membershipCount = await prisma.membership.count();
    console.log(`数据库中有 ${membershipCount} 个会员记录`);
    
    console.log('Prisma 测试完成，一切正常！');
  } catch (error) {
    console.error('Prisma 测试失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

main(); 