const transactions = [
  { title: "沙县小吃（晚餐11）", time: "今天 19:32", member: "老婆", amount: -28, color: "#f07a2a", icon: "餐" },
  { title: "永辉超市", time: "今天 17:48", member: "我", amount: -156.8, color: "#23a853", icon: "购" },
  { title: "地铁 3 号线", time: "今天 08:15", member: "我", amount: -6, color: "#2f86df", icon: "行" },
  { title: "房租（6月）", time: "06-01", member: "老婆", amount: -2800, color: "#f4a62a", icon: "房" },
  { title: "工资", time: "05-31", member: "我", amount: 20000, color: "#22a84d", icon: "薪" },
];

const categories = [
  { name: "餐饮", icon: "餐", color: "#22a84d", amount: 3268.5, budget: 4000 },
  { name: "交通", icon: "行", color: "#2f86df", amount: 1987.6, budget: 2500 },
  { name: "日用", icon: "用", color: "#f4a62a", amount: 2694.3, budget: 3000 },
  { name: "房租", icon: "房", color: "#f5be42", amount: 2800, budget: 2800 },
  { name: "医疗", icon: "医", color: "#ef5f5f", amount: 880.4, budget: 1200 },
  { name: "教育", icon: "学", color: "#8c6be8", amount: 1220, budget: 1800 },
  { name: "娱乐", icon: "乐", color: "#ff6f91", amount: 1166.8, budget: 1500 },
  { name: "其他", icon: "其", color: "#a0a7a0", amount: 2200.4, budget: 2600 },
];

const members = [
  { name: "我", amount: 6102.4, percent: 43.2, relation: "本人" },
  { name: "老婆", amount: 4856.3, percent: 34.4, relation: "配偶" },
  { name: "儿子", amount: 1812.6, percent: 12.8, relation: "家庭成员" },
  { name: "女儿", amount: 1346.3, percent: 9.5, relation: "家庭成员" },
];

const monthlyStats = {
  "2026-06": { income: 32680, expense: 14117.6 },
  "2026-05": { income: 30200, expense: 12860.4 },
  "2026-04": { income: 31800, expense: 15320.9 },
};

const assets = [
  { name: "中国邮政储蓄卡", balance: 100, owner: "我", hidden: false },
  { name: "建设银行卡", balance: 3860, owner: "丈夫", hidden: false },
  { name: "招商银行", balance: 1000, owner: "妻子", hidden: false },
];

let selectedCategory = categories[0].name;
let selectedAsset = assets[0].name;
let ledgerType = "expense";
let authMode = "login";
let editingCategoryIndex = null;
let editingAssetIndex = null;
let transferFromAssetIndex = null;
let statsDate = new Date(2026, 5, 1);
let statsMode = "month";
let currentNickname = "我";

