// ═══════════════════════════════════════════
//  TRANSLATIONS — i18n.js
//  Default language: zh (Chinese)
//  Toggle to: en (English)
// ═══════════════════════════════════════════

const TRANSLATIONS = {

  zh: {
    // ── Header ──────────────────────────────
    siteTitle:       '狼人杀档案',
    siteTagline:     '狼人杀积分记录系统',

    // ── Nav tabs ────────────────────────────
    tabLeaderboard:  '📋 排行榜',
    tabLogGame:      '🎲 记录游戏',
    tabPlayers:      '👤 玩家管理',
    tabHistory:      '📜 历史记录',

    // ── Lang toggle button ───────────────────
    langBtn:         'EN',

    // ── Admin ───────────────────────────────
    blackboxTitle:   '暗箱操作',
    blackboxBadge:   '暗箱操作',
    blackboxReason:  '原因',
    bbCurrentScore:  '当前积分',
    bbDeltaLabel:    '调整积分（正数加分，负数扣分）',
    bbReasonLabel:   '原因备注（可选）',
    bbReasonPh:      '例：特别奖励',
    bbConfirmBtn:    '确认调整',
    toastBBSaved:    (name, delta) => `${name} 的积分已调整 ${delta}。`,
    toastBBNoDelta:  '请输入一个非零的调整数值。',
        adminBadge:      '⚙️ 管理员',
    adminLockTitle:  '管理员登录',
    adminUnlockTitle:'管理员模式',
    adminModalTitle: '管理员登录',
    adminModalDesc:  '请输入管理员密码以解锁编辑功能。',
    adminPasswordPh: '密码…',
    adminUnlockBtn:  '解锁',
    adminCancelBtn:  '取消',
    adminError:      '密码错误，请重试。',
    adminLockToast:  '管理员模式已锁定。',
    adminUnlockToast:'管理员模式已解锁。欢迎回来，上帝。',
    adminLockHint:   '锁定管理员模式',
    adminLoginHint:  '管理员登录',

    // ── Leaderboard ─────────────────────────
    leaderboardTitle:    '排行榜',
    leaderboardSubtitle: '按总分排序',
    leaderboardEmpty:    '暂无玩家。请在"玩家管理"中添加玩家。',
    colRank:    '#',
    colPlayer:  '玩家',
    colScore:   '积分',
    colPlayed:  '出战',
    colWatched: '围观',
    colWinRate: '胜率',
    colWins:    '胜',
    colLosses:  '败',

    // ── Log Game ────────────────────────────
    logGameTitle:    '记录游戏',
    logGameSubtitle: '记录本局选手的结果',
    labelDate:       '日期',
    labelNotes:      '备注（可选）',
    notesPh:         '例：周五晚 第3局',
    labelDoubleScore:  '双倍积分',
    doubleScoreDesc:   '本局所有积分 ×2',
    badgeDouble:       '×2',
    step1Label:      '第一步 — 选择游戏模式',
    step2Label:      '第二步 — 为每个角色分配玩家',
    mvpStepLabel: '最佳MVP（可选）',
    mvpDesc:      '若MVP所在阵营获胜，将额外获得5积分。',
    mvpNone:      '— 不设MVP —',
        step3Label:      '第三步 — 哪一方获胜？',
    stepCoupleLabel: '第二点五步 — 木星选择情侣',
    coupleDesc:      '木星选择两名玩家组成情侣。若情侣为一狼一民，则增加第三胜利条件。',
    couplePlayer1:   '情侣玩家 1',
    couplePlayer2:   '情侣玩家 2',
    coupleSelectPh:  '— 选择玩家 —',
    coupleWins:      '情侣获胜',
    coupleMixed:     '⚠️ 混合情侣 — 情侣胜利条件已启用',
    coupleSameSide:  '✓ 同阵营情侣 — 无额外胜利条件',
    toastSelectCouple:    '木星模式需要选择两名情侣玩家。',
    toastCoupleSamePlayer:'情侣必须是两名不同的玩家。',
    changeModeBtn:   '← 返回选模式',
    watchersTitle:   '围观（可选）',
    addWatcherBtn:   '+ 添加围观者',
    saveGameBtn:     '保存游戏',
    savingBtn:       '保存中…',
    winsLabel:       '获胜',
    assignPh:        '— 选择玩家 —',
    addNewPlayer:    '➕ 添加新玩家…',
    watcherPh:       '— 选择围观者 —',

    // ── Game Modes ───────────────────────────
    modeCustom:      '自定义',
    modeCustomDesc:  '12人 · 自定义角色',
    customWolfCountLabel:    '坏人人数',
    customVillageCountLabel: '好人人数',
    customTotalLabel:        '总人数',
    customVillainSideBase:   '🐺 坏人阵营',
    customVillageSideBase:   '🏘 好人阵营',
    customPeopleSuffix:      '人',
        customVillainSide: '🐺 坏人阵营（4人）',
    customVillageSide: '🏘 好人阵营（8人）',
    customRolePh:    '角色名称（可选）',
    customRoleDefault: '未知角色',
        modeShouMuRen:      '守墓人',
    modeShouMuRenDesc:  '12人 · 特殊守卫角色',
    modeNormal12:       '标准 · 12人',
    modeNormal12Desc:   '12人 · 经典配置',
    modeNormal9:        '标准 · 9人',
    modeNormal9Desc:    '9人 · 小局游戏',
    modeWhiteWolf:      '白狼王',
    modeWhiteWolfDesc:  '8人 · 狼中有狼',
    modeJupiter:        '丘比特',
    modeJupiterDesc:    '12人 · 外来势力',

    // ── Sides ───────────────────────────────
    sideWolf:       '🐺 狼人阵营',
    sideVillage:    '🏘 村民阵营',
    sideJupiter:    '⚡ 丘比特阵营',

    // ── Roles ───────────────────────────────
    roleWerewolf:     '狼人',
    roleHeadWolf:     '石像鬼',
    roleProphet:'预言家',
    roleShouMuRen:    '守墓人',
    roleHunter:       '猎人',
    roleWitch:        '女巫',
    rolePeasant:      '平民',
    roleGuard:        '守卫',
    roleWhiteWolf:    '白狼王',
    roleKnight:       '骑士',
    roleJupiter:      '丘比特',

    // ── Players tab ─────────────────────────
    randomPlayerLabel:  '路人（不计入排行榜）',
    randomBadge:        '路人',
    toggleRandomTitle:  '切换路人状态',
    toastMarkedRandom:  (name) => `${name} 已标记为路人，不再计入排行榜。`,
    toastUnmarkedRandom:(name) => `${name} 已恢复为正式玩家，将计入排行榜。`,
    renamePlayerTitle:  '重命名玩家',
    renamePlayerDesc:   '输入新的名称。此更改将应用于所有记录。',
    renameConfirmBtn:   '保存',
    toastPlayerRenamed: '玩家名称已更新。',
        playersTitle:    '玩家管理',
    playersSubtitle: '管理你的小组',
    newPlayerLabel:  '新玩家名称',
    newPlayerPh:     '输入名称…',
    addPlayerBtn:    '添加玩家',
    playersEmpty:    '暂无玩家。',
    playerCardStats: (games, score, wr) => `${games} 局 · ${score} 分 · 胜率 ${wr}%`,
    removePlayerTitle: '移除玩家',

    // ── Quick-add modal ──────────────────────
    quickAddTitle:   '添加新玩家',
    quickAddDesc:    '该玩家尚未录入系统，请输入名称以添加。',
    quickAddPh:      '玩家名称…',
    quickAddConfirm: '添加并选择',
    quickAddCancel:  '取消',

    // ── History tab ─────────────────────────
    historyTitle:    '历史记录',
    historySubtitle: '所有已记录的游戏',
    historyEmpty:    '暂无游戏记录。',
    historyPlayed:   (n) => `${n} 人出战`,
    historyWatched:  (n) => `${n} 人旁观`,
    historySummary:  (p, w) => `${p} 人出战 · ${w} 人旁观`,
    colRole:         '角色',
    colSide:         '阵营',
    colOutcome:      '结果',
    colPts:          '积分',
    editGameBtn:      '编辑',
    updateGameBtn:    '更新游戏',
    toastGameUpdated: '游戏记录已更新！',
    toastEditingGame: '正在编辑游戏记录，修改后点击"更新游戏"保存。',
        deleteGameBtn:   '删除本局',

    // ── Confirm modal ────────────────────────
    confirmBtn:      '确认',
    cancelBtn:       '取消',
    deleteGameTitle: '删除游戏',
    deleteGameMsg:   (date) => `确定要删除 ${date} 的游戏记录吗？此操作不可撤销。`,
    removePlayerMsg: (name, hasGames) => hasGames
      ? `${name} 已有游戏记录，移除后其参与记录也将被删除。确定继续吗？`
      : `确定将 ${name} 从名单中移除吗？`,

    // ── Badges ──────────────────────────────
    badgeWon:    '胜',
    badgeLost:   '败',
    badgeWatch:  '旁观',
    badgeDeleted:'已删除',

    // ── Toasts & banners ────────────────────
    toastCloudFail:     '⚠️ 云端保存失败，已保存到本地。',
    toastGameSaved:     '游戏已保存！档案已更新。',
    toastGameSaveErr:   '保存游戏时出错，请查看控制台。',
    toastGameDeleted:   '游戏已删除。',
    toastPlayerAdded:   (name) => `${name} 已加入家族。`,
    toastPlayerRemoved: '玩家已移除。',
    toastEnterName:     '请输入名称。',
    toastNameExists:    '该名称已存在。',
    toastSelectDate:    '请选择日期。',
    toastSelectMode:    '请选择游戏模式。',
    toastSelectWinner:  '请选择获胜方。',
    toastAssignAll:     '请为每个角色分配玩家。',
    toastDuplicate:     (name) => `${name} 被分配到了多个角色。`,
    toastBothWatchPlay: (name) => `${name} 不能同时出战和旁观。`,
    bannerConnected:    '☁️  已连接至 Supabase，数据可跨设备同步。',
    bannerSupabaseErr:  '⚠️  Supabase 连接失败，已切换至本地存储。',
    bannerLocalMode:    '💾  本地模式运行中。请在 supabase.js 中配置 Supabase 以同步数据。',
  },

  // ─────────────────────────────────────────
  en: {
    siteTitle:       'THE MAFIA RECORDS',
    siteTagline:     'Mafia Game Statistics Tracker',

    tabLeaderboard:  '📋 Leaderboard',
    tabLogGame:      '🎲 Log a Game',
    tabPlayers:      '👤 Players',
    tabHistory:      '📜 Game History',

    langBtn:         '中文',

    blackboxTitle:   'Black Box',
    blackboxBadge:   'Black Box',
    blackboxReason:  'Reason',
    bbCurrentScore:  'Current Score',
    bbDeltaLabel:    'Point adjustment (positive to add, negative to subtract)',
    bbReasonLabel:   'Reason (optional)',
    bbReasonPh:      'e.g. Special bonus',
    bbConfirmBtn:    'Apply Adjustment',
    toastBBSaved:    (name, delta) => `${name}'s score adjusted by ${delta}.`,
    toastBBNoDelta:  'Please enter a non-zero adjustment value.',
        adminBadge:      '⚙️ Admin',
    adminLockTitle:  'Admin Mode',
    adminUnlockTitle:'Admin Mode',
    adminModalTitle: 'Admin Login',
    adminModalDesc:  'Enter the admin password to unlock editing features.',
    adminPasswordPh: 'Password…',
    adminUnlockBtn:  'Unlock',
    adminCancelBtn:  'Cancel',
    adminError:      'Incorrect password. Try again.',
    adminLockToast:  'Admin mode locked.',
    adminUnlockToast:'Admin mode unlocked. Welcome back, Judge.',
    adminLockHint:   'Lock admin mode',
    adminLoginHint:  'Admin login',

    leaderboardTitle:    'LEADERBOARD',
    leaderboardSubtitle: 'Sorted by total score',
    leaderboardEmpty:    'No players yet. Add players in the Players tab.',
    colRank:    '#',
    colPlayer:  'Player',
    colScore:   'Score',
    colPlayed:  'Played',
    colWatched: 'Watched',
    colWinRate: 'Win Rate',
    colWins:    'Wins',
    colLosses:  'Losses',

    logGameTitle:    'LOG A GAME',
    logGameSubtitle: 'Record results for all participants',
    labelDate:       'Date',
    labelNotes:      'Session Notes (optional)',
    notesPh:         'e.g. Friday night game #3',
    labelDoubleScore:  'Double Score',
    doubleScoreDesc:   'All points ×2 for this game',
    badgeDouble:       '×2',
    step1Label:      'STEP 1 — Select a game mode',
    step2Label:      'STEP 2 — Assign players to each role',
    mvpStepLabel: 'MVP (optional)',
    mvpDesc:      'If the MVP\'s side wins, they receive 5 bonus points.',
    mvpNone:      '— No MVP —',
        step3Label:      'STEP 3 — Who won?',
    stepCoupleLabel: 'STEP 2.5 — Jupiter selects a couple',
    coupleDesc:      'Jupiter picks 2 players to form a couple. If they are from opposite sides, a third win condition is unlocked.',
    couplePlayer1:   'Couple Player 1',
    couplePlayer2:   'Couple Player 2',
    coupleSelectPh:  '— Select player —',
    coupleWins:      'Couple Wins',
    coupleMixed:     '⚠️ Mixed couple — Couple win condition enabled',
    coupleSameSide:  '✓ Same-side couple — No extra win condition',
    toastSelectCouple:    "Please select 2 players for Jupiter's couple.",
    toastCoupleSamePlayer:'The couple must be 2 different players.',
    changeModeBtn:   '← Change Mode',
    watchersTitle:   'Watchers (optional)',
    addWatcherBtn:   '+ Add Watcher',
    saveGameBtn:     'Save Game',
    savingBtn:       'Saving…',
    winsLabel:       'wins',
    assignPh:        '— Assign player —',
    addNewPlayer:    '➕ Add new player…',
    watcherPh:       '— Select watcher —',

    modeCustom:      'Custom',
    modeCustomDesc:  '12 players · Custom roles',
    customWolfCountLabel:    'Villain Count',
    customVillageCountLabel: 'Villager Count',
    customTotalLabel:        'Total Players',
    customVillainSideBase:   '🐺 Villain Side',
    customVillageSideBase:   '🏘 Village Side',
    customPeopleSuffix:      '',
        customVillainSide: '🐺 Villain Side (4 players)',
    customVillageSide: '🏘 Village Side (8 players)',
    customRolePh:    'Role name (optional)',
    customRoleDefault: 'Unknown Role',
        modeShouMuRen:      'Tomb Keeper',
    modeShouMuRenDesc:  '12 players · Special guardian role',
    modeNormal12:       'Normal · 12P',
    modeNormal12Desc:   '12 players · Classic setup',
    modeNormal9:        'Normal · 9P',
    modeNormal9Desc:    '9 players · Smaller game',
    modeWhiteWolf:      'White Wolf',
    modeWhiteWolfDesc:  '8 players · Wolf among wolves',
    modeJupiter:        'Jupiter',
    modeJupiterDesc:    '12 players · Alien faction',

    sideWolf:       '🐺 Wolf Side',
    sideVillage:    '🏘 Village Side',

    roleWerewolf:     'Werewolf',
    roleHeadWolf:     'Gargoyle',
    roleProphet:      'Prophet',
    roleShouMuRen:    'Tomb Keeper',
    roleHunter:       'Hunter',
    roleWitch:        'Witch',
    rolePeasant:      'Peasant',
    roleGuard:        'Guard',
    roleWhiteWolf:    'WhiteWolf',
    roleKnight:       'Knight',
    roleJupiter:      'Jupiter',

    randomPlayerLabel:  'Random (excluded from leaderboard)',
    randomBadge:        'Random',
    toggleRandomTitle:  'Toggle random status',
    toastMarkedRandom:  (name) => `${name} marked as random — excluded from leaderboard.`,
    toastUnmarkedRandom:(name) => `${name} restored as a regular player — now on leaderboard.`,
    renamePlayerTitle:  'Rename Player',
    renamePlayerDesc:   'Enter a new name. This will apply to all records.',
    renameConfirmBtn:   'Save',
    toastPlayerRenamed: 'Player name updated.',
        playersTitle:    'PLAYERS',
    playersSubtitle: 'Manage your group',
    newPlayerLabel:  'New Player Name',
    newPlayerPh:     'Enter name…',
    addPlayerBtn:    'Add Player',
    playersEmpty:    'No players added yet.',
    playerCardStats: (games, score, wr) => `${games} games · ${score} pts · ${wr}% win rate`,
    removePlayerTitle: 'Remove Player',

    quickAddTitle:   'Add New Player',
    quickAddDesc:    "This person isn't in the system yet. Enter their name to add them.",
    quickAddPh:      'Player name…',
    quickAddConfirm: 'Add & Select',
    quickAddCancel:  'Cancel',

    historyTitle:    'GAME HISTORY',
    historySubtitle: 'All recorded sessions',
    historyEmpty:    'No games logged yet.',
    historyPlayed:   (n) => `${n} played`,
    historyWatched:  (n) => `${n} watched`,
    historySummary:  (p, w) => `${p} played · ${w} watched`,
    colRole:         'Role',
    colSide:         'Side',
    colOutcome:      'Outcome',
    colPts:          'Pts',
    editGameBtn:      'Edit',
    updateGameBtn:    'Update Game',
    toastGameUpdated: 'Game record updated!',
    toastEditingGame: 'Editing game record — make changes then click "Update Game" to save.',
        deleteGameBtn:   'Delete Game',

    confirmBtn:      'Confirm',
    cancelBtn:       'Cancel',
    deleteGameTitle: 'Delete Game',
    deleteGameMsg:   (date) => `Delete the game from ${date}? This cannot be undone.`,
    removePlayerMsg: (name, hasGames) => hasGames
      ? `${name} has recorded games. Removing them will delete their participation records. Are you sure?`
      : `Remove ${name} from the roster?`,

    badgeWon:    'Won',
    badgeLost:   'Lost',
    badgeWatch:  'Watched',
    badgeDeleted:'Deleted',

    toastCloudFail:     '⚠️ Cloud save failed — saved locally instead.',
    toastGameSaved:     'Game saved! The family records have been updated.',
    toastGameSaveErr:   'Error saving game. Check console.',
    toastGameDeleted:   'Game deleted.',
    toastPlayerAdded:   (name) => `${name} added to the family.`,
    toastPlayerRemoved: 'Player removed.',
    toastEnterName:     'Please enter a name.',
    toastNameExists:    'A player with that name already exists.',
    toastSelectDate:    'Please select a date.',
    toastSelectMode:    'Please select a game mode.',
    toastSelectWinner:  'Please select the winning side.',
    toastAssignAll:     'Please assign a player to every role.',
    toastDuplicate:     (name) => `${name} is assigned to more than one role.`,
    toastBothWatchPlay: (name) => `${name} is both playing and watching.`,
    bannerConnected:    '☁️  Connected to Supabase — data is shared across all devices.',
    bannerSupabaseErr:  '⚠️  Supabase error — falling back to local storage.',
    bannerLocalMode:    '💾  Running in local mode. Configure Supabase in supabase.js to share data.',
  },
};

