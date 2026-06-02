<template>
  <view class="assets-page">
    <view class="nav-bar">
      <view class="back-btn" @tap="uni.navigateBack()"><text>←</text></view>
      <text class="title">资产管理</text>
      <view style="width: 68rpx;"></view>
    </view>

    <!-- 总资产 -->
    <view class="panel summary">
      <view>
        <text class="eyebrow">总资产</text>
        <text class="total-amount">{{ formatPlainMoney(totalBalance) }}</text>
      </view>
      <text class="add-btn" @tap="openEditor()">添加</text>
    </view>

    <!-- 编辑器 -->
    <view v-if="showEditor" class="panel editor">
      <view class="section-title">
        <text class="panel-title">{{ editingId ? '余额管理' : '添加资产' }}</text>
        <text class="cancel-btn" @tap="closeEditor">取消</text>
      </view>
      <view class="field">
        <text class="label">资产名称</text>
        <input v-model="editName" type="text" maxlength="16" placeholder="例如：招商银行" />
      </view>
      <view class="field">
        <text class="label">资产金额</text>
        <input v-model="editBalance" type="digit" placeholder="例如：1000" />
      </view>
      <button class="save-button" @tap="handleSaveAsset">保存资产</button>
    </view>

    <!-- 转账编辑器 -->
    <view v-if="showTransfer" class="panel editor">
      <view class="section-title">
        <text class="panel-title">资产转账</text>
        <text class="cancel-btn" @tap="closeTransfer">取消</text>
      </view>
      <view class="field">
        <text class="label">转出账户</text>
        <input :value="transferFrom ? transferFrom.name : ''" type="text" disabled />
      </view>
      <view class="field">
        <text class="label">转入账户</text>
        <picker :range="transferTargets" :range-key="'label'" @change="transferToId = transferTargets[$event.detail.value].value">
          <view class="picker-value">{{ transferToName || '请选择' }}</view>
        </picker>
      </view>
      <view class="field">
        <text class="label">转账金额</text>
        <input v-model="transferAmount" type="digit" placeholder="请输入金额" />
      </view>
      <button class="save-button" @tap="handleTransfer">确认转账</button>
    </view>

    <!-- 资产列表 -->
    <view class="panel">
      <view class="section-title">
        <text class="panel-title">资产列表</text>
        <text class="sub-text">按账户管理余额</text>
      </view>
      <view v-for="asset in visibleAssets" :key="asset.id" class="asset-item">
        <view class="asset-icon">{{ asset.name.slice(0, 1) }}</view>
        <view class="asset-info">
          <text class="asset-name">{{ asset.name }}</text>
          <text class="asset-owner">所属人：{{ asset.owner_nickname || '未设置' }}</text>
        </view>
        <text class="asset-balance">{{ formatPlainMoney(asset.balance) }}</text>
        <view class="asset-actions">
          <text class="icon-btn" @tap="openEditor(asset)">¥</text>
          <text class="icon-btn" @tap="openTransfer(asset)">⇄</text>
          <text class="icon-btn danger" @tap="handleHide(asset)">隐藏</text>
        </view>
      </view>
    </view>

    <!-- 隐藏资产 -->
    <view v-if="hiddenAssets.length" class="panel">
      <view class="section-title">
        <text class="panel-title">隐藏资产</text>
        <text class="sub-text">不计入总资产</text>
      </view>
      <view v-for="asset in hiddenAssets" :key="asset.id" class="asset-item">
        <view class="asset-icon">{{ asset.name.slice(0, 1) }}</view>
        <view class="asset-info">
          <text class="asset-name">{{ asset.name }}</text>
          <text class="asset-owner">所属人：{{ asset.owner_nickname || '未设置' }}</text>
        </view>
        <text class="asset-balance muted">{{ formatPlainMoney(asset.balance) }}</text>
        <view class="asset-actions">
          <text class="icon-btn" @tap="handleShow(asset)">显示</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '@/api/index.js';
import { formatPlainMoney } from '@/utils/format.js';

const allAssets = ref([]);
const totalBalance = ref(0);
const showEditor = ref(false);
const editingId = ref(null);
const editName = ref('');
const editBalance = ref('');
const showTransfer = ref(false);
const transferFrom = ref(null);
const transferToId = ref(null);
const transferAmount = ref('');

const visibleAssets = computed(() => allAssets.value.filter(a => !a.hidden));
const hiddenAssets = computed(() => allAssets.value.filter(a => a.hidden));

const transferTargets = computed(() =>
  allAssets.value
    .filter(a => !a.hidden && a.id !== transferFrom.value?.id)
    .map(a => ({ label: `${a.name}（${a.owner_nickname}）`, value: a.id }))
);

const transferToName = computed(() => {
  const t = transferTargets.value.find(t => t.value === transferToId.value);
  return t?.label || '';
});

onMounted(() => loadAssets());

