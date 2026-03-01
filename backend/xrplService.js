const xrpl = require('xrpl');

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

const state = {
    client: new xrpl.Client(TESTNET_URL),
    parkerWallet: null,
    ownerWallet: null,
    adminWallet: null,
    isReady: false,
};

exports.initLedger = async () => {
    console.log('\n[XRPL: EVENT] Connecting to Testnet...');
    if (!state.client.isConnected()) await state.client.connect();

    console.log('[XRPL: EVENT] Funding Parker Wallet...');
    const f1 = await state.client.fundWallet();
    console.log(`[XRPL: SUCCESS] Parker funded: ${f1.wallet.address}`);

    console.log('[XRPL: EVENT] Funding Owner Wallet...');
    const f2 = await state.client.fundWallet();
    console.log(`[XRPL: SUCCESS] Owner funded: ${f2.wallet.address}`);

    console.log('[XRPL: EVENT] Funding Admin Wallet...');
    const f3 = await state.client.fundWallet();
    console.log(`[XRPL: SUCCESS] Admin funded: ${f3.wallet.address}`);

    state.parkerWallet = f1.wallet;
    state.ownerWallet = f2.wallet;
    state.adminWallet = f3.wallet;

    console.log('[XRPL: READY] Wallets initialized.\n');
    return {
        parker: state.parkerWallet.address,
        owner: state.ownerWallet.address,
        admin: state.adminWallet.address,
    };
};

exports.isReady = () => state.isReady;

exports.startParkingOnChain = async (spot) => {
    console.log(
        `\n[XRPL: EVENT] Starting On-Chain sequence for spot: ${spot.id}`,
    );

    // STRICT MATH: Prevent decimal rejections on ledger
    const collateralDrops = Math.floor(spot.price * 3 * 1000000).toString();
    const maxPotentialDrops = Math.floor(
        spot.price * spot.duration * 1000000,
    ).toString();

    console.log(
        `[XRPL: ACTION] Submitting PaymentChannelCreate (${maxPotentialDrops} drops)...`,
    );
    const payChanTx = await state.client.submitAndWait(
        {
            TransactionType: 'PaymentChannelCreate',
            Account: state.parkerWallet.address,
            Amount: maxPotentialDrops,
            Destination: state.ownerWallet.address,
            SettleDelay: 86400,
            PublicKey: state.parkerWallet.publicKey,
        },
        { wallet: state.parkerWallet },
    );

    if (payChanTx.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(
            `XRPL Rejected Channel: ${payChanTx.result.meta.TransactionResult}`,
        );
    }

    const createdNode = payChanTx.result.meta.AffectedNodes.find(
        (n) => n.CreatedNode && n.CreatedNode.LedgerEntryType === 'PayChannel',
    );
    spot.channelId = createdNode.CreatedNode.LedgerIndex;

    console.log(
        `[XRPL: ACTION] Submitting EscrowCreate (${collateralDrops} drops)...`,
    );
    const cancelAfter = Math.floor(Date.now() / 1000) - 946684800 + 86400;

    const preparedEscrow = await state.client.autofill({
        TransactionType: 'EscrowCreate',
        Account: state.parkerWallet.address,
        Amount: collateralDrops,
        Destination: state.ownerWallet.address,
        Condition: spot.condition,
        CancelAfter: cancelAfter,
    });

    spot.escrowSeq = preparedEscrow.Sequence;
    const escrowTx = await state.client.submitAndWait(preparedEscrow, {
        wallet: state.parkerWallet,
    });

    if (escrowTx.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(
            `XRPL Rejected Escrow: ${escrowTx.result.meta.TransactionResult}`,
        );
    }

    console.log(`[XRPL: SUCCESS] Setup complete.\n`);
    return {
        channelHash: payChanTx.result.hash,
        escrowHash: escrowTx.result.hash,
    };
};

exports.claimFractionalRate = async (spot) => {
    if (spot.minutesElapsed > spot.duration * 60) return spot.lastTrickleHash;

    const hoursElapsed = spot.minutesElapsed / 60;
    const amountToClaim = Math.floor(
        spot.price * hoursElapsed * 1000000,
    ).toString();
    const signature = xrpl.authorizeChannel(
        state.parkerWallet,
        spot.channelId,
        amountToClaim,
    );

    const claimTx = await state.client.submitAndWait(
        {
            TransactionType: 'PaymentChannelClaim',
            Account: state.ownerWallet.address,
            Channel: spot.channelId,
            Balance: amountToClaim,
            Amount: amountToClaim,
            Signature: signature,
            PublicKey: state.parkerWallet.publicKey,
        },
        { wallet: state.ownerWallet },
    );

    return claimTx.result.hash;
};

// PENALTY: Slash the funds
exports.slashCollateral = async (spot) => {
    console.log(
        `\n[XRPL: ACTION] Admin is SLASHING collateral for spot ${spot.id}!`,
    );
    console.log(
        `[XRPL: EXPLANATION] Admin does NOT get paid. The Escrow sends funds to the Owner.`,
    );

    const finishTx = await state.client.submitAndWait(
        {
            TransactionType: 'EscrowFinish',
            Account: state.adminWallet.address, // Admin pays network fee
            Owner: state.parkerWallet.address,
            OfferSequence: spot.escrowSeq,
            Condition: spot.condition,
            Fulfillment: spot.fulfillment,
        },
        { wallet: state.adminWallet },
    );
    return finishTx.result.hash;
};

