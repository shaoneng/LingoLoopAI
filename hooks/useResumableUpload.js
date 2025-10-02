import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserFriendlyError } from '../utils/errorMessages';

const UPLOAD_STATES = {
  IDLE: 'idle',
  SELECTING: 'selecting',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  TRANSCRIBING: 'transcribing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

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

const bufferToSha256Hex = async (arrayBuffer) => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('当前环境不支持 SHA-256 摘要计算');
  }
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const useResumableUpload = (options = {}) => {
  const { autoTranscribe = true, onUploadSuccess, onUploadError } = options;
  const { accessToken, user } = useAuth();

  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [audioId, setAudioId] = useState(null);
  const [uploadSession, setUploadSession] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const progressIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  const resetUpload = useCallback(() => {
    setUploadState(UPLOAD_STATES.IDLE);
    setProgress(0);
    setFile(null);
    setAudioDuration(null);
    setError('');
    setStatus('');
    setAudioId(null);
    setUploadSession(null);
    setRetryCount(0);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

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

  const startProgressSimulation = useCallback(() => {
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressIntervalRef.current);
          return 95;
        }
        return prev + Math.random() * 5; // Random progress increment
      });
    }, 300);
  }, []);

  const stopProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const selectFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error);
      setUploadState(UPLOAD_STATES.ERROR);
      return;
    }

    try {
      resetUpload();
      setFile(selectedFile);
      setUploadState(UPLOAD_STATES.SELECTING);
      setError('');

      // Get audio duration
      const duration = await getAudioDuration(selectedFile);
      setAudioDuration(duration);

      if (duration && duration > MAX_DURATION) {
        setError(`音频时长过长 (${formatDuration(duration)})，最大支持 ${formatDuration(MAX_DURATION)}`);
        setUploadState(UPLOAD_STATES.ERROR);
        return;
      }

      return {
        file: selectedFile,
        duration,
        isValid: true
      };

    } catch (error) {
      console.error('File selection error:', error);
      setError('文件处理失败，请重试');
      setUploadState(UPLOAD_STATES.ERROR);
      return null;
    }
  }, [validateFile, resetUpload]);

  const startUpload = useCallback(async (selectedFile = file) => {
    if (!selectedFile || !accessToken || !user) {
      setError('登录状态异常，请重新登录');
      setUploadState(UPLOAD_STATES.ERROR);
      return;
    }

    try {
      abortControllerRef.current = new AbortController();
      setUploadState(UPLOAD_STATES.UPLOADING);
      setError('');
      setStatus('准备上传...');
      setProgress(0);

      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';

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
        signal: abortControllerRef.current.signal
      });

      if (!createResp.ok) {
        const errorData = await createResp.json();
        throw new Error(errorData.error || '创建上传会话失败');
      }

      const createData = await createResp.json();
      setUploadSession(createData);

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
        signal: abortControllerRef.current.signal
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
        signal: abortControllerRef.current.signal
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
          onUploadSuccess?.(commitData.audioId, selectedFile);
        }, 1500);
      }

      return {
        success: true,
        audioId: commitData.audioId,
        file: selectedFile
      };

    } catch (error) {
      console.error('Upload error:', error);
      stopProgressSimulation();

      if (error.name === 'AbortError') {
        setError('上传已取消');
        setUploadState(UPLOAD_STATES.ERROR);
        return { success: false, error: 'Upload cancelled' };
      }

      const friendlyError = getUserFriendlyError(error);
      setError(friendlyError.message);
      setUploadState(UPLOAD_STATES.ERROR);
      onUploadError?.(error);

      return {
        success: false,
        error: friendlyError.message,
        originalError: error
      };
    }
  }, [file, accessToken, user, autoTranscribe, onUploadSuccess, onUploadError, startProgressSimulation, stopProgressSimulation]);

  const startTranscription = useCallback(async (uploadedAudioId) => {
    if (!uploadedAudioId || !accessToken) return;

    try {
      setUploadState(UPLOAD_STATES.TRANSCRIBING);
      setStatus('正在启动转写...');

      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
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
        setStatus('转写已启动，正在处理中...');
        setTimeout(() => {
          setUploadState(UPLOAD_STATES.COMPLETE);
          setStatus('转写已启动！');
          onUploadSuccess?.(uploadedAudioId, file);
        }, 2000);
      } else {
        // Sync processing
        setUploadState(UPLOAD_STATES.COMPLETE);
        setStatus('转写完成！');
        setTimeout(() => {
          onUploadSuccess?.(uploadedAudioId, file);
        }, 1500);
      }

      return { success: true, audioId: uploadedAudioId };

    } catch (error) {
      console.warn('Transcription start failed:', error);
      // Continue with upload success even if transcription fails
      setUploadState(UPLOAD_STATES.COMPLETE);
      setStatus('上传成功，转写启动失败，您可以稍后手动转写');
      setTimeout(() => {
        onUploadSuccess?.(uploadedAudioId, file);
      }, 2000);

      return {
        success: true,
        audioId: uploadedAudioId,
        transcriptionError: error.message
      };
    }
  }, [accessToken, file, onUploadSuccess]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopProgressSimulation();
    resetUpload();
  }, [resetUpload, stopProgressSimulation]);

  const retryUpload = useCallback(() => {
    if (file) {
      setRetryCount(prev => prev + 1);
      setError('');
      startUpload(file);
    }
  }, [file, startUpload]);

  const getUploadState = useCallback(() => ({
    state: uploadState,
    progress,
    file,
    audioDuration,
    error,
    status,
    audioId,
    uploadSession,
    retryCount,
    isUploading: uploadState === UPLOAD_STATES.UPLOADING || uploadState === UPLOAD_STATES.PROCESSING,
    isComplete: uploadState === UPLOAD_STATES.COMPLETE,
    isError: uploadState === UPLOAD_STATES.ERROR,
    canCancel: uploadState === UPLOAD_STATES.UPLOADING || uploadState === UPLOAD_STATES.PROCESSING,
    canRetry: uploadState === UPLOAD_STATES.ERROR && file
  }), [uploadState, progress, file, audioDuration, error, status, audioId, uploadSession, retryCount]);

  return {
    selectFile,
    startUpload,
    cancelUpload,
    retryUpload,
    resetUpload,
    getUploadState,
    ...getUploadState()
  };
};

export { UPLOAD_STATES, SUPPORTED_FORMATS, MAX_FILE_SIZE, MAX_DURATION };
export default useResumableUpload;