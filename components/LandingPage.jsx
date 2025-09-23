import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LandingPage = () => {
  const router = useRouter();

  const features = [
    {
      icon: '🎵',
      title: '智能音频转写',
      description: 'AI 驱动的语音识别，精准转写英语音频内容',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: '📊',
      title: '深度学习分析',
      description: '语法结构、关键词提取、情感分析全方位学习',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: '🎯',
      title: '个性化学习',
      description: '根据你的学习进度智能推荐内容和功能',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: '📱',
      title: '全平台支持',
      description: '桌面端和移动端完美同步，随时随地学习',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const demos = [
    {
      title: 'BBC 6 Minute English',
      description: '短小精悍的英语学习节目，适合日常练习',
      duration: '6分钟',
      level: '中级',
      image: '🎙️'
    },
    {
      title: 'TED 演讲精选',
      description: '富有启发性的英语演讲，提升听力理解能力',
      duration: '15分钟',
      level: '高级',
      image: '🎤'
    },
    {
      title: '英语新闻播报',
      description: '实时新闻内容，掌握地道英语表达',
      duration: '10分钟',
      level: '中级',
      image: '📰'
    }
  ];

  const stats = [
    { value: '98%', label: '转写准确率' },
    { value: '50K+', label: '活跃用户' },
    { value: '1M+', label: '处理音频' },
    { value: '4.9/5', label: '用户评分' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">LingoLoopAI</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200">
                    功能特色
                  </a>
                  <a href="#demo" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200">
                    体验演示
                  </a>
                  <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200">
                    价格方案
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-all duration-200 hover:shadow-lg"
              >
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 animate-pulse"></span>
                全新体验，开启智能英语学习之旅
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8 tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  智能英语听力
                </span>
                <span className="block text-gray-800 mt-3">学习平台</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl">
                上传音频，获得精准转写，AI 驱动分析，让英语学习更高效。
                <span className="block mt-3 text-gray-500">从今天开始，提升你的英语听力水平。</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start mb-10">
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-5 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center justify-center group"
                >
                  <span className="mr-3 text-xl">🚀</span>
                  开始免费试用
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
                <button
                  onClick={() => router.push('/demo')}
                  className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-5 rounded-full text-lg font-semibold hover:border-gray-300 hover:text-gray-900 transition-all duration-300 hover:shadow-lg flex items-center justify-center group"
                >
                  <span className="mr-3 text-xl">🎵</span>
                  体验演示
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2 text-lg">✓</span>
                  免费试用
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2 text-lg">✓</span>
                  无需信用卡
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2 text-lg">✓</span>
                  5分钟上手
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-2xl p-8 md:p-12 backdrop-blur-sm">
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-blue-100/[0.05] bg-[length:20px_20px]"></div>
                    <div className="relative z-10 text-center">
                      <div className="text-8xl md:text-9xl mb-6 drop-shadow-sm animate-pulse">🎧</div>
                      <div className="text-gray-700 font-medium text-xl">音频播放器演示</div>
                      <div className="text-gray-500 mt-4">支持多种音频格式</div>
                    </div>
                  </div>
                  <div className="mt-8 space-y-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-4 h-4 bg-gradient-to-r ${feature.color} rounded-full`}></div>
                        <span className="text-gray-700 font-medium">{feature.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-80 h-80 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
                <div className="absolute -bottom-8 -left-4 w-80 h-80 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                强大的学习功能
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              我们提供全方位的英语学习工具，帮助你快速提升听力水平
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 group hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-white text-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                体验演示内容
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              精选优质英语学习内容，立即体验智能转写和分析功能
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {demos.map((demo, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-100 hover:border-gray-200 hover:-translate-y-2"
                onClick={() => router.push(`/demo/${demo.title.toLowerCase().replace(/\s+/g, '-')}`)}
              >
                <div className="h-56 bg-gradient-to-br relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 opacity-10"></div>
                  <div className="absolute inset-0 bg-grid-gray-200/[0.05] bg-[length:20px_20px]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center relative z-10">
                      <div className="text-8xl mb-3 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                        {demo.image}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                      {demo.level}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                      {demo.duration}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 tracking-tight">
                    {demo.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {demo.description}
                  </p>
                  <div className="flex items-center text-blue-600 group-hover:text-blue-700 font-medium">
                    <span>立即体验</span>
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:30px_30px]"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></span>
            限时免费试用
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            准备好提升你的英语听力了吗？
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            加入数千名学习者，体验智能英语学习的魅力
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center justify-center group"
            >
              <span className="mr-3 text-xl">🚀</span>
              立即开始免费试用
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
            <button
              onClick={() => router.push('/demo')}
              className="bg-white border-2 border-gray-300 text-gray-700 px-10 py-5 rounded-full text-lg font-semibold hover:border-gray-400 hover:text-gray-900 transition-all duration-300 hover:shadow-lg flex items-center justify-center group"
            >
              <span className="mr-3 text-xl">🎵</span>
              先体验演示
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LingoLoopAI
              </h3>
              <p className="text-gray-600 leading-relaxed">
                智能英语听力学习平台，让学习更高效、更有趣。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-6">产品</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">功能特色</a></li>
                <li><a href="#demo" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">体验演示</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">价格方案</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-6">支持</h4>
              <ul className="space-y-3">
                <li><a href="/help" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">帮助中心</a></li>
                <li><a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">联系我们</a></li>
                <li><a href="/faq" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">常见问题</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-6">公司</h4>
              <ul className="space-y-3">
                <li><a href="/about" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">关于我们</a></li>
                <li><a href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">隐私政策</a></li>
                <li><a href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">服务条款</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-12 pt-8 text-center text-gray-500">
            <p>&copy; 2024 LingoLoopAI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .bg-grid-blue-100\/\[0\.05\] {
          background-image: linear-gradient(to right, #dbeafe 1px, transparent 1px),
                            linear-gradient(to bottom, #dbeafe 1px, transparent 1px);
        }

        .bg-grid-gray-200\/\[0\.05\] {
          background-image: linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
        }

        .bg-grid-white\/\[0\.02\] {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;