async function loadAssets() {
  try {
    const data = await api.get('/assets');
    allAssets.value = [...(data.assets || []), ...(data.hidden_assets || [])];
    totalBalance.value = data.total_balance || 0;
  } catch (e) {}
}

function openEditor(asset = null) {
  editingId.value = asset?.id || null;
  editName.value = asset?.name || '';
  editBalance.value = asset?.balance?.toString() || '';
  showEditor.value = true;
}

function closeEditor() {
  showEditor.value = false;
  editingId.value = null;
}

async function handleSaveAsset() {
  if (!editName.value.trim()) {
    uni.showToast({ title: '请输入资产名称', icon: 'none' });
    return;
  }
  try {
    if (editingId.value) {
      await api.put(`/assets/${editingId.value}`, {
        name: editName.value, balance: parseFloat(editBalance.value) || 0,
      });
      uni.showToast({ title: '已更新余额', icon: 'success' });
    } else {
      await api.post('/assets', {
        name: editName.value, balance: parseFloat(editBalance.value) || 0,
      });
      uni.showToast({ title: '已添加资产', icon: 'success' });
    }
    closeEditor();
    await loadAssets();
  } catch (e) {}
}

function openTransfer(asset) {
  transferFrom.value = asset;
  transferToId.value = null;
  transferAmount.value = '';
  showTransfer.value = true;
}

function closeTransfer() {
  showTransfer.value = false;
}

async function handleTransfer() {
  const amt = parseFloat(transferAmount.value);
  if (!amt || amt <= 0) {
    uni.showToast({ title: '请输入转账金额', icon: 'none' });
    return;
  }
  if (!transferToId.value) {
    uni.showToast({ title: '请选择转入账户', icon: 'none' });
    return;
  }
  try {
    await api.post('/assets/transfer', {
      from_asset_id: transferFrom.value.id,
      to_asset_id: transferToId.value,
      amount: amt,
    });
    uni.showToast({ title: '转账成功', icon: 'success' });
    closeTransfer();
    await loadAssets();
  } catch (e) {}
}

async function handleHide(asset) {
  try {
    await api.put(`/assets/${asset.id}/hide`, { hidden: true });
    uni.showToast({ title: '已隐藏资产', icon: 'success' });
    await loadAssets();
  } catch (e) {}
}

async function handleShow(asset) {
  try {
    await api.put(`/assets/${asset.id}/hide`, { hidden: false });
    uni.showToast({ title: '已恢复资产', icon: 'success' });
    await loadAssets();
  } catch (e) {}
}
</script>

<style scoped>
.assets-page {
  min-height: 100vh;
  padding: 0 32rpx 40rpx;
  background: #f5f6f4;
}

.nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 80rpx 0 20rpx;
}

.back-btn {
  width: 68rpx; height: 68rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #ffffff; font-size: 32rpx;
}

.title { font-size: 36rpx; font-weight: 600; }

.panel {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.summary {
  display: flex; align-items: center; justify-content: space-between;
}

.eyebrow { display: block; font-size: 22rpx; color: #737a72; font-weight: 700; }
.total-amount { display: block; font-size: 48rpx; font-weight: 700; margin-top: 8rpx; }
.add-btn { font-size: 28rpx; color: #22a84d; font-weight: 600; }
.cancel-btn { font-size: 28rpx; color: #737a72; }

.editor { border: 2rpx solid #22a84d; }

.section-title {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20rpx;
}

.panel-title { font-size: 30rpx; font-weight: 600; }
.sub-text { font-size: 24rpx; color: #737a72; }

.field { display: flex; flex-direction: column; gap: 8rpx; margin-bottom: 16rpx; }
.label { font-size: 24rpx; color: #737a72; font-weight: 600; }
.field input { height: 80rpx; padding: 0 20rpx; background: #f7f8f6; border-radius: 12rpx; font-size: 28rpx; }
.picker-value { height: 80rpx; line-height: 80rpx; padding: 0 20rpx; background: #f7f8f6; border-radius: 12rpx; font-size: 28rpx; }

.asset-item {
  display: flex; align-items: center; gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.asset-item:last-child { border-bottom: none; }

.asset-icon {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  background: #f5f6f4;
  display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; font-weight: 600;
}

.asset-info { flex: 1; }
.asset-name { display: block; font-size: 28rpx; font-weight: 500; }
.asset-owner { display: block; font-size: 22rpx; color: #737a72; margin-top: 4rpx; }
.asset-balance { font-size: 30rpx; font-weight: 600; white-space: nowrap; }
.asset-balance.muted { color: #737a72; }

.asset-actions { display: flex; gap: 12rpx; }

.icon-btn {
  width: 56rpx; height: 56rpx;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #f7f8f6;
  font-size: 24rpx; font-weight: 600;
}

.icon-btn.danger { color: #ef5f5f; }
</style>
