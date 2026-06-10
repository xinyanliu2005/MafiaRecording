// ═══════════════════════════════════════════
//  MAFIA STATS TRACKER — app.js
// ═══════════════════════════════════════════

// ─── Admin password — change this to whatever you want ───
const ADMIN_PASSWORD = 'hcx';

// ─── Admin session (lives in sessionStorage — clears when tab closes) ───
let isAdmin = sessionStorage.getItem('mafiaAdmin') === 'yes';

// ─── Scoring ─────────────────────────────────
const SCORE = { WIN: 25, LOSS: 17, WATCH: 15 };

// ─── Game Mode Definitions ───────────────────
// Each mode defines sides[], each side has a label, color, and roles[]
// roles[] entries: { role: string, count: number }
const GAME_MODES = {
  TombKeeper: {
    label: 'TombKeeper',
    sides: [
      {
        id: 'wolf', label: '🐺 Wolf Side', color: 'side-wolf',
        roles: [
          { role: 'Werewolf',   count: 3 },
          { role: 'HeadWolf',   count: 1 },
        ],
      },
      {
        id: 'village', label: '🏘 Village Side', color: 'side-village',
        roles: [
          { role: 'Prophet', count: 1 },
          { role: 'TombKeeper',     count: 1 },
          { role: 'Hunter',        count: 1 },
          { role: 'Witch',         count: 1 },
          { role: 'Peasant',       count: 4 },
        ],
      },
    ],
  },

  Normal12: {
    label: 'Normal (12P)',
    sides: [
      {
        id: 'wolf', label: '🐺 Wolf Side', color: 'side-wolf',
        roles: [
          { role: 'Werewolf', count: 4 },
        ],
      },
      {
        id: 'village', label: '🏘 Village Side', color: 'side-village',
        roles: [
          { role: 'Prophet', count: 1 },
          { role: 'Witch',         count: 1 },
          { role: 'Hunter',        count: 1 },
          { role: 'Guard',         count: 1 },
          { role: 'Peasant',       count: 4 },
        ],
      },
    ],
  },

  Normal9: {
    label: 'Normal (9P)',
    sides: [
      {
        id: 'wolf', label: '🐺 Wolf Side', color: 'side-wolf',
        roles: [
          { role: 'Werewolf', count: 3 },
        ],
      },
      {
        id: 'village', label: '🏘 Village Side', color: 'side-village',
        roles: [
          { role: 'Prophet', count: 1 },
          { role: 'Witch',         count: 1 },
          { role: 'Hunter',        count: 1 },
          { role: 'Peasant',       count: 3 },
        ],
      },
    ],
  },

  WhiteWolf: {
    label: 'White Wolf',
    sides: [
      {
        id: 'wolf', label: '🐺 Wolf Side', color: 'side-wolf',
        roles: [
          { role: 'Werewolf',  count: 3 },
        ],
      },
      {
        id: 'whitewolf', label: '🤍 White Wolf', color: 'side-whitewolf',
        roles: [
          { role: 'WhiteWolf', count: 1 },
        ],
      },
      {
        id: 'village', label: '🏘 Village Side', color: 'side-village',
        roles: [
          { role: 'Prophet', count: 1 },
          { role: 'Knight',        count: 1 },
          { role: 'Guard',         count: 1 },
          { role: 'Witch',         count: 1 },
        ],
      },
    ],
  },

  Jupiter: {
    label: 'Jupiter',
    sides: [
      {
        id: 'wolf', label: '🐺 Wolf Side', color: 'side-wolf',
        roles: [
          { role: 'Werewolf', count: 4 },
        ],
      },
      {
        id: 'jupiter', label: '⚡ Jupiter Side', color: 'side-jupiter',
        roles: [
          { role: 'Jupiter', count: 1 },
        ],
      },
      {
        id: 'village', label: '🏘 Village Side', color: 'side-village',
        roles: [
          { role: 'Prophet', count: 1 },
          { role: 'Witch',         count: 1 },
          { role: 'Hunter',        count: 1 },
          { role: 'Peasant',       count: 4 },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let state = {
  players: [],  // { id, name }
  games:   [],  // { id, date, notes, mode, participants: [{ playerId, status, role, sideId, outcome }] }
};

// Current game-logging session
let activeMode   = null;  // key in GAME_MODES
let selectedWinner = null; // sideId string
let watcherCount = 0;

// ═══════════════════════════════════════════
//  PERSISTENCE — Supabase + localStorage fallback
// ═══════════════════════════════════════════
async function loadState() {
  if (isSupabaseConfigured()) {
    try {
      const [players, games, participants] = await Promise.all([
        sb.select('players', { order: 'name.asc' }),
        sb.select('games',   { order: 'date.desc,created_at.desc' }),
        sb.select('participants'),
      ]);

      // Attach participants to their games
      state.players = players;
      state.games   = games.map(g => ({
        ...g,
        participants: participants.filter(p => p.game_id === g.id),
      }));

      showBanner(t('bannerConnected'), 'info');
    } catch (err) {
      console.error('Supabase load error:', err);
      showBanner(t('bannerSupabaseErr'), 'warn');
      loadLocalState();
    }
  } else {
    loadLocalState();
    showBanner(t('bannerLocalMode'), 'warn');
  }
}

function loadLocalState() {
  try {
    const saved = localStorage.getItem('mafiaStats');
    if (saved) state = JSON.parse(saved);
  } catch (e) { /* ignore */ }
}

async function saveGame(game) {
  if (isSupabaseConfigured()) {
    try {
      // Insert game row
      const [inserted] = await sb.insert('games', {
        id:           game.id,
        date:         game.date,
        notes:        game.notes        || null,
        mode:         game.mode         || null,
        double_score: game.doubleScore  || false,
      });
      const gameId = inserted.id;

      // Insert all participants
      const rows = game.participants.map(p => ({
        game_id:   gameId,
        player_id: p.playerId,
        status:    p.status,
        role:      p.role    || null,
        side_id:   p.sideId  || null,
        outcome:   p.outcome || null,
      }));
      await sb.insert('participants', rows);

      return gameId;
    } catch (err) {
      console.error('Supabase save error:', err);
      toast(t('toastCloudFail'));
    }
  }
  // Fallback: localStorage
  state.games.unshift(game);
  localStorage.setItem('mafiaStats', JSON.stringify(state));
  return game.id;
}

async function savePlayer(player) {
  if (isSupabaseConfigured()) {
    try {
      const [inserted] = await sb.insert('players', { id: player.id, name: player.name });
      return inserted;
    } catch (err) {
      console.error('Supabase save error:', err);
      toast(t('toastCloudFail'));
    }
  }
  state.players.push(player);
  localStorage.setItem('mafiaStats', JSON.stringify(state));
  return player;
}

async function deleteGameRemote(gameId) {
  if (isSupabaseConfigured()) {
    try {
      await sb.delete('participants', { game_id: gameId });
      await sb.delete('games',        { id: gameId });
      return;
    } catch (err) {
      console.error('Supabase delete error:', err);
    }
  }
  state.games = state.games.filter(g => g.id !== gameId);
  localStorage.setItem('mafiaStats', JSON.stringify(state));
}

async function deletePlayerRemote(playerId) {
  if (isSupabaseConfigured()) {
    try {
      await sb.delete('participants', { player_id: playerId });
      await sb.delete('players',      { id: playerId });
      return;
    } catch (err) {
      console.error('Supabase delete error:', err);
    }
  }
  state.players = state.players.filter(p => p.id !== playerId);
  state.games.forEach(g => {
    g.participants = g.participants.filter(p => p.playerId !== playerId);
  });
  localStorage.setItem('mafiaStats', JSON.stringify(state));
}

// ═══════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getPlayerById(id) {
  return state.players.find(p => p.id === id);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function computePlayerStats(playerId) {
  let score = 0, wins = 0, losses = 0, watched = 0, played = 0;
  for (const game of state.games) {
    const p = game.participants.find(x => (x.playerId || x.player_id) === playerId);
    if (!p) continue;
    const mult = (game.double_score || game.doubleScore) ? 2 : 1;
    if (p.status === 'watched') {
      score += SCORE.WATCH * mult; watched++;
    } else if (p.status === 'played') {
      played++;
      if (p.outcome === 'won') { score += SCORE.WIN  * mult; wins++; }
      else                     { score += SCORE.LOSS * mult; losses++; }
    }
  }
  const totalGames = wins + losses + watched;
  const winRate    = played > 0 ? Math.round((wins / played) * 100) : 0;
  return { score, wins, losses, watched, played, totalGames, winRate };
}

function getLeaderboard() {
  return state.players
    .map(p => ({ player: p, stats: computePlayerStats(p.id) }))
    .sort((a, b) => b.stats.score - a.stats.score);
}

// ═══════════════════════════════════════════
//  BANNER
// ═══════════════════════════════════════════
function showBanner(msg, type = 'info') {
  let el = document.getElementById('status-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'status-banner';
    document.querySelector('main').prepend(el);
  }
  el.textContent = msg;
  el.className   = `status-banner banner-${type}`;
}

// ═══════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════
let toastTimer = null;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════
//  CONFIRM MODAL
// ═══════════════════════════════════════════
let _modalResolve = null;
function showModal(title, message) {
  return new Promise(resolve => {
    _modalResolve = resolve;
    document.getElementById('modal-title').textContent   = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal-overlay').classList.remove('hidden');
  });
}
document.getElementById('modal-confirm').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.add('hidden');
  if (_modalResolve) _modalResolve(true);
});
document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.add('hidden');
  if (_modalResolve) _modalResolve(false);
});

// ═══════════════════════════════════════════
//  QUICK-ADD PLAYER MODAL
// ═══════════════════════════════════════════
let _quickAddResolve = null;
function showQuickAdd() {
  return new Promise(resolve => {
    _quickAddResolve = resolve;
    document.getElementById('quickadd-name').value = '';
    document.getElementById('quickadd-overlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('quickadd-name').focus(), 50);
  });
}
document.getElementById('quickadd-confirm').addEventListener('click', async () => {
  const name = document.getElementById('quickadd-name').value.trim();
  if (!name) { toast(t('toastEnterName')); return; }
  if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    toast(t('toastNameExists')); return;
  }
  const player = { id: uid(), name };
  const saved  = await savePlayer(player);
  if (!state.players.find(p => p.id === saved.id)) state.players.push(saved);
  document.getElementById('quickadd-overlay').classList.add('hidden');
  refreshAllPlayerSelects();
  if (_quickAddResolve) _quickAddResolve(saved);
});
document.getElementById('quickadd-cancel').addEventListener('click', () => {
  document.getElementById('quickadd-overlay').classList.add('hidden');
  if (_quickAddResolve) _quickAddResolve(null);
});
document.getElementById('quickadd-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('quickadd-confirm').click();
});

