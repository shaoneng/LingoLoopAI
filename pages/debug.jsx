import React from 'react';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">🎨 Tailwind CSS 调试页面</h1>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">基础样式测试</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
              <p className="font-semibold">✅ 蓝色背景卡片</p>
              <p>如果你看到蓝色背景，说明基础样式正常</p>
            </div>

            <div className="bg-green-100 text-green-800 p-4 rounded-lg">
              <p className="font-semibold">✅ 绿色背景卡片</p>
              <p>如果你看到绿色背景，说明基础样式正常</p>
            </div>

            <div className="bg-purple-100 text-purple-800 p-4 rounded-lg">
              <p className="font-semibold">✅ 紫色背景卡片</p>
              <p>如果你看到紫色背景，说明基础样式正常</p>
            </div>

            <div className="bg-orange-100 text-orange-800 p-4 rounded-lg">
              <p className="font-semibold">✅ 橙色背景卡片</p>
              <p>如果你看到橙色背景，说明基础样式正常</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">渐变背景测试</h3>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg">
              <p className="font-semibold">🌈 蓝紫渐变背景</p>
              <p>如果你看到渐变背景，说明渐变样式正常</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">动画测试</h3>
            <div className="animate-bounce bg-red-100 text-red-800 p-4 rounded-lg inline-block">
              <p className="font-semibold">⚡ 弹跳动画</p>
              <p>如果这个方块在弹跳，说明动画正常</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">阴影测试</h3>
            <div className="shadow-lg bg-gray-100 p-4 rounded-lg">
              <p className="font-semibold">🌑 阴影效果</p>
              <p>如果你看到阴影，说明阴影样式正常</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white mb-4">如果以上所有样式都正常显示，那么 Tailwind CSS 工作正常！</p>
          <a href="/" className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}