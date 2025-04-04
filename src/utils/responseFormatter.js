/**
 * 统一响应格式化工具
 * 
 * @param {number} code - 状态码，0表示成功，其他值表示错误
 * @param {string} message - 响应消息
 * @param {any} data - 响应数据
 * @returns {object} 格式化后的响应对象
 */
export const formatResponse = (code = 0, message = '操作成功', data = null) => {
  return {
    code,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};
