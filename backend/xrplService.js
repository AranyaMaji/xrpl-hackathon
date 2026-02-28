const xrpl = require('xrpl');

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

const state = {
    client: new xrpl.Client(TESTNET_URL),
    parkerWallet: null,
    ownerWallet: null,
    adminWallet: null,
};

exports.initLedger = async () => {
    console.log('\n[XRPL: EVENT] Connecting to Testnet...');
    if (!state.client.isConnected()) await state.client.connect();

    console.log('[XRPL: EVENT] Funding Parker Wallet...');
    const f1 = await state.client.fundWallet();
    console.log(
        `[XRPL: SUCCESS] Parker funded: ${f1.wallet.address} (Balance: ${f1.balance} XRP)`,
    );

    console.log('[XRPL: EVENT] Funding Owner Wallet...');
    const f2 = await state.client.fundWallet();
    console.log(
        `[XRPL: SUCCESS] Owner funded: ${f2.wallet.address} (Balance: ${f2.balance} XRP)`,
    );

    console.log('[XRPL: EVENT] Funding Admin Wallet...');
    const f3 = await state.client.fundWallet();
    console.log(
        `[XRPL: SUCCESS] Admin funded: ${f3.wallet.address} (Balance: ${f3.balance} XRP)`,
    );

    state.parkerWallet = f1.wallet;
    state.ownerWallet = f2.wallet;
    state.adminWallet = f3.wallet;
    state.isReady = true;

    console.log('[XRPL: READY] Ledger initialization complete.\n');
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

    // Convert mathematical XRP to drops (1 XRP = 1,000,000 drops)
    const baseFeeDrops = (spot.price * 1000000).toString();
    const collateralDrops = (spot.price * 3 * 1000000).toString();

    // THE FIX: Set max channel capacity to exactly the duration the Parker booked.
    // E.g., 4 XRP/hr * 2 hours = 8 XRP. This avoids the tecUNFUNDED error on the 100 XRP testnet limit.
    const maxPotentialDrops = (spot.price * spot.duration * 1000000).toString();

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

    console.log(
        `[XRPL: RESPONSE] PaymentChannel TX Result: ${payChanTx.result.meta.TransactionResult}`,
    );

    // STRICT VALIDATION
    if (payChanTx.result.meta.TransactionResult !== 'tesSUCCESS') {
        console.error(
            '[XRPL: FATAL ERROR] Payment Channel Failed:',
            payChanTx.result,
        );
        throw new Error(
            `XRPL Rejected Channel: ${payChanTx.result.meta.TransactionResult}`,
        );
    }

    const createdNode = payChanTx.result.meta.AffectedNodes.find(
        (n) => n.CreatedNode && n.CreatedNode.LedgerEntryType === 'PayChannel',
    );

    if (!createdNode)
        throw new Error('PayChannel node not found in ledger metadata!');
    spot.channelId = createdNode.CreatedNode.LedgerIndex;
    console.log(`[XRPL: SUCCESS] Channel ID mapped: ${spot.channelId}`);

    console.log(
        `[XRPL: ACTION] Submitting EscrowCreate (${collateralDrops} drops)...`,
    );
    const cancelAfter = Math.floor(Date.now() / 1000) - 946684800 + 86400; // 24 hours from now

    const preparedEscrow = await state.client.autofill({
        TransactionType: 'EscrowCreate',
        Account: state.parkerWallet.address,
        Amount: collateralDrops,
        Destination: state.ownerWallet.address,
        Condition: spot.condition,
        CancelAfter: cancelAfter,
    });

    spot.escrowSeq = preparedEscrow.Sequence;
    console.log(`[XRPL: TRACE] Escrow Sequence captured: ${spot.escrowSeq}`);

    const escrowTx = await state.client.submitAndWait(preparedEscrow, {
        wallet: state.parkerWallet,
    });

    console.log(
        `[XRPL: RESPONSE] EscrowCreate TX Result: ${escrowTx.result.meta.TransactionResult}`,
    );

    if (escrowTx.result.meta.TransactionResult !== 'tesSUCCESS') {
        console.error('[XRPL: FATAL ERROR] Escrow Failed:', escrowTx.result);
        throw new Error(
            `XRPL Rejected Escrow: ${escrowTx.result.meta.TransactionResult}`,
        );
    }

    console.log(`[XRPL: SUCCESS] On-Chain setup entirely complete.\n`);
    return {
        channelHash: payChanTx.result.hash,
        escrowHash: escrowTx.result.hash,
    };
};

