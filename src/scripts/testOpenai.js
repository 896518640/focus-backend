// testOpenai.js
// 测试OpenAI/OpenRouter集成

import dotenv from 'dotenv';
import openaiService from '../services/openaiService.js';

// 确保环境变量已加载
dotenv.config();

/**
 * 测试聊天完成
 */
async function testChatCompletion() {
  try {
    console.log('测试聊天完成...');
    const result = await openaiService.createChatCompletion({
      messages: [
        { role: 'user', content: '你好，请介绍一下自己' }
      ]
    });
    
    console.log('=== 聊天完成测试结果 ===');
    console.log('文本内容:', result.message.content);
    console.log('Token使用情况:', result.usage);
    console.log('使用模型:', result.model);
    console.log('===========================');
    
    return result;
  } catch (error) {
    console.error('聊天完成测试失败:', error);
    throw error;
  }
}

/**
 * 测试文本完成
 */
async function testTextCompletion() {
  try {
    console.log('测试文本完成...');
    const result = await openaiService.createCompletion('解释一下JavaScript中的Promise是什么?');
    
    console.log('=== 文本完成测试结果 ===');
    console.log('文本内容:', result.message.content);
    console.log('Token使用情况:', result.usage);
    console.log('使用模型:', result.model);
    console.log('=========================');
    
    return result;
  } catch (error) {
    console.error('文本完成测试失败:', error);
    throw error;
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('开始OpenAI集成测试...');
  
  // 检查OpenAI服务初始化状态
  if (!openaiService.openai) {
    console.error('错误: OpenAI服务未正确初始化，请检查环境变量配置。');
    console.log('请确保在.env文件中设置了以下变量:');
    console.log('- OPENROUTER_API_KEY (必需)');
    console.log('- OPENROUTER_BASE_URL (可选，默认为https://openrouter.ai/api/v1)');
    console.log('- OPENROUTER_DEFAULT_MODEL (可选，默认为openai/gpt-4o)');
    process.exit(1);
  }
  
  try {
    // 运行聊天完成测试
    await testChatCompletion();
    
    // 运行文本完成测试
    await testTextCompletion();
    
    console.log('所有测试完成，OpenAI集成工作正常！');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
    process.exit(1);
  }
}

// 执行测试
runTests(); 