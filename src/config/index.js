import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 语音服务配置
const speechConfig = {
  rtasr: {
    appId: process.env.RTASR_APP_ID,
    apiKey: process.env.RTASR_API_KEY,
  },
  iflytek: {
    appId: process.env.IFLYTEK_APP_ID,
    apiKey: process.env.IFLYTEK_API_KEY,
    apiSecret: process.env.IFLYTEK_API_SECRET,
  }
};

// 服务器配置
const serverConfig = {
  port: process.env.PORT || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  }
};

// 日志配置
const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
};

// 配置验证函数
export function validateConfig() {
  const requiredConfigs = {
    'RTASR': ['RTASR_APP_ID', 'RTASR_API_KEY'],
    'IFLYTEK': ['IFLYTEK_APP_ID', 'IFLYTEK_API_KEY', 'IFLYTEK_API_SECRET'],
  };

  const missingConfigsByService = {};
  let hasErrors = false;

  Object.entries(requiredConfigs).forEach(([service, keys]) => {
    const missingKeys = keys.filter(key => !process.env[key]);
    if (missingKeys.length > 0) {
      missingConfigsByService[service] = missingKeys;
      hasErrors = true;
    }
  });

  return {
    isValid: !hasErrors,
    missingConfigs: missingConfigsByService
  };
}

export default {
  speech: speechConfig,
  server: serverConfig,
  log: logConfig,
}; 