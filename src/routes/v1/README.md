# API 路由组织说明

## 路由结构优化

本项目的API路由已经进行了优化整合，以减少冗余并提高一致性。主要改进如下：

### 1. 统一用户路由 (`userRoutes.js`)

我们将原来分散的身份验证和用户管理功能合并到一个统一的用户路由模块中，并且删除了弃用的路由文件（`auth.js`和`user.js`）：

- `/api/v1/user/auth/login` - 用户登录 
- `/api/v1/user/auth/register` - 用户注册
- `/api/v1/user/me` - 获取当前用户基本信息
- `/api/v1/user/profile` - 获取/更新用户详细个人资料
- `/api/v1/user/activities` - 获取/记录用户活动
- `/api/v1/user/stats` - 获取用户使用统计
- `/api/v1/user/settings` - 更新用户设置

这种组织方式有以下优势：
- 所有用户相关功能统一管理
- 路由路径更加清晰和语义化
- 减少了重复的认证中间件应用
- 统一了路由注册方式
- 消除了冗余和冲突的路由定义

### 2. 控制器导出方式统一

所有控制器现在都使用一致的导出模式：
- 类方法以单独的命名函数导出
- 同时保留默认导出以兼容旧代码

### 3. 移除冗余路由定义

- 删除了已弃用的路由文件（`auth.js`和`user.js`）
- 保留了统一的用户路由模块（`userRoutes.js`）
- 明确列出了静态注册的路由模块，避免动态注册冲突

## 路由注册机制

本项目使用两种路由注册方式：

1. **静态注册**：在 `index.js` 中通过 `router.use('/path', moduleRoutes)` 明确注册
2. **动态注册**：通过 `registerAllRoutes` 函数自动扫描和注册未被静态注册的路由模块

为避免冲突，`explicitlyRegisteredRoutes` 数组中列出了所有静态注册的模块名称，这些模块将被动态注册机制排除。

## 路由助手工具

项目使用 `routeHelper.js` 中的工具统一处理路由注册和错误处理：

- `createFunctionHelper` - 为函数式控制器创建包装器
- `registerRoutes` - 批量注册路由配置
- `createHandler` - 为单个处理函数创建包装器

## 路由命名规范

所有API路由遵循以下命名规范：

1. **认证相关**：`/api/v1/user/auth/*`
2. **用户资料**：`/api/v1/user/profile`
3. **用户活动**：`/api/v1/user/activities` 
4. **用户统计**：`/api/v1/user/stats`
5. **用户设置**：`/api/v1/user/settings`

## 后续改进建议

1. 考虑为其他功能模块（如 `tingwu`、`translation` 等）也采用类似的组织结构
2. 可以为 API 添加版本控制前缀，如 `/api/v2/...` 
3. 实现 API 文档自动生成工具，基于路由配置和控制器注释 