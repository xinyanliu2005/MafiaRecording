// ═══════════════════════════════════════════
//  MAFIA STATS TRACKER — app.js
// ═══════════════════════════════════════════

// ─── Admin password — change this to whatever you want ───
const ADMIN_PASSWORD = 'hcx';

// ─── Admin session (lives in sessionStorage — clears when tab closes) ───
let isAdmin = sessionStorage.getItem('mafiaAdmin') === 'yes';

// ─── Scoring ─────────────────────────────────
const SCORE = { WIN: 25, LOSS: 17, WATCH: 15 };
const MVP_BONUS = 5;

// ─── Game Mode Definitions ───────────────────
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
          { role: 'Prophet',    count: 1 },
          { role: 'TombKeeper', count: 1 },
          { role: 'Hunter',     count: 1 },
          { role: 'Witch',      count: 1 },
          { role: 'Peasant',    count: 4 },
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
          { role: 'Witch',   count: 1 },
          { role: 'Hunter',  count: 1 },
          { role: 'Guard',   count: 1 },
          { role: 'Peasant', count: 4 },
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
          { role: 'Witch',   count: 1 },
          { role: 'Hunter',  count: 1 },
          { role: 'Peasant', count: 3 },
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
          { role: 'WhiteWolf', count: 1 },
        ],
      },
      {
        id: 'village', label: '🏘 Village Side', color: 'side-village',
        roles: [
          { role: 'Prophet', count: 1 },
          { role: 'Knight',  count: 1 },
          { role: 'Guard',   count: 1 },
          { role: 'Witch',   count: 1 },
          { role: 'Peasant', count: 4 },
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
        id: 'village', label: '🏘 Village Side', color: 'side-village',
        roles: [
          { role: 'Jupiter', count: 1 },
          { role: 'Prophet', count: 1 },
          { role: 'Witch',   count: 1 },
          { role: 'Hunter',  count: 1 },
          { role: 'Peasant', count: 4 },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let state = {
  players: [],
  games:   [],
};

let activeMode     = null;
let selectedWinner = null;
let watcherCount   = 0;
let couplePlayer1  = null;
let couplePlayer2  = null;

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

      state.players = players;
      state.games   = games.map(g => ({
        ...g,
        participants: participants.filter(p => p.game_id === g.id).map(p => ({
          ...p,
          playerId:   p.player_id,
          sideId:     p.side_id,
          adjustment: p.adjustment || 0,
        })),
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
      const [inserted] = await sb.insert('games', {
        id:           game.id,
        date:         game.date,
        notes:        game.notes       || null,
        mode:         game.mode        || null,
        double_score: game.doubleScore || false,
        mvp_player_id: game.mvpPlayerId || null,
      });
      const gameId = inserted.id;

      // ── FIXED: include adjustment in every participant row ──
      const rows = game.participants.map(p => ({
        game_id:    gameId,
        player_id:  p.playerId,
        status:     p.status,
        role:       p.role       || null,
        side_id:    p.sideId     || null,
        outcome:    p.outcome    || null,
        adjustment: p.adjustment || null,
      }));
      await sb.insert('participants', rows);

      return gameId;
    } catch (err) {
      console.error('Supabase save error:', err);
      toast(t('toastCloudFail'));
    }
  }
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
    if (game.mode === 'blackbox') {
      score += (p.adjustment || p.delta || 0);
      continue;
    }
    const mult = (game.double_score || game.doubleScore) ? 2 : 1;
    if (p.status === 'watched') {
      score += SCORE.WATCH * mult; watched++;
    } else if (p.status === 'played') {
      played++;
      if (p.outcome === 'won') {
        score += SCORE.WIN * mult; wins++;
        // MVP bonus — only applies if the MVP also won
        const mvpId = game.mvpPlayerId || game.mvp_player_id;
        if (mvpId && mvpId === playerId) score += MVP_BONUS * mult;
      } else {
        score += SCORE.LOSS * mult; losses++;
      }
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
        <button class="btn-icon admin-action" title="Remove player" onclick="removePlayer('${p.id}')" style="display:${isAdmin?'':'none'}">🗑</button>
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
  couplePlayer1  = null;
  couplePlayer2  = null;

  document.getElementById('log-step-mode').style.display   = 'none';
  document.getElementById('log-step-assign').style.display = 'block';
  document.getElementById('active-mode-label').textContent = tMode(modeKey);

  // Show/hide Jupiter couple section
  document.getElementById('jupiter-couple-section').style.display =
    modeKey === 'Jupiter' ? 'block' : 'none';

  // Show/hide custom roles section vs normal sides container
  const isCustom = modeKey === 'Custom';
  document.getElementById('custom-roles-section').style.display = isCustom ? 'block' : 'none';
  document.getElementById('sides-container').style.display       = isCustom ? 'none'  : 'block';

  if (isCustom) {
    buildCustomRoleUI();
  } else {
    buildRoleAssignmentUI(modeKey);
  }
  buildWinnerButtons(modeKey);
  document.getElementById('watcher-list').innerHTML = '';
  watcherCount = 0;
  document.getElementById('mvp-select').value = '';
  populateMvpDropdown();
}

document.getElementById('back-to-mode-btn').addEventListener('click', () => {
  document.getElementById('log-step-assign').style.display  = 'none';
  document.getElementById('log-step-mode').style.display    = 'block';
  document.getElementById('sides-container').innerHTML       = '';
  document.getElementById('sides-container').style.display   = 'block';
  document.getElementById('winner-side-container').innerHTML = '';
  document.getElementById('watcher-list').innerHTML          = '';
  document.getElementById('custom-roles-section').style.display = 'none';
  document.getElementById('custom-villain-roles').innerHTML  = '';
  document.getElementById('custom-village-roles').innerHTML  = '';
  document.getElementById('custom-wolf-count').value    = 4;
  document.getElementById('custom-village-count').value = 8;
  activeMode     = null;
  selectedWinner = null;
  watcherCount   = 0;
  couplePlayer1  = null;
  couplePlayer2  = null;
  document.getElementById('jupiter-couple-section').style.display = 'none';
  document.getElementById('couple-type-indicator').innerHTML = '';
  document.getElementById('mvp-select').innerHTML = '<option value="">— —</option>';
  document.getElementById('mvp-select').value     = '';
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

  container.querySelectorAll('.player-select').forEach(sel => {
    wirePlayerSelect(sel);
    if (activeMode === 'Jupiter') {
      sel.addEventListener('change', () => {
        setTimeout(populateCoupleDropdowns, 0);
      });
    }
  });

  if (activeMode === 'Jupiter') populateCoupleDropdowns();
}

// ═══════════════════════════════════════════
//  CUSTOM MODE ROLE UI
// ═══════════════════════════════════════════
function buildCustomRoleUI() {
  const wolfInput    = document.getElementById('custom-wolf-count');
  const villageInput = document.getElementById('custom-village-count');

  const wolfCount    = parseInt(wolfInput.value, 10)    || 1;
  const villageCount = parseInt(villageInput.value, 10) || 1;

  buildCustomSideRows('custom-villain-roles', 'wolf',    wolfCount);
  buildCustomSideRows('custom-village-roles', 'village', villageCount);
  updateCustomHeaders(wolfCount, villageCount);
}

/** Update the side headers and total count display */
function updateCustomHeaders(wolfCount, villageCount) {
  const total = wolfCount + villageCount;
  document.getElementById('custom-villain-header').textContent =
    `${t('customVillainSideBase')}（${wolfCount}${t('customPeopleSuffix')}）`;
  document.getElementById('custom-village-header').textContent =
    `${t('customVillageSideBase')}（${villageCount}${t('customPeopleSuffix')}）`;
  document.getElementById('custom-total-count').textContent = total;
}

/** Rebuild role rows when counts change, preserving already-entered data where possible */
function rebuildCustomRoleRows() {
  const wolfInput    = document.getElementById('custom-wolf-count');
  const villageInput = document.getElementById('custom-village-count');

  let wolfCount    = parseInt(wolfInput.value, 10);
  let villageCount = parseInt(villageInput.value, 10);

  // Clamp to sensible bounds
  if (isNaN(wolfCount)    || wolfCount    < 1) wolfCount    = 1;
  if (isNaN(villageCount) || villageCount < 1) villageCount = 1;
  if (wolfCount    > 30) wolfCount    = 30;
  if (villageCount > 30) villageCount = 30;
  wolfInput.value    = wolfCount;
  villageInput.value = villageCount;

  // Preserve existing entries (role name + selected player) before rebuilding
  const preserve = (containerId) => {
    const rows = document.querySelectorAll(`#${containerId} .custom-role-row`);
    return Array.from(rows).map(row => ({
      role:     row.querySelector('.custom-role-input')?.value || '',
      playerId: row.querySelector('.player-select')?.value     || '',
    }));
  };
  const prevWolf    = preserve('custom-villain-roles');
  const prevVillage = preserve('custom-village-roles');

  buildCustomSideRows('custom-villain-roles', 'wolf',    wolfCount,    prevWolf);
  buildCustomSideRows('custom-village-roles', 'village', villageCount, prevVillage);
  updateCustomHeaders(wolfCount, villageCount);
  filterUsedPlayers();
  populateMvpDropdown();
}

function buildCustomSideRows(containerId, sideId, count, prevData = []) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    // Row wrapper
    const row = document.createElement('div');
    row.className = 'custom-role-row';
    row.dataset.side  = sideId;
    row.dataset.index = i;

    // Role name text input
    const input = document.createElement('input');
    input.type        = 'text';
    input.className   = 'custom-role-input';
    input.placeholder = t('customRolePh');
    input.dataset.side  = sideId;
    input.dataset.index = i;
    if (prevData[i]) input.value = prevData[i].role;

    // Player select dropdown
    const sel = document.createElement('select');
    sel.className = 'player-select custom-player-select';
    sel.dataset.side  = sideId;
    sel.dataset.index = i;

    // Populate options
    const blankOpt = document.createElement('option');
    blankOpt.value       = '';
    blankOpt.textContent = t('assignPh');
    sel.appendChild(blankOpt);

    const newOpt = document.createElement('option');
    newOpt.value       = '__new__';
    newOpt.textContent = t('addNewPlayer');
    sel.appendChild(newOpt);

    state.players.forEach(p => {
      const opt = document.createElement('option');
      opt.value       = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });

    if (prevData[i] && prevData[i].playerId) sel.value = prevData[i].playerId;

    wirePlayerSelect(sel);

    row.appendChild(input);
    row.appendChild(sel);
    container.appendChild(row);
  }
}

// Wire up count input listeners (rebuild rows on change, debounced via 'change' event)
document.getElementById('custom-wolf-count').addEventListener('change', rebuildCustomRoleRows);
document.getElementById('custom-village-count').addEventListener('change', rebuildCustomRoleRows);

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
        refreshAllPlayerSelects();
        sel.value = player.id;
      } else {
        sel.value = '';
      }
    }
    // After any selection change, hide already-used players from other dropdowns
    filterUsedPlayers();
    populateMvpDropdown();
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
  filterUsedPlayers();
  populateMvpDropdown();
}

