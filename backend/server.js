const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateEscrowLock } = require('./cryptoService');
const xrplService = require('./xrplService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// THE REPUTATION STATE
let userProfiles = {
    parker: { safeCheckouts: 0, hasNFT: false, trustScore: 600 }, // Baseline start
};

let spots = [
    {
        id: 'unsw-001',
        lat: -33.9155,
        lng: 151.228,
        address: '14 High St, Kensington',
        price: 3.0,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
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
        minutesElapsed: 0,
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
        minutesElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-004',
        lat: -33.918,
        lng: 151.2375,
        address: '12 Botany St, Randwick',
        price: 2.0,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-006',
        lat: -33.9215,
        lng: 151.235,
        address: '110 Barker St, Kingsford',
        price: 3.5,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-010',
        lat: -33.9185,
        lng: 151.2245,
        address: '150 Anzac Pde, Kensington',
        price: 4.5,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
];

console.log('🚀 Server Booting... Firing up XRPL...');
// CHAIN PROMISES TO INIT AMM AFTER WALLETS
xrplService.initLedger().then(() => {
    xrplService.setupStablecoinAndAMM();
});

// Daemon: Ticks every 10 seconds (Simulating 5 Minutes of real time for the demo)
setInterval(async () => {
    for (let spot of spots) {
        if (spot.status === 'ACTIVE') {
            spot.minutesElapsed += 5;
            console.log(
                `\n[CRON] Spot ${spot.id} ticked to Minute ${spot.minutesElapsed}. Triggering 5-min claim...`,
            );

            try {
                spot.lastTrickleHash =
                    await xrplService.claimFractionalRate(spot);
            } catch (e) {
                console.error(
                    `[CRON ERROR] Trickle failed on spot ${spot.id}:`,
                    e.message,
                );
            }

            // Duration is in hours, so multiply by 60 to compare with minutes
            if (spot.minutesElapsed >= spot.duration * 60) {
                console.log(
                    `[CRON] ⏰ Spot ${spot.id} duration expired! Awaiting consensus votes.`,
                );
                spot.status = 'EXPIRED';
            }
        }
    }
}, 2500);

// Pass profile state to frontend
app.get('/api/system/status', (req, res) =>
    res.json({ ready: xrplService.isReady(), profiles: userProfiles }),
);

// Inject NFT and Score status into spots
app.get('/api/spots', (req, res) => {
    const enrichedSpots = spots.map((s) => ({
        ...s,
        parkerHasNFT: userProfiles.parker.hasNFT,
        parkerScore: userProfiles.parker.trustScore,
    }));
    res.json(enrichedSpots);
});

// MODIFIED: Put spot into PENDING_APPROVAL instead of BOOKED
app.post('/api/prepare', (req, res) => {
    const { spotId, duration } = req.body;
    const spot = spots.find((s) => s.id === spotId);
    const lock = generateEscrowLock();

    spot.status = 'PENDING_APPROVAL';
    spot.duration = duration;
    spot.condition = lock.condition;
    spot.fulfillment = lock.fulfillment;
    spot.votes = { parker: null, owner: null, admin: null };
    spot.nftMinted = false;
    spot.nftBurned = false;

    // Snapshot the Parker's score so the Owner can review it
    spot.pendingParkerScore = userProfiles.parker.trustScore;

    res.json({ success: true, spot });
});

// NEW: Owner Approval Route
app.post('/api/approve', (req, res) => {
    const { spotId, action } = req.body;
    const spot = spots.find((s) => s.id === spotId);

    if (action === 'accept') {
        spot.status = 'BOOKED'; // Now the Parker can arrive
    } else {
        // Reset spot if declined
        spot.status = 'AVAILABLE';
        spot.duration = 0;
        spot.condition = null;
        spot.fulfillment = null;
        spot.pendingParkerScore = null;
    }

    res.json({ success: true, spot });
});

app.post('/api/start', async (req, res) => {
    console.log(`\n[API POST] /start -> payload:`, req.body);
    const { spotId, useStablecoin } = req.body;
    const spot = spots.find((s) => s.id === spotId);

    try {
        let swapHash = null;
        if (useStablecoin) {
            console.log(
                `[API TRACE] Parker selected RLUSD. Calculating swap requirements...`,
            );
            // Calculate total XRP needed (Max Channel Capacity + Escrow Collateral)
            const capacityDrops = spot.price * spot.duration * 1000000;
            const collateralDrops = spot.price * 3 * 1000000;
            const totalDropsNeeded = capacityDrops + collateralDrops;
            console.log(
                `[API TRACE] Demanding ${totalDropsNeeded} drops from AMM DEX.`,
            );

            // Execute the atomic swap before continuing
            swapHash = await xrplService.swapStablecoinForXRP(totalDropsNeeded);
        }

        console.log(`[API TRACE] Triggering Native XRPL Escrow Logic...`);
        const hashes = await xrplService.startParkingOnChain(spot);
        if (swapHash) hashes.swapHash = swapHash;

        spot.status = 'ACTIVE';
        console.log(
            `[API SUCCESS] Parking Active. Hashes returned to frontend:`,
            hashes,
        );
        res.json({ success: true, hashes });
    } catch (e) {
        console.error(`[API FATAL] /start crash:`, e.message);
        res.status(500).json({ error: e.message });
    }
});

// Update the Vote Route to handle FICO logic
app.post('/api/vote', async (req, res) => {
    const { spotId, voter, vote } = req.body;
    const spot = spots.find((s) => s.id === spotId);
    spot.votes[voter] = vote;

    // Helper to process FICO Score & NFT Logic
    const processReputation = (status) => {
        if (status === 'RESOLVED_SAFE') {
            // +25 Points for good behavior, max 850
            userProfiles.parker.trustScore = Math.min(
                850,
                userProfiles.parker.trustScore + 25,
            );
            userProfiles.parker.safeCheckouts++;

            if (
                userProfiles.parker.trustScore >= 700 &&
                !userProfiles.parker.hasNFT
            ) {
                userProfiles.parker.hasNFT = true;
                spot.nftMinted = true;
            }
        } else if (status === 'RESOLVED_PENALTY') {
            // -150 Points for slashing, min 300
            userProfiles.parker.trustScore = Math.max(
                300,
                userProfiles.parker.trustScore - 150,
            );
            userProfiles.parker.hasNFT = false;
            userProfiles.parker.safeCheckouts = 0;
            spot.nftBurned = true;
        }
    };

    // Early Checkout Bypass
    if (spot.status === 'ACTIVE' && voter === 'parker' && vote === 'safe') {
        spot.status = 'RESOLVED_SAFE';
        processReputation(spot.status);
        return res.json(spot);
    }

    const votesArr = Object.values(spot.votes);
    if (
        votesArr.filter((v) => v === 'penalty').length >= 2 ||
        votesArr.filter((v) => v === 'safe').length >= 2
    ) {
        const isPenalty = votesArr.filter((v) => v === 'penalty').length >= 2;
        spot.status = isPenalty ? 'RESOLVED_PENALTY' : 'RESOLVED_SAFE';
        processReputation(spot.status);
        if (isPenalty)
            try {
                spot.escrowHash = await xrplService.slashCollateral(spot);
            } catch (e) {}
    } else if (
        spot.votes.parker &&
        spot.votes.owner &&
        spot.votes.parker !== spot.votes.owner
    ) {
        spot.status = 'CONFLICT';
    }

    res.json(spot);
});

app.listen(3000);
