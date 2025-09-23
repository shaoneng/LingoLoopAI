import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import UploadProgress from './UploadProgress';
import UploadContent from './UploadContent';
import UploadHelp from './UploadHelp';

const UPLOAD_STATES = {
  IDLE: 'idle',
  SELECTING: 'selecting',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  TRANSCRIBING: 'transcribing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

const UPLOAD_STEPS = [
  { id: 'select', label: '选择文件', icon: '📁' },
  { id: 'upload', label: '上传文件', icon: '☁️' },
  { id: 'process', label: '分析处理', icon: '⚡' },
  { id: 'transcribe', label: '开始转写', icon: '🎯' },
];

const SUPPORTED_FORMATS = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/flac'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION = 30 * 60 * 1000; // 30 minutes

const formatFileSize = (bytes) => {
  if (!bytes || Number.isNaN(bytes)) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${mb.toFixed(1)} MB`;
};

const formatDuration = (ms) => {
  if (!ms || Number.isNaN(ms)) return '—';
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const hours = Math.floor(min / 60);
  if (hours > 0) {
    return `${hours}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const bufferToSha256Hex = async (arrayBuffer) => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('当前环境不支持 SHA-256 摘要计算');
  }
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration * 1000); // Convert to milliseconds
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      resolve(null);
    };
  });
};

