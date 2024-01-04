import { arbitrum } from "viem/chains"
import { erc20Abi } from "abitype/abis"
import exchangeRouter from "./abi/exchangeRouter.js"
// import datastore from "./abi/datastore.js"
import eventEmitter from "./abi/eventEmitter.js"
import reader from "./abi/reader.js"
import datastore from "./abi/datastore.js"
import referralStorage from "./abi/referralStorage.js"
import customError from "./abi/customError.js"


export const CONTRACT = {
  [arbitrum.id]: {
    GMX: {
      address: "0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a",
      abi: erc20Abi,
    },
    ReferralStorage: {
      address: '0xe6fab3f0c7199b0d34d7fbe83394fc0e0d06e99d',
      abi: referralStorage,
    },

    // V2
    ReaderV2: {
      address: "0x38d91ED96283d62182Fc6d990C24097A918a4d9b",
      abi: reader,
    },
    ExchangeRouter: {
      address: "0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8",
      abi: exchangeRouter,
    },
    OrderVault: {
      address: "0x31eF83a530Fde1B38EE9A18093A333D8Bbbc40D5",
    },
    Datastore: {
      address: "0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8",
      abi: datastore,
    },
    EventEmitter: {
      address: "0xC8ee91A54287DB53897056e12D9819156D3822Fb",
      abi: eventEmitter,
    },
    CustomError: {
      abi: customError,
    },
  },
} as const

// DataStore: "0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8",
// EventEmitter: "0xC8ee91A54287DB53897056e12D9819156D3822Fb",
// ExchangeRouter: "0x3B070aA6847bd0fB56eFAdB351f49BBb7619dbc2",
// DepositVault: "0xF89e77e8Dc11691C9e8757e84aaFbCD8A67d7A55",
// WithdrawalVault: "0x0628D46b5D145f183AdB6Ef1f2c97eD1C4701C55",
// OrderVault: "0x31eF83a530Fde1B38EE9A18093A333D8Bbbc40D5",
// SyntheticsReader: "0x38d91ED96283d62182Fc6d990C24097A918a4d9b",
// SyntheticsRouter: "0x7452c558d45f8afC8c83dAe62C3f8A5BE19c71f6",
// Timelock: "0xaa50bD556CE0Fe61D4A57718BA43177a3aB6A597",

// VaultV2: {
//     address: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
//         abi: abi.vaultV2
// },