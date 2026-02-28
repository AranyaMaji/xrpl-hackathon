// ─────────────────────────────────────────────────
// ParkFlow — app.js v4 (Verbose Logging Enabled)
// ─────────────────────────────────────────────────
const POLL_MS = 3000;

// ─── DOM Refs ────────────────────────────────────
const $ = (id) => document.getElementById(id);

// Top bar
const roleBadge = $('roleBadge');
const roleBadgeIcon = $('roleBadgeIcon');
const roleBadgeLabel = $('roleBadgeLabel');
const listSpotBtn = $('listSpotBtn');
const systemPill = $('systemPill');
const systemDot = $('systemDot');
const searchInput = $('searchInput');
const hintText = $('hintText');
const filterChips = $('filterChips');

// Sheet
const sheet = $('sheet');
const sheetHandle = $('sheetHandle');
const closeSheetBtn = $('closeSheetBtn');
const spotPhoto = $('spotPhoto');
const spotPhotoIcon = $('spotPhotoIcon');
const spotPhotoBadge = $('spotPhotoBadge');
const sheetTitle = $('sheetTitle');
const sheetSubtitle = $('sheetSubtitle');
const sheetMeta = $('sheetMeta');
const statusBadge = $('statusBadge');
const rateValue = $('rateValue');
const depositValue = $('depositValue');
const durationValue = $('durationValue');
const elapsedValue = $('elapsedValue');
const directionsBtn = $('directionsBtn');

// Active booking card
const activeBookingCard = $('activeBookingCard');
const activeSpotName = $('activeSpotName');
const activeSubText = $('activeSubText');
const activeTimer = $('activeTimer');
const activeDot = $('activeDot');
const escrowLifecycle = $('escrowLifecycle');
const trickleRow = $('trickleRow');
const trickleFill = $('trickleFill');
const trickleLabel = $('trickleLabel');
const trickleRate = $('trickleRate');
const endBookingBtn = $('endBookingBtn');

// Modal
const modal = $('modal');
const modalView = $('modalView');
const successView = $('successView');
const loadingView = $('loadingView');
const loadingTitle = $('loadingTitle');
const loadingSub = $('loadingSub');
const modalSpotName = $('modalSpotName');
const modalSpotSub = $('modalSpotSub');
const quickDurations = $('quickDurations');
const hoursDisplay = $('hoursDisplay');
const hoursDownBtn = $('hoursDown');
const hoursUpBtn = $('hoursUp');
const costParking = $('costParking');
const costDeposit = $('costDeposit');
const costTotal = $('costTotal');
const successDetails = $('successDetails');
const successStartBtn = $('successStartBtn');
const modalConfirmBtn = $('modalConfirmBtn');

// List modal
const listModal = $('listModal');
const listModalCloseBtn = $('listModalCloseBtn');
const listModalCancelBtn = $('listModalCancelBtn');

// Role overlay
const roleOverlay = $('roleOverlay');
const roleButtons = $('roleButtons');
const adminPassGroup = $('adminPassGroup');
const adminPassInput = $('adminPassInput');
const adminPassSubmit = $('adminPassSubmit');
const adminPassError = $('adminPassError');

// ─── State ───────────────────────────────────────
let role = null; // 'parker' | 'owner' | 'admin'
let spots = []; // from GET /api/spots
let selId = null; // selected spot id (sheet)
let myId = null; // tracked spot id (active card)
let map = null;
let markers = [];
let bookHrs = 1;
let sysReady = false;
let currentFilter = 'all';
let pollTimer = null;
let voting = false; // prevents double-voting

// Allow inline HTML functions to call handleVote
window.handleVote = handleVote;

// ─── Helpers ─────────────────────────────────────
function showToast(msg, color = 'green') {
    console.log(`[UI] Toast Notification: "${msg}"`);
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    if (color === 'warn') t.style.borderColor = 'rgba(255,184,77,0.3)';
    if (color === 'danger') t.style.borderColor = 'rgba(255,107,107,0.3)';
    document.getElementById('app').appendChild(t);
    requestAnimationFrame(() =>
        requestAnimationFrame(() => t.classList.add('show')),
    );
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    }, 3200);
}

function statusLabel(s) {
    return (
        {
            AVAILABLE: 'Available',
            BOOKED: 'Booked',
            ACTIVE: 'Active',
            EXPIRED: 'Expired',
            CONFLICT: 'Disputed',
            RESOLVED_SAFE: 'Resolved (Safe)',
            RESOLVED_PENALTY: 'Resolved (Penalty)',
        }[s] || s
    );
}