// ─── Active language ─────────────────────────
let currentLang = localStorage.getItem('mafiaLang') || 'zh';

function t(key, ...args) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.zh;
  const val  = dict[key];
  if (val === undefined) {
    // Fallback to English
    const fallback = TRANSLATIONS.en[key];
    if (fallback === undefined) return key;
    return typeof fallback === 'function' ? fallback(...args) : fallback;
  }
  return typeof val === 'function' ? val(...args) : val;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('mafiaLang', lang);
}

// ─── Role key lookup (canonical English → translation key) ───
const ROLE_KEY_MAP = {
  'Werewolf':      'roleWerewolf',
  'HeadWolf':      'roleHeadWolf',
  'Prophet':       'roleProphet',
  'TombKeeper':    'roleShouMuRen',
  'Hunter':        'roleHunter',
  'Witch':         'roleWitch',
  'Peasant':       'rolePeasant',
  'Guard':         'roleGuard',
  'WhiteWolf':     'roleWhiteWolf',
  'Knight':        'roleKnight',
  'Jupiter':       'roleJupiter',
};

function tRole(englishRole) {
  const key = ROLE_KEY_MAP[englishRole];
  return key ? t(key) : englishRole;
}

// ─── Side key lookup ─────────────────────────
const SIDE_KEY_MAP = {
  'wolf':      'sideWolf',
  'village':   'sideVillage',
};

function tSide(sideId) {
  const key = SIDE_KEY_MAP[sideId];
  return key ? t(key) : sideId;
}

// ─── Mode label lookup ───────────────────────
const MODE_LABEL_MAP = {
  'TombKeeper': 'modeShouMuRen',
  'Custom':     'modeCustom',
  'Normal12':  'modeNormal12',
  'Normal9':   'modeNormal9',
  'WhiteWolf': 'modeWhiteWolf',
  'Jupiter':   'modeJupiter',
};

function tMode(modeKey) {
  const key = MODE_LABEL_MAP[modeKey];
  return key ? t(key) : modeKey;
}