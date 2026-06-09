// ═══════════════════════════════════════════
//  MAFIA STATS TRACKER — app.js
// ═══════════════════════════════════════════

// ─── Scoring ─────────────────────────────────
const SCORE = { WIN: 10, LOSS: 6, WATCH: 4 };

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
          { role: 'ProphetTeller', count: 1 },
          { role: 'TombKeeper',    count: 1 },
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
          { role: 'ProphetTeller', count: 1 },
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
          { role: 'ProphetTeller', count: 1 },
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
          { role: 'ProphetTeller', count: 1 },
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
          { role: 'ProphetTeller', count: 1 },
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

      showBanner('☁️  Connected to Supabase — data is shared across all devices.', 'info');
    } catch (err) {
      console.error('Supabase load error:', err);
      showBanner('⚠️  Supabase error — falling back to local storage.', 'warn');
      loadLocalState();
    }
  } else {
    loadLocalState();
    showBanner('💾  Running in local mode. Configure Supabase in supabase.js to share data.', 'warn');
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
        id:    game.id,
        date:  game.date,
        notes: game.notes || null,
        mode:  game.mode  || null,
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
      toast('⚠️ Cloud save failed — saved locally instead.');
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
      toast('⚠️ Cloud save failed — saved locally instead.');
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
    if (p.status === 'watched') {
      score += SCORE.WATCH; watched++;
    } else if (p.status === 'played') {
      played++;
      if (p.outcome === 'won') { score += SCORE.WIN;  wins++; }
      else                     { score += SCORE.LOSS; losses++; }
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
  if (!name) { toast('Please enter a name.'); return; }
  if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    toast('That name already exists.'); return;
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
  if (!name) { toast('Please enter a name.'); return; }
  if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    toast('A player with that name already exists.'); return;
  }
  const player = { id: uid(), name };
  const saved  = await savePlayer(player);
  if (!state.players.find(p => p.id === saved.id)) state.players.push(saved);
  input.value = '';
  renderPlayersList();
  toast(`${name} added to the family.`);
});
document.getElementById('new-player-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('add-player-btn').click();
});

function renderPlayersList() {
  const container = document.getElementById('players-list-container');
  if (state.players.length === 0) {
    container.innerHTML = '<p class="empty-state">No players added yet.</p>';
    return;
  }
  const sorted = [...state.players].sort((a, b) => a.name.localeCompare(b.name));
  container.innerHTML = `<div class="players-grid">${
    sorted.map(p => {
      const s = computePlayerStats(p.id);
      return `<div class="player-card">
        <div>
          <div class="player-card-name">${esc(p.name)}</div>
          <div class="player-card-stats">${s.totalGames} games · ${s.score} pts · ${s.winRate}% win rate</div>
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
  const msg = inGames
    ? `${player.name} has recorded games. Removing them will delete their participation records. Are you sure?`
    : `Remove ${player.name} from the roster?`;
  const confirmed = await showModal('Remove Player', msg);
  if (!confirmed) return;
  await deletePlayerRemote(id);
  state.players = state.players.filter(p => p.id !== id);
  state.games.forEach(g => { g.participants = g.participants.filter(p => (p.playerId||p.player_id) !== id); });
  renderPlayersList();
  toast(`${player.name} removed.`);
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
  document.getElementById('active-mode-label').textContent = GAME_MODES[modeKey].label;

  buildRoleAssignmentUI(modeKey);
  buildWinnerButtons(modeKey);
  document.getElementById('watcher-list').innerHTML = '';
  watcherCount = 0;
}

