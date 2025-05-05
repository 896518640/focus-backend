/**
 * 认证相关的Swagger模型定义
 */

export const loginRequest = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: {
      type: 'string',
      description: '用户名',
      example: 'admin'
    },
    password: {
      type: 'string',
      description: '密码',
      example: 'password123'
    }
  }
};

export const loginResponse = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE2MTU1MjQwMDAsImV4cCI6MTYxNTYxMDQwMH0.jLX4BXVrfwQxfInpnwpDXrZWxKGaRVuHwVmsjdCLxYA'
    }
  }
};

export const registerRequest = {
  type: 'object',
  required: ['username', 'email', 'password'],
  properties: {
    username: {
      type: 'string',
      description: '用户名（登录账号）',
      example: 'newuser'
    },
    displayName: {
      type: 'string',
      description: '用户显示名称（如未提供，将自动生成）',
      example: '张三'
    },
    email: {
      type: 'string',
      description: '电子邮箱',
      example: 'user@example.com'
    },
    password: {
      type: 'string',
      description: '密码',
      example: 'password123'
    }
  }
};

export const registerResponse = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000'
    },
    username: {
      type: 'string',
      example: 'newuser'
    },
    displayName: {
      type: 'string',
      example: '张三'
    },
    email: {
      type: 'string',
      example: 'user@example.com'
    }
  }
};

export default {
  loginRequest,
  loginResponse,
  registerRequest,
  registerResponse
}; 