// ═══════════════════════════════════════════
//  TAB NAVIGATION
// ═══════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    if (btn.dataset.tab === 'leaderboard') renderLeaderboard();
    if (btn.dataset.tab === 'players')     renderPlayersList();
    if (btn.dataset.tab === 'history')     renderHistory();
  });
});

// ═══════════════════════════════════════════
//  PLAYERS TAB
// ═══════════════════════════════════════════
document.getElementById('add-player-btn').addEventListener('click', async () => {
  const input = document.getElementById('new-player-name');
  const name  = input.value.trim();
  if (!name) { toast(t('toastEnterName')); return; }
  if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    toast(t('toastNameExists')); return;
  }
  const player = { id: uid(), name };
  const saved  = await savePlayer(player);
  if (!state.players.find(p => p.id === saved.id)) state.players.push(saved);
  input.value = '';
  renderPlayersList();
  toast(t('toastPlayerAdded', name));
});
document.getElementById('new-player-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('add-player-btn').click();
});

function renderPlayersList() {
  const container = document.getElementById('players-list-container');
  if (state.players.length === 0) {
    container.innerHTML = `<p class="empty-state">${t('playersEmpty')}</p>`;
    return;
  }
  const sorted = [...state.players].sort((a, b) => a.name.localeCompare(b.name));
  container.innerHTML = `<div class="players-grid">${
    sorted.map(p => {
      const s = computePlayerStats(p.id);
      return `<div class="player-card">
        <div>
          <div class="player-card-name">${esc(p.name)}</div>
          <div class="player-card-stats">${t('playerCardStats', s.totalGames, s.score, s.winRate)}</div>
        </div>
        <button class="btn-icon" title="Remove player" onclick="removePlayer('${p.id}')">🗑</button>
      </div>`;
    }).join('')
  }</div>`;
}