document.getElementById('back-to-mode-btn').addEventListener('click', () => {
  document.getElementById('log-step-assign').style.display = 'none';
  document.getElementById('log-step-mode').style.display   = 'block';
  activeMode     = null;
  selectedWinner = null;
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
        <div class="side-header">${side.label}</div>
        <div class="side-roles">${roleRows}</div>
      </div>`;
  }).join('');

  // Wire up "new player" option in every select
  container.querySelectorAll('.player-select').forEach(wirePlayerSelect);
}

function buildRoleRow(sideId, role, index, total) {
  const label = total > 1 ? `${role} ${index + 1}` : role;
  const key   = `${sideId}__${role}__${index}`;
  return `
    <div class="role-row" data-side="${sideId}" data-role="${role}" data-key="${key}">
      <span class="role-label">${label}</span>
      <select class="player-select" data-key="${key}">
        <option value="">— Assign player —</option>
        <option value="__new__">➕ Add new player…</option>
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
      <option value="">— Assign player —</option>
      <option value="__new__">➕ Add new player…</option>
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
      ${side.label} wins
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
        <option value="">— Select watcher —</option>
        <option value="__new__">➕ Add new player…</option>
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
  const date  = document.getElementById('game-date').value;
  const notes = document.getElementById('game-notes').value.trim();
  if (!date)        { toast('Please select a date.'); return; }
  if (!activeMode)  { toast('Please select a game mode.'); return; }
  if (!selectedWinner) { toast('Please select the winning side.'); return; }

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
      toast(`Please assign a player to every role (or remove empty rows).`);
      valid = false; return;
    }
    if (seenIds.has(playerId)) {
      const name = getPlayerById(playerId)?.name || 'Someone';
      toast(`${name} is assigned to more than one role.`);
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
      toast(`${getPlayerById(playerId)?.name || 'Someone'} is both playing and watching.`);
      valid = false; return;
    }
    seenIds.add(playerId);
    participants.push({ playerId, status: 'watched', role: null, sideId: null, outcome: null });
  });

  if (!valid) return;

  const game = { id: uid(), date, notes, mode: activeMode, participants };
  const btn  = document.getElementById('save-game-btn');
  btn.disabled   = true;
  btn.textContent = 'Saving…';

  try {
    await saveGame(game);
    if (!state.games.find(g => g.id === game.id)) state.games.unshift(game);
    toast('Game saved! The family records have been updated.');
    resetLogForm();
    renderLeaderboard();
  } catch (err) {
    toast('Error saving game. Check console.');
    console.error(err);
  } finally {
    btn.disabled   = false;
    btn.textContent = 'Save Game';
  }
});

function resetLogForm() {
  document.getElementById('game-date').value   = todayISO();
  document.getElementById('game-notes').value  = '';
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
    container.innerHTML = '<p class="empty-state">No players yet. Add players in the Players tab.</p>';
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
        <th>#</th><th>Player</th>
        <th class="num">Score</th><th class="num">Played</th>
        <th class="num">Watched</th><th>Win Rate</th>
        <th class="num">Wins</th><th class="num">Losses</th>
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
    container.innerHTML = '<p class="empty-state">No games logged yet.</p>';
    return;
  }
  container.innerHTML = state.games.map(game => {
    const played  = game.participants.filter(p => p.status === 'played').length;
    const watched = game.participants.filter(p => p.status === 'watched').length;
    const modeLabel = game.mode ? (GAME_MODES[game.mode]?.label || game.mode) : '';

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
      if (p.status === 'watched') {
        badge = `<span class="badge badge-watch">Watched</span>`;
        pts   = `+${SCORE.WATCH}`;
      } else if (p.outcome === 'won') {
        badge = `<span class="badge badge-win">Won</span>`;
        pts   = `+${SCORE.WIN}`;
      } else {
        badge = `<span class="badge badge-loss">Lost</span>`;
        pts   = `+${SCORE.LOSS}`;
      }
      const sideLabel = p.sideId || p.side_id || '—';
      return `<tr>
        <td>${name}</td>
        <td>${p.role ? esc(p.role) : '—'}</td>
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
            ${game.notes ? `<span class="history-notes">${esc(game.notes)}</span>` : ''}
          </div>
          <div class="history-summary">${played} played · ${watched} watched</div>
        </div>
        <div class="history-body" id="body-${game.id}" style="display:none">
          <table>
            <thead><tr><th>Player</th><th>Role</th><th>Side</th><th>Outcome</th><th>Pts</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="history-actions">
            <button class="btn btn-danger" onclick="deleteGame('${game.id}')">Delete Game</button>
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
    'Delete Game',
    `Delete the game from ${formatDate(game.date)}? This cannot be undone.`
  );
  if (!confirmed) return;
  await deleteGameRemote(gameId);
  state.games = state.games.filter(g => g.id !== gameId);
  renderHistory();
  renderLeaderboard();
  toast('Game deleted.');
}

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
(async () => {
  await loadState();
  renderLeaderboard();
  renderPlayersList();
  renderHistory();
})();
