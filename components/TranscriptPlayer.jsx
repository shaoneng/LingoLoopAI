import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Learning session hooks and utilities
const useLearningSession = (segments, runId) => {
  const [sessionData, setSessionData] = React.useState(null);
  const [playbackMode, setPlaybackMode] = React.useState('continuous'); // continuous, sentence, word
  const [repeatCount, setRepeatCount] = React.useState(1);
  const [currentRepeat, setCurrentRepeat] = React.useState(0);

  return {
    sessionData,
    setSessionData,
    playbackMode,
    setPlaybackMode,
    repeatCount,
    setRepeatCount,
    currentRepeat,
    setCurrentRepeat
  };
};

// Keyboard shortcuts hook for enhanced accessibility
const useKeyboardShortcuts = ({ audioRef, segments, activeSeg, playSentence, playWord, increaseSpeed, decreaseSpeed, toggleLoopMode, setShowTranslation, setShowSource, seekPlay, loopMode, learningSession, setShowShortcutsHelp, setLoopPointA, setLoopPointB, isRecording, startRecording, stopRecording, recordedAudio, playRecordedAudio, updateLoopRepeatCount, adjustLoopStart, adjustLoopEnd }) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Prevent default for all shortcuts to avoid browser conflicts
      e.preventDefault();

      switch (e.key.toLowerCase()) {
        // Playback controls
        case ' ':
          // Space: Play/Pause toggle
          if (audioRef.current) {
            if (audioRef.current.paused) {
              audioRef.current.play();
            } else {
              audioRef.current.pause();
            }
          }
          break;

        case 'arrowleft':
          // Left arrow: Previous sentence
          if (activeSeg > 0) {
            playSentence(segments[activeSeg - 1]);
          }
          break;

        case 'arrowright':
          // Right arrow: Next sentence
          if (activeSeg < segments.length - 1) {
            playSentence(segments[activeSeg + 1]);
          }
          break;

        case 'arrowup':
          // Up arrow: Replay current sentence
          if (activeSeg >= 0 && segments[activeSeg]) {
            playSentence(segments[activeSeg]);
          }
          break;

        case 'arrowdown':
          // Down arrow: Toggle loop mode
          toggleLoopMode();
          break;

        // Speed controls
        case '+':
        case '=':
          // Plus key: Increase speed
          increaseSpeed();
          break;

        case '-':
        case '_':
          // Minus key: Decrease speed
          decreaseSpeed();
          break;

        // Display toggles
        case 't':
          // T key: Toggle translation
          setShowTranslation(prev => !prev);
          break;

        case 's':
          // S key: Toggle source text
          setShowSource(prev => !prev);
          break;

        // Number keys: Set loop repeat count or jump to sentence
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (loopMode) {
            // Set loop repeat count
            updateLoopRepeatCount(parseInt(e.key));
          } else {
            // Jump to specific sentence
            const index = parseInt(e.key) - 1;
            if (index < segments.length) {
              playSentence(segments[index]);
            }
          }
          break;

        case '0':
          // 0 key: Go to first sentence
          if (segments.length > 0) {
            playSentence(segments[0]);
          }
          break;

        // Word-level controls (with modifiers)
        case 'w':
          // W key: Play current word (if active)
          if (activeSeg >= 0 && segments[activeSeg]) {
            const segment = segments[activeSeg];
            // Try to play the first word of current segment
            if (segment.words && segment.words.length > 0) {
              playWord(segment, 0);
            }
          }
          break;

        // Advanced controls
        case 'l':
          // L key: Toggle loop mode
          toggleLoopMode();
          break;

        case 'a':
          // A key: Set loop point A
          if (loopMode && activeSeg >= 0) {
            setLoopPointA();
          }
          break;

        case 'b':
          // B key: Set loop point B
          if (loopMode && activeSeg >= 0) {
            setLoopPointB();
          }
          break;

        case 'r':
          // R key: Reset speed to normal
          if (audioRef.current) {
            audioRef.current.playbackRate = 1.0;
          }
          break;

        case 'h':
        case '/':
          // H or / key: Show help
          setShowShortcutsHelp(prev => !prev);
          break;

        // Recording controls
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+R or Cmd+R: Start/Stop recording
            if (isRecording) {
              stopRecording();
            } else {
              startRecording();
            }
          } else {
            // R key: Reset speed (if no modifier)
            if (audioRef.current) {
              audioRef.current.playbackRate = 1.0;
            }
          }
          break;

        // Loop precision controls with Shift
        case 'a':
          if (e.shiftKey && loopMode) {
            // Shift+A: Adjust loop point A
            if (e.altKey) {
              adjustLoopStart(0.1); // Alt+Shift+A: A点后移
            } else {
              adjustLoopStart(-0.1); // Shift+A: A点前移
            }
            break;
          }
          // Regular A key (handled below)
          break;

        case 'b':
          if (e.shiftKey && loopMode) {
            // Shift+B: Adjust loop point B
            if (e.altKey) {
              adjustLoopEnd(0.1); // Alt+Shift+B: B点后移
            } else {
              adjustLoopEnd(-0.1); // Shift+B: B点前移
            }
            break;
          }
          // Regular B key (handled below)
          break;

        case 'arrowleft':
          if (e.shiftKey && loopMode) {
            // Shift+Left Arrow: Adjust loop start backward
            adjustLoopStart(-0.1);
            break;
          }
          // Regular left arrow (handled above)
          break;

        case 'arrowright':
          if (e.shiftKey && loopMode) {
            // Shift+Right Arrow: Adjust loop start forward
            adjustLoopStart(0.1);
            break;
          }
          // Regular right arrow (handled above)
          break;

        case 'p':
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+P or Cmd+P: Play recorded audio
            if (recordedAudio) {
              playRecordedAudio();
            }
          }
          break;

        default:
          // Don't prevent default for unhandled keys
          return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    audioRef, segments, activeSeg, playSentence, playWord,
    increaseSpeed, decreaseSpeed, toggleLoopMode, setShowTranslation,
    setShowSource, seekPlay, loopMode, learningSession, setShowShortcutsHelp,
    setLoopPointA, setLoopPointB, isRecording, startRecording, stopRecording,
    recordedAudio, playRecordedAudio, updateLoopRepeatCount, adjustLoopStart, adjustLoopEnd
  ]);
};