async function removePlayer(id) {
  const player = getPlayerById(id);
  if (!player) return;
  const inGames = state.games.some(g => g.participants.some(p => (p.playerId||p.player_id) === id));
  const msg = t('removePlayerMsg', player.name, inGames);
  const confirmed = await showModal(t('removePlayerTitle'), msg);
  if (!confirmed) return;
  await deletePlayerRemote(id);
  state.players = state.players.filter(p => p.id !== id);
  state.games.forEach(g => { g.participants = g.participants.filter(p => (p.playerId||p.player_id) !== id); });
  renderPlayersList();
  toast(t('toastPlayerRemoved'));
}

// ═══════════════════════════════════════════
//  LOG GAME — MODE SELECTION (Step 1)
// ═══════════════════════════════════════════
document.getElementById('game-date').value = todayISO();

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    const mode = card.dataset.mode;
    activateMode(mode);
  });
});

function activateMode(modeKey) {
  activeMode     = modeKey;
  selectedWinner = null;

  document.getElementById('log-step-mode').style.display   = 'none';
  document.getElementById('log-step-assign').style.display = 'block';
  document.getElementById('active-mode-label').textContent = tMode(modeKey);

  buildRoleAssignmentUI(modeKey);
  buildWinnerButtons(modeKey);
  document.getElementById('watcher-list').innerHTML = '';
  watcherCount = 0;
}