const formatMoney = (value) => {
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";
  return `${sign} ¥ ${Math.abs(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPlainMoney = (value) => formatMoney(value).replace("+ ", "");

function getStatsKey() {
  const year = statsDate.getFullYear();
  const month = String(statsDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function renderStatsMonth() {
  const label = document.getElementById("stats-month-label");
  if (label) {
    label.textContent =
      statsMode === "month" ? `${statsDate.getFullYear()}年${statsDate.getMonth() + 1}月` : `${statsDate.getFullYear()}年`;
  }
}

function getCurrentStats() {
  if (statsMode === "month") {
    return monthlyStats[getStatsKey()] || { income: 0, expense: 0 };
  }

  const year = String(statsDate.getFullYear());
  return Object.entries(monthlyStats).reduce(
    (sum, [key, value]) => {
      if (key.startsWith(year)) {
        sum.income += value.income;
        sum.expense += value.expense;
      }
      return sum;
    },
    { income: 0, expense: 0 },
  );
}

function setPage(pageName) {
  document.querySelector(".phone").classList.toggle("auth-mode", ["login", "family-setup"].includes(pageName));

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.dataset.page === pageName);
  });

  document.querySelectorAll(".bottom-nav button[data-go]").forEach((button) => {
    const target = button.dataset.go;
    const isActive = target === pageName || (pageName === "record" && button.classList.contains("nav-add"));
    button.classList.toggle("active", isActive);
  });
}

function setAccountTab(index) {
  const carousel = document.getElementById("account-carousel");
  const slideWidth = carousel?.querySelector(".account-slide")?.getBoundingClientRect().width || 0;
  if (carousel && slideWidth) {
    carousel.scrollTo({ left: index * (slideWidth + 12), behavior: "smooth" });
  }
  document.querySelectorAll("[data-account-tab]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.accountTab) === index);
  });
}

function renderTransactions() {
  const list = document.getElementById("recent-list");
  list.innerHTML = transactions
    .map(
      (item) => `
        <article class="transaction-item">
          <div class="tx-left">
            <span class="tx-icon" style="background:${item.color}">${item.icon}</span>
            <div class="tx-meta">
              <strong>${item.title}</strong>
              <span>${item.time}　${item.member}${item.asset ? ` · ${item.asset}` : ""}</span>
            </div>
          </div>
          <strong class="tx-amount ${item.amount > 0 ? "income" : ""}">${formatMoney(item.amount)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderCategories() {
  const grid = document.getElementById("category-grid");
  grid.innerHTML = categories
    .map(
      (category) => `
        <button class="category-item ${category.name === selectedCategory ? "selected" : ""}" type="button" data-category="${category.name}">
          <span class="category-icon" style="background:${category.color}">${category.icon}</span>
          <span>${category.name}</span>
        </button>
      `,
    )
    .join("");
}

function renderCategoryList() {
  const totalAmount = categories.reduce((sum, category) => sum + category.amount, 0);
  const summary = document.querySelector(".category-summary strong");
  if (summary) {
    summary.textContent = `${categories.length} 个分类`;
  }

  document.getElementById("category-list").innerHTML = categories
    .map(
      (category, index) => `
        <article class="category-manage-item">
          <span class="category-icon" style="background:${category.color}">${category.icon}</span>
          <div>
            <strong>${category.name}</strong>
            <span>本月 ¥ ${category.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} · ${totalAmount ? Math.round((category.amount / totalAmount) * 100) : 0}%</span>
          </div>
          <div class="category-actions">
            <button class="category-action" type="button" data-edit-category="${index}">修改</button>
            <button class="category-action danger" type="button" data-delete-category="${index}">删除</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function openCategoryEditor(index = null) {
  editingCategoryIndex = index;
  const editor = document.getElementById("category-editor");
  const title = document.getElementById("category-editor-title");
  const nameInput = document.getElementById("category-name-input");
  const iconInput = document.getElementById("category-icon-input");
  const colorInput = document.getElementById("category-color-input");
  const category = index === null ? null : categories[index];

  title.textContent = category ? "修改分类" : "添加分类";
  nameInput.value = category?.name || "";
  iconInput.value = category?.icon || "";
  colorInput.value = category?.color || "#22a84d";
  editor.classList.remove("is-hidden");
  nameInput.focus();
}

function closeCategoryEditor() {
  editingCategoryIndex = null;
  document.getElementById("category-editor").classList.add("is-hidden");
  document.getElementById("category-editor").reset();
  document.getElementById("category-color-input").value = "#22a84d";
}

function refreshCategoryViews() {
  renderCategories();
  renderCategoryList();
  renderStats();
}

function renderRecordAccounts() {
  const grid = document.getElementById("record-account-grid");
  if (!grid) {
    return;
  }

  const visibleAssets = assets.filter((asset) => !asset.hidden);
  if ((!selectedAsset || !visibleAssets.some((asset) => asset.name === selectedAsset)) && visibleAssets.length) {
    selectedAsset = visibleAssets[0].name;
  }

  grid.innerHTML = visibleAssets
    .map(
      (asset) => `
        <button class="account-select-item ${asset.name === selectedAsset ? "selected" : ""}" type="button" data-record-asset="${asset.name}">
          <span class="asset-icon">${asset.name.slice(0, 1)}</span>
          <span class="account-select-meta">
            <strong>${asset.name}</strong>
            <span>${formatMoney(asset.balance).replace("+ ", "")}</span>
          </span>
          <span class="account-select-check" aria-hidden="true"></span>
        </button>
      `,
    )
    .join("");
}

function renderStats() {
  renderStatsMonth();
  const currentStats = getCurrentStats();
  const balance = currentStats.income - currentStats.expense;
  const labelPrefix = statsMode === "month" ? "本月" : "本年";
  document.getElementById("stats-expense-label").textContent = `${labelPrefix}支出`;
  document.getElementById("stats-income-label").textContent = `${labelPrefix}收入`;
  document.getElementById("stats-balance-label").textContent = `${labelPrefix}结余`;
  document.getElementById("stats-expense").textContent = formatPlainMoney(currentStats.expense);
  document.getElementById("stats-income").textContent = formatPlainMoney(currentStats.income);
  document.getElementById("stats-balance").textContent = formatPlainMoney(balance);
  document.getElementById("stats-expense-total").textContent = `总支出 ${formatPlainMoney(currentStats.expense)}`;

  const total = categories.reduce((sum, category) => sum + category.amount, 0);
  document.getElementById("legend-list").innerHTML = categories
    .slice(0, 6)
    .map((category) => {
      const percent = Math.round((category.amount / total) * 1000) / 10;
      return `
        <div class="legend-item">
          <span class="dot" style="background:${category.color}"></span>
          <span>${category.name}</span>
          <strong>¥ ${category.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}　${percent}%</strong>
        </div>
      `;
    })
    .join("");

  document.getElementById("member-contrib").innerHTML = members
    .map(
      (member) => `
        <div class="contrib-item">
          <span class="contrib-avatar">${member.name.slice(0, 1)}</span>
          <div>
            <strong>${member.name}</strong>
            <div class="progress"><span style="width:${member.percent}%"></span></div>
          </div>
          <strong>¥ ${member.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</strong>
        </div>
      `,
    )
    .join("");

}

function renderMembers() {
  document.getElementById("member-list").innerHTML = members
    .map(
      (member) => `
        <div class="member-item">
          <div class="member-main">
            <span class="contrib-avatar">${member.name.slice(0, 1)}</span>
            <div class="member-meta">
              <strong>${member.name}</strong>
              <span>${member.relation}</span>
            </div>
          </div>
          <span class="member-amount">本月 ¥ ${member.amount.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}</span>
        </div>
      `,
    )
    .join("");
}

function renderAssets() {
  const visibleAssets = assets
    .map((asset, index) => ({ ...asset, index }))
    .filter((asset) => !asset.hidden);
  const hiddenAssets = assets
    .map((asset, index) => ({ ...asset, index }))
    .filter((asset) => asset.hidden);
  const total = visibleAssets.reduce((sum, asset) => sum + Number(asset.balance || 0), 0);
  const totalText = formatMoney(total).replace("+ ", "");
  const totalAssets = document.getElementById("total-assets");
  const assetsPageTotal = document.getElementById("assets-page-total");
  const assetList = document.getElementById("asset-list");
  const hiddenAssetList = document.getElementById("hidden-asset-list");

  if (totalAssets) {
    totalAssets.textContent = totalText;
  }
  if (assetsPageTotal) {
    assetsPageTotal.textContent = totalText;
  }
  if (!assetList) {
    return;
  }

  assetList.innerHTML = visibleAssets
    .map(
      (asset) => `
        <article class="asset-item">
          <span class="asset-icon">${asset.name.slice(0, 1)}</span>
          <div class="asset-meta">
            <strong>${asset.name}</strong>
            <span>所属人：${asset.owner || "未设置"}</span>
          </div>
          <strong class="asset-amount">${formatMoney(asset.balance).replace("+ ", "")}</strong>
          <div class="asset-actions">
            <button class="asset-icon-button" type="button" data-edit-asset="${asset.index}" aria-label="余额管理" title="余额管理">¥</button>
            <button class="asset-icon-button" type="button" data-transfer-asset="${asset.index}" aria-label="转账" title="转账">⇄</button>
            <button class="asset-icon-button danger" type="button" data-hide-asset="${asset.index}" aria-label="隐藏资产" title="隐藏资产">◡</button>
          </div>
        </article>
      `,
    )
    .join("");

  if (hiddenAssetList) {
    hiddenAssetList.innerHTML = hiddenAssets
      .map(
        (asset) => `
          <article class="asset-item">
            <span class="asset-icon">${asset.name.slice(0, 1)}</span>
            <div class="asset-meta">
              <strong>${asset.name}</strong>
              <span>所属人：${asset.owner || "未设置"}</span>
            </div>
            <strong class="asset-amount muted">${formatMoney(asset.balance).replace("+ ", "")}</strong>
            <div class="asset-actions">
              <button class="asset-icon-button" type="button" data-show-asset="${asset.index}" aria-label="恢复显示" title="恢复显示">◉</button>
            </div>
          </article>
        `,
      )
      .join("");
  }
}

function openAssetEditor(index = null) {
  editingAssetIndex = index;
  const editor = document.getElementById("asset-editor");
  const title = document.getElementById("asset-editor-title");
  const nameInput = document.getElementById("asset-name-input");
  const balanceInput = document.getElementById("asset-balance-input");
  const asset = index === null ? null : assets[index];

  title.textContent = asset ? "余额管理" : "添加资产";
  nameInput.value = asset?.name || "";
  balanceInput.value = asset?.balance ?? "";
  editor.classList.remove("is-hidden");
  nameInput.focus();
}

function closeAssetEditor() {
  editingAssetIndex = null;
  document.getElementById("asset-editor").classList.add("is-hidden");
  document.getElementById("asset-editor").reset();
}

function openTransferEditor(index) {
  transferFromAssetIndex = index;
  const fromAsset = assets[index];
  const editor = document.getElementById("transfer-editor");
  const fromInput = document.getElementById("transfer-from-input");
  const toInput = document.getElementById("transfer-to-input");
  const amountInput = document.getElementById("transfer-amount-input");
  const targets = assets
    .map((asset, assetIndex) => ({ ...asset, assetIndex }))
    .filter((asset) => !asset.hidden && asset.assetIndex !== index);

  if (!targets.length) {
    showToast("暂无可转入账户");
    return;
  }

  fromInput.value = fromAsset?.name || "";
  amountInput.value = "";
  toInput.innerHTML = targets
    .map((asset) => `<option value="${asset.assetIndex}">${asset.name}（${asset.owner || "未设置"}）</option>`)
    .join("");
  editor.classList.remove("is-hidden");
  amountInput.focus();
}

function closeTransferEditor() {
  transferFromAssetIndex = null;
  document.getElementById("transfer-editor").classList.add("is-hidden");
  document.getElementById("transfer-editor").reset();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function applyNickname(nickname) {
  currentNickname = nickname;
  members[0].name = nickname;
  members[0].relation = "我";
  renderMembers();
  renderStats();
}

function getNicknameInput() {
  return document.getElementById("nickname-input").value.trim();
}

document.addEventListener("click", (event) => {
  const goButton = event.target.closest("[data-go]");
  if (goButton) {
    setPage(goButton.dataset.go);
    return;
  }

  const accountTabButton = event.target.closest("[data-account-tab]");
  if (accountTabButton) {
    setAccountTab(Number(accountTabButton.dataset.accountTab));
    return;
  }

  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) {
    selectedCategory = categoryButton.dataset.category;
    renderCategories();
    return;
  }

  const recordAssetButton = event.target.closest("[data-record-asset]");
  if (recordAssetButton) {
    selectedAsset = recordAssetButton.dataset.recordAsset;
    renderRecordAccounts();
    return;
  }

  const typeButton = event.target.closest("[data-ledger-type]");
  if (typeButton) {
    ledgerType = typeButton.dataset.ledgerType;
    document.querySelectorAll("[data-ledger-type]").forEach((button) => {
      button.classList.toggle("selected", button === typeButton);
    });
    return;
  }

  const monthButton = event.target.closest("[data-month]");
  if (monthButton) {
    if (statsMode === "month") {
      statsDate.setMonth(statsDate.getMonth() + Number(monthButton.dataset.month));
    } else {
      statsDate.setFullYear(statsDate.getFullYear() + Number(monthButton.dataset.month));
    }
    renderStats();
    return;
  }

  const statsModeButton = event.target.closest("[data-stats-mode]");
  if (statsModeButton) {
    statsMode = statsModeButton.dataset.statsMode;
    document.querySelectorAll("[data-stats-mode]").forEach((button) => {
      button.classList.toggle("selected", button === statsModeButton);
    });
    renderStats();
    return;
  }

  const authButton = event.target.closest("[data-auth-mode]");
  if (authButton) {
    authMode = authButton.dataset.authMode;
    document.querySelectorAll("[data-auth-mode]").forEach((button) => {
      button.classList.toggle("selected", button === authButton);
    });
    document.getElementById("login-title").textContent = authMode === "login" ? "欢迎回来" : "创建账号";
    document.getElementById("auth-submit").textContent = authMode === "login" ? "登录" : "注册";
    return;
  }

  const createFamilyButton = event.target.closest("#create-family-button");
  if (createFamilyButton) {
    const nickname = getNicknameInput();
    if (!nickname) {
      showToast("请先填写昵称");
      return;
    }
    applyNickname(nickname);
    showToast("已创建家庭");
    setPage("home");
    return;
  }

  const addCategoryButton = event.target.closest("#add-category-button");
  if (addCategoryButton) {
    openCategoryEditor();
    return;
  }

  const cancelCategoryButton = event.target.closest("#cancel-category-button");
  if (cancelCategoryButton) {
    closeCategoryEditor();
    return;
  }

  const editCategoryButton = event.target.closest("[data-edit-category]");
  if (editCategoryButton) {
    openCategoryEditor(Number(editCategoryButton.dataset.editCategory));
    return;
  }

  const deleteCategoryButton = event.target.closest("[data-delete-category]");
  if (deleteCategoryButton) {
    const index = Number(deleteCategoryButton.dataset.deleteCategory);
    const removed = categories[index];
    categories.splice(index, 1);
    if (selectedCategory === removed?.name) {
      selectedCategory = categories[0]?.name || "";
    }
    closeCategoryEditor();
    refreshCategoryViews();
    showToast("已删除分类");
    return;
  }

  const addAssetButton = event.target.closest("#add-asset-button");
  if (addAssetButton) {
    openAssetEditor();
    return;
  }

  const cancelAssetButton = event.target.closest("#cancel-asset-button");
  if (cancelAssetButton) {
    closeAssetEditor();
    return;
  }

  const editAssetButton = event.target.closest("[data-edit-asset]");
  if (editAssetButton) {
    openAssetEditor(Number(editAssetButton.dataset.editAsset));
    return;
  }

  const transferAssetButton = event.target.closest("[data-transfer-asset]");
  if (transferAssetButton) {
    openTransferEditor(Number(transferAssetButton.dataset.transferAsset));
    return;
  }

  const cancelTransferButton = event.target.closest("#cancel-transfer-button");
  if (cancelTransferButton) {
    closeTransferEditor();
    return;
  }

  const hideAssetButton = event.target.closest("[data-hide-asset]");
  if (hideAssetButton) {
    const index = Number(hideAssetButton.dataset.hideAsset);
    assets[index].hidden = true;
    if (selectedAsset === assets[index].name) {
      const nextAsset = assets.find((asset) => !asset.hidden);
      selectedAsset = nextAsset?.name || "";
    }
    renderAssets();
    renderRecordAccounts();
    showToast("已隐藏资产");
    return;
  }

  const showAssetButton = event.target.closest("[data-show-asset]");
  if (showAssetButton) {
    const index = Number(showAssetButton.dataset.showAsset);
    assets[index].hidden = false;
    if (!selectedAsset) {
      selectedAsset = assets[index].name;
    }
    renderAssets();
    renderRecordAccounts();
    showToast("已恢复资产");
  }
});

document.getElementById("auth-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const phone = document.getElementById("phone-input").value.trim();
  const password = document.getElementById("password-input").value.trim();

  if (!/^1\d{10}$/.test(phone)) {
    showToast("请输入正确手机号");
    return;
  }

  if (password.length < 6) {
    showToast("密码至少 6 位");
    return;
  }

  showToast(authMode === "login" ? "登录成功" : "注册成功");
  setPage(authMode === "login" ? "home" : "family-setup");
});

document.getElementById("family-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const nickname = getNicknameInput();
  const inviteCode = document.getElementById("invite-code-input").value.trim();

  if (!nickname) {
    showToast("请先填写昵称");
    return;
  }

  if (!inviteCode) {
    showToast("请输入邀请码");
    return;
  }

  applyNickname(nickname);
  showToast("已加入家庭");
  setPage("home");
});

document.getElementById("record-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById("amount-input").value || 0);
  if (!amount) {
    showToast("请输入金额");
    return;
  }

  const note = document.getElementById("note-input").value.trim();
  const category = categories.find((item) => item.name === selectedCategory) || categories[0];
  transactions.unshift({
    title: note || category.name,
    time: "刚刚",
    member: currentNickname,
    asset: selectedAsset,
    amount: ledgerType === "income" ? amount : -amount,
    color: category.color,
    icon: category.icon,
  });

  renderTransactions();
  showToast("已保存到家庭账本");
  setPage("home");
});

document.getElementById("category-editor").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("category-name-input").value.trim();
  const icon = document.getElementById("category-icon-input").value.trim();
  const color = document.getElementById("category-color-input").value || "#22a84d";

  if (!name) {
    showToast("请输入分类名称");
    return;
  }

  const duplicate = categories.some((category, index) => category.name === name && index !== editingCategoryIndex);
  if (duplicate) {
    showToast("分类名称已存在");
    return;
  }

  if (editingCategoryIndex === null) {
    categories.push({
      name,
      icon: icon || name.slice(0, 1),
      color,
      amount: 0,
      budget: 0,
    });
    selectedCategory = name;
    showToast("已添加分类");
  } else {
    const oldName = categories[editingCategoryIndex].name;
    categories[editingCategoryIndex] = {
      ...categories[editingCategoryIndex],
      name,
      icon: icon || name.slice(0, 1),
      color,
    };
    if (selectedCategory === oldName) {
      selectedCategory = name;
    }
    showToast("已修改分类");
  }

  closeCategoryEditor();
  refreshCategoryViews();
});

document.getElementById("asset-editor").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("asset-name-input").value.trim();
  const balance = Number(document.getElementById("asset-balance-input").value || 0);

  if (!name) {
    showToast("请输入资产名称");
    return;
  }

  if (balance < 0) {
    showToast("资产金额不能小于 0");
    return;
  }

  if (editingAssetIndex === null) {
    assets.push({ name, balance, owner: "我", hidden: false });
    selectedAsset = name;
    showToast("已添加资产");
  } else {
    const oldName = assets[editingAssetIndex].name;
    assets[editingAssetIndex] = { ...assets[editingAssetIndex], name, balance };
    if (selectedAsset === oldName) {
      selectedAsset = name;
    }
    showToast("已更新余额");
  }

  closeAssetEditor();
  renderAssets();
  renderRecordAccounts();
});

document.getElementById("transfer-editor").addEventListener("submit", (event) => {
  event.preventDefault();
  const fromIndex = transferFromAssetIndex;
  const toIndex = Number(document.getElementById("transfer-to-input").value);
  const amount = Number(document.getElementById("transfer-amount-input").value || 0);
  const fromAsset = assets[fromIndex];
  const toAsset = assets[toIndex];

  if (!fromAsset || !toAsset || fromIndex === toIndex) {
    showToast("请选择有效账户");
    return;
  }

  if (amount <= 0) {
    showToast("请输入转账金额");
    return;
  }

  if (amount > Number(fromAsset.balance || 0)) {
    showToast("转出账户余额不足");
    return;
  }

  fromAsset.balance = Number(fromAsset.balance || 0) - amount;
  toAsset.balance = Number(toAsset.balance || 0) + amount;
  transactions.unshift({
    title: "资产转账",
    time: "刚刚",
    member: fromAsset.owner || "我",
    asset: `${fromAsset.name} → ${toAsset.name}`,
    amount: 0,
    color: "#2f86df",
    icon: "转",
  });

  closeTransferEditor();
  renderAssets();
  renderRecordAccounts();
  renderTransactions();
  showToast("转账成功");
});

document.getElementById("account-carousel").addEventListener("scroll", (event) => {
  const carousel = event.currentTarget;
  const slideWidth = carousel.querySelector(".account-slide")?.getBoundingClientRect().width || 1;
  const index = Math.round(carousel.scrollLeft / (slideWidth + 12));
  document.querySelectorAll("[data-account-tab]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.accountTab) === index);
  });
});

renderTransactions();
renderCategories();
renderCategoryList();
renderRecordAccounts();
renderStats();
renderMembers();
renderAssets();
