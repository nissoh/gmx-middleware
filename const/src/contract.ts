import { arbitrum } from "viem/chains";
import * as abi from "./abi.js";

export const CONTRACT = {
    [arbitrum.id]: {
        Vault: {
            address: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
            abi: abi.vault
        },
        PositionRouter: {
            address: "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868",
            abi: abi.positionRouter
        },
        VaultPriceFeed: {
            address: "0x2d68011bcA022ed0E474264145F46CC4de96a002",
            abi: abi.vaultPricefeed
        },
        Reader: {
            address: "0xF09eD52638c22cc3f1D7F5583e3699A075e601B2",
            abi: abi.gmxReader
        },
        Router: {
            address: "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064",
            abi: abi.routerfeed
        },
    },
} as const