const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateEscrowLock } = require('./cryptoService');
const xrplService = require('./xrplService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Mock Database of 24 Legit UNSW Parking Spots
let spots = [
    // North Campus (High St / Randwick)
    {
        id: 'unsw-001',
        lat: -33.9155,
        lng: 151.228,
        address: '14 High St, Kensington',
        price: 3.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-002',
        lat: -33.9161,
        lng: 151.234,
        address: '55 High St, Randwick',
        price: 3.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-003',
        lat: -33.9115,
        lng: 151.2335,
        address: '12 Clara St, Randwick',
        price: 1.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },

    // East Campus (Botany St)
    {
        id: 'unsw-004',
        lat: -33.918,
        lng: 151.2375,
        address: '12 Botany St, Randwick',
        price: 2.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-005',
        lat: -33.9145,
        lng: 151.239,
        address: '8 Wansey Rd, Randwick',
        price: 2.8,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },

    // South Campus (Barker St)
    {
        id: 'unsw-006',
        lat: -33.9215,
        lng: 151.235,
        address: '110 Barker St, Kingsford',
        price: 3.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-007',
        lat: -33.92,
        lng: 151.226,
        address: '12 Barker St, Kingsford',
        price: 4.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-008',
        lat: -33.923,
        lng: 151.227,
        address: '18 Strachan St, Kingsford',
        price: 1.8,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-009',
        lat: -33.9225,
        lng: 151.231,
        address: '40 Forsyth St, Kingsford',
        price: 2.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },

    // West Campus (Anzac Pde / Kensington)
    {
        id: 'unsw-010',
        lat: -33.9185,
        lng: 151.2245,
        address: '150 Anzac Pde, Kensington',
        price: 4.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-011',
        lat: -33.914,
        lng: 151.2215,
        address: '30 Doncaster Ave, Kensington',
        price: 2.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-012',
        lat: -33.9185,
        lng: 151.222,
        address: '15 Day Ave, Kensington',
        price: 2.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },

    // Surrounding Radials
    {
        id: 'unsw-013',
        lat: -33.9168,
        lng: 151.237,
        address: '90 High St, Randwick',
        price: 2.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-014',
        lat: -33.9205,
        lng: 151.237,
        address: '48 Botany St, Randwick',
        price: 1.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-015',
        lat: -33.9205,
        lng: 151.23,
        address: '45 Barker St, Kingsford',
        price: 3.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-016',
        lat: -33.9215,
        lng: 151.229,
        address: '22 Willis St, Kingsford',
        price: 2.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-017',
        lat: -33.916,
        lng: 151.223,
        address: '88 Anzac Pde, Kensington',
        price: 4.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-018',
        lat: -33.9145,
        lng: 151.2245,
        address: '10 Ascot St, Kensington',
        price: 3.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-019',
        lat: -33.913,
        lng: 151.236,
        address: '33 Arthur St, Randwick',
        price: 2.0,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-020',
        lat: -33.918,
        lng: 151.2395,
        address: '14 Magill St, Randwick',
        price: 1.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-021',
        lat: -33.922,
        lng: 151.2255,
        address: '5 Houston Rd, Kingsford',
        price: 2.2,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-022',
        lat: -33.924,
        lng: 151.2245,
        address: '9 Meeks St, Kingsford',
        price: 1.8,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-023',
        lat: -33.917,
        lng: 151.221,
        address: '75 Doncaster Ave, Kensington',
        price: 1.5,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-024',
        lat: -33.9125,
        lng: 151.227,
        address: '60 Bowral St, Kensington',
        price: 1.2,
        status: 'AVAILABLE',
        duration: 0,
        hoursElapsed: 0,
        votes: {},
    },
];

console.log('=========================================');
console.log('🚀 Server Booting... Firing up XRPL...');
console.log('=========================================');
xrplService.initLedger();

setInterval(async () => {
    for (let spot of spots) {
        if (spot.status === 'ACTIVE') {
            spot.hoursElapsed++;
            console.log(
                `\n[CRON] Spot ${spot.id} ticked to Hour ${spot.hoursElapsed}. Triggering claim...`,
            );

            try {
                spot.lastTrickleHash = await xrplService.claimHourlyRate(spot);
            } catch (e) {
                console.error(
                    `[CRON ERROR] Trickle failed on spot ${spot.id}:`,
                    e.message,
                );
            }

            if (spot.hoursElapsed >= spot.duration) {
                console.log(
                    `[CRON] ⏰ Spot ${spot.id} duration expired! Awaiting consensus votes.`,
                );
                spot.status = 'EXPIRED';
            }
        }
    }
}, 10000);

app.get('/api/system/status', (req, res) =>
    res.json({ ready: xrplService.isReady() }),
);
app.get('/api/spots', (req, res) => res.json(spots));

app.post('/api/prepare', (req, res) => {
    console.log(`\n[API POST] /prepare -> payload:`, req.body);
    const { spotId, duration } = req.body;
    const spot = spots.find((s) => s.id === spotId);

    console.log(`[API TRACE] Generating Crypto Lock off-chain...`);
    const lock = generateEscrowLock();

    spot.status = 'BOOKED';
    spot.duration = duration;
    spot.condition = lock.condition;
    spot.fulfillment = lock.fulfillment;
    spot.votes = { parker: null, owner: null, admin: null };

    console.log(`[API RESPONSE] Prepare successful. Spot status -> BOOKED\n`);
    res.json({ success: true, spot });
});

app.post('/api/start', async (req, res) => {
    console.log(`\n[API POST] /start -> payload:`, req.body);
    const { spotId } = req.body;
    const spot = spots.find((s) => s.id === spotId);

    try {
        console.log(`[API TRACE] Handing off to XRPL Service...`);
        const hashes = await xrplService.startParkingOnChain(spot);
        spot.status = 'ACTIVE';
        console.log(
            `[API RESPONSE] Start successful! Returning hashes to frontend.\n`,
        );
        res.json({ success: true, hashes });
    } catch (e) {
        console.error(`[API FATAL] /start crash:`, e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/vote', async (req, res) => {
    console.log(`\n[API POST] /vote -> payload:`, req.body);
    const { spotId, voter, vote } = req.body;
    const spot = spots.find((s) => s.id === spotId);

    spot.votes[voter] = vote;
    console.log(`[API TRACE] Voting matrix updated:`, spot.votes);

    // ==========================================
    // THE FIX: Early Checkout Bypass
    // If the Parker voluntarily leaves early, we don't need the Owner's permission.
    // Instantly resolve to SAFE to stop the billing daemon and return collateral.
    // ==========================================
    if (spot.status === 'ACTIVE' && voter === 'parker' && vote === 'safe') {
        console.log(
            `[API CONSENSUS] Parker executed early checkout. Auto-resolving to SAFE.`,
        );
        spot.status = 'RESOLVED_SAFE';
        return res.json(spot);
    }

    const votesArr = Object.values(spot.votes);
    const penaltyVotes = votesArr.filter((v) => v === 'penalty').length;
    const safeVotes = votesArr.filter((v) => v === 'safe').length;

    // Standard 2/3 Consensus Logic (Used for EXPIRED or CONFLICT states)
    if (penaltyVotes >= 2 || safeVotes >= 2) {
        const isPenalty = penaltyVotes >= 2;
        spot.status = isPenalty ? 'RESOLVED_PENALTY' : 'RESOLVED_SAFE';
        console.log(`[API CONSENSUS] 🏁 2/3 Reached! Outcome: ${spot.status}`);

        if (isPenalty) {
            try {
                console.log(
                    `[API TRACE] Hitting XRPL Service to slash collateral...`,
                );
                spot.escrowHash = await xrplService.slashCollateral(spot);
            } catch (e) {
                console.error('[API ERROR] Failed to slash:', e.message);
            }
        }
    } else if (
        spot.votes.parker &&
        spot.votes.owner &&
        spot.votes.parker !== spot.votes.owner
    ) {
        spot.status = 'CONFLICT';
        console.log(`[API CONSENSUS] ⚠️ CONFLICT triggered! Awaiting Admin.`);
    }

    console.log(`[API RESPONSE] Vote processed.\n`);
    res.json(spot);
});

app.listen(3000, () =>
    console.log('========================================='),
);