export default function UnifiedUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  onUploadError,
  autoTranscribe = true
}) {
  const { accessToken, user } = useAuth();
  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [transcriptionRunId, setTranscriptionRunId] = useState(null);
  const [audioId, setAudioId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const uploadSessionRef = useRef(null);

  const resetModal = useCallback(() => {
    setUploadState(UPLOAD_STATES.IDLE);
    setProgress(0);
    setFile(null);
    setAudioDuration(null);
    setError('');
    setStatus('');
    setTranscriptionRunId(null);
    setAudioId(null);
    setRetryCount(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (uploadState === UPLOAD_STATES.UPLOADING || uploadState === UPLOAD_STATES.PROCESSING) {
      return; // Prevent closing during active upload
    }

    resetModal();
    onClose();
  }, [uploadState, resetModal, onClose]);

  const validateFile = useCallback((selectedFile) => {
    if (!selectedFile) {
      return { isValid: false, error: '请选择文件' };
    }

    // Validate file type
    if (!SUPPORTED_FORMATS.includes(selectedFile.type)) {
      return {
        isValid: false,
        error: '文件格式不支持。支持格式：MP3、WAV、M4A、AAC、FLAC'
      };
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `文件过大 (${formatFileSize(selectedFile.size)})，最大支持 ${formatFileSize(MAX_FILE_SIZE)}`
      };
    }

    return { isValid: true, error: null };
  }, []);

  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError('');
    setFile(selectedFile);
    setUploadState(UPLOAD_STATES.SELECTING);

    try {
      // Get audio duration
      const duration = await getAudioDuration(selectedFile);
      setAudioDuration(duration);

      if (duration && duration > MAX_DURATION) {
        setError(`音频时长过长 (${formatDuration(duration)})，最大支持 ${formatDuration(MAX_DURATION)}`);
        setUploadState(UPLOAD_STATES.IDLE);
        return;
      }

      // Auto-start upload after file selection
      setTimeout(() => {
        startUpload(selectedFile);
      }, 500);

    } catch (durationError) {
      console.warn('Failed to get audio duration:', durationError);
      // Continue with upload even if duration check fails
      setTimeout(() => {
        startUpload(selectedFile);
      }, 500);
    }
  }, [validateFile]);

  const startProgressSimulation = useCallback(() => {
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressIntervalRef.current);
          return 95;
        }
        return prev + Math.random() * 10; // Random progress increment
      });
    }, 200);
  }, []);

  const stopProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startUpload = useCallback(async (selectedFile) => {
    if (!selectedFile || !accessToken || !user) return;

    setUploadState(UPLOAD_STATES.UPLOADING);
    setError('');
    setStatus('准备上传...');
    setProgress(0);

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';

      // 1. Create upload session
      setStatus('创建上传会话...');
      const createResp = await fetch(`${base}/api/uploads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          sizeBytes: selectedFile.size,
          mime: selectedFile.type || 'application/octet-stream',
        }),
      });

      if (!createResp.ok) {
        const errorData = await createResp.json();
        throw new Error(errorData.error || '创建上传会话失败');
      }

      const createData = await createResp.json();
      uploadSessionRef.current = createData;

      // 2. Upload to GCS
      setStatus('上传到云存储...');
      startProgressSimulation();

      const arrayBuffer = await selectedFile.arrayBuffer();
      let sha256;
      try {
        sha256 = await bufferToSha256Hex(arrayBuffer);
      } catch (digestError) {
        console.warn('SHA-256 计算失败，跳过校验', digestError);
      }

      const uploadResp = await fetch(createData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream',
          'Content-Length': String(arrayBuffer.byteLength),
          'Content-Range': `bytes 0-${arrayBuffer.byteLength - 1}/${arrayBuffer.byteLength}`,
        },
        body: arrayBuffer,
      });

      stopProgressSimulation();
      setProgress(95);

      if (!uploadResp.ok) {
        const text = await uploadResp.text();
        throw new Error(text || '上传失败，请稍后重试。');
      }

      // 3. Commit upload
      setStatus('确认上传...');
      const commitResp = await fetch(`${base}/api/uploads/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          audioId: createData.audioId,
          gcsKey: createData.gcsKey,
          ...(sha256 ? { sha256 } : {}),
        }),
      });

      setProgress(100);

      if (!commitResp.ok) {
        const errorData = await commitResp.json();
        throw new Error(errorData.error || '确认上传失败');
      }

      const commitData = await commitResp.json();
      setAudioId(commitData.audioId);

      setUploadState(UPLOAD_STATES.PROCESSING);
      setStatus('分析处理完成！');

      // 4. Start transcription if enabled
      if (autoTranscribe) {
        setTimeout(() => {
          startTranscription(commitData.audioId);
        }, 1000);
      } else {
        setTimeout(() => {
          setUploadState(UPLOAD_STATES.COMPLETE);
          setStatus('上传完成！');
          onUploadSuccess?.(commitData.audioId);
        }, 1500);
      }

    } catch (error) {
      console.error('Upload error:', error);
      stopProgressSimulation();

      const friendlyError = getUserFriendlyError(error);
      setError(friendlyError.message);
      setUploadState(UPLOAD_STATES.ERROR);
      onUploadError?.(error);
    }
  }, [accessToken, user, autoTranscribe, onUploadSuccess, onUploadError, startProgressSimulation, stopProgressSimulation]);

  const startTranscription = useCallback(async (uploadedAudioId) => {
    if (!uploadedAudioId || !accessToken) return;

    setUploadState(UPLOAD_STATES.TRANSCRIBING);
    setStatus('正在启动转写...');

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const transcribeResp = await fetch(`${base}/api/audios/${uploadedAudioId}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          engine: 'google-speech-v2',
          language: 'en-US',
          diarize: true,
          gapSec: 0.8,
        }),
      });

      const transcribeData = await transcribeResp.json();

      if (!transcribeResp.ok) {
        throw new Error(transcribeData.error || '转写失败，请稍后再试。');
      }

      if (transcribeData.queued) {
        // Async processing
        setTranscriptionRunId(transcribeData.run.id);
        setStatus('转写已启动，正在处理中...');

        // For now, mark as complete and let user check status in dashboard
        setTimeout(() => {
          setUploadState(UPLOAD_STATES.COMPLETE);
          setStatus('转写已启动！');
          onUploadSuccess?.(uploadedAudioId);
        }, 2000);
      } else {
        // Sync processing
        setUploadState(UPLOAD_STATES.COMPLETE);
        setStatus('转写完成！');
        setTimeout(() => {
          onUploadSuccess?.(uploadedAudioId);
          handleClose();
        }, 1500);
      }

    } catch (error) {
      console.warn('Transcription start failed:', error);
      // Continue with upload success even if transcription fails
      setUploadState(UPLOAD_STATES.COMPLETE);
      setStatus('上传成功，转写启动失败，您可以稍后手动转写');
      setTimeout(() => {
        onUploadSuccess?.(uploadedAudioId);
      }, 2000);
    }
  }, [accessToken, onUploadSuccess, handleClose]);

  const handleRetry = useCallback(() => {
    if (file) {
      setRetryCount(prev => prev + 1);
      setError('');
      startUpload(file);
    }
  }, [file, startUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  if (!isOpen) return null;

  const currentStepIndex = {
    [UPLOAD_STATES.IDLE]: 0,
    [UPLOAD_STATES.SELECTING]: 0,
    [UPLOAD_STATES.UPLOADING]: 1,
    [UPLOAD_STATES.PROCESSING]: 2,
    [UPLOAD_STATES.TRANSCRIBING]: 3,
    [UPLOAD_STATES.COMPLETE]: 4,
    [UPLOAD_STATES.ERROR]: -1
  }[uploadState];

  return (
    <div className="unified-upload-modal-overlay">
      <div className="unified-upload-modal">
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">上传音频文件</h2>
          <button
            className="upload-modal-close"
            onClick={handleClose}
            disabled={uploadState === UPLOAD_STATES.UPLOADING || uploadState === UPLOAD_STATES.PROCESSING}
            aria-label="关闭上传窗口"
          >
            ✕
          </button>
        </div>

        <UploadProgress
          steps={UPLOAD_STEPS}
          currentStepIndex={currentStepIndex}
          progress={progress}
        />

        <UploadContent
          uploadState={uploadState}
          file={file}
          audioDuration={audioDuration}
          error={error}
          status={status}
          onFileSelect={handleFileSelect}
          onRetry={handleRetry}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onFileInputChange={handleFileInputChange}
          fileInputRef={fileInputRef}
        />

        <UploadHelp uploadState={uploadState} />

        {uploadState === UPLOAD_STATES.COMPLETE && (
          <div className="upload-success-actions">
            <button
              className="upload-action-button secondary"
              onClick={() => {
                resetModal();
                // Keep modal open for another upload
              }}
            >
              上传更多文件
            </button>
            <button
              className="upload-action-button primary"
              onClick={() => {
                if (audioId) {
                  // Navigate to audio details page
                  window.location.href = `/audios/${audioId}`;
                }
                handleClose();
              }}
            >
              查看音频详情
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { UPLOAD_STATES, UPLOAD_STEPS };