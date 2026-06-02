<template>
  <view class="home-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view>
        <text class="eyebrow">共享账本</text>
        <text class="title">家庭账本</text>
      </view>
      <view class="nav-btn" @tap="goTo('/pages/members/index')">
        <text class="icon-user">我</text>
      </view>
    </view>

    <!-- 滑动卡片 -->
    <view class="card-tabs">
      <view :class="['card-tab', cardTab === 0 ? 'active' : '']" @tap="cardTab = 0">共享结余</view>
      <view :class="['card-tab', cardTab === 1 ? 'active' : '']" @tap="cardTab = 1">总资产</view>
    </view>

    <swiper class="card-swiper" :current="cardTab" @change="cardTab = $event.detail.current" :style="{ height: '240rpx' }">
      <swiper-item>
        <view class="balance-card">
          <view class="card-row">
            <text>共享结余</text>
            <text class="chip">本月</text>
          </view>
          <text class="balance-amount">{{ formatPlainMoney(monthlyStats.income - monthlyStats.expense) }}</text>
          <view class="split-stat">
            <text>总收入 {{ formatPlainMoney(monthlyStats.income) }}</text>
            <text>总支出 {{ formatPlainMoney(monthlyStats.expense) }}</text>
          </view>
        </view>
      </swiper-item>
      <swiper-item>
        <view class="balance-card asset-card">
          <view class="card-row">
            <text>总资产</text>
            <text class="chip">全部账户</text>
          </view>
          <text class="balance-amount">{{ formatPlainMoney(totalAssets) }}</text>
          <view class="card-footer">
            <text class="footer-text">银行卡、现金和其他资产汇总</text>
            <view class="manage-btn" @tap="goTo('/pages/assets/index')">管理资产</view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 概览卡片 -->
    <view class="summary-row">
      <view class="mini-card">
        <text class="mini-label">本月支出</text>
        <text class="mini-amount">{{ formatPlainMoney(monthlyStats.expense) }}</text>
      </view>
      <view class="mini-card amber">
        <text class="mini-label">本月收入</text>
        <text class="mini-amount">{{ formatPlainMoney(monthlyStats.income) }}</text>
      </view>
    </view>

    <!-- 记一笔按钮 -->
    <view class="primary-action" @tap="goTo('/pages/record/index')">
      <text class="edit-icon">+</text>
      <text>记一笔</text>
    </view>

    <!-- 功能模块 -->
    <view class="module-grid">
      <view class="module-card" @tap="goTo('/pages/categories/index')">
        <text class="module-icon">分</text>
        <text>分类</text>
      </view>
      <view class="module-card" @tap="goTo('/pages/members/index')">
        <text class="module-icon">人</text>
        <text>成员</text>
      </view>
      <view class="module-card" @tap="goTo('/pages/stats/index')">
        <text class="module-icon">统</text>
        <text>统计</text>
      </view>
    </view>

    <!-- 最近记录 -->
    <view class="panel">
      <view class="section-title">
        <text class="panel-title">最近记录</text>
      </view>
      <view v-for="item in transactions" :key="item.id" class="transaction-item">
        <view class="tx-left">
          <view class="tx-icon" :style="{ background: getCategoryProp(item, 'color', '#a0a7a0') }">
            <text>{{ getCategoryProp(item, 'icon', '?') }}</text>
          </view>
          <view class="tx-meta">
            <text class="tx-title">{{ item.note || getCategoryProp(item, 'name', '转账') }}</text>
            <text class="tx-sub">{{ formatDate(item.transaction_date) }}　{{ item.member_nickname }}</text>
          </view>
        </view>
        <text :class="['tx-amount', item.amount > 0 ? 'income' : '']">{{ formatMoney(item.amount) }}</text>
      </view>
      <view v-if="!transactions.length" class="empty-hint">
        <text>暂无记录，点击"记一笔"开始记账</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index.js';
import { formatMoney, formatPlainMoney, formatDate } from '@/utils/format.js';

const cardTab = ref(0);
const transactions = ref([]);
const monthlyStats = ref({ income: 0, expense: 0 });
const totalAssets = ref(0);

function getCategoryProp(item, prop, fallback) {
  return (item.category && item.category[prop]) || fallback;
}

onMounted(() => {
  loadData();
});

onShow(() => {
  loadData();
});

async function loadData() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [transData, assetData, statsData] = await Promise.all([
      api.get('/transactions?page=1&page_size=10'),
      api.get('/assets'),
      api.get(`/stats/monthly?year=${year}&month=${month}`),
    ]);

    transactions.value = transData.list || [];
    totalAssets.value = assetData.total_balance || 0;
    monthlyStats.value = { income: statsData.income || 0, expense: statsData.expense || 0 };
  } catch (e) {}
}

function goTo(url) {
  if (url.includes('tabBar') || ['/pages/members/index', '/pages/stats/index'].includes(url)) {
    uni.switchTab({ url });
  } else {
    uni.navigateTo({ url });
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 0 32rpx 160rpx;
  background: #f5f6f4;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80rpx 0 24rpx;
}

.eyebrow { font-size: 22rpx; color: #737a72; font-weight: 700; }
.title { display: block; font-size: 44rpx; font-weight: 700; }

.nav-btn {
  width: 68rpx; height: 68rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #ffffff;
}

.icon-user { font-size: 26rpx; font-weight: 600; }

.card-tabs {
  display: flex;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 20rpx;
}

.card-tab {
  flex: 1; text-align: center;
  padding: 14rpx 0; border-radius: 12rpx;
  font-size: 26rpx; font-weight: 600; color: #737a72;
}

.card-tab.active {
  background: #f5f6f4; color: #171916;
}

.card-swiper { margin-bottom: 20rpx; }

.balance-card {
  background: linear-gradient(135deg, #22a84d 0%, #168a3b 100%);
  border-radius: 20rpx;
  padding: 28rpx;
  color: #fff;
  height: 210rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.asset-card {
  background: linear-gradient(135deg, #2f86df 0%, #1a6bc4 100%);
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 26rpx;
  opacity: 0.9;
}

.chip {
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.balance-amount {
  font-size: 52rpx;
  font-weight: 700;
}

.split-stat {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  opacity: 0.85;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-text { font-size: 22rpx; opacity: 0.8; }

.manage-btn {
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.summary-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.mini-card {
  flex: 1;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.mini-label { display: block; font-size: 22rpx; color: #737a72; }
.mini-amount { display: block; font-size: 36rpx; font-weight: 700; margin-top: 8rpx; }

.primary-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  background: #22a84d;
  border-radius: 16rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.edit-icon { font-size: 36rpx; }

.module-grid {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.module-card {
  flex: 1;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.module-icon {
  width: 72rpx; height: 72rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: #e9f8ee;
  color: #22a84d;
  font-size: 28rpx;
  font-weight: 600;
}

.panel {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.section-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.panel-title { font-size: 30rpx; font-weight: 600; }

.transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.transaction-item:last-child { border-bottom: none; }

.tx-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.tx-icon {
  width: 72rpx; height: 72rpx;
  border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
}

.tx-meta { display: flex; flex-direction: column; gap: 4rpx; }
.tx-title { font-size: 28rpx; font-weight: 500; }
.tx-sub { font-size: 22rpx; color: #737a72; }
.tx-amount { font-size: 30rpx; font-weight: 600; white-space: nowrap; }
.tx-amount.income { color: #22a84d; }

.empty-hint {
  text-align: center;
  padding: 40rpx 0;
  color: #737a72;
  font-size: 26rpx;
}
</style>