exports.claimFractionalRate = async (spot) => {
    // Prevent claiming more than the channel holds
    if (spot.minutesElapsed > spot.duration * 60) {
        console.log(
            `[XRPL: DAEMON] Max duration reached for ${spot.id}. Halting trickle.`,
        );
        return spot.lastTrickleHash;
    }

    console.log(
        `[XRPL: DAEMON] Generating off-chain signature for Minute ${spot.minutesElapsed}...`,
    );

    // Calculate fractional amount to claim: (price per hour) * (minutes / 60)
    const hoursElapsed = spot.minutesElapsed / 60;
    const amountToClaim = Math.floor(
        spot.price * hoursElapsed * 1000000,
    ).toString();

    const signature = xrpl.authorizeChannel(
        state.parkerWallet,
        spot.channelId,
        amountToClaim,
    );

    console.log(
        `[XRPL: DAEMON] Submitting PaymentChannelClaim for ${amountToClaim} drops...`,
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

    console.log(
        `[XRPL: DAEMON SUCCESS] 5-Min Trickle complete. Hash: ${claimTx.result.hash}`,
    );
    return claimTx.result.hash;
};

exports.slashCollateral = async (spot) => {
    console.log(
        `\n[XRPL: ACTION] Admin is slashing collateral for spot ${spot.id}!`,
    );
    console.log(`[XRPL: TRACE] Using Condition: ${spot.condition}`);

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
        `[XRPL: RESPONSE] EscrowFinish Result: ${finishTx.result.meta.TransactionResult}\n`,
    );
    return finishTx.result.hash;
};

let issuerWallet = null;
const RLUSD_CURRENCY = 'RLU'; // Mock RLUSD

exports.setupStablecoinAndAMM = async () => {
    console.log('\n[XRPL: AMM] Setting up Stablecoin & AMM Pool...');

    // 1. Fund Issuer Wallet
    const { wallet: issuer } = await state.client.fundWallet();
    issuerWallet = issuer;
    console.log(`[XRPL: AMM] Issuer created: ${issuerWallet.address}`);

    // 2. Set Default Ripple on Issuer
    console.log(`[XRPL: AMM] Setting asfDefaultRipple on Issuer...`);
    const accSetTx = await state.client.submitAndWait(
        {
            TransactionType: 'AccountSet',
            Account: issuerWallet.address,
            SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
        },
        { wallet: issuerWallet },
    );
    console.log(
        `[XRPL: AMM] AccountSet Result: ${accSetTx.result.meta.TransactionResult}`,
    );

    // 3. Parker creates Trustline to Issuer
    console.log(`[XRPL: AMM] Creating Trustline for Parker -> Issuer...`);
    const trustTx = await state.client.submitAndWait(
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
    console.log(
        `[XRPL: AMM] TrustSet Result: ${trustTx.result.meta.TransactionResult}`,
    );

    // 4. Issue 500 RLUSD to Parker
    console.log(`[XRPL: AMM] Minting 500 RLUSD to Parker...`);
    const mintTx = await state.client.submitAndWait(
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
    console.log(
        `[XRPL: AMM] Mint Result: ${mintTx.result.meta.TransactionResult}`,
    );

    // 5. Create AMM Pool (XRP / RLUSD)
    // THE FIX: Use 50 XRP instead of 200, as testnet wallets only have 100 XRP total!
    console.log(
        `[XRPL: AMM] Funding AMM Liquidity Pool (50 XRP / 50 RLUSD)...`,
    );
    const ammTx = await state.client.submitAndWait(
        {
            TransactionType: 'AMMCreate',
            Account: issuerWallet.address,
            Amount: '50000000', // 50 XRP
            Amount2: {
                currency: RLUSD_CURRENCY,
                issuer: issuerWallet.address,
                value: '50', // 50 RLUSD
            },
            TradingFee: 500,
        },
        { wallet: issuerWallet },
    );

    console.log(
        `[XRPL: AMM] AMMCreate Result: ${ammTx.result.meta.TransactionResult}`,
    );
    if (ammTx.result.meta.TransactionResult !== 'tesSUCCESS') {
        console.error(
            '[XRPL: AMM FATAL] Failed to create AMM Pool:',
            JSON.stringify(ammTx.result, null, 2),
        );
    } else {
        console.log(`[XRPL: AMM] AMM Pool Active! Pathfinding ready.\n`);
        state.isReady = true;
    }
};

exports.swapStablecoinForXRP = async (dropsNeeded) => {
    console.log(
        `\n[XRPL: DEX] Initiating AMM Auto-Swap for ${dropsNeeded} drops...`,
    );

    // Round to 4 decimal places to prevent XRPL precision overflow
    const estimatedUsd = ((Number(dropsNeeded) / 1000000) * 1.05).toFixed(4);

    const swapPayload = {
        TransactionType: 'Payment',
        Account: state.parkerWallet.address,
        Destination: state.parkerWallet.address,
        Amount: dropsNeeded.toString(),
        SendMax: {
            currency: RLUSD_CURRENCY,
            issuer: issuerWallet.address,
            value: estimatedUsd.toString(),
        },
        Flags: xrpl.PaymentFlags.tfPartialPayment,
    };

    console.log(
        `[XRPL: DEX] Transmitting Swap Payload:`,
        JSON.stringify(swapPayload, null, 2),
    );

    const swapTx = await state.client.submitAndWait(swapPayload, {
        wallet: state.parkerWallet,
    });
    console.log(
        `[XRPL: DEX] Swap TX Result: ${swapTx.result.meta.TransactionResult}`,
    );

    if (swapTx.result.meta.TransactionResult !== 'tesSUCCESS') {
        console.error(
            `[XRPL: DEX FATAL] Complete Ledger Rejection:`,
            JSON.stringify(swapTx.result, null, 2),
        );
        throw new Error(
            `AMM Swap Failed: ${swapTx.result.meta.TransactionResult}`,
        );
    }

    console.log(`[XRPL: DEX] Swap Successful! Acquired XRP via AMM.`);
    return swapTx.result.hash;
};
