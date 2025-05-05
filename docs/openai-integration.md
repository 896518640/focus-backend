# OpenAI/OpenRouter 集成

本文档介绍如何在项目中使用 OpenAI/OpenRouter 集成功能。

## 环境配置

在项目根目录的 `.env` 文件中添加以下配置：

```env
# OpenRouter配置
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o

# 应用信息（用于API请求头）
APP_NAME=Focus AI App
APP_URL=http://localhost:3000
```

## API 接口

该集成提供了以下 API 接口：

### 1. 创建聊天完成（多轮对话）

**路径**: `/api/v1/openai/chat`
**方法**: POST
**需要授权**: 是

**请求体**:

```json
{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "你好，请介绍一下自己"
    }
  ],
  "temperature": 0.7
}
```

**响应**:

```json
{
  "success": true,
  "message": "AI响应生成成功",
  "data": {
    "message": {
      "role": "assistant",
      "content": "你好！我是一个AI助手，我可以回答问题、提供信息、帮助完成各种任务。有什么我可以帮你的吗？"
    },
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 42,
      "total_tokens": 52
    },
    "model": "openai/gpt-4o"
  },
  "timestamp": "2023-08-15T12:34:56.789Z"
}
```

### 2. 创建文本完成（单轮对话）

**路径**: `/api/v1/openai/completion`
**方法**: POST
**需要授权**: 是

**请求体**:

```json
{
  "prompt": "你好，请介绍一下自己",
  "model": "openai/gpt-4o",
  "temperature": 0.7
}
```

**响应**: 与聊天完成接口相同

### 3. 获取配置信息

**路径**: `/api/v1/openai/config`
**方法**: GET
**需要授权**: 是

**响应**:

```json
{
  "success": true,
  "message": "OpenAI配置获取成功",
  "data": {
    "isInitialized": true,
    "defaultModel": "openai/gpt-4o",
    "availableModels": [
      "openai/gpt-4o",
      "openai/gpt-4-turbo",
      "anthropic/claude-3-opus",
      "anthropic/claude-3-sonnet",
      "google/gemini-pro",
      "meta-llama/llama-3-70b"
    ]
  },
  "timestamp": "2023-08-15T12:34:56.789Z"
}
```

## 客户端使用示例

### 使用 axios 调用 API

```javascript
import axios from 'axios';

// 设置 API 基础 URL 和授权 token
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': `Bearer ${yourAuthToken}`,
    'Content-Type': 'application/json'
  }
});

// 聊天完成示例
async function chatWithAI() {
  try {
    const response = await api.post('/openai/chat', {
      messages: [
        { role: "user", content: "你能帮我解释一下量子计算的基本原理吗？" }
      ],
      model: "openai/gpt-4o"
    });
    
    console.log(response.data.data.message.content);
  } catch (error) {
    console.error('调用AI接口失败:', error.response?.data || error.message);
  }
}

// 简单文本完成示例
async function getCompletion() {
  try {
    const response = await api.post('/openai/completion', {
      prompt: "简单介绍一下JavaScript的异步编程",
      model: "openai/gpt-4o"
    });
    
    console.log(response.data.data.message.content);
  } catch (error) {
    console.error('调用AI接口失败:', error.response?.data || error.message);
  }
}
```

## 注意事项

1. 使用前请确保已设置有效的 OpenRouter API 密钥
2. 默认使用 "openai/gpt-4o" 模型，可以在配置中或请求中指定其他模型
3. 所有接口都需要用户认证
4. OpenRouter 是一个代理服务，可以访问多种AI模型，包括OpenAI、Anthropic、Google等
5. 根据所选模型不同，响应时间和计费也会有所不同 