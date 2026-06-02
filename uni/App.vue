<script>
	export default {
		onLaunch: function() {
			console.log('App Launch');
			// 网络诊断
			uni.request({
				url: 'https://app-for-home-worker.hants666.workers.dev/api/v1/auth/login',
				method: 'POST',
				data: { phone: '13800138000', password: '123456' },
				header: { 'Content-Type': 'application/json' },
				success: function(res) {
					console.log('网络测试成功:', JSON.stringify(res));
					uni.showToast({ title: '网络OK:' + res.statusCode, icon: 'none', duration: 3000 });
				},
				fail: function(err) {
					console.log('网络测试失败:', JSON.stringify(err));
					uni.showModal({
						title: '网络诊断',
						content: '请求失败: ' + JSON.stringify(err),
						showCancel: false
					});
				}
			});
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	page {
		--primary: #5B67CA;
		--primary-light: #E8EAFF;
		--danger: #E85B5B;
		--success: #4CAF50;
		--bg: #F5F5F5;
		--card: #FFFFFF;
		--text: #333333;
		--text-secondary: #999999;
		--border: #EEEEEE;
		--shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		background-color: #F5F5F5;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		color: #333333;
		font-size: 28rpx;
		line-height: 1.6;
	}

	.container {
		padding: 24rpx;
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	}

	.card {
		background: #FFFFFF;
		border-radius: 16rpx;
		padding: 28rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.btn-primary {
		background: #5B67CA;
		color: #FFFFFF;
		border: none;
		border-radius: 12rpx;
		padding: 24rpx;
		font-size: 30rpx;
		font-weight: 500;
		text-align: center;
	}

	.btn-primary:active {
		opacity: 0.85;
	}

	.section-title {
		font-size: 26rpx;
		color: #999999;
		margin-bottom: 16rpx;
		font-weight: 500;
	}

	.empty-tip {
		text-align: center;
		color: #999999;
		padding: 60rpx 0;
		font-size: 28rpx;
	}
</style>
