// src/routes/v1/tingwuTestRoutes.js
// 用于测试通义听悟服务的临时API路由

import express from 'express';
import mainTingwuService from '../../services/mainTingwuService.js';
import createLogger from '../../utils/logger.js';

const router = express.Router();
const logger = createLogger('TingwuTestRoutes');

/**
 * @route POST /api/v1/tingwu-test/create-task
 * @desc 创建离线转写任务
 * @access Public
 * 
 * 请求体示例:
 * {
 *   "fileUrl": "https://example.com/audio.wav",
 *   "format": "wav",
 *   "sampleRate": 16000
 * }
 */
router.post('/create-task', async (req, res) => {
  try {
    logger.info('收到创建任务请求');
    
    const { fileUrl, format = 'auto', sampleRate = 16000 } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: fileUrl'
      });
    }
    
    const options = {
      type: 'offline',
      input: {
        fileUrl,
        format,
        sampleRate,
        sourceLanguage: 'cn'
      },
      parameters: {
        // 转写参数
        transcription: {
          outputLevel: 2
        },
        // 启用智能标点
        textPolishEnabled: true
      }
    };
    
    const result = await mainTingwuService.createTask(options);
    
    return res.status(200).json({
      success: true,
      message: '成功创建任务',
      data: {
        taskId: result.data.taskId,
        taskStatus: result.data.taskStatus,
        apiResponse: result
      }
    });
  } catch (error) {
    logger.error('创建任务失败:', error);
    
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '创建任务失败',
      error: error.details || {}
    });
  }
});

/**
 * @route GET /api/v1/tingwu-test/task/:taskId
 * @desc 获取任务状态和结果
 * @access Public
 */
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: taskId'
      });
    }
    
    logger.info(`收到查询任务请求: ${taskId}`);
    
    const result = await mainTingwuService.getTaskInfo(taskId);
    
    // 格式化转写结果
    let formattedTranscription = null;
    if (result.data.taskStatus === 'COMPLETE' && result.data.result?.transcription) {
      try {
        const transcription = JSON.parse(result.data.result.transcription);
        
        if (transcription.sentences && transcription.sentences.length) {
          formattedTranscription = {
            sentences: transcription.sentences,
            totalTime: transcription.totalTime,
            totalLength: transcription.sentences.length
          };
        }
      } catch (e) {
        logger.warn('转写结果解析失败', e);
        formattedTranscription = { raw: result.data.result.transcription };
      }
    }
    
    return res.status(200).json({
      success: true,
      message: '成功获取任务信息',
      data: {
        taskId: result.data.taskId,
        taskStatus: result.data.taskStatus,
        transcription: formattedTranscription,
        outputFiles: {
          mp3: result.data.outputMp3Path,
          mp4: result.data.outputMp4Path,
          spectrum: result.data.outputSpectrumPath,
          thumbnail: result.data.outputThumbnailPath
        },
        apiResponse: result
      }
    });
  } catch (error) {
    logger.error('获取任务信息失败:', error);
    
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '获取任务信息失败',
      error: error.details || {}
    });
  }
});

/**
 * @route POST /api/v1/tingwu-test/realtime-task
 * @desc 创建实时转写任务（示例）
 * @access Public
 * 
 * 请求体示例:
 * {
 *   "taskKey": "my-realtime-task"
 * }
 */
router.post('/realtime-task', async (req, res) => {
  try {
    logger.info('收到创建实时任务请求');
    
    const { taskKey } = req.body;
    
    if (!taskKey) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: taskKey'
      });
    }
    
    const options = {
      type: 'realtime',
      input: {
        taskKey,
        sourceLanguage: 'cn',
        sampleRate: 16000,
        format: 'pcm',
        progressiveCallbacksEnabled: true
      },
      parameters: {
        transcription: {
          outputLevel: 2
        },
        textPolishEnabled: true
      }
    };
    
    const result = await mainTingwuService.createTask(options);
    
    return res.status(200).json({
      success: true,
      message: '成功创建实时任务',
      data: {
        taskId: result.data.taskId,
        taskStatus: result.data.taskStatus,
        meetingJoinUrl: result.data.meetingJoinUrl,
        apiResponse: result
      }
    });
  } catch (error) {
    logger.error('创建实时任务失败:', error);
    
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '创建实时任务失败',
      error: error.details || {}
    });
  }
});

