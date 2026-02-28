const xrpl = require('xrpl');

const TESTNET_URL = "wss://s.altnet.rippletest.net:51233";

const state = {
    client: new xrpl.Client(TESTNET_URL),
    parkerWallet: null,
    ownerWallet: null,
    adminWallet: null,
    channelId: null,
    escrowSeq: null,
    hourlyRateDrops: "1000000", // 1 XRP per hour
    collateralDrops: "10000000"
};

exports.initLedger = async () => {
    if (!state.client.isConnected()) await state.client.connect();
    const f1 = await state.client.fundWallet();
    const f2 = await state.client.fundWallet();
    const f3 = await state.client.fundWallet();
    state.parkerWallet = f1.wallet;
    state.ownerWallet = f2.wallet;
    state.adminWallet = f3.wallet;
    return { parker: state.parkerWallet.address, owner: state.ownerWallet.address, admin: state.adminWallet.address };
};

exports.startParkingOnChain = async (condition) => {
    // We lock a large amount in the channel to allow for many hours of "trickle"
    const maxPotentialDrops = "50000000"; // 50 XRP capacity
    const payChanTx = await state.client.submitAndWait({
        TransactionType: "PaymentChannelCreate",
        Account: state.parkerWallet.address,
        Amount: maxPotentialDrops,
        Destination: state.ownerWallet.address,
        SettleDelay: 86400,
        PublicKey: state.parkerWallet.publicKey,
    }, { wallet: state.parkerWallet });

    state.channelId = payChanTx.result.meta.AffectedNodes.find(
        n => n.CreatedNode && n.CreatedNode.LedgerEntryType === "PayChannel"
    ).CreatedNode.LedgerIndex;

    const cancelAfter = Math.floor(Date.now() / 1000) - 946684800 + 86400;
    const preparedEscrow = await state.client.autofill({
        TransactionType: "EscrowCreate",
        Account: state.parkerWallet.address,
        Amount: state.collateralDrops,
        Destination: state.ownerWallet.address,
        Condition: condition,
        CancelAfter: cancelAfter
    });
    
    state.escrowSeq = preparedEscrow.Sequence;
    const escrowTx = await state.client.submitAndWait(preparedEscrow, { wallet: state.parkerWallet });

    return { channelHash: payChanTx.result.hash, escrowHash: escrowTx.result.hash, channelId: state.channelId };
};

// Function called by the hourly daemon
exports.claimHourlyRate = async (totalHoursElapsed) => {
    const amountToClaim = (parseInt(state.hourlyRateDrops) * totalHoursElapsed).toString();
    
    // Generate a fresh signature for the cumulative amount
    const signature = xrpl.authorizeChannel(state.parkerWallet, state.channelId, amountToClaim);

    const claimTx = await state.client.submitAndWait({
        TransactionType: "PaymentChannelClaim",
        Account: state.ownerWallet.address,
        Channel: state.channelId,
        Balance: amountToClaim,
        Amount: amountToClaim,
        Signature: signature,
        PublicKey: state.parkerWallet.publicKey
    }, { wallet: state.ownerWallet });

    return claimTx.result.hash;
};

exports.slashCollateral = async (fulfillment, condition) => {
    const finishTx = await state.client.submitAndWait({
        TransactionType: "EscrowFinish",
        Account: state.adminWallet.address,
        Owner: state.parkerWallet.address,
        OfferSequence: state.escrowSeq,
        Condition: condition,
        Fulfillment: fulfillment
    }, { wallet: state.adminWallet });
    return finishTx.result.hash;
};