/**
 * Hide already-selected players from all role/watcher dropdowns.
 * Skips the Jupiter couple selects so the same player can appear twice there.
 */
function filterUsedPlayers() {
  const SELECTOR = '#sides-container .player-select, #custom-roles-section .player-select, .watcher-select';

  // Collect all currently selected playerIds from role + watcher selects
  // (exclude couple selects)
  const usedIds = new Set();
  document.querySelectorAll(SELECTOR).forEach(sel => {
    if (sel.value && sel.value !== '__new__') usedIds.add(sel.value);
  });

  // Rebuild each select's option list — removing (not hiding) used players.
  // iOS Safari does not respect <option hidden>, so we must add/remove
  // the actual <option> elements instead.
  document.querySelectorAll(SELECTOR).forEach(sel => {
    const ownValue = sel.value;

    // Determine which player IDs should be visible in this select
    const visiblePlayerIds = state.players
      .filter(p => !usedIds.has(p.id) || p.id === ownValue)
      .map(p => p.id);

    // Build the set of option values currently present (excluding blank/__new__)
    const currentValues = Array.from(sel.options)
      .map(o => o.value)
      .filter(v => v && v !== '__new__');

    const visibleSet = new Set(visiblePlayerIds);
    const currentSet = new Set(currentValues);

    // Remove options that should no longer be visible
    Array.from(sel.options).forEach(opt => {
      if (!opt.value || opt.value === '__new__') return;
      if (!visibleSet.has(opt.value)) sel.removeChild(opt);
    });

    // Add options that should be visible but aren't present yet
    visiblePlayerIds.forEach(pid => {
      if (currentSet.has(pid)) return;
      const player = getPlayerById(pid);
      if (!player) return;
      const opt = document.createElement('option');
      opt.value       = player.id;
      opt.textContent = player.name;
      sel.appendChild(opt);
    });

    // Restore the select's own value (it may have been removed/re-added)
    if (ownValue) sel.value = ownValue;
  });
}

