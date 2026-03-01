const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateEscrowLock } = require('./cryptoService');
const xrplService = require('./xrplService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

let userProfiles = {
    parker: { safeCheckouts: 0, hasNFT: false, trustScore: 600 },
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
        lat: -33.9149,
        lng: 151.2377,
        address: '15 Arthur St, Randwick NSW',
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
    {
        id: 'unsw-025',
        lat: -33.9135,
        lng: 151.2405,
        address: '27 Avoca St, Randwick NSW',
        price: 2.2,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-026',
        lat: -33.9222,
        lng: 151.2306,
        address: '14 Willis Ln, Randwick NSW',
        price: 1.8,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-027',
        lat: -33.9172,
        lng: 151.2188,
        address: '18 Todman Ave, Kensington NSW',
        price: 2.6,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },

    {
        id: 'unsw-029',
        lat: -33.912,
        lng: 151.243,
        address: '11 Perouse Rd, Randwick NSW',
        price: 2.0,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-030',
        lat: -33.9251,
        lng: 151.2313,
        address: '26 Wallace St, Kingsford NSW',
        price: 1.8,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-031',
        lat: -33.927,
        lng: 151.2275,
        address: '35 Rainbow St, Kingsford NSW',
        price: 1.5,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
    {
        id: 'unsw-032',
        lat: -33.9142,
        lng: 151.2418,
        address: '6 St Pauls St, Randwick NSW',
        price: 2.0,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },

    {
        id: 'unsw-034',
        lat: -33.9195,
        lng: 151.242,
        address: '44 Bundock St, Randwick NSW',
        price: 1.0,
        status: 'AVAILABLE',
        duration: 0,
        minutesElapsed: 0,
        votes: {},
    },
];

console.log('🚀 Server Booting... Firing up XRPL...');
xrplService.initLedger().then(() => {
    xrplService.setupStablecoinAndAMM();
});

setInterval(async () => {
    for (let spot of spots) {
        if (spot.status === 'ACTIVE') {
            spot.minutesElapsed += 5;
            try {
                spot.lastTrickleHash =
                    await xrplService.claimFractionalRate(spot);
            } catch (e) {}
            if (spot.minutesElapsed >= spot.duration * 60)
                spot.status = 'EXPIRED';
        }
    }
}, 2500);

app.get('/api/system/status', (req, res) =>
    res.json({ ready: xrplService.isReady(), profiles: userProfiles }),
);

app.get('/api/spots', (req, res) => {
    const enrichedSpots = spots.map((s) => ({
        ...s,
        parkerHasNFT: userProfiles.parker.hasNFT,
        parkerScore: userProfiles.parker.trustScore,
    }));
    res.json(enrichedSpots);
});

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
    spot.pendingParkerScore = userProfiles.parker.trustScore;

    // Clear old hashes
    spot.swapHash = null;
    spot.channelCreateHash = null;
    spot.escrowCreateHash = null;
    spot.lastTrickleHash = null;
    spot.resolutionHash = null;

    res.json({ success: true, spot });
});

app.post('/api/approve', (req, res) => {
    const { spotId, action } = req.body;
    const spot = spots.find((s) => s.id === spotId);
    if (action === 'accept') spot.status = 'BOOKED';
    else {
        spot.status = 'AVAILABLE';
        spot.duration = 0;
        spot.condition = null;
        spot.fulfillment = null;
        spot.pendingParkerScore = null;
    }
    res.json({ success: true, spot });
});

app.post('/api/start', async (req, res) => {
    const { spotId, currency } = req.body;
    const spot = spots.find((s) => s.id === spotId);
    try {
        let swapHash = null;
        if (currency && currency !== 'XRP') {
            // STRICT MATH: Prevent decimal drops being passed to the swap engine
            const capacityDrops = Math.floor(
                spot.price * spot.duration * 1000000,
            );
            const collateralDrops = Math.floor(spot.price * 3 * 1000000);
            swapHash = await xrplService.swapStablecoinForXRP(
                capacityDrops + collateralDrops,
                currency,
            );
            spot.swapHash = swapHash;
        }

        const hashes = await xrplService.startParkingOnChain(spot);
        spot.channelCreateHash = hashes.channelHash;
        spot.escrowCreateHash = hashes.escrowHash;
        spot.status = 'ACTIVE';
        res.json({ success: true, hashes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/vote', async (req, res) => {
    const { spotId, voter, vote } = req.body;
    const spot = spots.find((s) => s.id === spotId);
    spot.votes[voter] = vote;

    const processReputation = (status) => {
        if (status === 'RESOLVED_SAFE') {
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
            userProfiles.parker.trustScore = Math.max(
                300,
                userProfiles.parker.trustScore - 150,
            );
            userProfiles.parker.hasNFT = false;
            userProfiles.parker.safeCheckouts = 0;
            spot.nftBurned = true;
        }
    };

    // Safe Early Checkout Bypass (Refunds to Parker)
    if (spot.status === 'ACTIVE' && voter === 'parker' && vote === 'safe') {
        spot.status = 'RESOLVED_SAFE';
        try {
            spot.resolutionHash = await xrplService.refundCollateral(spot);
        } catch (e) {
            console.error(`[SERVER ERROR] Early refund execution failed:`, e);
        }
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

        if (isPenalty) {
            try {
                spot.resolutionHash = await xrplService.slashCollateral(spot);
            } catch (e) {
                console.error(`[SERVER ERROR] Slash execution failed:`, e);
            }
        } else {
            try {
                spot.resolutionHash = await xrplService.refundCollateral(spot);
            } catch (e) {
                console.error(
                    `[SERVER ERROR] Vote refund execution failed:`,
                    e,
                );
            }
        }
        processReputation(spot.status);
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
