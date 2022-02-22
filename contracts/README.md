# GMX Contracts
Contracts for GMX.

## Install Dependencies
If npx is not installed yet:
`npm install -g npx`

Install packages:
`npm i`

## Compile Contracts
`npx hardhat compile`

## Run Tests
`npx hardhat test`


## USEFUL COMMANDS
```
npx hardhat run scripts/peripherals/read.js --network arbitrum

TEST AGAINST HARDHAT ARBITRUM FORK ON LIVE GMX CONTRACTS 
npx hardhat test test/mirror/mirrorTrading.js

TEST AGAINST HARDHAT ARBITRUM FORK ON LOCAL DEPLOYED GMX CONTRACTS 
npx hardhat test test/mirror/mirrorTradingComplete.js
```