#!/bin/bash

# Denom 启动脚本

echo "🚀 启动 Denom..."
echo "=================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ 错误: Node.js版本过低，需要14.0.0或更高版本"
    echo "   当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  警告: 端口3000已被占用，尝试使用端口3001"
    PORT=3001
else
    PORT=3000
fi

echo "🌐 启动服务器在端口 $PORT..."

# 启动服务器
npx http-server frontend -p $PORT -o

echo "✅ 服务器已启动!"
echo "🌐 访问地址: http://localhost:$PORT"
echo "📱 按 Ctrl+C 停止服务器"