/**
 * Populate the MVP dropdown with all currently-assigned players
 * (from role rows — both standard and custom modes). Watchers are excluded.
 * Preserves the currently selected MVP if they're still assigned.
 */
function populateMvpDropdown() {
  const sel = document.getElementById('mvp-select');
  if (!sel) return;

  const current = sel.value;

  // Gather all assigned players from role rows (standard + custom)
  const assigned = [];
  document.querySelectorAll('#sides-container .role-row, #custom-roles-section .custom-role-row')
    .forEach(row => {
      const playerSel = row.querySelector('.player-select');
      const pid = playerSel?.value;
      if (pid && pid !== '__new__') {
        const player = getPlayerById(pid);
        if (player) assigned.push(player);
      }
    });

  sel.innerHTML = '';
  const noneOpt = document.createElement('option');
  noneOpt.value       = '';
  noneOpt.textContent = t('mvpNone');
  sel.appendChild(noneOpt);

  assigned.forEach(p => {
    const opt = document.createElement('option');
    opt.value       = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });

  // Restore previous selection if that player is still assigned
  if (current && assigned.some(p => p.id === current)) {
    sel.value = current;
  } else {
    sel.value = '';
  }
}

// ═══════════════════════════════════════════
//  WINNER SELECTION (Step 3)
// ═══════════════════════════════════════════
function buildWinnerButtons(modeKey) {
  const container = document.getElementById('winner-side-container');

  // Custom mode: always wolf vs village
  if (modeKey === 'Custom') {
    container.innerHTML = `
      <button class="winner-btn side-wolf" data-side="wolf"
        onclick="selectWinner('wolf', this)">
        ${tSide('wolf')} ${t('winsLabel')}
      </button>
      <button class="winner-btn side-village" data-side="village"
        onclick="selectWinner('village', this)">
        ${tSide('village')} ${t('winsLabel')}
      </button>`;
    return;
  }

  const mode = GAME_MODES[modeKey];
  let btns = mode.sides.map(side => `
    <button class="winner-btn ${side.color}" data-side="${side.id}"
      onclick="selectWinner('${side.id}', this)">
      ${tSide(side.id)} ${t('winsLabel')}
    </button>`
  ).join('');

  if (modeKey === 'Jupiter') {
    btns += `<button class="winner-btn side-couple couple-btn-hidden" id="couple-win-btn"
      data-side="couple" onclick="selectWinner('couple', this)">
      💕 ${t('coupleWins')}
    </button>`;
  }
  container.innerHTML = btns;
}

