const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateEscrowLock } = require('./cryptoService');
const xrplService = require('./xrplService');

const app = express();
app.use(cors()); app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

let activeSession = null;

// ==========================================
// THE HOURLY DAEMON
// ==========================================
setInterval(async () => {
    if (activeSession && activeSession.status === 'ACTIVE') {
        activeSession.hoursElapsed++;
        console.log(`[DAEMON] Hour ${activeSession.hoursElapsed} reached. Triggering XRPL Trickle...`);
        
        try {
            const hash = await xrplService.claimHourlyRate(activeSession.hoursElapsed);
            activeSession.lastTrickleHash = hash;
            console.log(`[DAEMON] Trickle Successful: ${hash}`);
        } catch (e) {
            console.error("[DAEMON ERROR]", e.message);
        }
    }
}, 10000); // 10 seconds = 1 hour for demo purposes

app.post('/api/init', async (req, res) => {
    const addresses = await xrplService.initLedger();
    res.json(addresses);
});

app.post('/api/prepare', (req, res) => {
    const lock = generateEscrowLock();
    activeSession = { 
        condition: lock.condition, 
        fulfillment: lock.fulfillment,
        status: 'PREPARED',
        hoursElapsed: 0,
        votes: { parker: null, owner: null, admin: null },
        lastTrickleHash: null
    };
    res.json({ sessionId: "sess_1", condition: lock.condition });
});

app.post('/api/start', async (req, res) => {
    const hashes = await xrplService.startParkingOnChain(activeSession.condition);
    activeSession.status = 'ACTIVE';
    res.json(hashes);
});

app.post('/api/status', (req, res) => {
    res.json(activeSession);
});

app.post('/api/vote', async (req, res) => {
    const { voter, vote } = req.body;
    activeSession.votes[voter] = vote;

    const votesArr = Object.values(activeSession.votes);
    const penaltyVotes = votesArr.filter(v => v === 'penalty').length;
    const safeVotes = votesArr.filter(v => v === 'safe').length;

    if (penaltyVotes >= 2 || safeVotes >= 2) {
        const isPenalty = penaltyVotes >= 2;
        activeSession.status = isPenalty ? 'RESOLVED_PENALTY' : 'RESOLVED_SAFE';
        
        let escrowHash = null;
        if (isPenalty) {
            escrowHash = await xrplService.slashCollateral(activeSession.fulfillment, activeSession.condition);
        }
        
        res.json({ status: activeSession.status, escrowHash, lastTrickleHash: activeSession.lastTrickleHash });
    } else {
        res.json({ status: 'AWAITING_VOTES', currentVotes: activeSession.votes });
    }
});

app.listen(3000, () => console.log('🚀 ParkNet Trickle Oracle running on 3000'));