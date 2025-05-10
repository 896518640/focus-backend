#!/usr/bin/env node
// scripts/test-tingwu.js
// 通义听悟服务测试脚本

import mainTingwuService from '../services/tingwuService.js';
import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 保存任务ID用于后续查询
let lastTaskId = null;

/**
 * 主菜单
 */
async function showMenu() {
  console.log('\n===== 通义听悟服务测试 =====');
  console.log('1. 创建离线转写任务（文件URL）');
  console.log('2. 创建离线转写任务（本地文件）');
  console.log('3. 查询任务状态');
  console.log('4. 退出');
  console.log('==========================');
  
  rl.question('请选择操作 [1-4]: ', async (answer) => {
    switch(answer.trim()) {
      case '1':
        await createOfflineTaskWithUrl();
        break;
      case '2':
        await createOfflineTaskWithLocalFile();
        break;
      case '3':
        await queryTaskStatus();
        break;
      case '4':
        console.log('退出测试工具');
        rl.close();
        return;
      default:
        console.log('无效的选项，请重新选择');
        await showMenu();
        break;
    }
  });
}

/**
 * 创建离线转写任务（使用URL）
 */
async function createOfflineTaskWithUrl() {
  rl.question('请输入音频文件URL: ', async (fileUrl) => {
    try {
      console.log('正在创建离线转写任务...');
      
      const options = {
        type: 'offline',
        input: {
          fileUrl: fileUrl,
          format: 'auto', // 通义听悟会自动识别格式
          sourceLanguage: 'cn'
        },
        parameters: {
          // 转写参数
          transcription: {
            outputLevel: 2 // 标准输出级别
          },
          // 启用智能标点
          textPolishEnabled: true
        }
      };
      
      const result = await mainTingwuService.createTask(options);
      console.log('\n创建任务成功!');
      console.log(`任务ID: ${result.data.taskId}`);
      console.log(`任务状态: ${result.data.taskStatus}`);
      console.log('原始响应:', JSON.stringify(result, null, 2));
      
      // 保存任务ID用于后续查询
      lastTaskId = result.data.taskId;
      
      // 返回主菜单
      showMenu();
    } catch (error) {
      console.error('创建任务失败:', error.message);
      console.error(error.details || '');
      showMenu();
    }
  });
}

/**
 * 创建离线转写任务（上传本地文件）
 * 注意：这个方法需要先把文件上传到OSS或者其他可访问的URL
 * 这里仅仅是一个示例，实际使用需要结合OSS上传功能
 */
async function createOfflineTaskWithLocalFile() {
  rl.question('请输入本地音频文件路径: ', async (filePath) => {
    try {
      console.log('警告: 此功能仅作示例。实际使用时需要先将文件上传至OSS获取URL。');
      console.log(`选择的文件: ${filePath}`);
      console.log('由于需要URL，此功能暂不可用。请先将文件上传至可公开访问的URL，然后使用选项1进行测试。');
      
      // 实际实现应该是：
      // 1. 上传文件到OSS或其他存储
      // 2. 获取文件URL
      // 3. 调用通义听悟API
      
      // 返回主菜单
      showMenu();
    } catch (error) {
      console.error('操作失败:', error.message);
      showMenu();
    }
  });
}

/**
 * 查询任务状态
 */
async function queryTaskStatus() {
  const promptTaskId = lastTaskId ? 
    `请输入任务ID (按回车使用上次的ID: ${lastTaskId}): ` : 
    '请输入任务ID: ';
  
  rl.question(promptTaskId, async (taskId) => {
    // 如果用户没有输入，使用上次的任务ID
    const id = taskId.trim() || lastTaskId;
    
    if (!id) {
      console.log('未提供任务ID');
      showMenu();
      return;
    }
    
    try {
      console.log(`正在查询任务 ${id} 的状态...`);
      const result = await mainTingwuService.getTaskInfo(id);
      
      console.log('\n查询成功!');
      console.log(`任务ID: ${result.data.taskId}`);
      console.log(`任务状态: ${result.data.taskStatus}`);
      
      // 如果任务完成，显示结果摘要
      if (result.data.taskStatus === 'COMPLETE') {
        console.log('\n===== 任务结果 =====');
        
        // 显示转写结果（如果有）
        if (result.data.result?.transcription) {
          try {
            const transcription = JSON.parse(result.data.result.transcription);
            console.log('\n转写结果摘要:');
            
            if (transcription.sentences && transcription.sentences.length) {
              // 显示前3个句子
              const previewSentences = transcription.sentences.slice(0, 3);
              previewSentences.forEach((sentence, index) => {
                console.log(`句子${index + 1}: ${sentence.text}`);
              });
              console.log(`... 共 ${transcription.sentences.length} 个句子`);
            } else {
              console.log('未找到转写句子内容');
            }
          } catch (e) {
            console.log('转写结果解析失败，原始内容:', result.data.result.transcription.substring(0, 200) + '...');
          }
        }
        
        // 显示其他输出文件路径
        if (result.data.outputMp3Path) console.log(`MP3输出: ${result.data.outputMp3Path}`);
        if (result.data.outputMp4Path) console.log(`MP4输出: ${result.data.outputMp4Path}`);
      }
      
      console.log('\n原始响应:', JSON.stringify(result, null, 2));
      
      // 返回主菜单
      showMenu();
    } catch (error) {
      console.error('查询任务失败:', error.message);
      console.error(error.details || '');
      showMenu();
    }
  });
}

// 启动主菜单
console.log('正在初始化通义听悟测试工具...');
showMenu(); 