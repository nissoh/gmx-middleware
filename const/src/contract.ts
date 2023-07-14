import { arbitrum } from "viem/chains"
import * as abi from "./abi.js"
import { erc20Abi } from "abitype/test"

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
    },
} as const

// VaultV2: {
//     address: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
//         abi: abi.vaultV2
// },