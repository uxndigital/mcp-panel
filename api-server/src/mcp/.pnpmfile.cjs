// 强制禁用工作区功能，让 MCP 项目独立安装依赖
module.exports = {
  hooks: {
    readPackage(pkg) {
      // 移除 workspace 相关的配置
      if (pkg.workspaces) {
        delete pkg.workspaces;
      }
      return pkg;
    }
  }
}; 