// ─────────────────────────────────────────────────
// ParkFlow — app.js v6 (Global Transparency Links)
// ─────────────────────────────────────────────────
const POLL_MS = 1500;

// ─── DOM Refs ────────────────────────────────────
const $ = (id) => document.getElementById(id);

const roleBadge = $('roleBadge');
const roleBadgeIcon = $('roleBadgeIcon');
const roleBadgeLabel = $('roleBadgeLabel');
const listSpotBtn = $('listSpotBtn');
const systemPill = $('systemPill');
const systemDot = $('systemDot');
const searchInput = $('searchInput');
const hintText = $('hintText');
const filterChips = $('filterChips');

const closeActiveCardBtn = $('closeActiveCardBtn');

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
const activeLedgerLog = $('activeLedgerLog'); // NEW

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

const listModal = $('listModal');
const listModalCloseBtn = $('listModalCloseBtn');
const listModalCancelBtn = $('listModalCancelBtn');

const roleOverlay = $('roleOverlay');
const roleButtons = $('roleButtons');
const adminPassGroup = $('adminPassGroup');
const adminPassInput = $('adminPassInput');
const adminPassSubmit = $('adminPassSubmit');
const adminPassError = $('adminPassError');

// ─── State ───────────────────────────────────────
let role = null;
let spots = [];
let selId = null;
let myId = null;
let map = null;
let markers = [];
let bookHrs = 1;
let sysReady = false;
let currentFilter = 'all';
let pollTimer = null;
let voting = false;
let isStartingParking = false;

window.handleVote = handleVote;

// ─── Helpers ─────────────────────────────────────
function showToast(msg, color = 'green') {
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
            PENDING_APPROVAL: 'Pending Approval',
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
            PENDING_APPROVAL: '⏳',
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
            PENDING_APPROVAL: 'rgba(255,184,77,0.10), rgba(255,215,0,0.06)',
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
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}

// NEW: Global Ledger HTML Generator
function generateActivityLogHTML(spot, isSafe = null) {
    if (
        !spot.swapHash &&
        !spot.channelCreateHash &&
        !spot.escrowCreateHash &&
        !spot.lastTrickleHash &&
        !spot.resolutionHash
    )
        return '';

    let html = `
    <div class="ledgerLog">
        <div class="ledgerLogTitle">On-Chain Activity Log</div>
        <div style="display:flex; flex-direction:column; gap:6px;">`;

    const createLog = (label, hash, colorClass = '') => `
        <div class="logItem">
            <span>${label}</span>
            <a href="https://testnet.xrpl.org/transactions/${hash}" target="_blank" class="logLink ${colorClass}">${hash.substring(0, 8)}...${hash.substring(hash.length - 6)} ↗</a>
        </div>`;

    if (spot.swapHash) html += createLog('AMM DEX Swap', spot.swapHash);
    if (spot.channelCreateHash)
        html += createLog('Stream Channel Opened', spot.channelCreateHash);
    if (spot.escrowCreateHash)
        html += createLog('Escrow Collateral Locked', spot.escrowCreateHash);
    if (spot.lastTrickleHash)
        html += createLog('Latest Stream Claim', spot.lastTrickleHash);

    if (spot.resolutionHash) {
        html += createLog(
            isSafe ? 'Collateral Refunded' : 'Collateral Slashed',
            spot.resolutionHash,
            isSafe ? 'safe' : 'danger',
        );
    }
    html += `</div></div>`;
    return html;
}

// ─── Role Selection ──────────────────────────────
function setRole(r) {
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

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([-33.918, 151.231], 15);
    L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' },
    ).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.on('click', () => {
        if (sheet.classList.contains('open')) closeSheet();
    });
}

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
        const html = `<div class="pinWrap"><div class="pinMarker status-${spot.status}${isSelected ? ' active' : ''}" data-id="${spot.id}"><div class="pinBubble"><span>${spot.price} XRP/hr</span></div><div class="pinTip"></div></div></div>`;
        const icon = L.divIcon({
            className: '',
            html,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
        });
        const m = L.marker([spot.lat, spot.lng], { icon }).addTo(map);
        m.on('click', () => selectSpot(spot));
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
    list.forEach((s) => (counts[s.status] = (counts[s.status] || 0) + 1));
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

function updateSystemPill() {
    if (sysReady) {
        systemPill.classList.add('ready');
        systemPill.classList.remove('connecting');
    } else {
        systemPill.classList.add('connecting');
        systemPill.classList.remove('ready');
    }
}

