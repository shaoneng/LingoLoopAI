import React from 'react';
import { TranscriptionStatus } from './TranscriptionStatus';

function formatDuration(ms) {
  if (!ms || Number.isNaN(ms)) return '—';
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${mb.toFixed(1)} MB`;
}

export default function AudioUploadModal({
  isOpen,
  onClose,
  accessToken,
  user,
  onUploadComplete,
  onUploadError
}) {
  React.useEffect(() => {
    console.log('AudioUploadModal rendered with isOpen:', isOpen);
  }, [isOpen]);
  const [file, setFile] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [transcriptionRunId, setTranscriptionRunId] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');
  const [progress, setProgress] = React.useState(0);
  const fileInputRef = React.useRef(null);

  const resetForm = () => {
    setFile(null);
    setIsDragging(false);
    setUploading(false);
    setTranscribing(false);
    setTranscriptionRunId(null);
    setStatus('');
    setError('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!uploading && !transcribing) {
      resetForm();
      onClose();
    }
  };

  const handleTranscriptionComplete = (success, data) => {
    if (success) {
      setStatus('转写完成！');
      setTimeout(() => {
        onUploadComplete?.(data.audioId);
        handleClose();
      }, 1500);
    } else {
      setStatus('转写失败，请稍后重试');
      setTimeout(() => {
        onUploadComplete?.(data.audioId);
        handleClose();
      }, 2000);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // 验证文件类型
    if (!selectedFile.type.startsWith('audio/')) {
      setError('请选择音频文件（MP3、WAV、M4A等格式）');
      return;
    }

    // 验证文件大小（100MB）
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('文件大小不能超过100MB');
      return;
    }

    setError('');
    setFile(selectedFile);

    // 获取音频时长
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = URL.createObjectURL(selectedFile);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
    };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const bufferToSha256Hex = async (arrayBuffer) => {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      throw new Error('当前环境不支持 SHA-256 摘要计算');
    }
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleUpload = async () => {
    if (!file || !accessToken || !user) return;

    setUploading(true);
    setError('');
    setStatus('准备上传...');

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';

      // 1. 创建上传会话
      setStatus('创建上传会话...');
      const createResp = await fetch(`${base}/api/uploads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          filename: file.name,
          sizeBytes: file.size,
          mime: file.type || 'application/octet-stream',
        }),
      });

      if (!createResp.ok) {
        const errorData = await createResp.json();
        throw new Error(errorData.error || '创建上传会话失败');
      }

      const createData = await createResp.json();

      // 2. 上传到 GCS
      setStatus('上传到云存储...');
      const arrayBuffer = await file.arrayBuffer();
      let sha256;
      try {
        sha256 = await bufferToSha256Hex(arrayBuffer);
      } catch (digestError) {
        console.warn('SHA-256 计算失败，跳过校验', digestError);
      }

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadResp = await fetch(createData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': String(arrayBuffer.byteLength),
          'Content-Range': `bytes 0-${arrayBuffer.byteLength - 1}/${arrayBuffer.byteLength}`,
        },
        body: arrayBuffer,
      });

      clearInterval(progressInterval);
      setProgress(95);

      if (!uploadResp.ok) {
        const text = await uploadResp.text();
        throw new Error(text || '上传失败，请稍后重试。');
      }

      // 3. 确认上传
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

      // 4. 开始转写（后台处理）
      setStatus('正在启动转写...');
      try {
        const transcribeResp = await fetch(`${base}/api/audios/${commitData.audioId}/transcribe`, {
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

        // 如果是异步处理，显示转写状态
        if (transcribeData.queued) {
          setTranscribing(true);
          setTranscriptionRunId(transcribeData.run.id);
          setStatus('转写已启动，正在处理中...');
          setUploading(false);
        } else {
          // 同步处理完成
          setStatus('转写完成！');
          setTimeout(() => {
            onUploadComplete?.(commitData.audioId);
            handleClose();
          }, 1500);
        }

      } catch (error) {
        // 即使转写启动失败，也要关闭弹窗，因为上传已经成功
        console.warn('转写启动失败:', error);
        setStatus('上传成功，转写启动失败，您可以稍后手动转写');
        setTimeout(() => {
          onUploadComplete?.(commitData.audioId);
          handleClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || '上传失败，请稍后再试。');
      onUploadError?.(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0,
            color: '#1f2937',
          }}>
            上传音频文件
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* 上传区域 */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${isDragging ? '#3b82f6' : '#d0d0d0'}`,
            borderRadius: '8px',
            padding: '40px 20px',
            background: isDragging ? 'rgba(59, 130, 246, 0.05)' : '#f9fafb',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            marginBottom: '20px',
            cursor: 'pointer',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />

          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
            拖拽音频文件到这里
          </p>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
            或点击选择文件
          </p>
          <span style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            选择文件
          </span>
        </div>

        {/* 文件信息 */}
        {file && (
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>🎵</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#1f2937',
                  wordBreak: 'break-word',
                }}>
                  {file.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '2px',
                }}>
                  {formatFileSize(file.size)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 状态信息 */}
        {status && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#1e40af',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}></div>
              {status}
            </div>
          </div>
        )}

        {/* 进度条 */}
        {uploading && progress > 0 && (
          <div style={{
            marginBottom: '16px',
          }}>
            <div style={{
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              height: '8px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                backgroundColor: '#3b82f6',
                height: '100%',
                transition: 'width 0.3s ease',
              }}></div>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'right',
              marginTop: '4px',
            }}>
              {progress}%
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#dc2626',
          }}>
            {error}
          </div>
        )}

        {/* 转写状态 */}
        {transcribing && transcriptionRunId && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '12px',
            }}>
              转写进度
            </div>
            <TranscriptionStatus
              runId={transcriptionRunId}
              onCompleted={handleTranscriptionComplete}
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleClose}
            disabled={uploading || transcribing}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: uploading || transcribing ? 'not-allowed' : 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading || transcribing}
            style={{
              padding: '10px 20px',
              backgroundColor: file && !uploading && !transcribing ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: file && !uploading && !transcribing ? 'pointer' : 'not-allowed',
            }}
          >
            {uploading ? '上传中...' : '开始上传'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}