import React, { useState } from 'react';
import useUserPreferences from '../../hooks/useUserPreferences';
import PreferenceToggle from './PreferenceToggle';
import PreferenceSelect from './PreferenceSelect';
import PreferenceSlider from './PreferenceSlider';
import { PREFERENCE_TYPES } from '../../utils/persist';

/**
 * Comprehensive preferences panel with categorized settings
 */
const PreferencesPanel = ({ onClose }) => {
  const { preferences, resetAll, export: exportPrefs, import: importPrefs, types } = useUserPreferences();
  const [activeTab, setActiveTab] = useState('appearance');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const tabs = [
    { id: 'appearance', label: '外观', icon: '🎨' },
    { id: 'audio', label: '音频', icon: '🔊' },
    { id: 'transcript', label: '转写', icon: '📝' },
    { id: 'upload', label: '上传', icon: '📤' },
    { id: 'notifications', label: '通知', icon: '🔔' },
    { id: 'accessibility', label: '无障碍', icon: '♿' },
    { id: 'experimental', label: '实验性', icon: '🧪' }
  ];

  const handleExport = () => {
    const prefs = exportPrefs();
    navigator.clipboard.writeText(prefs).then(() => {
      alert('偏好设置已复制到剪贴板');
    });
  };

  const handleImport = () => {
    try {
      const success = importPrefs(importText);
      if (success) {
        setImportText('');
        setImportError('');
        setShowImportModal(false);
        alert('偏好设置已导入');
      } else {
        setImportError('导入失败，请检查格式');
      }
    } catch (error) {
      setImportError('导入失败：' + error.message);
    }
  };

  const renderAppearanceTab = () => (
    <div className="preferences-tab">
      <PreferenceSelect
        type={types.APPEARANCE}
        key="theme"
        label="主题"
        description="选择应用程序的主题模式"
        options={[
          { value: 'light', label: '浅色模式' },
          { value: 'dark', label: '深色模式' },
          { value: 'system', label: '跟随系统' }
        ]}
      />

      <PreferenceSelect
        type={types.APPEARANCE}
        key="language"
        label="界面语言"
        description="选择界面显示语言"
        options={[
          { value: 'zh-CN', label: '简体中文' },
          { value: 'zh-TW', label: '繁體中文' },
          { value: 'en', label: 'English' }
        ]}
      />

      <PreferenceSelect
        type={types.APPEARANCE}
        key="fontSize"
        label="字体大小"
        description="调整界面字体大小"
        options={[
          { value: 'small', label: '小' },
          { value: 'medium', label: '中' },
          { value: 'large', label: '大' }
        ]}
      />

      <PreferenceToggle
        type={types.APPEARANCE}
        key="reducedMotion"
        label="减少动画"
        description="减少界面动画效果，提高性能和可访问性"
      />

      <PreferenceToggle
        type={types.APPEARANCE}
        key="highContrast"
        label="高对比度"
        description="提高界面对比度，提升可读性"
      />

      <PreferenceToggle
        type={types.APPEARANCE}
        key="denseMode"
        label="紧凑模式"
        description="减少界面间距，显示更多内容"
      />
    </div>
  );

  const renderAudioTab = () => (
    <div className="preferences-tab">
      <PreferenceSlider
        type={types.AUDIO}
        key="defaultVolume"
        label="默认音量"
        description="设置音频播放的默认音量"
        min={0}
        max={1}
        step={0.1}
        unit="%"
        onChange={(value) => Math.round(value * 100)}
      />

      <PreferenceSlider
        type={types.AUDIO}
        key="defaultPlaybackRate"
        label="默认播放速度"
        description="设置音频播放的默认速度"
        min={0.5}
        max={2}
        step={0.25}
        unit="x"
      />

      <PreferenceToggle
        type={types.AUDIO}
        key="autoPlay"
        label="自动播放"
        description="打开音频文件时自动开始播放"
      />

      <PreferenceToggle
        type={types.AUDIO}
        key="loopByDefault"
        label="默认循环播放"
        description="音频播放完毕后自动重新开始"
      />

      <PreferenceToggle
        type={types.AUDIO}
        key="showAdvancedControls"
        label="显示高级控制"
        description="在音频播放器中显示速度、循环等高级控制"
      />

      <PreferenceToggle
        type={types.AUDIO}
        key="rememberVolume"
        label="记住音量设置"
        description="记住上次使用的音量设置"
      />

      <PreferenceToggle
        type={types.AUDIO}
        key="skipSilence"
        label="跳过静音"
        description="自动跳过音频中的静音部分"
      />

      <PreferenceToggle
        type={types.AUDIO}
        key="crossfade"
        label="交叉淡入淡出"
        description="在音频切换时使用交叉淡入淡出效果"
      />
    </div>
  );

  const renderTranscriptTab = () => (
    <div className="preferences-tab">
      <PreferenceSelect
        type={types.TRANSCRIPT}
        key="fontSize"
        label="转写字体大小"
        description="调整转写文本的字体大小"
        options={[
          { value: 'small', label: '小' },
          { value: 'medium', label: '中' },
          { value: 'large', label: '大' }
        ]}
      />

      <PreferenceSlider
        type={types.TRANSCRIPT}
        key="lineHeight"
        label="行高"
        description="调整转写文本的行高"
        min={1}
        max={2}
        step={0.1}
      />

      <PreferenceToggle
        type={types.TRANSCRIPT}
        key="showTimestamps"
        label="显示时间戳"
        description="在转写文本中显示时间戳"
      />

      <PreferenceToggle
        type={types.TRANSCRIPT}
        key="showSpeakerLabels"
        label="显示说话人标签"
        description="在多人对话中显示说话人标签"
      />

      <PreferenceToggle
        type={types.TRANSCRIPT}
        key="wordHighlighting"
        label="单词高亮"
        description="播放时高亮当前单词"
      />

      <PreferenceToggle
        type={types.TRANSCRIPT}
        key="autoScroll"
        label="自动滚动"
        description="播放时自动滚动到当前位置"
      />

      <PreferenceToggle
        type={types.TRANSCRIPT}
        key="showAnalysis"
        label="显示分析结果"
        description="在转写文本中显示AI分析结果"
      />

      <PreferenceSelect
        type={types.TRANSCRIPT}
        key="displayMode"
        label="显示模式"
        description="选择转写文本的显示模式"
        options={[
          { value: 'original', label: '仅原文' },
          { value: 'translation', label: '仅翻译' },
          { value: 'bilingual', label: '双语对照' }
        ]}
      />

      <PreferenceSelect
        type={types.TRANSCRIPT}
        key="preferredEngine"
        label="首选转写引擎"
        description="选择默认的语音转写引擎"
        options={[
          { value: 'google-speech-v2', label: 'Google Speech-to-Text v2' },
          { value: 'whisper', label: 'OpenAI Whisper' }
        ]}
      />
    </div>
  );

  const renderUploadTab = () => (
    <div className="preferences-tab">
      <PreferenceToggle
        type={types.UPLOAD}
        key="autoTranscribe"
        label="自动转写"
        description="上传完成后自动开始转写"
      />

      <PreferenceToggle
        type={types.UPLOAD}
        key="autoAnalyze"
        label="自动分析"
        description="转写完成后自动开始AI分析"
      />

      <PreferenceSelect
        type={types.UPLOAD}
        key="defaultLanguage"
        label="默认语言"
        description="选择音频的默认语言"
        options={[
          { value: 'en-US', label: '英语（美国）' },
          { value: 'zh-CN', label: '中文（简体）' },
          { value: 'auto', label: '自动检测' }
        ]}
      />

      <PreferenceToggle
        type={types.UPLOAD}
        key="rememberLastSettings"
        label="记住上次设置"
        description="记住上次上传时的设置选项"
      />

      <PreferenceToggle
        type={types.UPLOAD}
        key="showAdvancedOptions"
        label="显示高级选项"
        description="默认显示上传的高级选项"
      />

      <PreferenceToggle
        type={types.UPLOAD}
        key="enableDiarization"
        label="启用说话人分离"
        description="自动识别不同的说话人"
      />

      <PreferenceSlider
        type={types.UPLOAD}
        key="gapSeconds"
        label="静音间隔"
        description="设置说话人分离的静音间隔时间"
        min={0.1}
        max={2}
        step={0.1}
        unit="秒"
      />

      <PreferenceSlider
        type={types.UPLOAD}
        key="maxSpeakers"
        label="最大说话人数"
        description="设置音频中预期的最大说话人数量"
        min={1}
        max={10}
        step={1}
        unit="人"
      />
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="preferences-tab">
      <PreferenceToggle
        type={types.NOTIFICATIONS}
        key="emailNotifications"
        label="邮件通知"
        description="通过邮件接收重要通知"
      />

      <PreferenceToggle
        type={types.NOTIFICATIONS}
        key="transcriptionComplete"
        label="转写完成通知"
        description="转写完成后发送通知"
      />

      <PreferenceToggle
        type={types.NOTIFICATIONS}
        key="analysisComplete"
        label="分析完成通知"
        description="AI分析完成后发送通知"
      />

      <PreferenceToggle
        type={types.NOTIFICATIONS}
        key="weeklyReports"
        label="每周报告"
        description="每周发送学习进度报告"
      />

      <PreferenceToggle
        type={types.NOTIFICATIONS}
        key="featureUpdates"
        label="功能更新通知"
        description="接收新功能和改进的通知"
      />

      <PreferenceToggle
        type={types.NOTIFICATIONS}
        key="browserNotifications"
        label="浏览器通知"
        description="在浏览器中显示推送通知"
      />

      <PreferenceToggle
        type={types.NOTIFICATIONS}
        key="soundEffects"
        label="音效"
        description="操作时播放音效反馈"
      />
    </div>
  );

  const renderAccessibilityTab = () => (
    <div className="preferences-tab">
      <PreferenceToggle
        type={types.ACCESSIBILITY}
        key="keyboardNavigation"
        label="键盘导航"
        description="启用完整的键盘导航支持"
      />

      <PreferenceToggle
        type={types.ACCESSIBILITY}
        key="screenReader"
        label="屏幕阅读器"
        description="优化屏幕阅读器的使用体验"
      />

      <PreferenceToggle
        type={types.ACCESSIBILITY}
        key="largeText"
        label="大字体"
        description="使用更大的字体大小"
      />

      <PreferenceToggle
        type={types.ACCESSIBILITY}
        key="highContrastMode"
        label="高对比度模式"
        description="使用高对比度颜色方案"
      />

      <PreferenceToggle
        type={types.ACCESSIBILITY}
        key="reducedAnimations"
        label="减少动画"
        description="减少界面动画效果"
      />

      <PreferenceToggle
        type={types.ACCESSIBILITY}
        key="focusIndicators"
        label="焦点指示器"
        description="显示清晰的键盘焦点指示器"
      />

      <PreferenceToggle
        type={types.ACCESSIBILITY}
        key="dyslexiaFont"
        label="阅读障碍字体"
        description="使用适合阅读障碍者的字体"
      />
    </div>
  );

  const renderExperimentalTab = () => (
    <div className="preferences-tab">
      <PreferenceToggle
        type={types.EXPERIMENTAL}
        key="enableBetaFeatures"
        label="启用测试版功能"
        description="体验正在开发中的新功能"
      />

      <PreferenceToggle
        type={types.EXPERIMENTAL}
        key="aiSuggestions"
        label="AI建议"
        description="获取AI驱动的学习建议"
      />

      <PreferenceToggle
        type={types.EXPERIMENTAL}
        key="voiceCommands"
        label="语音命令"
        description="使用语音控制应用程序"
      />

      <PreferenceToggle
        type={types.EXPERIMENTAL}
        key="gestureControls"
        label="手势控制"
        description="使用手势控制播放器"
      />

      <PreferenceToggle
        type={types.EXPERIMENTAL}
        key="offlineMode"
        label="离线模式"
        description="启用离线功能支持"
      />

      <PreferenceToggle
        type={types.EXPERIMENTAL}
        key="advancedAnalytics"
        label="高级分析"
        description="启用详细的学习分析功能"
      />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return renderAppearanceTab();
      case 'audio':
        return renderAudioTab();
      case 'transcript':
        return renderTranscriptTab();
      case 'upload':
        return renderUploadTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'accessibility':
        return renderAccessibilityTab();
      case 'experimental':
        return renderExperimentalTab();
      default:
        return null;
    }
  };

  return (
    <div className="preferences-panel">
      <div className="preferences-header">
        <h2>偏好设置</h2>
        <div className="preferences-actions">
          <button onClick={handleExport} className="action-button">
            📤 导出
          </button>
          <button onClick={() => setShowImportModal(true)} className="action-button">
            📥 导入
          </button>
          <button onClick={() => {
            if (confirm('确定要重置所有设置吗？')) {
              resetAll();
            }
          }} className="action-button destructive">
            🔄 重置
          </button>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>
      </div>

      <div className="preferences-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="preferences-content">
        {renderTabContent()}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="preferences-modal">
          <div className="modal-content">
            <h3>导出偏好设置</h3>
            <textarea
              value={exportPrefs()}
              readOnly
              rows={10}
              className="export-textarea"
            />
            <div className="modal-actions">
              <button onClick={() => navigator.clipboard.writeText(exportPrefs())}>
                复制到剪贴板
              </button>
              <button onClick={() => setShowExportModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="preferences-modal">
          <div className="modal-content">
            <h3>导入偏好设置</h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="粘贴导出的偏好设置JSON..."
              rows={10}
              className="import-textarea"
            />
            {importError && (
              <div className="error-message">{importError}</div>
            )}
            <div className="modal-actions">
              <button onClick={handleImport} disabled={!importText.trim()}>
                导入
              </button>
              <button onClick={() => {
                setShowImportModal(false);
                setImportError('');
                setImportText('');
              }}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesPanel;