// asyncHandler.js
// 捕获异步控制器函数的错误，自动传递到 Express 全局错误处理中间件
export default fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