export default function TranscriptPlayer({ audioRef, segments, onActiveChange, runId, showSource, setShowSource }) {
  const { accessToken } = useAuth();
  const [activeSeg, setActiveSeg] = React.useState(-1);
  const [activeWord, setActiveWord] = React.useState([-1, -1]);
  const [showTranslation, setShowTranslation] = React.useState(false);
  const [translating, setTranslating] = React.useState(false);

  // Enhanced learning features
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1.0);
  const [loopMode, setLoopMode] = React.useState(false);
  const [loopStart, setLoopStart] = React.useState(null);
  const [loopEnd, setLoopEnd] = React.useState(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [learningStats, setLearningStats] = React.useState({
    totalSegments: 0,
    completedSegments: [],
    playCount: 0,
    lastPlayedSegment: null
  });
  const [showShortcutsHelp, setShowShortcutsHelp] = React.useState(false);

  // Recording state
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [recordedAudio, setRecordedAudio] = React.useState(null);
  const [recordingTimer, setRecordingTimer] = React.useState(null);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);

  // Enhanced loop state
  const [loopSettings, setLoopSettings] = React.useState({
    repeatCount: 3, // Default repeat 3 times
    currentRepeat: 0,
    loopInterval: null, // Store interval ID
    isLooping: false
  });

  const learningSession = useLearningSession(segments, runId);

  // Check if there are segments without translations
  const hasMissingTranslations = segments.some(seg => !seg.translation || seg.translation.trim() === '');

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const seekPlay = (t, endTime = null, forceSpeed = null) => {
    const a = audioRef?.current;
    if (!a) return;

    // Apply playback speed
    if (forceSpeed) {
      a.playbackRate = forceSpeed;
    } else {
      a.playbackRate = playbackSpeed;
    }

    a.currentTime = Math.max(0, t + 0.01);
    const playPromise = a.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }

    setIsPlaying(true);

    // Update learning stats
    setLearningStats(prev => ({
      ...prev,
      playCount: prev.playCount + 1,
      lastPlayedSegment: activeSeg
    }));

    // Enhanced playback control with loop mode
    if (endTime) {
      const duration = (endTime - t) * 1000; // 转换为毫秒

      if (loopMode && loopStart !== null && loopEnd !== null) {
        // Enhanced loop mode with better control
        startEnhancedLoop(a, loopStart, loopEnd);
      } else {
        // Single play with sentence end pause
        setTimeout(() => {
          if (a && !a.paused && Math.abs(a.currentTime - endTime) < 0.5) {
            a.pause();
            setIsPlaying(false);
          }
        }, duration);
      }
    }
  };

  // Enhanced sentence playback with speed control
  const playSentence = (segment, speed = null) => {
    if (!segment) return;

    // Mark segment as completed
    if (!learningStats.completedSegments.includes(activeSeg)) {
      setLearningStats(prev => ({
        ...prev,
        completedSegments: [...prev.completedSegments, activeSeg]
      }));
    }

    seekPlay(segment.start, segment.end, speed);
  };

  // Word-level playback for focused listening
  const playWord = (segment, wordIndex) => {
    if (!segment || !segment.words || !segment.words[wordIndex]) return;

    const word = segment.words[wordIndex];
    seekPlay(word.s, word.e);
  };

  // Speed control functions
  const increaseSpeed = () => {
    const newSpeed = Math.min(2.0, playbackSpeed + 0.25);
    setPlaybackSpeed(newSpeed);
    if (audioRef?.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const decreaseSpeed = () => {
    const newSpeed = Math.max(0.5, playbackSpeed - 0.25);
    setPlaybackSpeed(newSpeed);
    if (audioRef?.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Enhanced toggle loop mode
  const toggleLoopMode = () => {
    if (loopMode) {
      // Turn off loop mode
      setLoopMode(false);
      setLoopStart(null);
      setLoopEnd(null);
      resetLoopState();
    } else if (activeSeg >= 0 && segments[activeSeg]) {
      // Turn on loop mode for current segment
      const segment = segments[activeSeg];
      setLoopMode(true);
      setLoopStart(segment.start);
      setLoopEnd(segment.end);
      resetLoopState();
    }
  };

  // Precision loop adjustment
  const adjustLoopStart = (delta) => {
    if (loopStart !== null) {
      const newStart = Math.max(0, loopStart + delta);
      setLoopStart(newStart);
      learningSession.setCurrentRepeat(0);
    }
  };

  const adjustLoopEnd = (delta) => {
    if (loopEnd !== null && segments.length > 0) {
      const maxTime = segments[segments.length - 1].end;
      const newEnd = Math.min(maxTime, loopEnd + delta);
      setLoopEnd(newEnd);
      learningSession.setCurrentRepeat(0);
    }
  };

  // Recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear recording timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  const playRecordedAudio = () => {
    if (recordedAudio) {
      const audio = new Audio(recordedAudio);
      audio.play();
    }
  };

  const deleteRecording = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
      setRecordedAudio(null);
      setRecordingTime(0);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced loop functionality
  const startEnhancedLoop = (audioElement, startTime, endTime) => {
    // Clear any existing loop
    stopEnhancedLoop();

    let currentRepeat = 0; // Use local variable instead of state
    const repeatCount = loopSettings.repeatCount; // Capture current repeat count

    setLoopSettings(prev => ({
      ...prev,
      isLooping: true,
      currentRepeat: 0
    }));

    const loopInterval = setInterval(() => {
      if (audioElement && audioElement.currentTime >= endTime) {
        if (currentRepeat < repeatCount - 1) {
          // Continue looping
          currentRepeat++;
          audioElement.currentTime = startTime;
          setLoopSettings(prev => ({
            ...prev,
            currentRepeat: currentRepeat
          }));
        } else {
          // Stop looping after reaching repeat count
          clearInterval(loopInterval);
          setLoopSettings(prev => ({
            ...prev,
            loopInterval: null,
            isLooping: false,
            currentRepeat: 0
          }));
          audioElement.pause();
          setIsPlaying(false);
        }
      }
    }, 50); // Check every 50ms for more precise timing

    // Store the loop interval in state
    setLoopSettings(prev => ({
      ...prev,
      loopInterval: loopInterval
    }));
  };

  const stopEnhancedLoop = () => {
    if (loopSettings.loopInterval) {
      clearInterval(loopSettings.loopInterval);
      setLoopSettings(prev => ({
        ...prev,
        loopInterval: null,
        isLooping: false,
        currentRepeat: 0
      }));
    }
  };

  // Enhanced loop control with better state management
  const resetLoopState = () => {
    stopEnhancedLoop();
    setLoopSettings(prev => ({
      ...prev,
      currentRepeat: 0,
      isLooping: false
    }));
  };

  const updateLoopRepeatCount = (count) => {
    const newCount = Math.max(1, Math.min(10, count)); // Limit between 1-10
    setLoopSettings(prev => {
      // Clear existing loop interval if any
      if (prev.loopInterval) {
        clearInterval(prev.loopInterval);
      }
      return {
        ...prev,
        repeatCount: newCount,
        currentRepeat: 0,
        isLooping: false,
        loopInterval: null
      };
    });
  };

  // Enhanced A/B point setting with visual feedback
  const setLoopPointA = () => {
    if (activeSeg >= 0 && segments[activeSeg]) {
      const segment = segments[activeSeg];
      setLoopStart(segment.start);
      if (!loopMode) {
        setLoopMode(true);
      }
      if (loopEnd === null) {
        setLoopEnd(segment.end);
      }
      // Reset loop state
      resetLoopState();
    }
  };

  const setLoopPointB = () => {
    if (activeSeg >= 0 && segments[activeSeg]) {
      const segment = segments[activeSeg];
      setLoopEnd(segment.end);
      if (!loopMode) {
        setLoopMode(true);
      }
      if (loopStart === null) {
        setLoopStart(segment.start);
      }
      // Reset loop state
      resetLoopState();
    }
  };

  const locate = (arr, t, getS, getE) => {
    let lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const s = getS(arr[mid]);
      const e = getE(arr[mid]);
      if (t < s) hi = mid - 1; else if (t >= e) lo = mid + 1; else return mid;
    }
    return -1;
  };

  React.useEffect(() => {
    const a = audioRef?.current; if (!a) return;

    // Initialize learning stats
    setLearningStats(prev => ({
      ...prev,
      totalSegments: segments.length
    }));

    const onTime = () => {
      const t = a.currentTime;
      const si = locate(segments, t, s => s.start, s => s.end);
      setActiveSeg((prev) => {
        if (prev !== si) {
          const seg = si >= 0 ? segments[si] : null;
          const globalIndex = seg && typeof seg.id === 'number' ? seg.id : si;
          if (typeof onActiveChange === 'function') {
            onActiveChange({ localIndex: si, globalIndex, segment: seg || null });
          }
        }
        return si;
      });
      if (si >= 0) {
        const w = segments[si].words || [];
        const wi = locate(w, t, x => x.s, x => x.e);
        setActiveWord([si, wi]);
        const el = document.querySelector(`[data-seg="${si}"]`);
        if (el) el.scrollIntoView({ block: 'nearest' });
      } else {
        setActiveWord([-1, -1]);
      }

      // Update playing state
      setIsPlaying(!a.paused);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);

    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
  }, [segments, audioRef, onActiveChange]);

  const handleToggleSource = () => {
    const newShowSource = !showSource;
    setShowSource(newShowSource);
    // If hiding the source, also hide the translation
    if (!newShowSource) {
      setShowTranslation(false);
    }
  };

  const detectAndTranslateMissing = async () => {
    if (!runId || !accessToken || segments.length === 0) return;

    // Find segments without translation
    const segmentsWithoutTranslation = segments.filter(seg => !seg.translation || seg.translation.trim() === '');

    if (segmentsWithoutTranslation.length === 0) {
      return;
    }

    if (!confirm(`发现 ${segmentsWithoutTranslation.length} 个句子没有中文翻译，是否立即翻译？`)) {
      return;
    }

    setTranslating(true);
    const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    let successCount = 0;
    let failCount = 0;

    // Process translations in batches to avoid overwhelming the API
    for (const segment of segmentsWithoutTranslation) {
      try {
        const segmentIndex = typeof segment.id === 'number' ? segment.id : segments.indexOf(segment);
        const resp = await fetch(`${base}/api/runs/${runId}/segments/${segmentIndex}/analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            kinds: ['translation'],
            force: false
          }),
        });

        const data = await resp.json();
        if (resp.ok) {
          successCount++;
        } else {
          failCount++;
          console.error(`翻译失败 (${segmentIndex}):`, data.error);
        }
      } catch (error) {
        failCount++;
        console.error(`翻译请求失败:`, error);
      }

      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTranslating(false);

    // Refresh the page to show new translations if any succeeded
    if (successCount > 0) {
      window.location.reload();
    }
  };

  const buttonStyle = (active, disabled = false) => ({
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: active ? '#e2e8f0' : '#fff',
    color: active ? '#1e293b' : '#475569',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
  });

  const speedButtonStyle = (active = false) => ({
    ...buttonStyle(active),
    minWidth: '60px',
    fontSize: '12px',
    padding: '4px 8px',
    background: active ? '#3b82f6' : '#fff',
    color: active ? '#fff' : '#475569',
    border: active ? '1px solid #3b82f6' : '1px solid #cbd5e1',
  });

  const loopButtonStyle = (active = false) => ({
    ...buttonStyle(active),
    background: active ? '#10b981' : '#fff',
    color: active ? '#fff' : '#475569',
    border: active ? '1px solid #10b981' : '1px solid #cbd5e1',
  });

  // Initialize keyboard shortcuts after all functions are defined
  useKeyboardShortcuts({
    audioRef,
    segments,
    activeSeg,
    playSentence,
    playWord,
    increaseSpeed,
    decreaseSpeed,
    toggleLoopMode,
    setShowTranslation,
    setShowSource,
    seekPlay,
    loopMode,
    learningSession,
    setShowShortcutsHelp,
    setLoopPointA,
    setLoopPointB,
    isRecording,
    startRecording,
    stopRecording,
    recordedAudio,
    playRecordedAudio,
    updateLoopRepeatCount,
    adjustLoopStart,
    adjustLoopEnd
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Enhanced Control Panel */}
      <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Main Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>精听工作台</h3>
            <div style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
              进度: {learningStats.completedSegments.length}/{learningStats.totalSegments}
            </div>
            {isPlaying && (
              <div style={{ fontSize: '12px', color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: 4 }}>
                ▶ 播放中
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleToggleSource} style={buttonStyle(showSource)}>
              {showSource ? '隐藏英文' : '显示英文'}
            </button>
            <button
              type="button"
              onClick={() => setShowTranslation(!showTranslation)}
              style={buttonStyle(showTranslation, !showSource)}
              disabled={!showSource}
            >
              {showTranslation ? '隐藏中文' : '显示中文'}
            </button>
          </div>
        </div>

        {/* Learning Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Speed Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>语速:</span>
            <button
              type="button"
              onClick={decreaseSpeed}
              disabled={playbackSpeed <= 0.5}
              style={speedButtonStyle()}
            >
              -
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '35px', textAlign: 'center' }}>
              {playbackSpeed.toFixed(1)}x
            </span>
            <button
              type="button"
              onClick={increaseSpeed}
              disabled={playbackSpeed >= 2.0}
              style={speedButtonStyle()}
            >
              +
            </button>
          </div>

          {/* Enhanced A/B Loop Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={toggleLoopMode}
              style={loopButtonStyle(loopMode)}
              disabled={activeSeg < 0}
              title={loopMode ? "关闭A/B循环" : "开启当前句子循环"}
            >
              {loopMode ? '🔁 循环中' : '🔁 循环'}
            </button>

            {loopMode && (
              <>
                <button
                  type="button"
                  onClick={setLoopPointA}
                  style={{
                    ...buttonStyle(false),
                    fontSize: '10px',
                    padding: '4px 6px',
                    minWidth: '30px',
                    background: '#ef4444',
                    color: 'white',
                    border: '1px solid #ef4444',
                  }}
                  title="设置A点（循环开始）"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={setLoopPointB}
                  style={{
                    ...buttonStyle(false),
                    fontSize: '10px',
                    padding: '4px 6px',
                    minWidth: '30px',
                    background: '#3b82f6',
                    color: 'white',
                    border: '1px solid #3b82f6',
                  }}
                  title="设置B点（循环结束）"
                >
                  B
                </button>

                {/* Loop repeat count control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => updateLoopRepeatCount(loopSettings.repeatCount - 1)}
                    disabled={loopSettings.repeatCount <= 1}
                    style={{
                      ...buttonStyle(false),
                      fontSize: '10px',
                      padding: '2px 6px',
                      minWidth: '20px',
                      opacity: loopSettings.repeatCount <= 1 ? 0.5 : 1,
                    }}
                    title="减少循环次数"
                  >
                    -
                  </button>
                  <span style={{ fontSize: '11px', color: '#6b7280', minWidth: '30px', textAlign: 'center' }}>
                    {loopSettings.repeatCount}x
                  </span>
                  <button
                    type="button"
                    onClick={() => updateLoopRepeatCount(loopSettings.repeatCount + 1)}
                    disabled={loopSettings.repeatCount >= 10}
                    style={{
                      ...buttonStyle(false),
                      fontSize: '10px',
                      padding: '2px 6px',
                      minWidth: '20px',
                      opacity: loopSettings.repeatCount >= 10 ? 0.5 : 1,
                    }}
                    title="增加循环次数"
                  >
                    +
                  </button>
                </div>

                {/* Loop status and duration display */}
                {loopStart !== null && loopEnd !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      {formatTime(loopStart)} - {formatTime(loopEnd)} ({formatTime(loopEnd - loopStart)})
                      {loopSettings.isLooping && ` | 第${loopSettings.currentRepeat + 1}/${loopSettings.repeatCount}次`}
                    </div>

                    {/* Precision adjustment controls */}
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => adjustLoopStart(-0.1)}
                        style={{
                          ...buttonStyle(false),
                          fontSize: '9px',
                          padding: '2px 4px',
                          minWidth: '20px',
                        }}
                        title="A点前移0.1秒"
                      >
                        A-
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustLoopStart(0.1)}
                        style={{
                          ...buttonStyle(false),
                          fontSize: '9px',
                          padding: '2px 4px',
                          minWidth: '20px',
                        }}
                        title="A点后移0.1秒"
                      >
                        A+
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustLoopEnd(-0.1)}
                        style={{
                          ...buttonStyle(false),
                          fontSize: '9px',
                          padding: '2px 4px',
                          minWidth: '20px',
                        }}
                        title="B点前移0.1秒"
                      >
                        B-
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustLoopEnd(0.1)}
                        style={{
                          ...buttonStyle(false),
                          fontSize: '9px',
                          padding: '2px 4px',
                          minWidth: '20px',
                        }}
                        title="B点后移0.1秒"
                      >
                        B+
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Translation */}
          {hasMissingTranslations && (
            <button
              type="button"
              onClick={detectAndTranslateMissing}
              style={buttonStyle(false, translating || !showSource)}
              disabled={translating || !showSource}
              title="检测并翻译没有中文的句子"
            >
              {translating ? '翻译中...' : '翻译缺失'}
            </button>
          )}

          {/* Recording Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                ...buttonStyle(isRecording),
                background: isRecording ? '#ef4444' : '#fff',
                color: isRecording ? '#fff' : '#475569',
                border: isRecording ? '1px solid #ef4444' : '1px solid #cbd5e1',
              }}
              title={isRecording ? "停止录音" : "开始录音练习"}
            >
              {isRecording ? `🔴 ${formatRecordingTime(recordingTime)}` : '🎤 录音'}
            </button>

            {recordedAudio && (
              <>
                <button
                  type="button"
                  onClick={playRecordedAudio}
                  style={buttonStyle(false)}
                  title="播放录音"
                >
                  ▶️ 播放录音
                </button>
                <button
                  type="button"
                  onClick={deleteRecording}
                  style={{
                    ...buttonStyle(false),
                    background: '#ef4444',
                    color: 'white',
                    border: '1px solid #ef4444',
                  }}
                  title="删除录音"
                >
                  🗑️ 删除
                </button>
              </>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          <button
            type="button"
            onClick={() => setShowShortcutsHelp(true)}
            style={buttonStyle(false)}
            title="显示键盘快捷键帮助 (H)"
          >
            ⌨️ 快捷键
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, maxHeight: '100%', overflowY: 'scroll', lineHeight: 1.8, paddingRight: 8, border: '1px solid #e0e0e0', borderRadius: 6 }}>
        {segments.map((seg, si) => (
          <div
            key={seg.id}
            data-seg={si}
            onClick={() => {
              if (typeof onActiveChange === 'function') {
                const gid = typeof seg.id === 'number' ? seg.id : si;
                onActiveChange({ localIndex: si, globalIndex: gid, segment: seg });
              }
            }}
            style={{
              padding: '8px 10px',
              background: (() => {
                if (si === activeSeg) return 'rgba(255,215,0,0.25)';
                if (loopMode && loopStart !== null && loopEnd !== null) {
                  if (seg.start >= loopStart && seg.end <= loopEnd) {
                    return 'rgba(16, 185, 129, 0.1)';
                  }
                }
                return 'transparent';
              })(),
              borderLeft: loopMode && loopStart !== null && loopEnd !== null && seg.start >= loopStart && seg.end <= loopEnd ? '3px solid #10b981' : 'none',
              cursor: 'default',
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            <div style={{ visibility: (showSource || showTranslation) ? 'visible' : 'hidden', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13, color: '#777' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  title="播放本句"
                  onClick={(e) => { e.stopPropagation(); playSentence(seg); }}
                  style={{
                    width: 20,
                    height: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    fontSize: '10px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                >
                  ▶
                </button>

                {/* Speed controls for individual sentence */}
                <button
                  type="button"
                  title="慢速播放"
                  onClick={(e) => { e.stopPropagation(); playSentence(seg, 0.75); }}
                  style={{
                    width: 18,
                    height: 18,
                    fontSize: '9px',
                    padding: 0,
                    borderRadius: 3,
                    border: '1px solid #d1d5db',
                    background: '#fef3c7',
                    color: '#92400e',
                    cursor: 'pointer',
                  }}
                >
                  🐌
                </button>
              </div>
              <span>{formatTime(seg.start)} – {formatTime(seg.end)}</span>
            </div>
            <div style={{ visibility: showSource ? 'visible' : 'hidden', whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'break-word', letterSpacing: '-0.01em', lineHeight: '1.6' }}>
              {seg.words?.length
                ? seg.words.map((w, wi) => (
                    <React.Fragment key={wi}>
                      <span
                        style={{
                          padding: '2px 3px',
                          margin: '1px',
                          background:
                            activeWord[0] === si && activeWord[1] === wi
                              ? 'rgba(59, 130, 246, 0.2)'
                              : 'transparent',
                          borderRadius: 3,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: activeWord[0] === si && activeWord[1] === wi
                            ? '1px solid #3b82f6'
                            : '1px solid transparent',
                        }}
                        onClick={() => playWord(seg, wi)}
                        onMouseEnter={(e) => {
                          if (activeWord[0] !== si || activeWord[1] !== wi) {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeWord[0] !== si || activeWord[1] !== wi) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                        title="点击播放此单词"
                      >
                        {w.w}
                      </span>{' '}
                    </React.Fragment>
                  ))
                : seg.text}
            </div>
            {showTranslation && seg.translation && (
              <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: '#f0f9ff', border: '1px solid #0ea5e9', color: '#0c4a6e', fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, marginBottom: 2, fontSize: '12px', color: '#0369a1' }}>📝 翻译</div>
                {seg.translation}
              </div>
            )}

            {/* Learning progress indicator */}
            {learningStats.completedSegments.includes(si) && (
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '11px', color: '#059669' }}>已完成</span>
              </div>
            )}
          </div>
        ))}
        {!segments.length && (
          <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '16px', marginBottom: 8 }}>🎧</div>
            <div>暂无转写内容，上传音频后将在此显示精听学习材料。</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 8 }}>
              支持逐词播放、语速调节、A/B循环等精听功能
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>⌨️ 键盘快捷键</h3>
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>播放控制</h4>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><strong>空格</strong> - 播放/暂停</div>
                  <div><strong>←</strong> - 上一句</div>
                  <div><strong>→</strong> - 下一句</div>
                  <div><strong>↑</strong> - 重播当前句</div>
                  <div><strong>↓</strong> - 开关A/B循环</div>
                  <div><strong>0-9</strong> - 跳转到指定句子</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>语速控制</h4>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><strong>+/-</strong> - 加速/减速</div>
                  <div><strong>R</strong> - 重置语速</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>显示切换</h4>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><strong>S</strong> - 显示/隐藏英文</div>
                  <div><strong>T</strong> - 显示/隐藏中文</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>高级功能</h4>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><strong>L</strong> - 开关循环模式</div>
                  <div><strong>A</strong> - 设置循环A点</div>
                  <div><strong>B</strong> - 设置循环B点</div>
                  <div><strong>W</strong> - 播放当前词</div>
                  <div><strong>H</strong> - 显示帮助</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>循环控制</h4>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><strong>1-9</strong> - 设置循环次数</div>
                  <div><strong>Shift+A</strong> - A点前移0.1秒</div>
                  <div><strong>Shift+B</strong> - A点后移0.1秒</div>
                  <div><strong>Shift+←</strong> - B点前移0.1秒</div>
                  <div><strong>Shift+→</strong> - B点后移0.1秒</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>录音功能</h4>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><strong>Ctrl+R</strong> - 开始/停止录音</div>
                  <div><strong>Ctrl+P</strong> - 播放录音</div>
                  <div><strong>R</strong> - 重置语速</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
              提示：输入框中输入时快捷键将被禁用
            </div>
          </div>
        </div>
      )}

      {/* Learning Statistics Footer */}
      {segments.length > 0 && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              学习进度: {Math.round((learningStats.completedSegments.length / learningStats.totalSegments) * 100)}%
              | 播放次数: {learningStats.playCount}
              {loopMode && ` | A/B循环: ${formatTime(loopStart)}-${formatTime(loopEnd)}`}
              {loopSettings.isLooping && ` (${loopSettings.repeatCount}次循环 第${loopSettings.currentRepeat + 1}次)`}
            </div>
            <div>
              当前语速: {playbackSpeed.toFixed(1)}x
              {activeSeg >= 0 && ` | 句子: ${activeSeg + 1}/${segments.length}`}
            </div>
          </div>
          <div style={{ marginTop: 4, fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              按 H 查看快捷键帮助
              {isRecording && ` | 🔴 录音中: ${formatRecordingTime(recordingTime)}`}
              {recordedAudio && !isRecording && ' | 🎤 有录音'}
            </div>
            <div>空格:播放/暂停 | ←→:切换句子 | +/-:语速 | Ctrl+R:录音 | 数字键:循环次数</div>
          </div>
        </div>
      )}
    </div>
  );
}