// SAFE CHECKOUT: Return the funds
exports.refundCollateral = async (spot) => {
    console.log(
        `\n[XRPL: ACTION] Releasing Escrow & REFUNDING collateral for spot ${spot.id}...`,
    );
    console.log(
        `[XRPL: EXPLANATION] Admin unlocks Escrow to Owner. Owner instantly refunds Parker.`,
    );

    try {
        // 1. Fulfill the Escrow Condition (Admin executes it neutrally)
        const finishTx = await state.client.submitAndWait(
            {
                TransactionType: 'EscrowFinish',
                Account: state.adminWallet.address,
                Owner: state.parkerWallet.address,
                OfferSequence: spot.escrowSeq,
                Condition: spot.condition,
                Fulfillment: spot.fulfillment,
            },
            { wallet: state.adminWallet },
        );

        console.log(
            `[XRPL: TRACE] EscrowFinish Executed: ${finishTx.result.meta.TransactionResult}`,
        );

        // 2. Owner bounces the EXACT XRP amount back to the Parker (Strict Math Floor applied)
        const collateralDrops = Math.floor(spot.price * 3 * 1000000).toString();
        const refundTx = await state.client.submitAndWait(
            {
                TransactionType: 'Payment',
                Account: state.ownerWallet.address,
                Destination: state.parkerWallet.address,
                Amount: collateralDrops,
            },
            { wallet: state.ownerWallet },
        );

        console.log(
            `[XRPL: SUCCESS] Collateral safely refunded. Hash: ${refundTx.result.hash}\n`,
        );
        return refundTx.result.hash;
    } catch (e) {
        console.error(`[XRPL: FATAL ERROR] Refund failed:`, e);
        throw e;
    }
};

// --- MULTI-AMM STABLECOIN LOGIC ---
let issuerWallet = null;
const RLUSD_CURRENCY = 'RLU';
const AUDD_CURRENCY = 'AUD';

exports.setupStablecoinAndAMM = async () => {
    console.log('\n[XRPL: AMM] Setting up RLUSD, AUDD & AMM Pools...');
    const { wallet: issuer } = await state.client.fundWallet();
    issuerWallet = issuer;

    await state.client.submitAndWait(
        {
            TransactionType: 'AccountSet',
            Account: issuerWallet.address,
            SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
        },
        { wallet: issuerWallet },
    );

    await state.client.submitAndWait(
        {
            TransactionType: 'TrustSet',
            Account: state.parkerWallet.address,
            LimitAmount: {
                currency: RLUSD_CURRENCY,
                issuer: issuerWallet.address,
                value: '10000',
            },
        },
        { wallet: state.parkerWallet },
    );
    await state.client.submitAndWait(
        {
            TransactionType: 'TrustSet',
            Account: state.parkerWallet.address,
            LimitAmount: {
                currency: AUDD_CURRENCY,
                issuer: issuerWallet.address,
                value: '10000',
            },
        },
        { wallet: state.parkerWallet },
    );

    await state.client.submitAndWait(
        {
            TransactionType: 'Payment',
            Account: issuerWallet.address,
            Destination: state.parkerWallet.address,
            Amount: {
                currency: RLUSD_CURRENCY,
                issuer: issuerWallet.address,
                value: '500',
            },
        },
        { wallet: issuerWallet },
    );
    await state.client.submitAndWait(
        {
            TransactionType: 'Payment',
            Account: issuerWallet.address,
            Destination: state.parkerWallet.address,
            Amount: {
                currency: AUDD_CURRENCY,
                issuer: issuerWallet.address,
                value: '500',
            },
        },
        { wallet: issuerWallet },
    );

    // Pool 1: RLU (25 XRP)
    await state.client.submitAndWait(
        {
            TransactionType: 'AMMCreate',
            Account: issuerWallet.address,
            Amount: '25000000',
            Amount2: {
                currency: RLUSD_CURRENCY,
                issuer: issuerWallet.address,
                value: '25',
            },
            TradingFee: 500,
        },
        { wallet: issuerWallet },
    );

    // Pool 2: AUD (25 XRP)
    await state.client.submitAndWait(
        {
            TransactionType: 'AMMCreate',
            Account: issuerWallet.address,
            Amount: '25000000',
            Amount2: {
                currency: AUDD_CURRENCY,
                issuer: issuerWallet.address,
                value: '37.5',
            },
            TradingFee: 500,
        },
        { wallet: issuerWallet },
    );

    console.log(`[XRPL: AMM] Pools Active! UI Unlocked.\n`);
    state.isReady = true;
};

exports.swapStablecoinForXRP = async (dropsNeeded, currencyCode) => {
    console.log(
        `\n[XRPL: DEX] AMM Auto-Swap for ${dropsNeeded} drops using ${currencyCode}...`,
    );

    let maxSpend = 0;
    const xrpAmount = Number(dropsNeeded) / 1000000;
    if (currencyCode === RLUSD_CURRENCY) maxSpend = xrpAmount * 1.05;
    if (currencyCode === AUDD_CURRENCY) maxSpend = xrpAmount * 1.5 * 1.05;

    const swapTx = await state.client.submitAndWait(
        {
            TransactionType: 'Payment',
            Account: state.parkerWallet.address,
            Destination: state.parkerWallet.address,
            Amount: dropsNeeded.toString(),
            // FIX: Number() strips trailing zeros that cause the precision crash
            SendMax: {
                currency: currencyCode,
                issuer: issuerWallet.address,
                value: Number(maxSpend.toFixed(4)).toString(),
            },
            Flags: xrpl.PaymentFlags.tfPartialPayment,
        },
        { wallet: state.parkerWallet },
    );

    if (swapTx.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(
            `AMM Swap Failed: ${swapTx.result.meta.TransactionResult}`,
        );
    }
    return swapTx.result.hash;
};
