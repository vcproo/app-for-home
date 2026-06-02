<script>
export default {
  onLaunch() {},
};
</script>

<style>
page {
  --bg: #f5f6f4;
  --surface: #ffffff;
  --surface-soft: #f7f8f6;
  --text: #171916;
  --muted: #737a72;
  --line: #e7ebe5;
  --green: #22a84d;
  --green-dark: #168a3b;
  --green-soft: #e9f8ee;
  --amber: #f4a62a;
  --amber-soft: #fff5e5;
  --blue: #2f86df;
  --red: #ef5f5f;
  background: var(--bg);
  color: var(--text);
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.container {
  padding: 0 32rpx;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
}

.page-header h1 {
  font-size: 48rpx;
  font-weight: 700;
}

.back-btn {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-soft);
  font-size: 36rpx;
}

.save-button {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: var(--green);
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  margin-top: 20rpx;
}

.save-button::after {
  border: none;
}

.panel {
  background: var(--surface);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title h2 {
  font-size: 30rpx;
  font-weight: 600;
}

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 16rpx 40rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  z-index: 9999;
  pointer-events: none;
}
</style>