function statusIcon(s) {
    return (
        {
            AVAILABLE: '\u{1f17f}\ufe0f',
            BOOKED: '\ud83d\udccb',
            ACTIVE: '\ud83d\ude97',
            EXPIRED: '\u23f0',
            CONFLICT: '\u26a0\ufe0f',
            RESOLVED_SAFE: '\u2705',
            RESOLVED_PENALTY: '\ud83d\udd34',
        }[s] || '\u{1f17f}\ufe0f'
    );
}

function statusGrad(s) {
    return (
        {
            AVAILABLE: 'rgba(106,228,255,0.10), rgba(77,255,180,0.06)',
            BOOKED: 'rgba(255,184,77,0.10), rgba(106,228,255,0.06)',
            ACTIVE: 'rgba(77,255,180,0.10), rgba(106,228,255,0.06)',
            EXPIRED: 'rgba(255,107,107,0.08), rgba(255,184,77,0.06)',
            CONFLICT: 'rgba(255,184,77,0.10), rgba(255,107,107,0.06)',
            RESOLVED_SAFE: 'rgba(77,255,180,0.06), rgba(106,228,255,0.04)',
            RESOLVED_PENALTY: 'rgba(255,107,107,0.06), rgba(106,228,255,0.04)',
        }[s] || 'rgba(106,228,255,0.08), rgba(77,255,180,0.05)'
    );
}

