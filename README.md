# Faucet-DApp-Full-Stack
A secure, gas-optimized Ethereum faucet smart contract built in Solidity with a modern frontend powered by TypeScript, React, Wagmi, RainbowKit, and TailwindCSS. Designed to enable controlled, abuse-resistant ETH distribution with full administrative controls and an intuitive user interface.


---

## Overview

This project implements a faucet that allows users to withdraw small amounts of ETH with enforced rate limiting and daily caps.
Tipping is supported with automatic refunds for over-contributions.
Admins can pause the contract, blacklist abusive addresses, adjust limits, and recover ERC20 tokens.
Users are able to see the transaction history (tip/withdraw, time, amount, pending/completed/failed, seeing tx on etherscan)
A responsive frontend provides user and admin functionality.

## Project Structure
```yaml
faucet-project/
├── contracts/ # Solidity smart contract
│ └── Faucet.sol
│ └── MockERC20.sol
├── test/ # Unit tests
├── frontend/ # React frontend
│ ├── app/
│ ├── components/
│ └── lib/
├── scripts/ # Deployment scripts
├── hardhat.config.ts # Hardhat configuration
```

---

## Features

### Smart Contract (Solidity)

- **Controlled ETH Distribution**
  - Per-transaction limit (`perTransactionLimit`)
  - Daily withdrawal cap (`dailyLimit`)
  - Time-based cooldown per address (`coolDown`)
  - Automatic refund if the faucet balance is exceeded

- **Refund System**
  - Tips above the `maxBalance` are tracked and refunded
  - Manual and automatic refund logic

- **Security and Admin Control**
  - Single-owner access using `onlyOwner`
  - Pause/unpause faucet
  - Blacklist management
  - Emergency ETH and ERC20 recovery
  - Reentrancy protection via OpenZeppelin `ReentrancyGuard`

- **Gas Efficiency**
  - Optimized storage access and short-circuiting
  - Minimal writes for daily tracking
  - Compact logic paths

- **Event Logging**
  - Emits events on key actions (withdraw, refund, pause, tip, etc.)
  - Circular buffer for withdrawal history (fixed-length tracking)

---

## Frontend (React + TypeScript)

Built with Wagmi, RainbowKit, and TailwindCSS, the frontend offers an interactive DApp experience for both users and the admin.

### Technologies

- React + TypeScript
- Wagmi
- RainbowKit
- TailwindCSS

### Functionality

- **Users**
  - Connect wallet
  - Request faucet withdrawal
  - Send tips (refunded if above faucet cap)
  - View withdrawal history and limits

- **Admins**
  - Pause/unpause faucet
  - Blacklist/unblacklist addresses
  - Adjust cooldowns and limits
  - Withdraw remaining/all ETH
  - Recover stuck ERC20 tokens
  - Transfer ownership

---

## Testing

**Framework**: Hardhat (or specify if using Foundry)

### Coverage

- Withdrawal eligibility and limits
- Cooldown and daily limit enforcement
- Refund processing (auto/manual)
- Admin-only actions and ownership restrictions
- Blacklist behavior
- Reentrancy protection
- Token recovery logic

---

---

## Deployment

### Deploy to testnet (example with Hardhat)

```bash
npx hardhat run scripts/deploy.ts --network goerli
```

Example admin actions
```solidity
faucet.setPerTransactionLimit(0.05 ether);
faucet.setCoolDown(5 minutes);
faucet.pause();
faucet.addToBlacklist(0x123...);
```
## Technologies

| Layer      | Tools                                             |
|------------|---------------------------------------------------|
| Smart Contract | Solidity, OpenZeppelin, Hardhat               |
| Frontend   | React, TypeScript, RainbowKit, Wagmi, TailwindCSS |
| Testing    | Hardhat, Ethers.js                                |

## Requirements

Before getting started, make sure you have the following installed:

- **Node.js** (v18+ recommended): https://nodejs.org
- **npm** or **yarn**
- **Metamask** wallet extension: https://metamask.io
- **Hardhat**:  
  Install globally (optional):
  ```bash
  npm install -g hardhat
   ```
Both the contract and frontend require environment variables to be configured.
In faucet-contract/.env:
```ini
PRIVATE_KEY=your_private_key_here
```
⚠️ The account from PRIVATE_KEY will be the admin of the contract.
This same private key should be imported into MetaMask to connect as admin in the frontend.

> ⚠️  Run All In Ubuntu, VS Code (wsl)

## Smart Contract Setup & Deployment
1. Install dependencies
```bash
cd faucet-contract
npm install
```
2. Compile contracts
```bash
npx hardhat compile
```
3. Test contracts
```bash
npx hardhat test
```
4. Deploy to Localhost
Start Hardhat node:
```bash
npx hardhat node
```
Then deploy:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
5. Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```
Make sure your .env is filled in with the right values before deploying.

## Frontend: Setup & Run
1. Install dependencies
```bash
cd faucet-frontend
npm install
```
2. Run the frontend
```bash
npm run dev
```

---

## Future Improvements (Optional Ideas)
 - Chainlink integration for dynamic value conversion
 - NFT-based access control
 - Role-based admin delegation
 - Usage dashboard


License
MIT