document.getElementById('back-to-mode-btn').addEventListener('click', () => {
  document.getElementById('log-step-assign').style.display  = 'none';
  document.getElementById('log-step-mode').style.display    = 'block';
  // Clear all role/winner/watcher state so the next mode starts completely fresh
  document.getElementById('sides-container').innerHTML       = '';
  document.getElementById('winner-side-container').innerHTML = '';
  document.getElementById('watcher-list').innerHTML          = '';
  activeMode     = null;
  selectedWinner = null;
  watcherCount   = 0;
});

// ═══════════════════════════════════════════
//  ROLE ASSIGNMENT UI (Step 2)
// ═══════════════════════════════════════════
function buildRoleAssignmentUI(modeKey) {
  const mode      = GAME_MODES[modeKey];
  const container = document.getElementById('sides-container');

  container.innerHTML = mode.sides.map(side => {
    const roleRows = side.roles.map(({ role, count }) =>
      Array.from({ length: count }, (_, i) => buildRoleRow(side.id, role, i, count))
    ).flat().join('');

    return `
      <div class="side-block ${side.color}">
        <div class="side-header">${tSide(side.id)}</div>
        <div class="side-roles">${roleRows}</div>
      </div>`;
  }).join('');

  // Wire up "new player" option in every select
  container.querySelectorAll('.player-select').forEach(wirePlayerSelect);
}

function buildRoleRow(sideId, role, index, total) {
  const label = total > 1 ? `${tRole(role)} ${index + 1}` : tRole(role);
  const key   = `${sideId}__${role}__${index}`;
  return `
    <div class="role-row" data-side="${sideId}" data-role="${role}" data-key="${key}">
      <span class="role-label">${label}</span>
      <select class="player-select" data-key="${key}">
        <option value="">${t('assignPh')}</option>
        <option value="__new__">${t('addNewPlayer')}</option>
        ${state.players.map(p =>
          `<option value="${p.id}">${esc(p.name)}</option>`
        ).join('')}
      </select>
    </div>`;
}

function wirePlayerSelect(sel) {
  sel.addEventListener('change', async () => {
    if (sel.value === '__new__') {
      const player = await showQuickAdd();
      if (player) {
        // Refresh all selects and pick the new player in this one
        refreshAllPlayerSelects();
        sel.value = player.id;
      } else {
        sel.value = '';
      }
    }
  });
}

function refreshAllPlayerSelects() {
  document.querySelectorAll('.player-select').forEach(sel => {
    const current = sel.value;
    sel.innerHTML = `
      <option value="">${t('assignPh')}</option>
      <option value="__new__">${t('addNewPlayer')}</option>
      ${state.players.map(p =>
        `<option value="${p.id}" ${p.id === current ? 'selected' : ''}>${esc(p.name)}</option>`
      ).join('')}`;
    wirePlayerSelect(sel);
  });
}

// ═══════════════════════════════════════════
//  WINNER SELECTION (Step 3)
// ═══════════════════════════════════════════
function buildWinnerButtons(modeKey) {
  const mode      = GAME_MODES[modeKey];
  const container = document.getElementById('winner-side-container');
  container.innerHTML = mode.sides.map(side => `
    <button class="winner-btn ${side.color}" data-side="${side.id}"
      onclick="selectWinner('${side.id}', this)">
      ${tSide(side.id)} ${t('winsLabel')}
    </button>`
  ).join('');
}

