import React from 'react';
import Link from 'next/link';

export default function TakedownPage() {
  const [isClient, setIsClient] = React.useState(false);
  const [formData, setFormData] = React.useState({
    resourceId: '',
    reason: '',
    contactInfo: '',
    additionalInfo: ''
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/takedown-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || '提交失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isClient) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中…</div>;
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{
          padding: '24px',
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#065f46', marginBottom: 16 }}>下架请求已提交</h1>
          <p style={{ color: '#047857', lineHeight: 1.6, marginBottom: 16 }}>
            我们已收到您的下架请求，将在24小时内处理。处理结果将通过您提供的联系信息通知您。
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 6,
              fontWeight: 500
            }}
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: '#1f2937', marginBottom: 16 }}>
          版权下架请求
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.6 }}>
          如果您认为资源库中的某些内容侵犯了您的版权，请填写此表单提交下架请求。
          我们承诺在24小时内处理所有合法的下架请求。
        </p>
      </header>

      {error && (
        <div style={{
          marginBottom: 24,
          padding: '16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: 8,
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>
            资源ID *
          </label>
          <input
            type="text"
            name="resourceId"
            value={formData.resourceId}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
            }}
            placeholder="请从资源页面复制资源ID"
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            资源ID可以在资源详情页面的URL中找到，格式类似于：xxx-xxx-xxx
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>
            下架原因 *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              resize: 'vertical',
            }}
            placeholder="请详细说明为什么该资源应该被下架，包括版权所有权证明等信息"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>
            联系信息 *
          </label>
          <input
            type="text"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
            }}
            placeholder="邮箱地址或其他联系方式"
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            我们将通过此联系方式与您沟通处理进度
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>
            附加信息
          </label>
          <textarea
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleInputChange}
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              resize: 'vertical',
            }}
            placeholder="任何其他有助于处理此请求的信息（可选）"
          />
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          fontSize: 14,
          color: '#4b5563'
        }}>
          <h4 style={{ fontWeight: 600, marginBottom: 8 }}>处理流程：</h4>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
            <li>收到请求后，我们将在24小时内进行审核</li>
            <li>如需补充信息，我们将通过您提供的联系方式联系您</li>
            <li>审核通过后，相关资源将被立即下架</li>
            <li>处理结果将通过您提供的联系方式通知</li>
          </ol>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '16px 32px',
            backgroundColor: submitting ? '#9ca3af' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 500,
            cursor: submitting ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-start'
          }}
        >
          {submitting ? '提交中…' : '提交下架请求'}
        </button>
      </form>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
        <Link
          href="/dashboard"
          style={{
            color: '#6b7280',
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}