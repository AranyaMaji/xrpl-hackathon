# 🅿️ XRPark ( 🥈2nd Place )

**A Pure Web3 Peer-to-Peer Parking Economy Powered by the XRP Ledger.**

Built for the XRPL Hackathon 2026. XRPark completely eliminates predatory parking management companies by directly connecting driveway owners with drivers using trustless, time-released, on-chain escrows. 

There are no Web2 databases holding user funds. There are no centralized custody wallets. Every microsecond of a booking is backed by native XRPL primitives and mathematically verifiable on the Testnet.

<img width="400" height="600" alt="image" src="https://github.com/user-attachments/assets/fdddb27d-6d61-4579-b132-d2fdb51bdbe8" />

---

## 🚀 The Architecture: Doing Stablecoins the *Right* Way

A major hurdle for Web3 adoption is price volatility. Users want to pay for real-world services using stable fiat equivalents like **AUDD** or **RLUSD**. 

**The Problem:** XRPL `EscrowCreate` and `PaymentChannelCreate` nodes are protocol-hardcoded to *only* accept native XRP drops.
**The Web2 Hack (What we didn't do):** Many projects fake this by holding stablecoins in a centralized wallet and merely tracking the "escrow" in a standard SQL database. 
**The XRPark Solution (The Web3 Way):** We utilize the XRPL's native **Automated Market Maker (AMM)** to execute trustless, atomic cross-currency swaps.

When a Parker chooses to pay in **AUDD**:
1. **The Entry Swap:** The system submits a `Payment` transaction to itself with the `SendMax` flag set to the user's AUDD balance. 
2. **Pathfinding:** The XRPL engine automatically routes the payment through our decentralized AUDD/XRP AMM Liquidity Pool.
3. **The Lock:** The exact required drops of native XRP are outputted from the pool and instantaneously locked into the Escrow and Payment Channel.
4. **The Safe Refund:** If a Parker checks out early, the smart contract refunds their collateral in strictly native XRP. This is a deliberate design choice that protects the user from getting hit by DEX slippage and trading fees twice.

<img width="400" height="500" alt="image" src="https://github.com/user-attachments/assets/730364e1-168a-4e70-818c-294a18a5b069" />


---

## 🧠 Core XRPL Features

* **Real-Time Streaming (Payment Channels):** XRP doesn't just move at the end of a session. It streams. A localized background daemon signs off-chain claims every 2.5 seconds, trickling fractional payments to the driveway Owner.
* **Dual-AMM Liquidity Pools:** The backend automatically provisions two independent decentralized exchanges on the testnet (RLUSD/XRP and AUDD/XRP) to facilitate seamless onboarding.
* **XLS-20 Soulbound Reputation:** Good behavior guarantees identity. Perfect checkout records mint a glowing, permanent "Verified Parker" XLS-20 NFT to the user's wallet.
* **Trust-Score Gateway:** Owners are presented with an on-chain, FICO-style score evaluating the Parker's slash history before they programmatically approve the smart contract.
* **3-Party Multisig Consensus:** Disputes trigger a 2/3 consensus protocol. The Parker, Owner, and a decentralized Admin node vote to either safely release the Escrow or execute an `EscrowFinish` to mathematically slash the 3× collateral.
* **Total Transparency:** The UI dynamically injects live Testnet Explorer links for every single phase of the lifecycle: the AMM Swap, the Channel Creation, the Escrow Lock, the Stream Claims, and the Final Resolution.

<img width="570" height="322" alt="image" src="https://github.com/user-attachments/assets/bb97894e-94af-4f94-8f94-fcc2a2b2f0d3" />
<br />
<br />
<br />
<img width="400" height="600" alt="image" src="https://github.com/user-attachments/assets/2bd9820f-17eb-4aa4-9a2a-a10cc9342d19" />


---

## ⚙️ Local Setup & Boot Sequence

**1) Install**
```bash
git clone https://github.com/AranyaMaji/xrpl-hackathon.git
cd xrpark
npm install
```

**2) Run**
```bash
cd .\backend\
node .\server.js
```

**3) View**
<br />
Open [http://localhost:3000/](http://localhost:3000/)