function selectWinner(sideId, btn) {
  selectedWinner = sideId;
  document.querySelectorAll('.winner-btn').forEach(b => b.classList.remove('winner-active'));
  btn.classList.add('winner-active');
}

// ═══════════════════════════════════════════
//  WATCHERS
// ═══════════════════════════════════════════
document.getElementById('add-watcher-btn').addEventListener('click', () => {
  addWatcherRow();
});

function addWatcherRow() {
  const id   = ++watcherCount;
  const list = document.getElementById('watcher-list');
  const row  = document.createElement('div');
  row.className    = 'watcher-row';
  row.dataset.rowId = id;
  row.innerHTML = `
    <div class="form-group" style="flex:1">
      <select class="player-select watcher-select">
        <option value="">${t('watcherPh')}</option>
        <option value="__new__">${t('addNewPlayer')}</option>
        ${state.players.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
      </select>
    </div>
    <button class="btn-icon" onclick="this.closest('.watcher-row').remove()">✕</button>`;
  list.appendChild(row);
  wirePlayerSelect(row.querySelector('.player-select'));
}

// ═══════════════════════════════════════════
//  SAVE GAME
// ═══════════════════════════════════════════
document.getElementById('save-game-btn').addEventListener('click', async () => {
  const date        = document.getElementById('game-date').value;
  const notes       = document.getElementById('game-notes').value.trim();
  const doubleScore = document.getElementById('double-score-toggle').checked;
  if (!date)        { toast(t('toastSelectDate')); return; }
  if (!activeMode)  { toast(t('toastSelectMode')); return; }
  if (!selectedWinner) { toast(t('toastSelectWinner')); return; }

  // Collect role assignments
  const roleRows   = document.querySelectorAll('#sides-container .role-row');
  const participants = [];
  const seenIds    = new Set();
  let valid        = true;

  roleRows.forEach(row => {
    const sideId   = row.dataset.side;
    const role     = row.dataset.role;
    const playerId = row.querySelector('.player-select').value;

    if (!playerId || playerId === '__new__') {
      toast(t('toastAssignAll'));
      valid = false; return;
    }
    if (seenIds.has(playerId)) {
      const name = getPlayerById(playerId)?.name || 'Someone';
      toast(t('toastDuplicate', name));
      valid = false; return;
    }
    seenIds.add(playerId);

    const outcome = sideId === selectedWinner ? 'won' : 'lost';
    participants.push({ playerId, status: 'played', role, sideId, outcome });
  });

  if (!valid) return;

  // Collect watchers
  document.querySelectorAll('.watcher-select').forEach(sel => {
    const playerId = sel.value;
    if (!playerId || playerId === '__new__') return;
    if (seenIds.has(playerId)) {
      toast(t('toastBothWatchPlay', getPlayerById(playerId)?.name || '?'));
      valid = false; return;
    }
    seenIds.add(playerId);
    participants.push({ playerId, status: 'watched', role: null, sideId: null, outcome: null });
  });

  if (!valid) return;

  const game = { id: uid(), date, notes, mode: activeMode, doubleScore, participants };
  const btn  = document.getElementById('save-game-btn');
  btn.disabled   = true;
  btn.textContent = t('savingBtn');

  try {
    await saveGame(game);
    if (!state.games.find(g => g.id === game.id)) state.games.unshift(game);
    toast(t('toastGameSaved'));
    resetLogForm();
    renderLeaderboard();
  } catch (err) {
    toast(t('toastGameSaveErr'));
    console.error(err);
  } finally {
    btn.disabled   = false;
    btn.textContent = t('saveGameBtn');
  }
});

function resetLogForm() {
  document.getElementById('game-date').value              = todayISO();
  document.getElementById('game-notes').value             = '';
  document.getElementById('double-score-toggle').checked  = false;
  document.getElementById('log-step-assign').style.display = 'none';
  document.getElementById('log-step-mode').style.display   = 'block';
  document.getElementById('sides-container').innerHTML      = '';
  document.getElementById('winner-side-container').innerHTML = '';
  document.getElementById('watcher-list').innerHTML         = '';
  activeMode = null; selectedWinner = null; watcherCount = 0;
}