function updateCoupleWinButton() {
  const btn = document.getElementById('couple-win-btn');
  if (!btn) return;
  const isMixed = isMixedCouple();
  btn.classList.toggle('couple-btn-hidden', !isMixed);
  if (!isMixed && selectedWinner === 'couple') {
    selectedWinner = null;
    document.querySelectorAll('.winner-btn').forEach(b => b.classList.remove('winner-active'));
  }
}

function selectWinner(sideId, btn) {
  selectedWinner = sideId;
  document.querySelectorAll('.winner-btn').forEach(b => b.classList.remove('winner-active'));
  btn.classList.add('winner-active');
}

// ─── Jupiter couple helpers ───────────────────────────────────────────────
function getPlayerSideId(playerId) {
  for (const sel of document.querySelectorAll('#sides-container .role-row select')) {
    if (sel.value === playerId) return sel.closest('.role-row').dataset.side;
  }
  return null;
}

function isMixedCouple() {
  if (!couplePlayer1 || !couplePlayer2) return false;
  const side1 = getPlayerSideId(couplePlayer1);
  const side2 = getPlayerSideId(couplePlayer2);
  if (!side1 || !side2) return false;
  return (side1 === 'wolf' && side2 === 'village') ||
         (side1 === 'village' && side2 === 'wolf');
}

