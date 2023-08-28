import * as GMX from "gmx-middleware-const"
import * as viem from "viem"
import { ILogOrderedEvent, ILogTxType } from "./types.js"


export type IEventEmitterAbi = typeof GMX.CONTRACT['42161']['EventEmitter']['abi']

export type IEventLog1Args = ILogOrderedEvent<IEventEmitterAbi, 'EventLog1'>



export type PositionFeesInfo = {
  orderKey: viem.Hex
  positionKey: viem.Hex
  referralCode: viem.Hex

  market: viem.Address
  collateralToken: viem.Address
  affiliate: viem.Address
  trader: viem.Address
  uiFeeReceiver: viem.Address

  'collateralTokenPrice.min': bigint
  'collateralTokenPrice.max': bigint
  tradeSizeUsd: bigint
  totalRebateFactor: bigint
  traderDiscountFactor: bigint
  totalRebateAmount: bigint
  traderDiscountAmount: bigint
  affiliateRewardAmount: bigint
  fundingFeeAmount: bigint
  claimableLongTokenAmount: bigint 
  claimableShortTokenAmount: bigint
  latestFundingFeeAmountPerSize: bigint
  latestLongTokenClaimableFundingAmountPerSize: bigint 
  latestShortTokenClaimableFundingAmountPerSize: bigint
  borrowingFeeUsd: bigint
  borrowingFeeAmount: bigint
  borrowingFeeReceiverFactor: bigint
  borrowingFeeAmountForFeeReceiver: bigint
  positionFeeFactor: bigint
  protocolFeeAmount: bigint
  positionFeeReceiverFactor: bigint
  feeReceiverAmount: bigint
  feeAmountForPool: bigint
  positionFeeAmountForPool: bigint
  positionFeeAmount: bigint
  totalCostAmount: bigint
  uiFeeReceiverFactor: bigint
  uiFeeAmount: bigint
  isIncrease: bigint
}

export type PositionAdjustment = {
  account: viem.Address
  market: viem.Address
  collateralToken: viem.Address

  isLong: boolean

  orderType: bigint


  orderKey: viem.Hex
  positionKey: viem.Hex

  sizeInUsd: bigint
  sizeInTokens: bigint
  collateralAmount: bigint
  borrowingFactor: bigint
  fundingFeeAmountPerSize: bigint
  longTokenClaimableFundingAmountPerSize: bigint
  shortTokenClaimableFundingAmountPerSize: bigint
  executionPrice: bigint
  'indexTokenPrice.max': bigint
  'indexTokenPrice.min': bigint
  'collateralTokenPrice.max': bigint
  'collateralTokenPrice.min': bigint
  sizeDeltaUsd: bigint
  sizeDeltaInTokens: bigint
  collateralDeltaAmount: bigint

  priceImpactUsd: bigint
}


export type PositionIncrease =  ILogTxType<'PositionIncrease'> & PositionAdjustment & {
  priceImpactAmount: bigint
}

export type PositionDecrease = ILogTxType<'PositionDecrease'> & PositionAdjustment & {
  'values.priceImpactDiffUsd': bigint
  basePnlUsd: bigint
  uncappedBasePnlUsd: bigint
}

export type OraclePrice = {
  isPriceFeed: boolean
  maxPrice: bigint
  minPrice: bigint
  token: viem.Address
}


export type InsolventClose = {
  orderKey: viem.Hex
  positionCollateralAmount: bigint
  remainingCostUsd: bigint
  basePnlUsd: bigint
}


export type MarketCreated = ILogTxType<'MarketCreated'> & {
  marketToken: viem.Address
  indexToken: viem.Address
  longToken: viem.Address
  shortToken: viem.Address
}

export interface IPositionSourceGMXV2 {
  increaseList: PositionIncrease[]
  decreaseList: PositionDecrease[]
  fees: PositionFeesInfo[]
}

export type Market = ILogTxType<'Market'> & {
  marketToken: viem.Address
  indexToken: viem.Address
  longToken: viem.Address
  shortToken: viem.Address
  salt: viem.Hex
}


export interface MarketPoolValueInfo extends ILogTxType<"MarketPoolValueInfo"> {
  market: viem.Address
  poolValue: bigint
  longPnl: bigint
  shortPnl: bigint
  netPnl: bigint
  longTokenAmount: bigint
  shortTokenAmount: bigint
  longTokenUsd: bigint
  shortTokenUsd: bigint
  totalBorrowingFees: bigint
  borrowingFeePoolFactor: bigint
  impactPoolAmount: bigint
  marketTokensSupply: bigint
}


