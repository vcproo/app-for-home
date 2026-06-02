<template>
  <view class="categories-page">
    <view class="nav-bar">
      <view class="back-btn" @tap="uni.navigateBack()"><text>←</text></view>
      <text class="title">分类</text>
      <view style="width: 68rpx;"></view>
    </view>

    <!-- 分类编辑器 -->
    <view v-if="showEditor" class="panel editor">
      <view class="section-title">
        <text class="panel-title">{{ editingId ? '修改分类' : '添加分类' }}</text>
        <text class="cancel-btn" @tap="closeEditor">取消</text>
      </view>
      <view class="field">
        <text class="label">分类名称</text>
        <input v-model="editName" type="text" maxlength="8" placeholder="例如：餐饮" />
      </view>
      <view class="editor-row">
        <view class="field half">
          <text class="label">图标字</text>
          <input v-model="editIcon" type="text" maxlength="1" placeholder="餐" />
        </view>
        <view class="field half">
          <text class="label">颜色</text>
          <picker :range="colorOptions" :range-key="'label'" @change="editColor = colorOptions[$event.detail.value].value">
            <view class="color-preview" :style="{ background: editColor }">
              <text style="color: #fff; font-size: 22rpx;">选</text>
            </view>
          </picker>
        </view>
      </view>
      <button class="save-button" @tap="handleSaveCategory">保存分类</button>
    </view>

    <!-- 分类列表 -->
    <view class="panel">
      <view class="section-title">
        <text class="panel-title">常用分类</text>
        <text class="add-btn" @tap="openEditor()">添加</text>
      </view>
      <view v-for="cat in categories" :key="cat.id" class="category-item">
        <view class="cat-icon" :style="{ background: cat.color }">
          <text>{{ cat.icon }}</text>
        </view>
        <view class="cat-info">
          <text class="cat-name">{{ cat.name }}</text>
          <text class="cat-amount">本月 ¥ {{ (cat.month_amount || 0).toFixed(2) }}</text>
        </view>
        <view class="cat-actions">
          <text class="action-link" @tap="openEditor(cat)">修改</text>
          <text class="action-link danger" @tap="handleDelete(cat)">删除</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api/index.js';

const categories = ref([]);
const showEditor = ref(false);
const editingId = ref(null);
const editName = ref('');
const editIcon = ref('');
const editColor = ref('#22a84d');

const colorOptions = [
  { label: '绿色', value: '#22a84d' },
  { label: '蓝色', value: '#2f86df' },
  { label: '橙色', value: '#f4a62a' },
  { label: '黄色', value: '#f5be42' },
  { label: '红色', value: '#ef5f5f' },
  { label: '紫色', value: '#8c6be8' },
  { label: '粉色', value: '#ff6f91' },
  { label: '灰色', value: '#a0a7a0' },
];

onMounted(() => loadCategories());

async function loadCategories() {
  try {
    categories.value = await api.get('/categories');
  } catch (e) {}
}

function openEditor(cat = null) {
  editingId.value = cat?.id || null;
  editName.value = cat?.name || '';
  editIcon.value = cat?.icon || '';
  editColor.value = cat?.color || '#22a84d';
  showEditor.value = true;
}

function closeEditor() {
  showEditor.value = false;
  editingId.value = null;
}

async function handleSaveCategory() {
  if (!editName.value.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' });
    return;
  }
  try {
    if (editingId.value) {
      await api.put(`/categories/${editingId.value}`, {
        name: editName.value, icon: editIcon.value || editName.value.slice(0, 1), color: editColor.value,
      });
      uni.showToast({ title: '已修改分类', icon: 'success' });
    } else {
      await api.post('/categories', {
        name: editName.value, icon: editIcon.value || editName.value.slice(0, 1), color: editColor.value,
      });
      uni.showToast({ title: '已添加分类', icon: 'success' });
    }
    closeEditor();
    await loadCategories();
  } catch (e) {}
}

async function handleDelete(cat) {
  uni.showModal({
    title: '确认删除',
    content: `删除分类"${cat.name}"后，相关流水的分类将变为空`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.delete(`/categories/${cat.id}`);
          uni.showToast({ title: '已删除', icon: 'success' });
          await loadCategories();
        } catch (e) {}
      }
    },
  });
}
</script>

<style scoped>
.categories-page {
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

.section-title {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20rpx;
}

.panel-title { font-size: 30rpx; font-weight: 600; }
.add-btn { font-size: 28rpx; color: #22a84d; font-weight: 600; }
.cancel-btn { font-size: 28rpx; color: #737a72; }

.editor { border: 2rpx solid #22a84d; }

.field { display: flex; flex-direction: column; gap: 8rpx; margin-bottom: 16rpx; }
.field.half { flex: 1; }
.label { font-size: 24rpx; color: #737a72; font-weight: 600; }
.field input { height: 80rpx; padding: 0 20rpx; background: #f7f8f6; border-radius: 12rpx; font-size: 28rpx; }

.editor-row { display: flex; gap: 20rpx; }

.color-preview {
  height: 80rpx; border-radius: 12rpx;
  display: flex; align-items: center; justify-content: center;
}

.category-item {
  display: flex; align-items: center; gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.category-item:last-child { border-bottom: none; }

.cat-icon {
  width: 72rpx; height: 72rpx; border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 28rpx; font-weight: 600;
}

.cat-info { flex: 1; }
.cat-name { display: block; font-size: 28rpx; font-weight: 500; }
.cat-amount { display: block; font-size: 22rpx; color: #737a72; margin-top: 4rpx; }

.cat-actions { display: flex; gap: 24rpx; }
.action-link { font-size: 26rpx; color: #22a84d; }
.action-link.danger { color: #ef5f5f; }
</style>