function updateCoupleIndicator() {
  const el = document.getElementById('couple-type-indicator');
  if (!el) return;
  if (!couplePlayer1 || !couplePlayer2) { el.innerHTML = ''; return; }
  const side1 = getPlayerSideId(couplePlayer1);
  const side2 = getPlayerSideId(couplePlayer2);
  if (!side1 || !side2) { el.innerHTML = ''; return; }
  if (isMixedCouple()) {
    el.innerHTML = `<span class="couple-type mixed">${t('coupleMixed')}</span>`;
  } else {
    el.innerHTML = `<span class="couple-type same">${t('coupleSameSide')}</span>`;
  }
  updateCoupleWinButton();
}

function populateCoupleDropdowns() {
  const sel1 = document.getElementById('couple-player-1');
  const sel2 = document.getElementById('couple-player-2');
  if (!sel1 || !sel2) return;

  const assigned = [];
  document.querySelectorAll('#sides-container .role-row').forEach(row => {
    const pid = row.querySelector('select').value;
    if (pid && pid !== '__new__') {
      const player = getPlayerById(pid);
      if (player) assigned.push({ id: pid, name: player.name, side: row.dataset.side });
    }
  });

  const opts = (currentVal) => `
    <option value="">${t('coupleSelectPh')}</option>
    ${assigned.map(a =>
      `<option value="${a.id}" ${a.id === currentVal ? 'selected' : ''}>${esc(a.name)}</option>`
    ).join('')}`;

  sel1.innerHTML = opts(couplePlayer1 || '');
  sel2.innerHTML = opts(couplePlayer2 || '');

  sel1.onchange = () => { couplePlayer1 = sel1.value || null; updateCoupleIndicator(); };
  sel2.onchange = () => { couplePlayer2 = sel2.value || null; updateCoupleIndicator(); };
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

  const row = document.createElement('div');
  row.className     = 'watcher-row';
  row.dataset.rowId = id;

  // Build select using DOM so filterUsedPlayers can hide options immediately
  const wrap = document.createElement('div');
  wrap.className = 'form-group';
  wrap.style.flex = '1';

  const sel = document.createElement('select');
  sel.className = 'player-select watcher-select';

  const blankOpt = document.createElement('option');
  blankOpt.value       = '';
  blankOpt.textContent = t('watcherPh');
  sel.appendChild(blankOpt);

  const newOpt = document.createElement('option');
  newOpt.value       = '__new__';
  newOpt.textContent = t('addNewPlayer');
  sel.appendChild(newOpt);

  state.players.forEach(p => {
    const opt = document.createElement('option');
    opt.value       = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });

  wrap.appendChild(sel);

  // Remove button also re-runs filter so that player reappears in other dropdowns
  const removeBtn = document.createElement('button');
  removeBtn.className   = 'btn-icon';
  removeBtn.textContent = '✕';
  removeBtn.onclick     = () => { row.remove(); filterUsedPlayers(); populateMvpDropdown(); };

  row.appendChild(wrap);
  row.appendChild(removeBtn);
  list.appendChild(row);

  wirePlayerSelect(sel);
  // Apply current filter immediately so already-used players are hidden
  filterUsedPlayers();
  populateMvpDropdown();
}

