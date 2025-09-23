import React from 'react';

export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tailwind CSS 测试</h1>
        <p className="text-gray-600 mb-6">如果你能看到这个页面有样式，说明 Tailwind CSS 工作正常！</p>
        <div className="space-y-4">
          <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
            <span className="font-semibold">✅ 背景色和文字颜色</span>
          </div>
          <div className="bg-green-100 text-green-800 p-4 rounded-lg">
            <span className="font-semibold">✅ Flexbox 布局</span>
          </div>
          <div className="bg-purple-100 text-purple-800 p-4 rounded-lg">
            <span className="font-semibold">✅ 渐变背景</span>
          </div>
          <div className="bg-orange-100 text-orange-800 p-4 rounded-lg">
            <span className="font-semibold">✅ 圆角和阴影</span>
          </div>
        </div>
      </div>
    </div>
  );
}