async function api(method, path, body) {
    console.log(`[API REQUEST] ${method} /api${path}`, body ? body : '');
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${path}`, opts);
    const data = await res.json();
    if (!res.ok) {
        console.error(`[API ERROR] Response from /api${path}:`, data.error);
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    console.log(`[API SUCCESS] /api${path}:`, data);
    return data;
}

// ─── Role Selection ──────────────────────────────
function setRole(r) {
    console.log(`[UI EVENT] Role selected: ${r.toUpperCase()}`);
    role = r;
    roleOverlay.classList.add('hidden');
    setTimeout(() => {
        roleOverlay.style.display = 'none';
    }, 350);

    roleBadge.style.display = '';
    roleBadgeIcon.textContent = {
        parker: '\ud83d\ude97',
        owner: '\ud83c\udfe0',
        admin: '\ud83d\udee1\ufe0f',
    }[r];
    roleBadgeLabel.textContent = r.charAt(0).toUpperCase() + r.slice(1);
    roleBadge.setAttribute('data-role', r);

    listSpotBtn.style.display = r === 'owner' ? '' : 'none';

    showToast(`Logged in as ${roleBadgeLabel.textContent}`);
    renderMarkers();

    if (sheet.classList.contains('open')) updateSheet();
}

function openRoleSelector() {
    console.log(`[UI EVENT] Opening Role Selector`);
    role = null;
    myId = null;
    selId = null;
    closeSheet();
    activeBookingCard.style.display = 'none';
    roleBadge.style.display = 'none';
    listSpotBtn.style.display = 'none';
    adminPassGroup.style.display = 'none';
    adminPassError.style.display = 'none';
    roleOverlay.style.display = '';
    roleOverlay.classList.remove('hidden');
}

// ─── Map ─────────────────────────────────────────
function initMap() {
    console.log(`[SYSTEM] Initializing Leaflet map...`);
    map = L.map('map', { zoomControl: false }).setView([-33.918, 151.231], 15);
    L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
            attribution: '© <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
            subdomains: 'abcd',
        },
    ).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', () => {
        if (sheet.classList.contains('open')) closeSheet();
    });
}

// ─── Markers ─────────────────────────────────────
function getFilteredSpots() {
    const q = searchInput.value.trim().toLowerCase();
    let list = spots;
    if (q) list = list.filter((s) => s.address.toLowerCase().includes(q));
    if (currentFilter !== 'all')
        list = list.filter((s) => s.status === currentFilter);
    return list;
}

function renderMarkers() {
    markers.forEach((m) => map.removeLayer(m));
    markers = [];

    const filtered = getFilteredSpots();
    updateHint(filtered);

    for (const spot of filtered) {
        const isSelected = selId === spot.id;
        const html = `<div class="pinWrap">
      <div class="pinMarker status-${spot.status}${isSelected ? ' active' : ''}" data-id="${spot.id}">
        <div class="pinBubble"><span>${spot.price} XRP/hr</span></div>
        <div class="pinTip"></div>
      </div>
    </div>`;

        const icon = L.divIcon({
            className: '',
            html,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
        });
        const m = L.marker([spot.lat, spot.lng], { icon }).addTo(map);
        m.on('click', () => {
            console.log(
                `[MAP EVENT] Clicked pin: ${spot.id} (Status: ${spot.status})`,
            );
            selectSpot(spot);
        });
        markers.push(m);
    }
}

function updateHint(filtered) {
    const list = filtered || getFilteredSpots();
    if (!sysReady) {
        hintText.textContent = 'Server offline — retrying...';
        return;
    }
    if (!list.length) {
        hintText.textContent = 'No spots match your filter';
        return;
    }
    const counts = {};
    list.forEach((s) => {
        counts[s.status] = (counts[s.status] || 0) + 1;
    });
    const parts = [`${list.length} spot${list.length !== 1 ? 's' : ''}`];
    if (counts.AVAILABLE) parts.push(`${counts.AVAILABLE} available`);
    if (counts.ACTIVE) parts.push(`${counts.ACTIVE} active`);
    if (counts.EXPIRED) parts.push(`${counts.EXPIRED} expired`);
    if (counts.CONFLICT) parts.push(`${counts.CONFLICT} disputed`);
    if (counts.RESOLVED_SAFE) parts.push(`${counts.RESOLVED_SAFE} resolved`);
    if (counts.RESOLVED_PENALTY)
        parts.push(`${counts.RESOLVED_PENALTY} slashed`);
    hintText.textContent = parts.join(' \u00b7 ');
}

// ─── System Status ───────────────────────────────
function updateSystemPill() {
    if (sysReady) {
        systemPill.classList.add('ready');
        systemPill.classList.remove('connecting');
    } else {
        systemPill.classList.add('connecting');
        systemPill.classList.remove('ready');
    }
}

// ─── Polling ─────────────────────────────────────
async function poll() {
    try {
        const [statusRes, spotsRes] = await Promise.all([
            fetch('/api/system/status').then((r) => r.json()),
            fetch('/api/spots').then((r) => r.json()),
        ]);
        sysReady = statusRes.ready;
        updateSystemPill();

        const changed = JSON.stringify(spotsRes) !== JSON.stringify(spots);
        spots = spotsRes;

        if (changed) {
            console.log(`[POLL] Data change detected. Updating UI markers.`);
            renderMarkers();
        }
        updateActiveCard();
        if (selId && sheet.classList.contains('open')) updateSheet();
        updateHint();
    } catch (e) {
        if (sysReady) console.error(`[POLL FATAL] Backend disconnected.`);
        sysReady = false;
        updateSystemPill();
        updateHint();
    }
}

function startPolling() {
    console.log(`[SYSTEM] Starting 3.0s Background Poller...`);
    poll();
    pollTimer = setInterval(poll, POLL_MS);
}

// ─── Sheet ───────────────────────────────────────
function openSheet() {
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
}

function closeSheet() {
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    selId = null;
    renderMarkers();
}

function selectSpot(spot) {
    selId = spot.id;
    if (spot.status !== 'AVAILABLE') myId = spot.id;
    openSheet();
    updateSheet();
    renderMarkers();
    map.setView([spot.lat, spot.lng], Math.max(map.getZoom(), 15), {
        animate: true,
    });
}

function updateSheet() {
    const spot = spots.find((s) => s.id === selId);
    if (!spot) {
        closeSheet();
        return;
    }

    // Header
    sheetTitle.textContent = spot.address;
    sheetSubtitle.textContent = `Spot ${spot.id.replace('spot_', '#')} \u00b7 ${statusLabel(spot.status)}`;
    statusBadge.textContent = statusLabel(spot.status);
    statusBadge.className = `statusBadge status-${spot.status}`;
    sheetMeta.style.display = '';

    // Photo
    spotPhoto.style.background = `linear-gradient(135deg, ${statusGrad(spot.status)})`;
    spotPhotoIcon.textContent = statusIcon(spot.status);
    spotPhotoBadge.textContent = spot.status;

    // Info cards
    rateValue.textContent = `${spot.price} XRP/hr`;
    depositValue.textContent = `${spot.price * 3} XRP`;
    durationValue.textContent = spot.duration
        ? `${spot.duration} hrs`
        : '\u2014';
    elapsedValue.textContent = spot.hoursElapsed
        ? `${spot.hoursElapsed} hrs`
        : '\u2014';

    // Dynamic UI injection
    renderDynamicActions(spot);
}

function renderDynamicActions(spot) {
  const container = $("dynamicSheetActions");
  if (!container) return;

  let html = "";
  const isSafe = spot.status === 'RESOLVED_SAFE';

  // Generate XRPL Explorer Links dynamically
  let txLinks = '';
  if (spot.lastTrickleHash || spot.escrowHash) {
      txLinks = `<div class="txLinksRow">`;
      if (spot.lastTrickleHash) {
          txLinks += `<a href="https://testnet.xrpl.org/transactions/${spot.lastTrickleHash}" target="_blank" class="txLink">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              Latest Stream TX
          </a>`;
      }
      if (spot.escrowHash) {
          txLinks += `<a href="https://testnet.xrpl.org/transactions/${spot.escrowHash}" target="_blank" class="txLink danger">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              Escrow Settlement TX
          </a>`;
      }
      txLinks += `</div>`;
  }

  // 1. RESOLVED STATE (ALL ROLES)
  if (spot.status.startsWith("RESOLVED")) {
    html = `
      <div class="resolutionBanner ${isSafe ? 'safe' : 'penalty'}">
        <div class="resolutionIcon">${isSafe ? '✅' : '🔴'}</div>
        <div>${isSafe ? 'Resolved — Collateral Returned' : 'Resolved — Collateral Slashed'}</div>
      </div>
      ${txLinks}
    `;
    container.innerHTML = html;
    return;
  }

  // 2. ROLE: PARKER
  if (role === "parker") {
    if (spot.status === "AVAILABLE") {
      html = `
        <div class="callout">
          <div class="calloutTitle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            XRPL time-based escrow
          </div>
          <div class="muted tiny" style="line-height:1.5; margin-bottom:10px;">
            Your payment locks in an on-chain escrow. Funds trickle to the owner every hour. Collateral (3× rate) is held and returned on safe checkout.
          </div>
        </div>
        <button class="btnPrimary" id="injectBookBtn" ${!sysReady ? 'disabled' : ''}>
          ${!sysReady ? 'Backend Offline — Cannot Book' : 'Book this spot'}
        </button>
      `;
    } else if (spot.status === "BOOKED") {
      html = `
        <button class="btnPrimary btnGreen" id="injectArriveBtn">
          📍 I Have Arrived — Lock Funds
        </button>
      `;
    } else if (spot.status === "ACTIVE") {
       html = `<div class="callout muted tiny" style="text-align:center;">Session is Active. Tap your active booking card floating below to end the session.</div> ${txLinks}`;
    } else if (spot.status === "EXPIRED" || spot.status === "CONFLICT") {
       if (spot.votes?.parker) {
           html = `<div class="voteBanner">You voted: ${spot.votes.parker.toUpperCase()}. Awaiting consensus.</div> ${txLinks}`;
       } else {
           html = `
             <div class="voteBanner">Session expired. Are you still parked?</div>
             <div class="voteButtons">
               <button class="voteBtn safe" onclick="window.handleVote('safe')">No (I Left)</button>
               <button class="voteBtn penalty" onclick="window.handleVote('penalty')">Yes (Still Here)</button>
             </div>
             ${txLinks}
           `;
       }
    }
  }

  // 3. ROLE: OWNER
  else if (role === "owner") {
    if (spot.status === "AVAILABLE") {
      html = `<div class="callout muted tiny" style="text-align:center;">Spot is available. Waiting for a parker to book.</div>`;
    } else if (spot.status === "BOOKED") {
      html = `<div class="callout muted tiny" style="text-align:center;">Spot booked. Waiting for parker to arrive and lock funds.</div>`;
    } else if (spot.status === "ACTIVE") {
      html = `<div class="callout muted tiny" style="text-align:center;">Session active. XRP is streaming to your wallet.</div> ${txLinks}`;
    } else if (spot.status === "EXPIRED") {
       if (spot.votes?.owner) {
           html = `<div class="voteBanner">You voted: ${spot.votes.owner.toUpperCase()}. Awaiting consensus.</div> ${txLinks}`;
       } else {
           html = `
             <div class="voteBanner">Session expired. Is the car still parked?</div>
             <div class="voteButtons">
               <button class="voteBtn safe" onclick="window.handleVote('safe')">No (Safe Checkout)</button>
               <button class="voteBtn penalty" onclick="window.handleVote('penalty')">Yes (Slash Collateral)</button>
             </div>
             ${txLinks}
           `;
       }
    } else if (spot.status === "CONFLICT") {
       html = `
         <div class="conflictBanner">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
           Status Disputed — Awaiting Admin Resolution
         </div>
         ${txLinks}
       `;
    }
  }

  // 4. ROLE: ADMIN
  else if (role === "admin") {
    if (spot.status === "CONFLICT") {
       html = `
         <div class="adminVoteCard">
            <div class="adminVoteTitle">Admin Tie-Breaker Required</div>
            <div class="adminVoteInfo" style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
              <div class="adminVoteRow" style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; border:1px solid var(--border);">
                <span class="voteLabel" style="font-size:12px; font-weight:700;">Parker voted</span>
                <span class="voteValue ${spot.votes?.parker}" style="font-size:11px; font-weight:800;">${(spot.votes?.parker || "—").toUpperCase()}</span>
              </div>
              <div class="adminVoteRow" style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; border:1px solid var(--border);">
                <span class="voteLabel" style="font-size:12px; font-weight:700;">Owner voted</span>
                <span class="voteValue ${spot.votes?.owner}" style="font-size:11px; font-weight:800;">${(spot.votes?.owner || "—").toUpperCase()}</span>
              </div>
            </div>
            <div class="voteButtons">
              <button class="voteBtn safe" onclick="window.handleVote('safe')">Rule Safe</button>
              <button class="voteBtn penalty" onclick="window.handleVote('penalty')">Rule Penalty</button>
            </div>
         </div>
         ${txLinks}
       `;
    } else {
       html = `<div class="callout muted tiny" style="text-align:center;">No admin intervention required. Current status: ${spot.status}</div> ${txLinks}`;
    }
  }

  container.innerHTML = html;

  // Re-attach event listeners for dynamically injected buttons
  const bBtn = $("injectBookBtn");
  if (bBtn) bBtn.addEventListener("click", () => {
      console.log(`[UI EVENT] Clicked "Book this spot" on ${spot.id}`);
      openBookingModal();
  });

  const aBtn = $("injectArriveBtn");
  if (aBtn) aBtn.addEventListener("click", () => { 
      console.log(`[UI EVENT] Clicked "I Have Arrived" on ${spot.id}`);
      myId = spot.id; 
      startParking(false); 
  });
}

// ─── Voting ──────────────────────────────────────
async function handleVote(vote) {
    const spotId = selId || myId;
    console.log(
        `[UI EVENT] Casting Vote: Role=${role} Vote=${vote} Spot=${spotId}`,
    );
    if (!spotId || !role || voting) return;
    voting = true;

    document.querySelectorAll('.voteBtn').forEach((b) => {
        b.disabled = true;
        b.textContent = 'Voting...';
    });

    try {
        await api('POST', '/vote', { spotId, voter: role, vote });
        showToast(`Vote recorded: ${vote.toUpperCase()}`);
        await poll();
    } catch (e) {
        showToast('Vote failed: ' + e.message, 'danger');
    }

    document.querySelectorAll('.voteBtn').forEach((b) => {
        b.disabled = false;
    });
    voting = false;
}

// ─── Active Booking Card ─────────────────────────
function updateActiveCard() {
    if (!myId) {
        activeBookingCard.style.display = 'none';
        return;
    }

    const spot = spots.find((s) => s.id === myId);
    if (!spot || spot.status === 'AVAILABLE') {
        myId = null;
        activeBookingCard.style.display = 'none';
        return;
    }

    activeBookingCard.style.display = '';
    activeSpotName.textContent = spot.address;

    const inner = activeBookingCard.querySelector('.activeInner');
    inner.classList.remove('expired', 'conflict');
    activeDot.classList.remove('expired', 'conflict', 'resolved');
    activeTimer.classList.remove('expired');

    const voteSec = $('activeVoteSection');
    const conflictSec = $('activeConflictSection');
    const resSec = $('activeResolutionSection');
    const actions = $('activeActions');

    voteSec.style.display = 'none';
    conflictSec.style.display = 'none';
    resSec.style.display = 'none';

    switch (spot.status) {
        case 'BOOKED':
            activeSubText.textContent = 'Booked \u2014 head to the spot';
            activeTimer.textContent = '\u2014\u2014:\u2014\u2014';
            updateLifecycle('created');
            trickleRow.style.display = 'none';
            actions.style.display = 'none';
            break;

        case 'ACTIVE': {
            const pct =
                spot.duration > 0 ? spot.hoursElapsed / spot.duration : 0;
            const released = spot.price * spot.hoursElapsed;
            const total = spot.price * spot.duration;
            const remaining = spot.duration - spot.hoursElapsed;

            activeSubText.textContent = `${spot.duration}h session \u00b7 ${total} XRP locked`;
            activeTimer.textContent = `${remaining}h left`;
            updateLifecycle('streaming');

            trickleRow.style.display = '';
            trickleFill.style.width = `${pct * 100}%`;
            trickleLabel.textContent = `${released.toFixed(1)} / ${total.toFixed(1)} XRP released`;
            trickleRate.textContent = `${spot.price} XRP/hr`;

            actions.style.display = '';
            endBookingBtn.style.display = role === 'parker' ? '' : 'none';
            break;
        }

        case 'EXPIRED': {
            inner.classList.add('expired');
            activeDot.classList.add('expired');
            activeTimer.textContent = 'EXPIRED';
            activeTimer.classList.add('expired');
            activeSubText.textContent = 'Session expired \u2014 vote to settle';
            updateLifecycle('vote');

            const total = spot.price * spot.duration;
            trickleRow.style.display = '';
            trickleFill.style.width = '100%';
            trickleLabel.textContent = `${total.toFixed(1)} / ${total.toFixed(1)} XRP released`;
            trickleRate.textContent = '';
            actions.style.display = 'none';

            if ((role === 'parker' || role === 'owner') && !spot.votes[role]) {
                voteSec.style.display = '';
                const banner = $('activeVoteBanner');
                const buttons = $('activeVoteButtons');
                banner.textContent =
                    role === 'parker'
                        ? 'Are you still parked?'
                        : 'Is the car still parked?';
                buttons.innerHTML =
                    role === 'parker'
                        ? `<button class="voteBtn safe" onclick="window.handleVote('safe')">No (I Left)</button>
             <button class="voteBtn penalty" onclick="window.handleVote('penalty')">Yes (Still Here)</button>`
                        : `<button class="voteBtn safe" onclick="window.handleVote('safe')">No (Safe Checkout)</button>
             <button class="voteBtn penalty" onclick="window.handleVote('penalty')">Yes (Slash Collateral)</button>`;
            } else if (spot.votes[role]) {
                voteSec.style.display = '';
                $('activeVoteBanner').textContent =
                    `You voted: ${spot.votes[role].toUpperCase()}. Awaiting consensus.`;
                $('activeVoteButtons').innerHTML = '';
            }
            break;
        }

        case 'CONFLICT':
            inner.classList.add('conflict');
            activeDot.classList.add('conflict');
            activeTimer.textContent = 'DISPUTED';
            activeTimer.classList.add('expired');
            activeSubText.textContent = 'Votes disagree \u2014 admin needed';
            updateLifecycle('vote');
            trickleRow.style.display = 'none';
            actions.style.display = 'none';

            if (role === 'admin' && !spot.votes.admin) {
                voteSec.style.display = '';
                $('activeVoteBanner').textContent =
                    `Parker: ${(spot.votes.parker || '\u2014').toUpperCase()} \u00b7 Owner: ${(spot.votes.owner || '\u2014').toUpperCase()}`;
                const btns = $('activeVoteButtons');
                btns.innerHTML = `
          <button class="voteBtn safe" onclick="window.handleVote('safe')">Rule Safe</button>
          <button class="voteBtn penalty" onclick="window.handleVote('penalty')">Rule Penalty</button>`;
            } else {
                conflictSec.style.display = '';
            }
            break;

        case 'RESOLVED_SAFE':
        case 'RESOLVED_PENALTY': {
            const isSafe = spot.status === 'RESOLVED_SAFE';
            activeDot.classList.add('resolved');
            activeTimer.textContent = 'DONE';
            activeTimer.classList.add('expired');
            activeSubText.textContent = isSafe
                ? 'Collateral returned'
                : 'Collateral slashed';
            updateLifecycle('complete');
            trickleRow.style.display = 'none';
            actions.style.display = 'none';

            resSec.style.display = '';
            const banner = $('activeResolutionBanner');
            banner.className = `resolutionBanner ${isSafe ? 'safe' : 'penalty'}`;
            banner.innerHTML = `
        <div class="resolutionIcon">${isSafe ? '\u2705' : '\ud83d\udd34'}</div>
        <div>${isSafe ? 'Resolved \u2014 Collateral Returned' : 'Resolved \u2014 Collateral Slashed'}</div>`;
            break;
        }
    }
}

function updateLifecycle(stage) {
    const stages = ['created', 'streaming', 'vote', 'complete'];
    const stageEls = escrowLifecycle.querySelectorAll('.escrowStage');
    const lineEls = escrowLifecycle.querySelectorAll('.escrowLine');
    const idx = stages.indexOf(stage);

    stageEls.forEach((el, i) => {
        el.classList.remove('completed', 'active');
        if (i < idx) el.classList.add('completed');
        if (i === idx) el.classList.add('active');
    });
    lineEls.forEach((el, i) => {
        el.classList.toggle('completed', i < idx);
    });
}

// ─── Booking Modal ───────────────────────────────
function openBookingModal() {
    const spot = spots.find((s) => s.id === selId);
    if (!spot) return;

    bookHrs = 1;
    modalSpotName.textContent = spot.address;
    modalSpotSub.textContent = `${spot.price} XRP/hr`;

    quickDurations.innerHTML = '';
    [1, 2, 3, 4].forEach((h) => {
        const btn = document.createElement('button');
        btn.className = `quickBtn${h === 1 ? ' selected' : ''}`;
        btn.type = 'button';
        btn.textContent = `${h}h`;
        btn.addEventListener('click', () => {
            bookHrs = h;
            updateBookingCost();
        });
        quickDurations.appendChild(btn);
    });

    updateBookingCost();
    modalView.style.display = '';
    successView.style.display = 'none';
    loadingView.style.display = 'none';

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modalOpen');
}

function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modalOpen');
}

function updateBookingCost() {
    const spot = spots.find((s) => s.id === selId);
    if (!spot) return;

    const parking = bookHrs * spot.price;
    const deposit = spot.price * 3;
    const total = parking + deposit;

    hoursDisplay.textContent = `${bookHrs} hr${bookHrs !== 1 ? 's' : ''}`;
    costParking.textContent = `${parking.toFixed(2)} XRP`;
    costDeposit.textContent = `${deposit.toFixed(2)} XRP`;
    costTotal.textContent = `${total.toFixed(2)} XRP`;

    hoursDownBtn.disabled = bookHrs <= 1;
    hoursUpBtn.disabled = bookHrs >= 8;

    quickDurations
        .querySelectorAll('.quickBtn')
        .forEach((b) =>
            b.classList.toggle('selected', parseInt(b.textContent) === bookHrs),
        );
}

async function confirmBooking() {
    const spot = spots.find((s) => s.id === selId);
    if (!spot) return;
    console.log(
        `[UI EVENT] Confirming Off-Chain Booking for ${spot.id} for ${bookHrs} hrs`,
    );

    modalConfirmBtn.disabled = true;
    modalConfirmBtn.textContent = 'Negotiating...';

    try {
        const result = await api('POST', '/prepare', {
            spotId: spot.id,
            duration: bookHrs,
        });

        if (result.success) {
            myId = spot.id;

            successDetails.innerHTML = `
        <div class="xrplRow"><span class="muted">Spot</span><span>${spot.address}</span></div>
        <div class="xrplRow"><span class="muted">Duration</span><span>${bookHrs} hour${bookHrs !== 1 ? 's' : ''}</span></div>
        <div class="xrplRow"><span class="muted">Rate</span><span class="accent">${spot.price} XRP/hr</span></div>
        <div class="xrplRow"><span class="muted">Parking cost</span><span>${(bookHrs * spot.price).toFixed(2)} XRP</span></div>
        <div class="xrplRow"><span class="muted">Collateral</span><span>${(spot.price * 3).toFixed(2)} XRP</span></div>
        <div class="xrplRow"><span class="muted">Status</span><span class="mono" style="color:var(--warn)">BOOKED</span></div>`;

            modalView.style.display = 'none';
            successView.style.display = '';
            showToast('Spot booked! Escrow condition prepared off-chain.');
            await poll();
        }
    } catch (e) {
        showToast('Booking failed: ' + e.message, 'danger');
    }

    modalConfirmBtn.disabled = false;
    modalConfirmBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg> Confirm & Book`;
}

