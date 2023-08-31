import * as GMX from "gmx-middleware-const"
import { ILog } from "./types.js"


export type IVaultAbi = typeof GMX.CONTRACT['42161']['Vault']['abi']
export type IPoisitionRouterAbi = typeof GMX.CONTRACT['42161']['PositionRouter']['abi']

export type IPositionIncrease = ILog<IVaultAbi, 'IncreasePosition'>
export type IPositionDecrease = ILog<IVaultAbi, 'DecreasePosition'>
export type IPositionUpdate = ILog<IVaultAbi, 'UpdatePosition'> & { markPrice: bigint }
export type IPositionLiquidated = ILog<IVaultAbi, 'LiquidatePosition'>
export type IPositionClose = ILog<IVaultAbi, 'ClosePosition'>
export type IExecuteIncreasePosition = ILog<IPoisitionRouterAbi, 'ExecuteIncreasePosition'>
export type IExecuteDecreasePosition = ILog<IPoisitionRouterAbi, 'ExecuteDecreasePosition'>

