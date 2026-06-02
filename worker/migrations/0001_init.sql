-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 家庭表
CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 家庭成员表
CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES families(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    nickname TEXT NOT NULL,
    relation TEXT DEFAULT '家庭成员',
    role TEXT DEFAULT 'member',
    joined_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(family_id, user_id)
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES families(id),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 资产表
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES families(id),
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    owner_nickname TEXT NOT NULL,
    hidden INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 流水表
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES families(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    member_nickname TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
    amount REAL NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    asset_id INTEGER REFERENCES assets(id),
    transfer_to_asset_id INTEGER REFERENCES assets(id),
    note TEXT,
    transaction_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_transactions_family_date ON transactions(family_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_family_category ON transactions(family_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_family_member ON transactions(family_id, member_nickname);
CREATE INDEX IF NOT EXISTS idx_categories_family ON categories(family_id);
CREATE INDEX IF NOT EXISTS idx_assets_family ON assets(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
