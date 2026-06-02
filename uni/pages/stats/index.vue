<template>
  <view class="stats-page">
    <view class="nav-bar">
      <text class="title">统计</text>
      <view style="width: 68rpx;"></view>
    </view>

    <!-- 月/年切换 -->
    <view class="tabs">
      <view :class="['tab', statsMode === 'month' ? 'active' : '']" @tap="statsMode = 'month'; loadStats()">月</view>
      <view :class="['tab', statsMode === 'year' ? 'active' : '']" @tap="statsMode = 'year'; loadStats()">年</view>
    </view>

    <!-- 日期选择 -->
    <view class="month-picker">
      <text class="arrow" @tap="changeDate(-1)">‹</text>
      <text class="date-label">{{ dateLabel }}</text>
      <text class="arrow" @tap="changeDate(1)">›</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-cards">
      <view class="stat-card expense">
        <text class="stat-label">{{ statsMode === 'month' ? '本月' : '本年' }}支出</text>
        <text class="stat-amount">{{ formatPlainMoney(statsData.expense) }}</text>
      </view>
      <view class="stat-card income">
        <text class="stat-label">{{ statsMode === 'month' ? '本月' : '本年' }}收入</text>
        <text class="stat-amount">{{ formatPlainMoney(statsData.income) }}</text>
      </view>
      <view class="stat-card balance">
        <text class="stat-label">{{ statsMode === 'month' ? '本月' : '本年' }}结余</text>
        <text class="stat-amount">{{ formatPlainMoney(statsData.income - statsData.expense) }}</text>
      </view>
    </view>

    <!-- 支出概览 -->
    <view class="panel">
      <view class="section-title">
        <text class="panel-title">支出概览</text>
        <text class="sub-text">总支出 {{ formatPlainMoney(statsData.expense) }}</text>
      </view>
      <!-- 环形图 -->
      <view class="chart-row">
        <view class="donut-wrap">
          <view class="donut" :style="{ background: donutGradient }">
            <view class="donut-center">
              <text class="donut-amount">{{ formatPlainMoney(statsData.expense) }}</text>
              <text class="donut-label">总支出</text>
            </view>
          </view>
        </view>
        <view class="legend-list">
          <view v-for="cat in categoryStats" :key="cat.id" class="legend-item">
            <view class="dot" :style="{ background: cat.color }"></view>
            <text class="legend-name">{{ cat.name }}</text>
            <text class="legend-value">¥{{ cat.amount.toFixed(2) }}　{{ cat.percent }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 成员贡献 -->
    <view class="panel">
      <view class="section-title">
        <text class="panel-title">成员贡献</text>
        <text class="sub-text">按付款统计</text>
      </view>
      <view v-for="m in memberStats" :key="m.nickname" class="contrib-item">
        <view class="contrib-avatar">{{ m.nickname.slice(0, 1) }}</view>
        <view class="contrib-info">
          <text class="contrib-name">{{ m.nickname }}</text>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: m.percent + '%' }"></view>
          </view>
        </view>
        <text class="contrib-amount">¥{{ m.amount.toFixed(2) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index.js';
import { formatPlainMoney } from '@/utils/format.js';

const statsMode = ref('month');
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
const statsData = ref({ income: 0, expense: 0 });
const categoryStats = ref([]);
const memberStats = ref([]);

const dateLabel = computed(() => {
  if (statsMode.value === 'month') return `${currentYear.value}年${currentMonth.value}月`;
  return `${currentYear.value}年`;
});

const donutGradient = computed(() => {
  if (!categoryStats.value.length || !statsData.value.expense) {
    return 'conic-gradient(#e7ebe5 0% 100%)';
  }
  let acc = 0;
  const stops = categoryStats.value.map(cat => {
    const start = acc;
    acc += cat.percent;
    return `${cat.color} ${start}% ${acc}%`;
  });
  if (acc < 100) stops.push(`#e7ebe5 ${acc}% 100%`);
  return `conic-gradient(${stops.join(', ')})`;
});

onMounted(() => {
  loadStats();
});

onShow(() => {
  loadStats();
});

function changeDate(delta) {
  if (statsMode.value === 'month') {
    currentMonth.value += delta;
    if (currentMonth.value < 1) { currentMonth.value = 12; currentYear.value--; }
    if (currentMonth.value > 12) { currentMonth.value = 1; currentYear.value++; }
  } else {
    currentYear.value += delta;
  }
  loadStats();
}

async function loadStats() {
  try {
    const y = currentYear.value;
    const m = currentMonth.value;

    if (statsMode.value === 'month') {
      const [monthly, cats, members] = await Promise.all([
        api.get(`/stats/monthly?year=${y}&month=${m}`),
        api.get(`/stats/categories?year=${y}&month=${m}`),
        api.get(`/stats/members?year=${y}&month=${m}`),
      ]);
      statsData.value = monthly;
      categoryStats.value = cats.categories || [];
      memberStats.value = members.members || [];
    } else {
      const yearly = await api.get(`/stats/yearly?year=${y}`);
      statsData.value = yearly;
      categoryStats.value = [];
      memberStats.value = [];
    }
  } catch (e) {}
}
</script>

<style scoped>
.stats-page {
  min-height: 100vh;
  padding: 0 32rpx 160rpx;
  background: #f5f6f4;
}

.nav-bar {
  display: flex; align-items: center; justify-content: center;
  padding: 80rpx 0 20rpx;
}

.title { font-size: 36rpx; font-weight: 600; }

.tabs {
  display: flex;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 20rpx;
}

.tab {
  flex: 1; text-align: center;
  padding: 14rpx 0; border-radius: 12rpx;
  font-size: 28rpx; font-weight: 600; color: #737a72;
}

.tab.active { background: #f5f6f4; color: #171916; }

.month-picker {
  display: flex; align-items: center; justify-content: center;
  gap: 40rpx; margin-bottom: 24rpx;
}

.arrow { font-size: 48rpx; color: #737a72; padding: 0 20rpx; }
.date-label { font-size: 30rpx; font-weight: 600; }

.stats-cards {
  display: flex; gap: 16rpx; margin-bottom: 20rpx;
}

.stat-card {
  flex: 1; border-radius: 16rpx; padding: 20rpx;
  background: #ffffff;
}

.stat-card.expense .stat-amount { color: #ef5f5f; }
.stat-card.income .stat-amount { color: #22a84d; }
.stat-card.balance .stat-amount { color: #2f86df; }

.stat-label { display: block; font-size: 22rpx; color: #737a72; }
.stat-amount { display: block; font-size: 30rpx; font-weight: 700; margin-top: 8rpx; }

.panel {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.section-title {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20rpx;
}

.panel-title { font-size: 30rpx; font-weight: 600; }
.sub-text { font-size: 24rpx; color: #737a72; }

.chart-row {
  display: flex; gap: 24rpx; align-items: center;
}

.donut-wrap { flex-shrink: 0; }

.donut {
  width: 200rpx; height: 200rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.donut-center {
  width: 140rpx; height: 140rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}

.donut-amount { font-size: 24rpx; font-weight: 700; }
.donut-label { font-size: 20rpx; color: #737a72; }

.legend-list { flex: 1; display: flex; flex-direction: column; gap: 12rpx; }

.legend-item {
  display: flex; align-items: center; gap: 12rpx;
}

.dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.legend-name { font-size: 24rpx; flex: 1; }
.legend-value { font-size: 22rpx; color: #737a72; white-space: nowrap; }

.contrib-item {
  display: flex; align-items: center; gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.contrib-item:last-child { border-bottom: none; }

.contrib-avatar {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: #e9f8ee; color: #22a84d;
  display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; font-weight: 600;
}

.contrib-info { flex: 1; }
.contrib-name { display: block; font-size: 26rpx; font-weight: 500; margin-bottom: 8rpx; }

.progress-bar {
  height: 12rpx; background: #f0f0f0; border-radius: 6rpx; overflow: hidden;
}

.progress-fill {
  height: 100%; background: #22a84d; border-radius: 6rpx;
  transition: width 0.3s;
}

.contrib-amount { font-size: 28rpx; font-weight: 600; white-space: nowrap; }
</style>
