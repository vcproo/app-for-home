<template>
  <view class="record-page">
    <view class="nav-bar">
      <view class="back-btn" @tap="uni.navigateBack()">
        <text>←</text>
      </view>
      <text class="title">记账</text>
      <view style="width: 68rpx;"></view>
    </view>

    <!-- 支出/收入切换 -->
    <view class="tabs">
      <view :class="['tab', ledgerType === 'expense' ? 'active' : '']" @tap="ledgerType = 'expense'">支出</view>
      <view :class="['tab', ledgerType === 'income' ? 'active' : '']" @tap="ledgerType = 'income'">收入</view>
    </view>

    <!-- 金额 -->
    <view class="amount-field">
      <text class="label">金额</text>
      <input v-model="amount" type="digit" placeholder="0.00" />
    </view>

    <!-- 分类选择 -->
    <view class="panel">
      <text class="panel-label">分类</text>
      <view class="category-grid">
        <view
          v-for="cat in categories"
          :key="cat.id"
          :class="['category-item', selectedCategoryId === cat.id ? 'selected' : '']"
          @tap="selectedCategoryId = cat.id"
        >
          <view class="cat-icon" :style="{ background: cat.color }">
            <text>{{ cat.icon }}</text>
          </view>
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <!-- 选择账户 -->
    <view class="panel">
      <text class="panel-label">选择账户</text>
      <scroll-view scroll-x class="account-scroll">
        <view
          v-for="asset in visibleAssets"
          :key="asset.id"
          :class="['account-item', selectedAssetId === asset.id ? 'selected' : '']"
          @tap="selectedAssetId = asset.id"
        >
          <view class="asset-icon">{{ asset.name.slice(0, 1) }}</view>
          <view class="asset-meta">
            <text class="asset-name">{{ asset.name }}</text>
            <text class="asset-balance">{{ formatPlainMoney(asset.balance) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 日期 -->
    <view class="field-row">
      <text class="label">日期</text>
      <picker mode="date" :value="date" @change="date = $event.detail.value">
        <text class="date-value">{{ date }}</text>
      </picker>
    </view>

    <!-- 备注 -->
    <view class="note-field">
      <text class="label">备注</text>
      <input v-model="note" type="text" placeholder="选填，填写备注信息..." />
    </view>

    <button class="save-button" @tap="handleSave">保存</button>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '@/api/index.js';
import { formatPlainMoney } from '@/utils/format.js';

const ledgerType = ref('expense');
const amount = ref('');
const selectedCategoryId = ref(null);
const selectedAssetId = ref(null);
const note = ref('');
const date = ref(new Date().toISOString().slice(0, 10));
const categories = ref([]);
const assets = ref([]);

const visibleAssets = computed(() => assets.value.filter(a => !a.hidden));

onMounted(async () => {
  try {
    const [catData, assetData] = await Promise.all([
      api.get('/categories'),
      api.get('/assets'),
    ]);
    categories.value = catData || [];
    assets.value = [...(assetData.assets || []), ...(assetData.hidden_assets || [])];
    if (categories.value.length) selectedCategoryId.value = categories.value[0].id;
    if (assetData.assets?.length) selectedAssetId.value = assetData.assets[0].id;
  } catch (e) {}
});

async function handleSave() {
  const amt = parseFloat(amount.value);
  if (!amt || amt <= 0) {
    uni.showToast({ title: '请输入正确金额', icon: 'none' });
    return;
  }

  try {
    await api.post('/transactions', {
      type: ledgerType.value,
      amount: amt,
      category_id: selectedCategoryId.value,
      asset_id: selectedAssetId.value,
      note: note.value || undefined,
      transaction_date: date.value,
    });
    uni.showToast({ title: '已保存到家庭账本', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (e) {}
}
</script>

<style scoped>
.record-page {
  min-height: 100vh;
  padding: 0 32rpx 40rpx;
  background: #f5f6f4;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80rpx 0 20rpx;
}

.back-btn {
  width: 68rpx; height: 68rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #ffffff;
  font-size: 32rpx;
}

.title { font-size: 36rpx; font-weight: 600; }

.tabs {
  display: flex;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
}

.tab {
  flex: 1; text-align: center;
  padding: 16rpx 0; border-radius: 12rpx;
  font-size: 28rpx; font-weight: 600; color: #737a72;
}

.tab.active { background: #f5f6f4; color: #171916; }

.amount-field {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.amount-field input {
  height: 80rpx;
  font-size: 48rpx;
  font-weight: 700;
  margin-top: 8rpx;
}

.panel {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.panel-label {
  display: block;
  font-size: 26rpx;
  color: #737a72;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.category-item {
  width: calc(25% - 12rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 0;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.category-item.selected {
  border-color: #22a84d;
  background: #e9f8ee;
}

.cat-icon {
  width: 64rpx; height: 64rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 26rpx; font-weight: 600;
}

.cat-name { font-size: 22rpx; }

.account-scroll {
  white-space: nowrap;
}

.account-item {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  border: 2rpx solid #e7ebe5;
  margin-right: 16rpx;
}

.account-item.selected {
  border-color: #22a84d;
  background: #e9f8ee;
}

.asset-icon {
  width: 56rpx; height: 56rpx;
  border-radius: 50%;
  background: #f5f6f4;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; font-weight: 600;
}

.asset-meta { display: flex; flex-direction: column; }
.asset-name { font-size: 26rpx; font-weight: 500; }
.asset-balance { font-size: 22rpx; color: #737a72; }

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.date-value { font-size: 28rpx; }

.note-field {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.note-field input {
  height: 72rpx;
  font-size: 28rpx;
  margin-top: 8rpx;
}

.label {
  font-size: 24rpx;
  color: #737a72;
  font-weight: 600;
}
</style>