function renderOwnerAlerts(pendingSpots) {
    const container = $('ownerAlertsContainer');
    if (!container) return;
    if (pendingSpots.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    pendingSpots.forEach((spot) => {
        let scoreColor = '#ff6b6b';
        if (spot.pendingParkerScore >= 750) scoreColor = '#4dffb4';
        else if (spot.pendingParkerScore >= 650) scoreColor = '#6ae4ff';
        else if (spot.pendingParkerScore >= 550) scoreColor = '#ffb84d';

        html += `
        <div class="approvalToast">
            <div style="font-weight:900; font-size:14px; margin-bottom:4px; color:var(--accent);">Booking Request</div>
            <div class="muted tiny" style="margin-bottom:10px;">${spot.address} (${spot.duration} hrs)</div>
            <div style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:6px; border:1px solid ${scoreColor}55; background:${scoreColor}11; margin-bottom:12px;">
                <span style="font-size:14px; font-weight:900; color:${scoreColor}; font-family:var(--mono);">${spot.pendingParkerScore}</span>
                <span style="font-size:10px; color:var(--muted); text-transform:uppercase;">Trust Score</span>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btnPrimary btnGreen" style="flex:1; padding:8px 0;" onclick="window.apiApprove('${spot.id}', 'accept')">Accept</button>
                <button class="btn btnDanger" style="flex:1; padding:8px 0;" onclick="window.apiApprove('${spot.id}', 'decline')">Decline</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

window.apiApprove = async (spotId, action) => {
    try {
        await api('POST', '/approve', { spotId, action });
        showToast(
            action === 'accept' ? 'Booking Accepted!' : 'Booking Declined',
            action === 'accept' ? 'green' : 'warn',
        );
        await poll();
    } catch (e) {
        showToast('Action failed: ' + e.message, 'danger');
    }
};

async function poll() {
    try {
        const [statusRes, spotsRes] = await Promise.all([
            fetch('/api/system/status').then((r) => r.json()),
            fetch('/api/spots').then((r) => r.json()),
        ]);
        sysReady = statusRes.ready;
        updateSystemPill();

        if (role === 'owner') {
            const pendingSpots = spotsRes.filter(
                (s) => s.status === 'PENDING_APPROVAL',
            );
            renderOwnerAlerts(pendingSpots);
        } else {
            const alertBox = $('ownerAlertsContainer');
            if (alertBox) alertBox.innerHTML = '';
        }

        const nftBadge = $('userNftBadge');
        if (nftBadge && statusRes.profiles) {
            if (role === 'parker') {
                const score = statusRes.profiles.parker.trustScore;
                let color = '#ff6b6b';
                if (score >= 750) color = '#4dffb4';
                else if (score >= 650) color = '#6ae4ff';
                else if (score >= 550) color = '#ffb84d';

                nftBadge.style.display = '';
                nftBadge.innerHTML = `<span class="nftIcon">🌟</span> <span style="color:${color}; font-family:var(--mono);">${score}</span> <span style="margin-left:4px; font-size:10px; font-weight:600; color:var(--muted)">TRUST SCORE</span>`;
                nftBadge.style.borderColor = color;
                nftBadge.style.boxShadow = `0 0 10px ${color}33`;
            } else {
                nftBadge.style.display = 'none';
            }
        }

        const changed = JSON.stringify(spotsRes) !== JSON.stringify(spots);
        spots = spotsRes;

        if (changed) renderMarkers();
        updateActiveCard();
        if (selId && sheet.classList.contains('open')) updateSheet();
        updateHint();
    } catch (e) {
        sysReady = false;
        updateSystemPill();
        updateHint();
    }
}

function startPolling() {
    poll();
    pollTimer = setInterval(poll, POLL_MS);
}

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
    if (spot.status !== 'AVAILABLE' && spot.status !== 'PENDING_APPROVAL')
        myId = spot.id;
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

    sheetTitle.textContent = spot.address;
    sheetSubtitle.textContent = `Spot ${spot.id.replace('spot_', '#')} \u00b7 ${statusLabel(spot.status)}`;
    statusBadge.textContent = statusLabel(spot.status);
    statusBadge.className = `statusBadge status-${spot.status}`;
    sheetMeta.style.display = '';

    spotPhoto.style.background = `linear-gradient(135deg, ${statusGrad(spot.status)})`;
    spotPhotoIcon.textContent = statusIcon(spot.status);
    spotPhotoBadge.textContent = spot.status;

    rateValue.textContent = `${spot.price} XRP/hr`;
    depositValue.textContent = `${spot.price * 3} XRP`;
    durationValue.textContent = spot.duration
        ? `${spot.duration} hrs`
        : '\u2014';
    elapsedValue.textContent = spot.minutesElapsed
        ? `${spot.minutesElapsed} mins`
        : '\u2014';

    renderDynamicActions(spot);
}

function renderDynamicActions(spot) {
    const container = $('dynamicSheetActions');
    if (!container) return;

    let html = '';
    const isSafe = spot.status === 'RESOLVED_SAFE';

    // Use the global function to generate the transparency log for the bottom sheet
    const txLinks = generateActivityLogHTML(spot, isSafe);

    if (spot.status.startsWith('RESOLVED')) {
        html = `
      <div class="resolutionBanner ${isSafe ? 'safe' : 'penalty'}">
        <div class="resolutionIcon">${isSafe ? '✅' : '🔴'}</div>
        <div>${isSafe ? 'Resolved — Collateral Returned' : 'Resolved — Collateral Slashed'}</div>
      </div>
      ${txLinks}`;

        if (role === 'parker') {
            if (spot.nftMinted) {
                html += `<div class="nftCallout"><div style="font-size: 26px; margin-bottom: 5px;">🌟</div><div style="color: #ffd700; font-weight: 900; margin-bottom: 4px; font-size: 14px;">XLS-20 NFT Minted!</div><div class="muted tiny">You earned the "Verified Parker" Soulbound Token for a flawless checkout.</div></div>`;
            }
            if (spot.nftBurned) {
                html += `<div class="nftCallout" style="border-color: var(--danger); background: rgba(255,107,107,0.05); animation: none;"><div style="font-size: 26px; margin-bottom: 5px;">🔥</div><div style="color: var(--danger); font-weight: 900; margin-bottom: 4px; font-size: 14px;">Reputation Burned</div><div class="muted tiny">Your Verified token was destroyed due to an overstay penalty.</div></div>`;
            }
        }
        container.innerHTML = html;
        return;
    }

    if (role === 'parker') {
        if (spot.status === 'AVAILABLE') {
            html = `<div class="callout"><div class="calloutTitle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>XRPL time-based escrow</div><div class="muted tiny" style="line-height:1.5; margin-bottom:10px;">Your payment locks in an on-chain escrow. Funds trickle to the owner every hour. Collateral (3× rate) is held and returned on safe checkout.</div></div><button class="btnPrimary" id="injectBookBtn" ${!sysReady ? 'disabled' : ''}>${!sysReady ? 'Backend Offline — Cannot Book' : 'Book this spot'}</button>`;
        } else if (spot.status === 'PENDING_APPROVAL') {
            html = `<div class="callout" style="border-color:var(--warn); text-align:center;"><p style="color:var(--warn); font-weight:900; margin-bottom:5px; font-size: 14px;">⏳ Pending Approval</p><p class="muted tiny">The owner is currently reviewing your profile and Trust Score.</p></div>`;
        } else if (spot.status === 'BOOKED') {
            if (isStartingParking) {
                html = `<button class="btnPrimary btnGreen" disabled style="display: flex; justify-content: center; align-items: center; gap: 8px;"><div class="loadingSpinner" style="width: 14px; height: 14px; border-width: 2px; margin: 0; animation: spin 0.8s linear infinite;"></div>Locking on Ledger...</button>`;
            } else {
                html = `<button class="btnPrimary btnGreen" id="injectArriveBtn">📍 I Have Arrived — Lock Funds</button>`;
            }
        } else if (spot.status === 'ACTIVE') {
            html = `<div class="callout muted tiny" style="text-align:center;">Session is Active. Tap your active booking card floating below to end the session.</div> ${txLinks}`;
        } else if (spot.status === 'EXPIRED' || spot.status === 'CONFLICT') {
            if (spot.votes?.parker) {
                html = `<div class="voteBanner">You voted: ${spot.votes.parker.toUpperCase()}. Awaiting consensus.</div> ${txLinks}`;
            } else {
                html = `<div class="voteBanner">Session expired. Are you still parked?</div><div class="voteButtons"><button class="voteBtn safe" onclick="window.handleVote('safe')">No (I Left)</button><button class="voteBtn penalty" onclick="window.handleVote('penalty')">Yes (Still Here)</button></div>${txLinks}`;
            }
        }
    } else if (role === 'owner') {
        let scoreColor = '#ff6b6b';
        if (spot.parkerScore >= 750) scoreColor = '#4dffb4';
        else if (spot.parkerScore >= 650) scoreColor = '#6ae4ff';
        else if (spot.parkerScore >= 550) scoreColor = '#ffb84d';

        const trustBadge =
            spot.status !== 'AVAILABLE'
                ? `<div style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:6px; border:1px solid ${scoreColor}55; background:${scoreColor}11; margin-top:6px;"><span style="font-size:12px; font-weight:900; color:${scoreColor}; font-family:var(--mono);">${spot.parkerScore}</span><span style="font-size:9px; color:var(--muted); text-transform:uppercase;">Parker Score</span>${spot.parkerHasNFT ? '<span title="Verified NFT Holder">🌟</span>' : ''}</div>`
                : '';

        if (spot.status === 'AVAILABLE') {
            html = `<div class="callout muted tiny" style="text-align:center;">Spot is available. Waiting for a parker to book.</div>`;
        } else if (spot.status === 'PENDING_APPROVAL') {
            html = `<div class="callout" style="border-color:var(--accent); text-align:center;"><p style="color:var(--accent); font-weight:900; margin-bottom:5px; font-size: 14px;">🔔 Action Required</p><p class="muted tiny">A Parker wants to book this spot. Use the popup in the top right to accept or decline based on their Trust Score.</p></div>`;
        } else if (spot.status === 'BOOKED') {
            html = `<div class="callout muted tiny" style="text-align:center; padding-bottom:8px;">Spot booked. Waiting for parker to arrive and lock funds.<br>${trustBadge}</div>`;
        } else if (spot.status === 'ACTIVE') {
            html = `<div class="callout muted tiny" style="text-align:center; padding-bottom:8px;">Session active. XRP is streaming to your wallet.<br>${trustBadge}</div> ${txLinks}`;
        } else if (spot.status === 'EXPIRED') {
            if (spot.votes?.owner) {
                html = `<div class="voteBanner">You voted: ${spot.votes.owner.toUpperCase()}. Awaiting consensus.</div> ${txLinks}`;
            } else {
                html = `<div class="voteBanner">Session expired. Is the car still parked?</div><div class="voteButtons"><button class="voteBtn safe" onclick="window.handleVote('safe')">No (Safe Checkout)</button><button class="voteBtn penalty" onclick="window.handleVote('penalty')">Yes (Slash Collateral)</button></div>${txLinks}`;
            }
        } else if (spot.status === 'CONFLICT') {
            html = `<div class="conflictBanner"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>Status Disputed — Awaiting Admin Resolution</div>${txLinks}`;
        }
    } else if (role === 'admin') {
        if (spot.status === 'CONFLICT') {
            html = `<div class="adminVoteCard"><div class="adminVoteTitle">Admin Tie-Breaker Required</div><div class="adminVoteInfo" style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;"><div class="adminVoteRow" style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; border:1px solid var(--border);"><span class="voteLabel" style="font-size:12px; font-weight:700;">Parker voted</span><span class="voteValue ${spot.votes?.parker}" style="font-size:11px; font-weight:800;">${(spot.votes?.parker || '—').toUpperCase()}</span></div><div class="adminVoteRow" style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; border:1px solid var(--border);"><span class="voteLabel" style="font-size:12px; font-weight:700;">Owner voted</span><span class="voteValue ${spot.votes?.owner}" style="font-size:11px; font-weight:800;">${(spot.votes?.owner || '—').toUpperCase()}</span></div></div><div class="voteButtons"><button class="voteBtn safe" onclick="window.handleVote('safe')">Rule Safe</button><button class="voteBtn penalty" onclick="window.handleVote('penalty')">Rule Penalty</button></div></div>${txLinks}`;
        } else {
            html = `<div class="callout muted tiny" style="text-align:center;">No admin intervention required. Current status: ${spot.status}</div> ${txLinks}`;
        }
    }

    container.innerHTML = html;

    const bBtn = $('injectBookBtn');
    if (bBtn) bBtn.addEventListener('click', openBookingModal);
    const aBtn = $('injectArriveBtn');
    if (aBtn)
        aBtn.addEventListener('click', () => {
            myId = spot.id;
            startParking(false);
        });
}

async function handleVote(vote) {
    const spotId = selId || myId;
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

function updateActiveCard() {
    if (!myId) {
        activeBookingCard.style.display = 'none';
        return;
    }
    const spot = spots.find((s) => s.id === myId);
    if (
        !spot ||
        spot.status === 'AVAILABLE' ||
        spot.status === 'PENDING_APPROVAL'
    ) {
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

    // NEW: Inject Ledger Log directly into the Parker's floating card
    if (activeLedgerLog) {
        const isSafe = spot.status === 'RESOLVED_SAFE';
        activeLedgerLog.innerHTML = generateActivityLogHTML(spot, isSafe);
    }

    switch (spot.status) {
        case 'BOOKED':
            activeSubText.textContent = 'Booked \u2014 head to the spot';
            activeTimer.textContent = '\u2014\u2014:\u2014\u2014';
            updateLifecycle('created');
            trickleRow.style.display = 'none';
            actions.style.display = 'none';
            break;

        case 'ACTIVE': {
            const elapsedMins = spot.minutesElapsed || 0;
            const pct =
                spot.duration > 0 ? elapsedMins / 60 / spot.duration : 0;
            const released = spot.price * (elapsedMins / 60);
            const total = spot.price * spot.duration;

            const remMins = spot.duration * 60 - elapsedMins;
            const rH = Math.floor(remMins / 60);
            const rM = remMins % 60;
            const timeStr = rH > 0 ? `${rH}h ${rM}m left` : `${rM}m left`;

            activeSubText.textContent = `${spot.duration}h session \u00b7 ${total.toFixed(2)} XRP locked`;
            activeTimer.textContent = timeStr;
            updateLifecycle('streaming');

            trickleRow.style.display = '';
            trickleFill.style.width = `${(pct * 100).toFixed(1)}%`;
            trickleLabel.textContent =
                role === 'parker'
                    ? `${released.toFixed(2)} / ${total.toFixed(2)} XRP to claim`
                    : `${released.toFixed(2)} / ${total.toFixed(2)} XRP released`;
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
            trickleLabel.textContent =
                role === 'parker'
                    ? `${total.toFixed(2)} / ${total.toFixed(2)} XRP to claim`
                    : `${total.toFixed(2)} / ${total.toFixed(2)} XRP released`;
            trickleRate.textContent = '';
            actions.style.display = 'none';

            if ((role === 'parker' || role === 'owner') && !spot.votes[role]) {
                voteSec.style.display = '';
                $('activeVoteBanner').textContent =
                    role === 'parker'
                        ? 'Are you still parked?'
                        : 'Is the car still parked?';
                $('activeVoteButtons').innerHTML =
                    role === 'parker'
                        ? `<button class="voteBtn safe" onclick="window.handleVote('safe')">No (I Left)</button><button class="voteBtn penalty" onclick="window.handleVote('penalty')">Yes (Still Here)</button>`
                        : `<button class="voteBtn safe" onclick="window.handleVote('safe')">No (Safe Checkout)</button><button class="voteBtn penalty" onclick="window.handleVote('penalty')">Yes (Slash Collateral)</button>`;
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
                $('activeVoteButtons').innerHTML =
                    `<button class="voteBtn safe" onclick="window.handleVote('safe')">Rule Safe</button><button class="voteBtn penalty" onclick="window.handleVote('penalty')">Rule Penalty</button>`;
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
            banner.innerHTML = `<div class="resolutionIcon">${isSafe ? '\u2705' : '\ud83d\udd34'}</div><div>${isSafe ? 'Resolved \u2014 Collateral Returned' : 'Resolved \u2014 Collateral Slashed'}</div>`;
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
    lineEls.forEach((el, i) => el.classList.toggle('completed', i < idx));
}

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

    modalConfirmBtn.disabled = true;
    modalConfirmBtn.textContent = 'Sending Request...';
    try {
        const result = await api('POST', '/prepare', {
            spotId: spot.id,
            duration: bookHrs,
        });
        if (result.success) {
            myId = spot.id;
            closeModal();
            showToast(
                'Request sent! Waiting for owner to review your Trust Score.',
            );
            await poll();
        }
    } catch (e) {
        showToast('Booking failed: ' + e.message, 'danger');
    }
    modalConfirmBtn.disabled = false;
    modalConfirmBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Confirm & Book`;
}

async function startParking(fromModal) {
    if (!myId) return;

    isStartingParking = true;
    if (selId === myId) updateSheet();

    // Retrieve selected currency from radio buttons
    const selectedCurrencyEl = document.querySelector(
        'input[name="paymentAsset"]:checked',
    );
    const selectedCurrency = selectedCurrencyEl
        ? selectedCurrencyEl.value
        : 'XRP';

    if (fromModal) {
        modalView.style.display = 'none';
        successView.style.display = 'none';
        loadingView.style.display = '';
        loadingTitle.textContent = 'Processing on XRPL\u2026';
        loadingSub.textContent =
            selectedCurrency !== 'XRP'
                ? `Swapping ${selectedCurrency} via AMM & locking escrow...`
                : 'Creating payment channel & locking escrow on-chain';
    }

    try {
        const result = await api('POST', '/start', {
            spotId: myId,
            currency: selectedCurrency,
        });
        if (result.success) {
            showToast(
                result.hashes.swapHash
                    ? `${selectedCurrency} Swapped & Funds Locked! Streaming actively.`
                    : 'Funds Locked! XRP streaming actively.',
            );
            isStartingParking = false;
            closeModal();
            closeSheet();
            await poll();
        } else {
            throw new Error(result.error || 'Failed to start');
        }
    } catch (e) {
        isStartingParking = false;
        if (selId === myId) updateSheet();
        showToast('Start failed: ' + e.message, 'danger');
        if (fromModal) {
            loadingView.style.display = 'none';
            successView.style.display = '';
        }
    }
}

function updateEarningsPreview() {
    const ownerRateInput = $('ownerRate');
    const ownerStartInput = $('ownerStart');
    const ownerEndInput = $('ownerEnd');
    const earningsValue = $('earningsValue');
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
    const ownerStartInput = $('ownerStart');
    const ownerEndInput = $('ownerEnd');
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

function setupEvents() {
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

    if (closeActiveCardBtn) {
        closeActiveCardBtn.addEventListener('click', () => {
            myId = null; // Clear the tracked spot
            updateActiveCard(); // Instantly hide the card
        });
    }

    adminPassSubmit.addEventListener('click', () => {
        if (adminPassInput.value === 'admin') setRole('admin');
        else adminPassError.style.display = '';
    });
    adminPassInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') adminPassSubmit.click();
    });
    roleBadge.addEventListener('click', openRoleSelector);

    closeSheetBtn.addEventListener('click', closeSheet);
    sheetHandle.addEventListener('click', closeSheet);

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

    $('modalCloseBtn').addEventListener('click', closeModal);
    $('modalCancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modalConfirmBtn.addEventListener('click', confirmBooking);
    successStartBtn.addEventListener('click', () => startParking(true));

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

    endBookingBtn.addEventListener('click', () => {
        if (!myId || !role) return;
        handleVote('safe');
    });

    directionsBtn.addEventListener('click', () => {
        const spot = spots.find((s) => s.id === selId);
        if (spot)
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=walking`,
                '_blank',
            );
    });

    listSpotBtn.addEventListener('click', openListModal);
    listModalCloseBtn.addEventListener('click', closeListModal);
    listModalCancelBtn.addEventListener('click', closeListModal);
    listModal.addEventListener('click', (e) => {
        if (e.target === listModal) closeListModal();
    });

    const ownerRateInput = $('ownerRate');
    const ownerStartInput = $('ownerStart');
    const ownerEndInput = $('ownerEnd');
    if (ownerRateInput)
        ownerRateInput.addEventListener('input', updateEarningsPreview);
    if (ownerStartInput)
        ownerStartInput.addEventListener('input', updateEarningsPreview);
    if (ownerEndInput)
        ownerEndInput.addEventListener('input', updateEarningsPreview);

    const listModalSubmitBtn = $('listModalSubmitBtn');
    if (listModalSubmitBtn) {
        listModalSubmitBtn.addEventListener('click', () => {
            closeListModal();
            showToast('Spot listed successfully! (Demo mode)');
        });
    }

    searchInput.addEventListener('input', () => {
        renderMarkers();
        if (sheet.classList.contains('open')) closeSheet();
    });
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

function init() {
    console.log(`[SYSTEM] App Initializing...`);
    initMap();
    setupEvents();
    startPolling();
}

init();
