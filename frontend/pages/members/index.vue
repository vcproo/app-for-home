<template>
  <view class="members-page">
    <view class="nav-bar">
      <view>
        <text class="eyebrow">家庭共享</text>
        <text class="title">我的</text>
      </view>
    </view>

    <!-- 家庭概览 -->
    <view class="panel overview">
      <text class="overview-title">家庭账本概览</text>
      <text class="overview-desc">当前 {{ members.length }} 位成员共同记录，本月共有 {{ totalTransactions }} 条流水。</text>
    </view>

    <!-- 邀请码 -->
    <view v-if="familyInfo" class="panel invite-panel">
      <text class="invite-label">家庭邀请码</text>
      <text class="invite-code">{{ familyInfo.invite_code }}</text>
      <text class="invite-hint">分享此邀请码给家人，即可加入家庭账本</text>
    </view>

    <!-- 成员列表 -->
    <view class="panel">
      <text class="panel-title">家庭成员</text>
      <view v-for="m in members" :key="m.user_id" class="member-item">
        <view class="member-left">
          <view class="member-avatar">{{ m.nickname.slice(0, 1) }}</view>
          <view class="member-meta">
            <text class="member-name">{{ m.nickname }}</text>
            <text class="member-relation">{{ m.relation }}</text>
          </view>
        </view>
        <text class="member-amount">本月 ¥{{ m.month_amount.toFixed(0) }}</text>
      </view>
    </view>

    <!-- 退出家庭 -->
    <view class="panel danger-panel" @tap="handleLeave">
      <text class="danger-text">退出家庭</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api, clearToken } from '@/api/index.js';

const members = ref([]);
const totalTransactions = ref(0);
const familyInfo = ref(null);

onMounted(() => loadData());

onShow(() => {
  loadData();
});

async function loadData() {
  try {
    const [memberData, infoData] = await Promise.all([
      api.get('/members'),
      api.get('/family/info'),
    ]);
    members.value = memberData.members || [];
    totalTransactions.value = memberData.total_transactions || 0;
    familyInfo.value = infoData;
  } catch (e) {}
}

function handleLeave() {
  uni.showModal({
    title: '退出家庭',
    content: '退出后你的账单记录会保留，但你只能查看自己的账单。确定退出吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.post('/family/leave');
          clearToken();
          uni.reLaunch({ url: '/pages/login/index' });
        } catch (e) {}
      }
    },
  });
}
</script>

<style scoped>
.members-page {
  min-height: 100vh;
  padding: 0 32rpx 160rpx;
  background: #f5f6f4;
}

.nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 80rpx 0 24rpx;
}

.eyebrow { display: block; font-size: 22rpx; color: #737a72; font-weight: 700; }
.title { display: block; font-size: 44rpx; font-weight: 700; }

.panel {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.overview-title { display: block; font-size: 30rpx; font-weight: 600; margin-bottom: 12rpx; }
.overview-desc { display: block; font-size: 26rpx; color: #737a72; line-height: 1.6; }

.invite-panel { text-align: center; }
.invite-label { display: block; font-size: 24rpx; color: #737a72; margin-bottom: 12rpx; }
.invite-code {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #22a84d;
  letter-spacing: 8rpx;
  margin-bottom: 12rpx;
}
.invite-hint { display: block; font-size: 22rpx; color: #737a72; }

.panel-title { display: block; font-size: 30rpx; font-weight: 600; margin-bottom: 20rpx; }

.member-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.member-item:last-child { border-bottom: none; }

.member-left { display: flex; align-items: center; gap: 20rpx; }

.member-avatar {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  background: #e9f8ee; color: #22a84d;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 600;
}

.member-meta { display: flex; flex-direction: column; gap: 4rpx; }
.member-name { font-size: 28rpx; font-weight: 500; }
.member-relation { font-size: 22rpx; color: #737a72; }

.member-amount { font-size: 28rpx; font-weight: 600; }

.danger-panel {
  text-align: center;
  border: 2rpx solid #ef5f5f;
}

.danger-text { color: #ef5f5f; font-size: 28rpx; font-weight: 600; }
</style>