/**
 * @route POST /api/v1/tingwu-test/stop-task/:taskId
 * @desc 停止实时任务
 * @access Public
 */
router.post('/stop-task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: taskId'
      });
    }
    
    logger.info(`收到停止任务请求: ${taskId}`);
    
    const options = {
      type: 'realtime',
      input: {
        taskId
      },
      operation: 'stop'
    };
    
    const result = await mainTingwuService.createTask(options);
    
    return res.status(200).json({
      success: true,
      message: '成功发送停止任务请求',
      data: {
        apiResponse: result
      }
    });
  } catch (error) {
    logger.error('停止任务失败:', error);
    
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '停止任务失败',
      error: error.details || {}
    });
  }
});

/**
 * @route GET /api/v1/tingwu-test/simple-form
 * @desc 提供简单的HTML表单用于测试通义听悟API
 * @access Public
 */
router.get('/simple-form', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>通义听悟API测试</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; box-sizing: border-box; }
        button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background: #45a049; }
        .result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; white-space: pre-wrap; }
        .loading { display: none; margin-top: 20px; }
        h1 { color: #333; }
        .tab { overflow: hidden; border: 1px solid #ccc; background-color: #f1f1f1; }
        .tab button { background-color: inherit; float: left; border: none; outline: none; cursor: pointer; padding: 14px 16px; }
        .tab button:hover { background-color: #ddd; }
        .tab button.active { background-color: #ccc; }
        .tabcontent { display: none; padding: 6px 12px; border: 1px solid #ccc; border-top: none; }
      </style>
    </head>
    <body>
      <h1>通义听悟API测试</h1>
      
      <div class="tab">
        <button class="tablinks active" onclick="openTab(event, 'CreateTask')">创建离线任务</button>
        <button class="tablinks" onclick="openTab(event, 'QueryTask')">查询任务</button>
        <button class="tablinks" onclick="openTab(event, 'RealtimeTask')">实时任务</button>
      </div>
      
      <div id="CreateTask" class="tabcontent" style="display:block;">
        <h2>创建离线转写任务</h2>
        <div class="form-group">
          <label for="fileUrl">音频文件URL:</label>
          <input type="text" id="fileUrl" placeholder="https://example.com/audio.mp3" />
        </div>
        <div class="form-group">
          <label for="format">音频格式:</label>
          <select id="format">
            <option value="auto">自动识别</option>
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="m4a">M4A</option>
          </select>
        </div>
        <div class="form-group">
          <label for="sampleRate">采样率:</label>
          <select id="sampleRate">
            <option value="16000">16000 Hz (默认)</option>
            <option value="8000">8000 Hz</option>
            <option value="44100">44100 Hz</option>
            <option value="48000">48000 Hz</option>
          </select>
        </div>
        <button onclick="createTask()">创建任务</button>
        <div id="createLoading" class="loading">正在创建任务，请稍候...</div>
        <div id="createResult" class="result"></div>
      </div>
      
      <div id="QueryTask" class="tabcontent">
        <h2>查询任务状态</h2>
        <div class="form-group">
          <label for="taskId">任务ID:</label>
          <input type="text" id="taskId" placeholder="任务ID" />
        </div>
        <button onclick="queryTask()">查询任务</button>
        <div id="queryLoading" class="loading">正在查询任务，请稍候...</div>
        <div id="queryResult" class="result"></div>
      </div>
      
      <div id="RealtimeTask" class="tabcontent">
        <h2>实时转写任务</h2>
        <div class="form-group">
          <label for="taskKey">任务名称:</label>
          <input type="text" id="taskKey" placeholder="任务标识" />
        </div>
        <button onclick="createRealtimeTask()">创建实时任务</button>
        <div id="realtimeLoading" class="loading">正在创建实时任务，请稍候...</div>
        <div id="realtimeResult" class="result"></div>
        
        <h3>停止实时任务</h3>
        <div class="form-group">
          <label for="realtimeTaskId">实时任务ID:</label>
          <input type="text" id="realtimeTaskId" placeholder="实时任务ID" />
        </div>
        <button onclick="stopTask()">停止任务</button>
        <div id="stopLoading" class="loading">正在停止任务，请稍候...</div>
        <div id="stopResult" class="result"></div>
      </div>
      
      <script>
        function openTab(evt, tabName) {
          var i, tabcontent, tablinks;
          tabcontent = document.getElementsByClassName("tabcontent");
          for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
          }
          tablinks = document.getElementsByClassName("tablinks");
          for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
          }
          document.getElementById(tabName).style.display = "block";
          evt.currentTarget.className += " active";
        }
        
        async function createTask() {
          const fileUrl = document.getElementById('fileUrl').value;
          const format = document.getElementById('format').value;
          const sampleRate = parseInt(document.getElementById('sampleRate').value);
          
          if (!fileUrl) {
            alert('请输入音频文件URL');
            return;
          }
          
          document.getElementById('createLoading').style.display = 'block';
          document.getElementById('createResult').textContent = '';
          
          try {
            const response = await fetch('/api/v1/tingwu-test/create-task', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ fileUrl, format, sampleRate }),
            });
            
            const result = await response.json();
            document.getElementById('createResult').textContent = JSON.stringify(result, null, 2);
            
            if (result.success && result.data.taskId) {
              document.getElementById('taskId').value = result.data.taskId;
            }
          } catch (error) {
            document.getElementById('createResult').textContent = '请求失败: ' + error.message;
          } finally {
            document.getElementById('createLoading').style.display = 'none';
          }
        }
        
        async function queryTask() {
          const taskId = document.getElementById('taskId').value;
          
          if (!taskId) {
            alert('请输入任务ID');
            return;
          }
          
          document.getElementById('queryLoading').style.display = 'block';
          document.getElementById('queryResult').textContent = '';
          
          try {
            const response = await fetch('/api/v1/tingwu-test/task/' + taskId);
            const result = await response.json();
            document.getElementById('queryResult').textContent = JSON.stringify(result, null, 2);
          } catch (error) {
            document.getElementById('queryResult').textContent = '请求失败: ' + error.message;
          } finally {
            document.getElementById('queryLoading').style.display = 'none';
          }
        }
        
        async function createRealtimeTask() {
          const taskKey = document.getElementById('taskKey').value;
          
          if (!taskKey) {
            alert('请输入任务名称');
            return;
          }
          
          document.getElementById('realtimeLoading').style.display = 'block';
          document.getElementById('realtimeResult').textContent = '';
          
          try {
            const response = await fetch('/api/v1/tingwu-test/realtime-task', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ taskKey }),
            });
            
            const result = await response.json();
            document.getElementById('realtimeResult').textContent = JSON.stringify(result, null, 2);
            
            if (result.success && result.data.taskId) {
              document.getElementById('realtimeTaskId').value = result.data.taskId;
            }
          } catch (error) {
            document.getElementById('realtimeResult').textContent = '请求失败: ' + error.message;
          } finally {
            document.getElementById('realtimeLoading').style.display = 'none';
          }
        }
        
        async function stopTask() {
          const taskId = document.getElementById('realtimeTaskId').value;
          
          if (!taskId) {
            alert('请输入实时任务ID');
            return;
          }
          
          document.getElementById('stopLoading').style.display = 'block';
          document.getElementById('stopResult').textContent = '';
          
          try {
            const response = await fetch('/api/v1/tingwu-test/stop-task/' + taskId, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            const result = await response.json();
            document.getElementById('stopResult').textContent = JSON.stringify(result, null, 2);
          } catch (error) {
            document.getElementById('stopResult').textContent = '请求失败: ' + error.message;
          } finally {
            document.getElementById('stopLoading').style.display = 'none';
          }
        }
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

export default router; 