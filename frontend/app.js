const API_URL = '/api';
const el = {
    initBtn: document.getElementById('initBtn'),
    bookBtn: document.getElementById('bookBtn'),
    startBtn: document.getElementById('startBtn'),
    initStatus: document.getElementById('initStatus'),
    parkerStatus: document.getElementById('parkerStatus'),
    voteStatus: document.getElementById('voteStatus'),
    parkerStep: document.getElementById('parkerStep'),
    votingStep: document.getElementById('votingStep'),
    bookingUI: document.getElementById('bookingUI'),
    arrivalUI: document.getElementById('arrivalUI')
};

const explorerLink = (hash) => `<a href="https://testnet.xrpl.org/transactions/${hash}" target="_blank" class="tx-link">Verify on Ledger ↗</a>`;

// Polling for Hourly Trickle Status
setInterval(async () => {
    if (el.votingStep.style.display === 'block') {
        const res = await fetch(`${API_URL}/status`, { method: 'POST' });
        const session = await res.json();
        if (session.status === 'ACTIVE') {
            el.parkerStatus.innerHTML = `
                <b>ACTIVE TICKING...</b><br>
                Hours Paid: ${session.hoursElapsed} XRP<br>
                Latest Trickle Hash: ${session.lastTrickleHash ? session.lastTrickleHash.substring(0,10) + '...' : 'Waiting for Hour 1'}<br>
                ${session.lastTrickleHash ? explorerLink(session.lastTrickleHash) : ''}
            `;
        }
    }
}, 3000);

el.initBtn.onclick = async () => {
    el.initStatus.innerHTML = "<i>Funding System...</i>";
    const res = await fetch(`${API_URL}/init`, { method: 'POST' });
    const data = await res.json();
    el.initStatus.innerHTML = `<b>System Ready.</b> Admin: ${data.admin.substring(0,8)}...`;
    el.parkerStep.style.display = 'block';
};

el.bookBtn.onclick = async () => {
    await fetch(`${API_URL}/prepare`, { method: 'POST' });
    el.parkerStatus.innerHTML = "<b>Spot Reserved.</b> Arrive to start billing.";
    el.bookingUI.style.display = 'none';
    el.arrivalUI.style.display = 'block';
};

el.startBtn.onclick = async () => {
    el.parkerStatus.innerHTML = "<i>Opening Channel...</i>";
    const res = await fetch(`${API_URL}/start`, { method: 'POST' });
    const data = await res.json();
    el.parkerStatus.innerHTML = `<b>STREAMING ACTIVE.</b><br>Channel: ${explorerLink(data.channelHash)}`;
    el.votingStep.style.display = 'block';
};

async function castVote(voter, vote) {
    const res = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter, vote })
    });
    const data = await res.json();
    if (data.status.startsWith('RESOLVED')) {
        el.voteStatus.innerHTML = `<b>CONSENSUS: ${data.status}</b><br>Final Hourly Hash: ${explorerLink(data.lastTrickleHash)}<br>${data.escrowHash ? 'Penalty: ' + explorerLink(data.escrowHash) : ''}`;
    } else {
        el.voteStatus.innerHTML = `Votes: P:${data.currentVotes.parker || '-'} O:${data.currentVotes.owner || '-'} A:${data.currentVotes.admin || '-'}`;
    }
}