// ═══════════════════════════════════════════
//  SAVE GAME
// ═══════════════════════════════════════════
document.getElementById('save-game-btn').addEventListener('click', async () => {
  const date        = document.getElementById('game-date').value;
  const notes       = document.getElementById('game-notes').value.trim();
  const doubleScore = document.getElementById('double-score-toggle').checked;
  if (!date)       { toast(t('toastSelectDate')); return; }
  if (!activeMode) { toast(t('toastSelectMode')); return; }

  if (activeMode === 'Jupiter') {
    if (!couplePlayer1 || !couplePlayer2) {
      toast(t('toastSelectCouple')); return;
    }
    if (couplePlayer1 === couplePlayer2) {
      toast(t('toastCoupleSamePlayer')); return;
    }
    populateCoupleDropdowns();
  }

  if (!selectedWinner) { toast(t('toastSelectWinner')); return; }

  const participants = [];
  const seenIds     = new Set();
  let valid         = true;

  // Collect role rows — from custom UI or standard sides-container
  const isCustomMode = activeMode === 'Custom';
  const roleRows = isCustomMode
    ? document.querySelectorAll('#custom-roles-section .custom-role-row')
    : document.querySelectorAll('#sides-container .role-row');

  roleRows.forEach(row => {
    const sideId   = row.dataset.side;
    const role     = isCustomMode
      ? (row.querySelector('.custom-role-input')?.value.trim() || t('customRoleDefault'))
      : row.dataset.role;
    const playerId = row.querySelector('.player-select').value;

    if (!playerId || playerId === '__new__') {
      toast(t('toastAssignAll')); valid = false; return;
    }
    if (seenIds.has(playerId)) {
      const name = getPlayerById(playerId)?.name || 'Someone';
      toast(t('toastDuplicate', name)); valid = false; return;
    }
    seenIds.add(playerId);

    let outcome;
    const isMixed = isMixedCouple();
    const isCoupleMember = (playerId === couplePlayer1 || playerId === couplePlayer2);
    const isJupiter = (role === 'Jupiter');

    if (activeMode === 'Jupiter' && isMixed) {
      if (selectedWinner === 'couple') {
        outcome = (isCoupleMember || isJupiter) ? 'won' : 'lost';
      } else if (selectedWinner === 'village') {
        outcome = (sideId === 'village' && !isCoupleMember && !isJupiter) ? 'won' : 'lost';
      } else {
        outcome = (sideId === 'wolf' && !isCoupleMember) ? 'won' : 'lost';
      }
    } else if (activeMode === 'Jupiter' && !isMixed) {
      outcome = sideId === selectedWinner ? 'won' : 'lost';
    } else {
      outcome = sideId === selectedWinner ? 'won' : 'lost';
    }
    participants.push({ playerId, status: 'played', role, sideId, outcome });
  });

  if (!valid) return;

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

  const coupleIds  = activeMode === 'Jupiter' ? [couplePlayer1, couplePlayer2] : null;
  const mvpPlayerId = document.getElementById('mvp-select').value || null;
  const game = { id: uid(), date, notes, mode: activeMode, doubleScore, coupleIds, mvpPlayerId, participants };
  const btn  = document.getElementById('save-game-btn');
  btn.disabled    = true;
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
    btn.disabled    = false;
    btn.textContent = t('saveGameBtn');
  }
});

