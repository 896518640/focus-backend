# SpeakFlow Backend

语音识别后端服务，支持多种讯飞语音识别API。

## 功能特点

- 支持讯飞RTASR实时语音识别服务
- 支持讯飞标准语音识别服务(IFlytekSTT)
- WebSocket实时音频传输与结果返回
- 统一的错误处理和日志系统
- 可扩展的模块化设计

## 项目结构

```
src/
  ├── config/             # 配置管理
  ├── controllers/        # 控制器
  ├── middlewares/        # 中间件
  ├── models/             # 数据模型
  ├── routes/             # 路由
  ├── services/           # 服务实现
  │   └── speech/         # 语音识别服务
  ├── utils/              # 工具类
  └── index.js            # 应用入口
```

## 环境要求

- Node.js >= 14.x
- 讯飞开放平台账号

## 安装

1. 克隆仓库:

```bash
git clone https://github.com/yourusername/speakflow-backend.git
cd speakflow-backend
```

2. 安装依赖:

```bash
npm install
# 或
pnpm install
```

3. 配置环境变量:

创建`.env`文件并配置以下变量:

```
# 讯飞RTASR服务配置
RTASR_APP_ID=your_rtasr_app_id
RTASR_API_KEY=your_rtasr_api_key

# 讯飞标准语音识别服务配置
IFLYTEK_APP_ID=your_iflytek_app_id
IFLYTEK_API_KEY=your_iflytek_api_key
IFLYTEK_API_SECRET=your_iflytek_api_secret

# 服务器配置（可选）
PORT=3000
CORS_ORIGIN=*
LOG_LEVEL=info
```

## 使用

### 启动服务

开发模式:

```bash
npm run dev
```

生产模式:

```bash
npm start
```

### API文档

#### WebSocket事件

**客户端发送事件:**

- `start-recording`: 开始新的录音会话
  - 参数: `{ serviceType: 'RTASR' | 'IFLYTEK_STT' }`（可选，默认为'RTASR'）

- `audio-chunk`: 发送音频数据块
  - 参数: `Uint8Array` 或 `Buffer` - 音频数据块(16kHz采样率，16bit位深的PCM音频)

- `audio-end`: 结束录音会话
  - 参数: 无

**服务器发送事件:**

- `recording-started`: 录音会话已开始
  - 数据: `{ serviceType: 'RTASR' | 'IFLYTEK_STT' }`

- `translation`: 实时语音识别结果
  - 数据: `{ original: Object, text: String }`

- `error`: 错误信息
  - 数据: `{ message: String, details: String, code: Number }`

- `warning`: 警告信息
  - 数据: `{ message: String }`

- `recording-ended`: 录音会话已结束
  - 数据: 无

#### REST API

- `GET /health`: 健康检查
  - 返回: `{ status: 'ok', timestamp: String, services: Object }`

## 客户端示例

```javascript
import io from 'socket.io-client';

// 连接到服务器
const socket = io('http://localhost:3000');

// 事件处理
socket.on('connect', () => {
  console.log('已连接到服务器');
});

socket.on('recording-started', (data) => {
  console.log('录音会话已开始:', data);
});

socket.on('translation', (data) => {
  console.log('识别结果:', data.text);
});

socket.on('error', (error) => {
  console.error('错误:', error);
});

socket.on('warning', (warning) => {
  console.warn('警告:', warning);
});

socket.on('recording-ended', () => {
  console.log('录音会话已结束');
});

// 开始录音会话
function startRecording(serviceType = 'RTASR') {
  socket.emit('start-recording', { serviceType });
}

// 发送音频数据
function sendAudioChunk(chunk) {
  socket.emit('audio-chunk', chunk);
}

// 结束录音会话
function endRecording() {
  socket.emit('audio-end');
}
```

## 许可证

ISC

## 通义听悟API

本项目提供了两种使用阿里云通义听悟API的方式：

### 1. 完整版通义听悟API

完整版API提供了丰富的功能，包括音频文件上传、转录任务管理、词汇表创建以及实时转录等功能。

访问路径: `/api/v1/tingwu/...`

### 2. 简化版通义听悟API (新增)

简化版API只保留了通义听悟的两个核心接口，更加简洁和直接：

- **创建任务**: `POST /api/v1/simple-tingwu/tasks`
  - 直接对应通义听悟的 CreateTask API
  - 参数完全透传，无额外封装
  - 示例请求:
    ```json
    {
      "type": "offline",
      "input": {
        "sourceLanguage": "cn",
        "fileUrl": "https://example.com/sample.wav"
      },
      "parameters": {
        "transcription": {
          "diarizationEnabled": true
        }
      }
    }
    ```

- **获取任务信息**: `GET /api/v1/simple-tingwu/tasks/:taskId`
  - 直接对应通义听悟的 GetTaskInfo API
  - 无额外处理，返回原始API响应
  
简化版API适合以下场景：
- 需要直接使用通义听悟原生API，无需额外封装
- 更关注API性能和响应速度
- 希望对API请求和响应有完全控制权
