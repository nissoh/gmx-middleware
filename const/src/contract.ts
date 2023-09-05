import { arbitrum } from "viem/chains"
import * as abi from "./abi.js"
import { erc20Abi } from "abitype/test"
import exchangeRouter from "./abi/exchangeRouter.js"
// import datastore from "./abi/datastore.js"
import eventEmitter from "./abi/eventEmitter.js"
import reader from "./abi/reader.js"
import datastore from "./abi/datastore.js"
import referralStorage from "./abi/referralStorage.js"


export const CONTRACT = {
    [arbitrum.id]: {
        Vault: {
            address: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
            abi: abi.vault,
        },
        PositionRouter: {
            address: "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868",
            abi: abi.positionRouter,
        },
        VaultPriceFeed: {
            address: "0x2d68011bcA022ed0E474264145F46CC4de96a002",
            abi: abi.vaultPricefeed,
        },
        FastPriceFeed: {
            address: "0x11D62807dAE812a0F1571243460Bf94325F43BB7",
            abi: abi.fastPricefeed,
        },
        Reader: {
            address: "0xF09eD52638c22cc3f1D7F5583e3699A075e601B2",
            abi: abi.gmxReader,
        },
        Router: {
            address: "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064",
            abi: abi.routerfeed,
        },
        USDG: {
            address: "0x45096e7aA921f27590f8F19e457794EB09678141",
            abi: erc20Abi,
        },
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
            address: "0x3b070aa6847bd0fb56efadb351f49bbb7619dbc2",
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