import React, { useState } from 'react';
import AdaptiveExperienceTester from '../../utils/adaptiveTesting';

/**
 * Interactive test runner for the adaptive experience system
 * Provides a comprehensive testing interface for developers
 */
const AdaptiveTestRunner = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [testLog, setTestLog] = useState([]);

  const tester = new AdaptiveExperienceTester();

  // Available test scenarios
  const testScenarios = [
    { id: 'user_scenarios', name: '用户场景测试', description: '测试不同用户等级的自适应行为' },
    { id: 'learning_patterns', name: '学习模式测试', description: '测试学习模式检测和适配' },
    { id: 'ui_adaptations', name: '界面适配测试', description: '测试导航、表单、内容的自适应' },
    { id: 'performance', name: '性能测试', description: '测试渲染性能和内存使用' },
    { id: 'accessibility', name: '无障碍测试', description: '测试键盘导航和屏幕阅读器支持' }
  ];

  // Toggle scenario selection
  const toggleScenario = (scenarioId) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        return prev.filter(id => id !== scenarioId);
      } else {
        return [...prev, scenarioId];
      }
    });
  };

  // Select all scenarios
  const selectAllScenarios = () => {
    setSelectedScenarios(testScenarios.map(s => s.id));
  };

  // Clear all scenarios
  const clearAllScenarios = () => {
    setSelectedScenarios([]);
  };

  // Run selected tests
  const runTests = async () => {
    if (selectedScenarios.length === 0) {
      alert('请选择至少一个测试场景');
      return;
    }

    setIsRunning(true);
    setTestResults(null);
    setTestLog([]);

    const logMessage = (message) => {
      setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    try {
      logMessage('🚀 开始运行自适应系统测试...');

      const results = {
        userScenarios: {},
        learningPatterns: {},
        uiAdaptations: {},
        performanceTests: {},
        accessibilityTests: {},
        overallScore: 0,
        passedTests: 0,
        totalTests: 0
      };

      // Run user scenario tests
      if (selectedScenarios.includes('user_scenarios')) {
        setCurrentTest('用户场景测试');
        logMessage('👤 测试用户场景...');
        results.userScenarios = await tester.runUserScenarioTests();
      }

      // Run learning pattern tests
      if (selectedScenarios.includes('learning_patterns')) {
        setCurrentTest('学习模式测试');
        logMessage('🎯 测试学习模式...');
        results.learningPatterns = await tester.runLearningPatternTests();
      }

      // Run UI adaptation tests
      if (selectedScenarios.includes('ui_adaptations')) {
        setCurrentTest('界面适配测试');
        logMessage('🎨 测试界面适配...');
        results.uiAdaptations = await tester.runUIAdaptationTests();
      }

      // Run performance tests
      if (selectedScenarios.includes('performance')) {
        setCurrentTest('性能测试');
        logMessage('⚡ 测试性能...');
        results.performanceTests = await tester.runPerformanceTests();
      }

      // Run accessibility tests
      if (selectedScenarios.includes('accessibility')) {
        setCurrentTest('无障碍测试');
        logMessage('♿ 测试无障碍功能...');
        results.accessibilityTests = await tester.runAccessibilityTests();
      }

      // Calculate overall score
      let passedTests = 0;
      let totalTests = 0;

      // Count user scenario tests
      Object.values(results.userScenarios).forEach(result => {
        totalTests++;
        if (result.passed) passedTests++;
      });

      // Count learning pattern tests
      Object.values(results.learningPatterns).forEach(result => {
        totalTests++;
        if (result.passed) passedTests++;
      });

      // Count UI adaptation tests
      Object.values(results.uiAdaptations).forEach(category => {
        Object.values(category).forEach(result => {
          totalTests++;
          if (result.passed) passedTests++;
        });
      });

      // Count performance tests
      Object.values(results.performanceTests).forEach(result => {
        totalTests++;
        if (result.passed) passedTests++;
      });

      // Count accessibility tests
      Object.values(results.accessibilityTests).forEach(result => {
        totalTests++;
        if (result.passed) passedTests++;
      });

      results.overallScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      results.passedTests = passedTests;
      results.totalTests = totalTests;

      setTestResults(results);
      logMessage(`✅ 测试完成！总体评分: ${results.overallScore.toFixed(1)}%`);
      logMessage(`📊 通过测试: ${passedTests}/${totalTests}`);

    } catch (error) {
      logMessage(`❌ 测试运行失败: ${error.message}`);
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  // Render test results
  const renderTestResults = () => {
    if (!testResults) return null;

    const { overallScore, passedTests, totalTests } = testResults;

    return (
      <div className="test-results">
        <div className="overall-score">
          <h3>总体结果</h3>
          <div className={`score-badge ${overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : 'needs-improvement'}`}>
            {overallScore.toFixed(1)}%
          </div>
          <p>{passedTests}/{totalTests} 测试通过</p>
          <div className="score-description">
            {overallScore >= 80 && '🎉 优秀！自适应系统运行良好'}
            {overallScore >= 60 && overallScore < 80 && '⚠️ 良好，但仍有改进空间'}
            {overallScore < 60 && '❌ 需要改进，请检查失败的测试'}
          </div>
        </div>

        {/* User Scenario Results */}
        {Object.keys(testResults.userScenarios).length > 0 && (
          <div className="result-section">
            <h4>用户场景测试</h4>
            {Object.entries(testResults.userScenarios).map(([key, result]) => (
              <div key={key} className={`result-item ${result.passed ? 'passed' : 'failed'}`}>
                <div className="result-header">
                  <span className="result-status">{result.passed ? '✅' : '❌'}</span>
                  <span className="result-name">{result.scenario}</span>
                  <span className="result-score">{result.score.toFixed(1)}%</span>
                </div>
                {result.error && (
                  <div className="result-error">错误: {result.error}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Learning Pattern Results */}
        {Object.keys(testResults.learningPatterns).length > 0 && (
          <div className="result-section">
            <h4>学习模式测试</h4>
            {Object.entries(testResults.learningPatterns).map(([key, result]) => (
              <div key={key} className={`result-item ${result.passed ? 'passed' : 'failed'}`}>
                <div className="result-header">
                  <span className="result-status">{result.passed ? '✅' : '❌'}</span>
                  <span className="result-name">{result.pattern}</span>
                  <span className="result-score">{result.score.toFixed(1)}%</span>
                </div>
                {result.error && (
                  <div className="result-error">错误: {result.error}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* UI Adaptation Results */}
        {Object.keys(testResults.uiAdaptations).length > 0 && (
          <div className="result-section">
            <h4>界面适配测试</h4>
            {Object.entries(testResults.uiAdaptations).map(([category, tests]) => (
              <div key={category} className="category-results">
                <h5>{category === 'navigation' ? '导航' : category === 'forms' ? '表单' : '内容'}</h5>
                {Object.entries(tests).map(([level, result]) => (
                  <div key={level} className={`result-item ${result.passed ? 'passed' : 'failed'}`}>
                    <div className="result-header">
                      <span className="result-status">{result.passed ? '✅' : '❌'}</span>
                      <span className="result-name">{level}</span>
                      <span className="result-score">{result.score ? result.score.toFixed(1) + '%' : 'N/A'}</span>
                    </div>
                    {result.error && (
                      <div className="result-error">错误: {result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Performance Results */}
        {Object.keys(testResults.performanceTests).length > 0 && (
          <div className="result-section">
            <h4>性能测试</h4>
            <div className={`result-item ${testResults.performanceTests.renderPerformance?.passed ? 'passed' : 'failed'}`}>
              <div className="result-header">
                <span className="result-status">{testResults.performanceTests.renderPerformance?.passed ? '✅' : '❌'}</span>
                <span className="result-name">渲染性能</span>
                <span className="result-score">
                  {testResults.performanceTests.renderPerformance?.passed ? '通过' : '失败'}
                </span>
              </div>
              {testResults.performanceTests.renderPerformance?.measurements && (
                <div className="result-details">
                  平均渲染时间: {testResults.performanceTests.renderPerformance.averageRenderTime?.toFixed(2)}ms
                </div>
              )}
            </div>

            <div className={`result-item ${testResults.performanceTests.memoryUsage?.passed ? 'passed' : 'failed'}`}>
              <div className="result-header">
                <span className="result-status">{testResults.performanceTests.memoryUsage?.passed ? '✅' : '❌'}</span>
                <span className="result-name">内存使用</span>
                <span className="result-score">
                  {testResults.performanceTests.memoryUsage?.passed ? '通过' : '失败'}
                </span>
              </div>
              {testResults.performanceTests.memoryUsage?.note && (
                <div className="result-details">{testResults.performanceTests.memoryUsage.note}</div>
              )}
            </div>

            <div className={`result-item ${testResults.performanceTests.responsiveness?.passed ? 'passed' : 'failed'}`}>
              <div className="result-header">
                <span className="result-status">{testResults.performanceTests.responsiveness?.passed ? '✅' : '❌'}</span>
                <span className="result-name">响应速度</span>
                <span className="result-score">
                  {testResults.performanceTests.responsiveness?.passed ? '通过' : '失败'}
                </span>
              </div>
              {testResults.performanceTests.responsiveness?.averageResponseTime && (
                <div className="result-details">
                  平均响应时间: {testResults.performanceTests.responsiveness.averageResponseTime.toFixed(2)}ms
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accessibility Results */}
        {Object.keys(testResults.accessibilityTests).length > 0 && (
          <div className="result-section">
            <h4>无障碍测试</h4>
            <div className={`result-item ${testResults.accessibilityTests.keyboardNavigation?.passed ? 'passed' : 'failed'}`}>
              <div className="result-header">
                <span className="result-status">{testResults.accessibilityTests.keyboardNavigation?.passed ? '✅' : '❌'}</span>
                <span className="result-name">键盘导航</span>
                <span className="result-score">
                  {testResults.accessibilityTests.keyboardNavigation?.passed ? '通过' : '失败'}
                </span>
              </div>
            </div>

            <div className={`result-item ${testResults.accessibilityTests.screenReader?.passed ? 'passed' : 'failed'}`}>
              <div className="result-header">
                <span className="result-status">{testResults.accessibilityTests.screenReader?.passed ? '✅' : '❌'}</span>
                <span className="result-name">屏幕阅读器</span>
                <span className="result-score">
                  {testResults.accessibilityTests.screenReader?.passed ? '通过' : '失败'}
                </span>
              </div>
            </div>

            <div className={`result-item ${testResults.accessibilityTests.colorContrast?.passed ? 'passed' : 'failed'}`}>
              <div className="result-header">
                <span className="result-status">{testResults.accessibilityTests.colorContrast?.passed ? '✅' : '❌'}</span>
                <span className="result-name">颜色对比</span>
                <span className="result-score">
                  {testResults.accessibilityTests.colorContrast?.passed ? '通过' : '失败'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="adaptive-test-runner">
      <div className="test-runner-header">
        <h2>🧪 自适应系统测试工具</h2>
        <p>全面测试LingoLoopAI的自适应用户体验系统</p>
      </div>

      <div className="test-controls">
        <div className="scenario-selection">
          <h3>选择测试场景</h3>
          <div className="scenario-controls">
            <button onClick={selectAllScenarios} disabled={isRunning}>
              全选
            </button>
            <button onClick={clearAllScenarios} disabled={isRunning}>
              清空
            </button>
          </div>
          <div className="scenario-list">
            {testScenarios.map(scenario => (
              <label key={scenario.id} className="scenario-item">
                <input
                  type="checkbox"
                  checked={selectedScenarios.includes(scenario.id)}
                  onChange={() => toggleScenario(scenario.id)}
                  disabled={isRunning}
                />
                <div className="scenario-info">
                  <span className="scenario-name">{scenario.name}</span>
                  <span className="scenario-description">{scenario.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="test-actions">
          <button
            onClick={runTests}
            disabled={isRunning || selectedScenarios.length === 0}
            className={`run-test-btn ${isRunning ? 'running' : ''}`}
          >
            {isRunning ? '测试中...' : '运行测试'}
          </button>

          {isRunning && currentTest && (
            <div className="current-test">
              <span className="test-spinner">⏳</span>
              <span>正在运行: {currentTest}</span>
            </div>
          )}
        </div>
      </div>

      {/* Test log */}
      {testLog.length > 0 && (
        <div className="test-log">
          <h3>测试日志</h3>
          <div className="log-content">
            {testLog.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test results */}
      {testResults && renderTestResults()}

      <style jsx>{`
        .adaptive-test-runner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .test-runner-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .test-runner-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .test-runner-header p {
          margin: 0;
          color: #6b7280;
        }

        .test-controls {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .scenario-selection h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .scenario-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .scenario-controls button {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .scenario-controls button:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .scenario-controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .scenario-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .scenario-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .scenario-item:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .scenario-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
        }

        .scenario-info {
          flex: 1;
        }

        .scenario-name {
          display: block;
          font-weight: 500;
          color: #1f2937;
        }

        .scenario-description {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .test-actions {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }

        .run-test-btn {
          padding: 1rem 2rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 150px;
        }

        .run-test-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .run-test-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .run-test-btn.running {
          background: #6b7280;
        }

        .current-test {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .test-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .test-log {
          margin-bottom: 2rem;
        }

        .test-log h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .log-content {
          background: #1f2937;
          color: #f3f4f6;
          border-radius: 8px;
          padding: 1rem;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .log-entry {
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }

        .test-results {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .overall-score {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .overall-score h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .score-badge {
          display: inline-block;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .score-badge.excellent {
          background: #10b981;
          color: white;
        }

        .score-badge.good {
          background: #f59e0b;
          color: white;
        }

        .score-badge.needs-improvement {
          background: #ef4444;
          color: white;
        }

        .overall-score p {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .score-description {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .result-section {
          margin-bottom: 2rem;
        }

        .result-section h4 {
          margin: 0 0 1rem 0;
          color: #374151;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .result-section h5 {
          margin: 1rem 0 0.75rem 0;
          color: #4b5563;
          font-size: 0.875rem;
          text-transform: uppercase;
        }

        .result-item {
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .result-item.passed {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .result-item.failed {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .result-status {
          font-size: 1.25rem;
        }

        .result-name {
          flex: 1;
          font-weight: 500;
          color: #374151;
        }

        .result-score {
          font-weight: 600;
          color: #6b7280;
        }

        .result-error {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #fef2f2;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #dc2626;
        }

        .result-details {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .adaptive-test-runner {
            padding: 1rem;
          }

          .test-controls {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .scenario-controls {
            justify-content: center;
          }

          .test-actions {
            order: -1;
          }

          .score-badge {
            font-size: 1.5rem;
            padding: 0.75rem 1.5rem;
          }

          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdaptiveTestRunner;