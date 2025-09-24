import React, { useState, useRef, useEffect } from 'react';

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const MobileAudioPlayer = ({
  audioUrl,
  title,
  duration,
  onTimeUpdate,
  onEnded,
  isPlaying: externalIsPlaying,
  onPlayPause: externalOnPlayPause
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Handle external play/pause control
  useEffect(() => {
    if (externalIsPlaying !== undefined && externalOnPlayPause) {
      setIsPlaying(externalIsPlaying);
    }
  }, [externalIsPlaying, externalOnPlayPause]);

  // Sync audio element with state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Audio playback failed:', error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Update looping
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setCurrentTime(0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const handlePlayPause = () => {
    if (externalOnPlayPause) {
      externalOnPlayPause(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !audioRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const handleSeekForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const handleRateChange = (rate) => {
    setPlaybackRate(rate);
    setShowAdvancedControls(false);
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="mobile-audio-player">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Player Header */}
      <div className="player-header">
        <div className="track-info">
          <div className="track-title">{title || '音频播放器'}</div>
          <div className="track-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        <button
          className="advanced-toggle"
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
        >
          ⋮
        </button>
      </div>

      {/* Progress Bar */}
      <div className="progress-container" onClick={handleProgressClick}>
        <div
          ref={progressRef}
          className="progress-bar"
        >
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="progress-handle"
            style={{ left: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="main-controls">
        <button
          className="control-button secondary"
          onClick={handleSeekBackward}
          aria-label="后退10秒"
        >
          ⏪
        </button>

        <button
          className={`control-button primary ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlayPause}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <button
          className="control-button secondary"
          onClick={handleSeekForward}
          aria-label="前进10秒"
        >
          ⏩
        </button>
      </div>

      {/* Advanced Controls */}
      {showAdvancedControls && (
        <div className="advanced-controls">
          {/* Playback Rate */}
          <div className="control-group">
            <div className="control-label">播放速度</div>
            <div className="rate-options">
              {playbackRates.map(rate => (
                <button
                  key={rate}
                  className={`rate-button ${playbackRate === rate ? 'active' : ''}`}
                  onClick={() => handleRateChange(rate)}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Loop Control */}
          <div className="control-group">
            <button
              className={`loop-button ${isLooping ? 'active' : ''}`}
              onClick={toggleLoop}
            >
              <span className="loop-icon">🔁</span>
              <span className="loop-text">循环播放</span>
            </button>
          </div>

          {/* Volume Control */}
          <div className="control-group">
            <div className="control-label">音量</div>
            <div className="volume-control">
              <span className="volume-icon">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Mini Controls (when advanced is hidden) */}
      {!showAdvancedControls && (
        <div className="mini-controls">
          <button
            className={`mini-control ${isLooping ? 'active' : ''}`}
            onClick={toggleLoop}
            aria-label="循环播放"
          >
            🔁
          </button>

          <button
            className="mini-control"
            onClick={() => setShowAdvancedControls(true)}
            aria-label="更多控制"
          >
            {playbackRate}x
          </button>

          <div className="volume-indicator">
            <span className="volume-icon">🔈</span>
            <span className="volume-text">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAudioPlayer;