# 🅿️ XRPark

**A Decentralized Peer-to-Peer Parking Marketplace Powered by the XRP Ledger.**

Built for the XRPL Hackathon 6. XRPark eliminates predatory parking fees by directly connecting driveway owners with drivers using trustless, time-released on-chain escrows. 

## 🚀 The Hackathon Edge (Core Features)

Instead of just building a standard Web2 CRUD app that happens to use crypto, XRPark deeply integrates native XRPL primitives:

* **Streaming On-Chain Payments (Payment Channels):** XRP doesn't just move at the end of a session. It streams. XRPark utilizes XRPL Payment Channels to trickle fractional payments to the Owner every 5 minutes.
* **Stablecoin AMM Auto-Swap:** Parkers can pay in **RLUSD** (Stablecoin) while Owners strictly receive **XRP**. The backend executes a `SendMax` atomic swap utilizing the XRPL's native Automated Market Maker (AMM) DEX before locking the escrow.
* **XLS-20 Soulbound Reputation System:** FICO-style Trust Scores (300-850). Flawless checkouts mint a permanent "Verified Parker" NFT to your wallet. Overstaying slashes your collateral, burns the NFT, and tanks your score.
* **Approval Gateway:** Owners review a Parker's Trust Score before programmatically accepting the booking.
* **2/3 Consensus Dispute Resolution:** If a Parker overstays, the session requires a 2/3 multisig-style vote (Parker, Owner, Admin) to either safely close the channel or execute an `EscrowFinish` to slash the 3× collateral.

## 🧠 System Architecture

1.  **Prepare:** Parker selects a spot. Backend generates a cryptographic condition/fulfillment lock off-chain.
2.  **Approve:** Owner reviews the Parker's Trust Score and accepts.
3.  **Start (The Swap & Lock):** * *(Optional)*: RLUSD is swapped for XRP via the AMM.
    * `PaymentChannelCreate` locks the maximum session cost.
    * `EscrowCreate` locks the 3× penalty collateral.
4.  **Trickle:** A Node.js daemon submits `PaymentChannelClaim` transactions every 5 minutes with off-chain signatures.
5.  **Settle:** Session ends. 2/3 consensus either releases the collateral or slashes it via `EscrowFinish`.

## 🛠 Tech Stack

* **Ledger:** `xrpl.js` (Testnet)
* **Backend:** Node.js, Express
* **Frontend:** Vanilla JavaScript, HTML5, CSS3, Leaflet.js (Map rendering)
* **Cryptography:** `five-bells-condition` (For Escrow locking)

## ⚙️ Local Setup & Running

**1. Clone and Install**
```bash
git clone https://github.com/AranyaMaji/xrpl-hackathon.git
cd xrpl-hackathon
npm install