// ═══════════════════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════════════════
function renderLeaderboard() {
  const container   = document.getElementById('leaderboard-container');
  const leaderboard = getLeaderboard();
  if (leaderboard.length === 0) {
    container.innerHTML = `<p class="empty-state">${t('leaderboardEmpty')}</p>`;
    return;
  }
  const rows = leaderboard.map(({ player, stats }, idx) => {
    const rank      = idx + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
    return `<tr>
      <td><span class="rank-badge ${rankClass}">${rank}</span></td>
      <td class="player-name-cell">${esc(player.name)}</td>
      <td class="num"><span class="score-value">${stats.score}</span></td>
      <td class="num">${stats.played}</td>
      <td class="num">${stats.watched}</td>
      <td>
        <div class="winrate-bar-wrap">
          <div class="winrate-bar"><div class="winrate-fill" style="width:${stats.winRate}%"></div></div>
          <span class="winrate-pct">${stats.played > 0 ? stats.winRate + '%' : '—'}</span>
        </div>
      </td>
      <td class="num">${stats.wins}</td>
      <td class="num">${stats.losses}</td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="leaderboard-table">
      <thead><tr>
        <th>${t('colRank')}</th><th>${t('colPlayer')}</th>
        <th class="num">${t('colScore')}</th><th class="num">${t('colPlayed')}</th>
        <th class="num">${t('colWatched')}</th><th>${t('colWinRate')}</th>
        <th class="num">${t('colWins')}</th><th class="num">${t('colLosses')}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ═══════════════════════════════════════════
//  GAME HISTORY
// ═══════════════════════════════════════════
function renderHistory() {
  const container = document.getElementById('history-container');
  if (state.games.length === 0) {
    container.innerHTML = `<p class="empty-state">${t('historyEmpty')}</p>`;
    return;
  }
  container.innerHTML = state.games.map(game => {
    const played  = game.participants.filter(p => p.status === 'played').length;
    const watched = game.participants.filter(p => p.status === 'watched').length;
    const modeLabel = game.mode ? tMode(game.mode) : '';

    // Group players by side
    const sideMap = {};
    game.participants.forEach(p => {
      if (p.status !== 'played') return;
      const sid = p.sideId || p.side_id || 'unknown';
      if (!sideMap[sid]) sideMap[sid] = [];
      sideMap[sid].push(p);
    });

    const rows = game.participants.map(p => {
      const pid    = p.playerId || p.player_id;
      const player = getPlayerById(pid);
      const name   = player ? esc(player.name) : '<em>Deleted</em>';
      let badge, pts;
      const mult = (game.double_score || game.doubleScore) ? 2 : 1;
      if (p.status === 'watched') {
        badge = `<span class="badge badge-watch">${t('badgeWatch')}</span>`;
        pts   = `+${SCORE.WATCH * mult}`;
      } else if (p.outcome === 'won') {
        badge = `<span class="badge badge-win">${t('badgeWon')}</span>`;
        pts   = `+${SCORE.WIN * mult}`;
      } else {
        badge = `<span class="badge badge-loss">${t('badgeLost')}</span>`;
        pts   = `+${SCORE.LOSS * mult}`;
      }
      const sideLabel = (p.sideId || p.side_id) ? tSide(p.sideId || p.side_id) : '—';
      return `<tr>
        <td>${name}</td>
        <td>${p.role ? tRole(p.role) : '—'}</td>
        <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">${sideLabel}</td>
        <td>${badge}</td>
        <td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gold-dim)">${pts}</td>
      </tr>`;
    }).join('');

    return `
      <div class="history-game" id="game-${game.id}">
        <div class="history-game-header" onclick="toggleHistory('${game.id}')">
          <div class="history-game-title">
            <span class="history-date">${formatDate(game.date)}</span>
            ${modeLabel ? `<span class="badge badge-mode">${esc(modeLabel)}</span>` : ''}
            ${(game.double_score || game.doubleScore) ? `<span class="badge badge-double">${t('badgeDouble')}</span>` : ''}
            ${game.notes ? `<span class="history-notes">${esc(game.notes)}</span>` : ''}
          </div>
          <div class="history-summary">${t('historySummary', played, watched)}</div>
        </div>
        <div class="history-body" id="body-${game.id}" style="display:none">
          <table>
            <thead><tr><th>${t('colPlayer')}</th><th>${t('colRole')}</th><th>${t('colSide')}</th><th>${t('colOutcome')}</th><th>${t('colPts')}</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="history-actions admin-action" style="display:${isAdmin?'':'none'}">
            <button class="btn btn-danger" onclick="deleteGame('${game.id}')">${t('deleteGameBtn')}</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function toggleHistory(gameId) {
  const body = document.getElementById(`body-${gameId}`);
  if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

async function deleteGame(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;
  const confirmed = await showModal(
    t('deleteGameTitle'),
    t('deleteGameMsg', formatDate(game.date))
  );
  if (!confirmed) return;
  await deleteGameRemote(gameId);
  state.games = state.games.filter(g => g.id !== gameId);
  renderHistory();
  renderLeaderboard();
  toast(t('toastGameDeleted'));
}

// ═══════════════════════════════════════════
//  LANGUAGE TOGGLE
// ═══════════════════════════════════════════

/** Walk all [data-i18n] elements and update their text + placeholders */
function applyTranslations() {
  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val && typeof val === 'string') el.textContent = val;
  });

  // Placeholder attributes
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = t(key);
    if (val) el.placeholder = val;
  });

  // Lang button label (shows the OTHER language to switch to)
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('langBtn');

  // Admin lock button tooltip
  const lockBtn = document.getElementById('admin-lock-btn');
  if (lockBtn) lockBtn.title = isAdmin ? t('adminLockHint') : t('adminLoginHint');

  // Re-render dynamic sections so their injected HTML is also translated
  renderLeaderboard();
  renderPlayersList();
  renderHistory();

  // Update html lang attribute
  document.documentElement.lang = currentLang;
}