async function startParking(fromModal) {
    if (!myId) return;
    console.log(`[UI EVENT] Triggering On-Chain Logic for ${myId}`);

    if (fromModal) {
        modalView.style.display = 'none';
        successView.style.display = 'none';
        loadingView.style.display = '';
        loadingTitle.textContent = 'Processing on XRPL\u2026';
        loadingSub.textContent =
            'Creating payment channel & locking escrow on-chain';
    }

    const btn = $('injectArriveBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Locking XRP on Ledger (~5s)...';
    }

    try {
        const result = await api('POST', '/start', { spotId: myId });
        if (result.success) {
            showToast('Funds Locked! XRP streaming actively.');
            closeModal();
            closeSheet();
            await poll();
        } else {
            throw new Error(result.error || 'Failed to start');
        }
    } catch (e) {
        showToast('Start failed: ' + e.message, 'danger');
        if (fromModal) {
            loadingView.style.display = 'none';
            successView.style.display = '';
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `📍 I Have Arrived — Lock Funds`;
        }
    }
}

// ─── List Modal ──────────────────────────────────
// ─── List Modal ──────────────────────────────────
const ownerRateInput = $('ownerRate');
const ownerStartInput = $('ownerStart');
const ownerEndInput = $('ownerEnd');
const earningsValue = $('earningsValue');