function resetLogForm() {
  document.getElementById('game-date').value             = todayISO();
  document.getElementById('game-notes').value            = '';
  document.getElementById('double-score-toggle').checked = false;
  couplePlayer1 = null;
  couplePlayer2 = null;
  document.getElementById('jupiter-couple-section').style.display = 'none';
  document.getElementById('couple-type-indicator').innerHTML      = '';
  document.getElementById('log-step-assign').style.display  = 'none';
  document.getElementById('log-step-mode').style.display    = 'block';
  document.getElementById('sides-container').innerHTML           = '';
  document.getElementById('sides-container').style.display       = 'block';
  document.getElementById('winner-side-container').innerHTML      = '';
  document.getElementById('watcher-list').innerHTML               = '';
  document.getElementById('custom-roles-section').style.display  = 'none';
  document.getElementById('custom-villain-roles').innerHTML       = '';
  document.getElementById('custom-village-roles').innerHTML       = '';
  document.getElementById('custom-wolf-count').value    = 4;
  document.getElementById('custom-village-count').value = 8;
  document.getElementById('mvp-select').innerHTML = '<option value="">— —</option>';
  document.getElementById('mvp-select').value     = '';
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
      <td class="player-name-cell">
        ${esc(player.name)}
        ${isAdmin ? `<button class="btn-blackbox" title="${t('blackboxTitle')}" onclick="openBlackbox('${player.id}')">🎲</button>` : ''}
      </td>
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
//  BLACKBOX / 暗箱操作
// ═══════════════════════════════════════════
function openBlackbox(playerId) {
  if (!isAdmin) return;
  const player = getPlayerById(playerId);
  if (!player) return;
  const stats  = computePlayerStats(playerId);

  const overlay = document.getElementById('blackbox-overlay');
  document.getElementById('bb-player-name').textContent   = player.name;
  document.getElementById('bb-current-score').textContent = stats.score;
  document.getElementById('bb-delta-input').value         = '';
  document.getElementById('bb-reason-input').value        = '';
  document.getElementById('bb-preview').textContent       = '';
  document.getElementById('bb-preview').className         = 'bb-preview';
  overlay.dataset.playerId = playerId;
  overlay.classList.remove('hidden');
  document.getElementById('bb-delta-input').focus();
}

document.getElementById('bb-delta-input').addEventListener('input', () => {
  const overlay  = document.getElementById('blackbox-overlay');
  const playerId = overlay.dataset.playerId;
  const delta    = parseInt(document.getElementById('bb-delta-input').value, 10);
  const stats    = computePlayerStats(playerId);
  const preview  = document.getElementById('bb-preview');
  if (isNaN(delta) || delta === 0) { preview.textContent = ''; return; }
  const newScore = stats.score + delta;
  const sign     = delta > 0 ? '+' : '';
  preview.textContent = `${stats.score} ${sign}${delta} = ${newScore}`;
  preview.className   = delta > 0 ? 'bb-preview positive' : 'bb-preview negative';
});

document.getElementById('bb-cancel-btn').addEventListener('click', () => {
  document.getElementById('blackbox-overlay').classList.add('hidden');
});

document.getElementById('bb-confirm-btn').addEventListener('click', async () => {
  const overlay  = document.getElementById('blackbox-overlay');
  const playerId = overlay.dataset.playerId;
  const delta    = parseInt(document.getElementById('bb-delta-input').value, 10);
  const reason   = document.getElementById('bb-reason-input').value.trim();

  if (isNaN(delta) || delta === 0) { toast(t('toastBBNoDelta')); return; }

  const game = {
    id:           uid(),
    date:         todayISO(),
    notes:        reason || null,
    mode:         'blackbox',
    doubleScore:  false,
    coupleIds:    null,
    participants: [{ playerId, status: 'blackbox', adjustment: delta, role: null, sideId: null, outcome: null }],
  };

  const btn = document.getElementById('bb-confirm-btn');
  btn.disabled = true;

  try {
    await saveGame(game);
    if (!state.games.find(g => g.id === game.id)) state.games.unshift(game);
    overlay.classList.add('hidden');
    renderLeaderboard();
    renderHistory();
    const sign = delta > 0 ? '+' : '';
    toast(t('toastBBSaved', getPlayerById(playerId)?.name, sign + delta));
  } catch (err) {
    toast(t('toastGameSaveErr'));
    console.error(err);
  } finally {
    btn.disabled = false;
  }
});

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

    if (game.mode === 'blackbox') return '';

    const modeLabel = game.mode ? tMode(game.mode) : '';

    const rows = game.participants.map(p => {
      const pid    = p.playerId || p.player_id;
      const player = getPlayerById(pid);
      const name   = player ? esc(player.name) : '<em>Deleted</em>';
      const mvpId  = game.mvpPlayerId || game.mvp_player_id;
      const isMvp  = mvpId && mvpId === pid;
      let badge, pts;
      const mult = (game.double_score || game.doubleScore) ? 2 : 1;
      if (p.status === 'watched') {
        badge = `<span class="badge badge-watch">${t('badgeWatch')}</span>`;
        pts   = `+${SCORE.WATCH * mult}`;
      } else if (p.outcome === 'won') {
        badge = `<span class="badge badge-win">${t('badgeWon')}</span>`;
        pts   = `+${SCORE.WIN * mult}`;
        if (isMvp) pts = `+${(SCORE.WIN + MVP_BONUS) * mult}`;
      } else {
        badge = `<span class="badge badge-loss">${t('badgeLost')}</span>`;
        pts   = `+${SCORE.LOSS * mult}`;
      }
      if (isMvp) badge += ` <span class="badge badge-mvp">🏆 MVP</span>`;
      const sideLabel = (p.sideId || p.side_id) ? tSide(p.sideId || p.side_id) : '—';
      return `<tr>
        <td>${name}</td>
        <td>${p.role ? tRole(p.role) : '—'}</td>
        <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">${sideLabel}</td>
        <td>${badge}</td>
        ${isAdmin ? `<td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gold-dim)">${pts}</td>` : ''}
      </tr>`;
    }).join('');

    return `
      <div class="history-game" id="game-${game.id}">
        <div class="history-game-header" onclick="toggleHistory('${game.id}')">
          <div class="history-game-title">
            <span class="history-date">${formatDate(game.date)}</span>
            ${modeLabel ? `<span class="badge badge-mode">${esc(modeLabel)}</span>` : ''}
            ${(game.double_score || game.doubleScore) ? `<span class="badge badge-double">${t('badgeDouble')}</span>` : ''}
            ${game.coupleIds ? `<span class="badge badge-couple">💕</span>` : ''}
            ${game.notes ? `<span class="history-notes">${esc(game.notes)}</span>` : ''}
          </div>
          <div class="history-summary">${t('historySummary', played, watched)}</div>
        </div>
        <div class="history-body" id="body-${game.id}" style="display:none">
          <table>
            <thead><tr><th>${t('colPlayer')}</th><th>${t('colRole')}</th><th>${t('colSide')}</th><th>${t('colOutcome')}</th>${isAdmin ? `<th>${t('colPts')}</th>` : ''}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="history-actions" style="display:${isAdmin?'flex':'none'}">
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
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val && typeof val === 'string') el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = t(key);
    if (val) el.placeholder = val;
  });

  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('langBtn');

  const lockBtn = document.getElementById('admin-lock-btn');
  if (lockBtn) lockBtn.title = isAdmin ? t('adminLockHint') : t('adminLoginHint');

  renderLeaderboard();
  renderPlayersList();
  renderHistory();

  document.documentElement.lang = currentLang;
}

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
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    badge.classList.remove('hidden');
    lockBtn.textContent = '🔓';
    lockBtn.title = t('adminLockHint');
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    badge.classList.add('hidden');
    lockBtn.textContent = '🔒';
    lockBtn.title = t('adminLoginHint');
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.classList.contains('admin-only')) {
      document.querySelector('[data-tab="leaderboard"]').click();
    }
  }
  // Re-render so blackbox buttons and delete buttons show/hide correctly
  renderLeaderboard();
  renderHistory();
  renderPlayersList();
}

document.getElementById('admin-lock-btn').addEventListener('click', () => {
  if (isAdmin) {
    isAdmin = false;
    sessionStorage.removeItem('mafiaAdmin');
    applyAdminState();
    toast(t('adminLockToast'));
  } else {
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