// Lang toggle button
document.getElementById('lang-btn').addEventListener('click', () => {
  setLang(currentLang === 'zh' ? 'en' : 'zh');
  applyTranslations();
});

// ═══════════════════════════════════════════
//  ADMIN MODE
// ═══════════════════════════════════════════

function applyAdminState() {
  const badge   = document.getElementById('admin-badge');
  const lockBtn = document.getElementById('admin-lock-btn');

  if (isAdmin) {
    // Show admin tabs
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    // Show admin-only buttons inside pages
    document.querySelectorAll('.admin-action').forEach(el => el.style.display = '');
    badge.classList.remove('hidden');
    lockBtn.textContent = '🔓';
    lockBtn.title = t('adminLockHint');
  } else {
    // Hide admin tabs
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    // Hide admin-only buttons inside pages
    document.querySelectorAll('.admin-action').forEach(el => el.style.display = 'none');
    badge.classList.add('hidden');
    lockBtn.textContent = '🔒';
    lockBtn.title = t('adminLoginHint');
    // If currently on an admin-only tab, redirect to leaderboard
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.classList.contains('admin-only')) {
      document.querySelector('[data-tab="leaderboard"]').click();
    }
  }
}

// Lock button — toggle login/logout
document.getElementById('admin-lock-btn').addEventListener('click', () => {
  if (isAdmin) {
    // Already admin — clicking locks
    isAdmin = false;
    sessionStorage.removeItem('mafiaAdmin');
    applyAdminState();
    toast(t('adminLockToast'));
  } else {
    // Not admin — open login modal
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-error').classList.add('hidden');
    document.getElementById('admin-modal-title').textContent = t('adminModalTitle');
    document.getElementById('admin-modal-overlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('admin-password-input').focus(), 50);
  }
});

document.getElementById('admin-login-btn').addEventListener('click', () => {
  const entered = document.getElementById('admin-password-input').value;
  if (entered === ADMIN_PASSWORD) {
    isAdmin = true;
    sessionStorage.setItem('mafiaAdmin', 'yes');
    document.getElementById('admin-modal-overlay').classList.add('hidden');
    applyAdminState();
    toast(t('adminUnlockToast'));
  } else {
    document.getElementById('admin-error').classList.remove('hidden');
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-password-input').focus();
  }
});

document.getElementById('admin-modal-cancel').addEventListener('click', () => {
  document.getElementById('admin-modal-overlay').classList.add('hidden');
});

document.getElementById('admin-password-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('admin-login-btn').click();
});

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
(async () => {
  await loadState();
  applyAdminState();
  applyTranslations();
})();