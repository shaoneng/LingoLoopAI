import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionPage() {
  const { user, accessToken } = useAuth();
  const [subscription, setSubscription] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    if (user && accessToken) {
      fetchSubscription();
    }
  }, [user, accessToken]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/user/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          planType: 'monthly',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('订阅成功！您现在可以访问所有学习资源了。');
        await fetchSubscription();
      } else {
        alert(data.error || '订阅失败，请稍后重试');
      }
    } catch (error) {
      alert('订阅失败，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('确定要取消订阅吗？取消后您将无法访问付费内容。')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        alert('订阅已取消');
        await fetchSubscription();
      } else {
        alert(data.error || '取消失败，请稍后重试');
      }
    } catch (error) {
      alert('取消失败，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  const hasActiveSubscription = subscription &&
    subscription.status === 'ACTIVE' &&
    new Date(subscription.expiresAt) > new Date();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>订阅服务</h1>

      {/* Current Status */}
      {subscription && (
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: hasActiveSubscription ? '#d4edda' : '#f8d7da',
          border: hasActiveSubscription ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: hasActiveSubscription ? '#155724' : '#721c24' }}>
            当前状态: {hasActiveSubscription ? '已订阅' : '已过期'}
          </h3>
          <div style={{ color: hasActiveSubscription ? '#155724' : '#721c24' }}>
            {subscription.planType === 'monthly' ? '月度订阅' : '年度订阅'}
            <br />
            到期时间: {new Date(subscription.expiresAt).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Free Plan */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>免费版</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>¥0<span style={{ fontSize: '16px', fontWeight: 'normal' }}>/月</span></div>
          <ul style={{ textAlign: 'left', marginBottom: '20px', paddingLeft: '20px' }}>
            <li>查看前5个学习节目</li>
            <li>基础转写功能</li>
            <li>基础分析功能</li>
          </ul>
          {hasActiveSubscription ? null : (
            <button
              disabled
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'not-allowed',
              }}
            >
              当前方案
            </button>
          )}
        </div>

        {/* Monthly Plan */}
        <div style={{
          border: '2px solid #007bff',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
          }}>
            推荐
          </div>
          <h3 style={{ margin: '0 0 10px 0' }}>月度订阅</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>¥30<span style={{ fontSize: '16px', fontWeight: 'normal' }}>/月</span></div>
          <ul style={{ textAlign: 'left', marginBottom: '20px', paddingLeft: '20px' }}>
            <li>✓ 所有学习节目</li>
            <li>✓ 完整转写功能</li>
            <li>✓ 高级分析功能</li>
            <li>✓ 优先客服支持</li>
          </ul>
          {hasActiveSubscription ? (
            <button
              onClick={handleCancel}
              disabled={processing}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: processing ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? '处理中...' : '取消订阅'}
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={processing}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: processing ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? '处理中...' : '立即订阅'}
            </button>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>订阅功能对比</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>功能</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>免费版</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>月度订阅</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>学习节目数量</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>5个</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>全部</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>转写精度</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>标准</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>高精度</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>语法分析</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>基础</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>高级</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>翻译功能</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>✓</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>✓</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>客服支持</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>社区</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>优先</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}