function updateEarningsPreview() {
    if (!ownerRateInput || !ownerStartInput || !ownerEndInput || !earningsValue)
        return;
    const rate = parseFloat(ownerRateInput.value) || 0;
    const start = ownerStartInput.value
        ? new Date(ownerStartInput.value)
        : null;
    const end = ownerEndInput.value ? new Date(ownerEndInput.value) : null;
    if (!start || !end || end <= start) {
        earningsValue.textContent = '— XRP';
        return;
    }
    const hrs = (end - start) / 3600000;
    earningsValue.textContent = `${(rate * hrs).toFixed(2)} XRP`;
}

function openListModal() {
    // Set default dates to Right Now -> +8 Hours
    if (ownerStartInput && ownerEndInput) {
        const now = new Date();
        const end = new Date(now.getTime() + 8 * 3600000);
        const pad = (n) => String(n).padStart(2, '0');
        const format = (d) =>
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        ownerStartInput.value = format(now);
        ownerEndInput.value = format(end);
        updateEarningsPreview();
    }

    listModal.classList.add('open');
    listModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modalOpen');
}

function closeListModal() {
    listModal.classList.remove('open');
    listModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modalOpen');
}
// ─── Event Wiring ────────────────────────────────
function setupEvents() {
    // Role selector
    roleButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('.roleBtn');
        if (!btn) return;
        const r = btn.dataset.role;

        if (r === 'admin') {
            adminPassGroup.style.display = '';
            adminPassInput.value = '';
            adminPassError.style.display = 'none';
            adminPassInput.focus();
        } else {
            adminPassGroup.style.display = 'none';
            setRole(r);
        }
    });

    adminPassSubmit.addEventListener('click', () => {
        if (adminPassInput.value === 'admin') {
            setRole('admin');
        } else {
            adminPassError.style.display = '';
        }
    });

    adminPassInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') adminPassSubmit.click();
    });

    // Role badge → re-open selector
    roleBadge.addEventListener('click', openRoleSelector);

    // Sheet
    closeSheetBtn.addEventListener('click', closeSheet);
    sheetHandle.addEventListener('click', closeSheet);

    // Sheet swipe-to-close
    let touchStartY = 0;
    sheetHandle.addEventListener(
        'touchstart',
        (e) => {
            touchStartY = e.touches[0].clientY;
        },
        { passive: true },
    );
    sheetHandle.addEventListener(
        'touchend',
        (e) => {
            if (e.changedTouches[0].clientY - touchStartY > 50) closeSheet();
        },
        { passive: true },
    );

    // Modal
    $('modalCloseBtn').addEventListener('click', closeModal);
    $('modalCancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Confirm booking
    modalConfirmBtn.addEventListener('click', confirmBooking);

    // Start parking from modal success
    successStartBtn.addEventListener('click', () => startParking(true));

    // Hours stepper
    hoursDownBtn.addEventListener('click', () => {
        if (bookHrs > 1) {
            bookHrs--;
            updateBookingCost();
        }
    });
    hoursUpBtn.addEventListener('click', () => {
        if (bookHrs < 8) {
            bookHrs++;
            updateBookingCost();
        }
    });

    // End booking (early checkout — votes safe)
    endBookingBtn.addEventListener('click', () => {
        console.log(`[UI EVENT] End Session clicked by ${role}`);
        if (!myId || !role) return;
        handleVote('safe');
    });

    // Directions
    directionsBtn.addEventListener('click', () => {
        const spot = spots.find((s) => s.id === selId);
        if (spot) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=walking`,
                '_blank',
            );
        }
    });

    // List spot
    listSpotBtn.addEventListener('click', openListModal);
    listModalCloseBtn.addEventListener('click', closeListModal);
    listModalCancelBtn.addEventListener('click', closeListModal);
    listModal.addEventListener('click', (e) => {
        if (e.target === listModal) closeListModal();
    });

    // Search
    searchInput.addEventListener('input', () => {
        renderMarkers();
        if (sheet.classList.contains('open')) closeSheet();
    });

    // Filter chips
    filterChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.filterChip');
        if (!chip) return;
        currentFilter = chip.dataset.filter;
        filterChips
            .querySelectorAll('.filterChip')
            .forEach((c) =>
                c.classList.toggle(
                    'active',
                    c.dataset.filter === currentFilter,
                ),
            );
        renderMarkers();
        if (sheet.classList.contains('open')) closeSheet();
    });
}

// ─── Init ────────────────────────────────────────
function init() {
    console.log(`[SYSTEM] App Initializing...`);
    initMap();
    setupEvents();
    startPolling();
}

init();
