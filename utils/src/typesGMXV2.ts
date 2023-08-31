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

export type IPositionAdjustment = {
  account: viem.Address
  collateralToken: viem.Address
  isLong: boolean

  market: viem.Address

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


export type IPositionIncrease =  ILogTxType<'PositionIncrease'> & IPositionAdjustment & {
  priceImpactAmount: bigint
}

export type IPositionDecrease = ILogTxType<'PositionDecrease'> & IPositionAdjustment & {
  'values.priceImpactDiffUsd': bigint
  basePnlUsd: bigint
  uncappedBasePnlUsd: bigint
}

export type IOraclePrice = {
  isPriceFeed: boolean
  max: bigint
  min: bigint
  token: viem.Address
}


export type IInsolventClose = {
  orderKey: viem.Hex
  positionCollateralAmount: bigint
  remainingCostUsd: bigint
  basePnlUsd: bigint
}

export interface IMarketToken {
  indexToken: viem.Address
  longToken: viem.Address
  shortToken: viem.Address
}

export interface IMarketPrice {
  indexTokenPrice: IOraclePrice,
  longTokenPrice: IOraclePrice,
  shortTokenPrice: IOraclePrice
}

export type IMarketCreatedEvent = ILogTxType<'MarketCreated'> & IMarketToken & {
  marketToken: viem.Address
  salt: viem.Hex
}


export type IOraclePriceUpdateEvent = ILogTxType<'MarketCreated'> & {
  token: viem.Address
  maxPrice: bigint
  minPrice: bigint
  isPriceFeed: boolean
}

export type IMarket = IMarketToken & {
  marketToken: viem.Address
}



// export type IMarketConfig = {
//   reserveFactorLongs: bigint
//   reserveFactorShorts: bigint

//   openInterestReserveFactorLongs: bigint
//   openInterestReserveFactorShorts: bigint

//   minCollateralFactor: bigint
//   minCollateralFactorForOpenInterestMultiplierLong: bigint
//   minCollateralFactorForOpenInterestMultiplierShort: bigint

//   maxLongTokenPoolAmount: bigint
//   maxShortTokenPoolAmount: bigint

//   maxOpenInterestForLongs: bigint
//   maxOpenInterestForShorts: bigint

//   maxPnlFactorForTradersLongs: bigint
//   maxPnlFactorForTradersShorts: bigint

//   maxPnlFactorForAdlLongs: bigint
//   maxPnlFactorForAdlShorts: bigint

//   minPnlFactorAfterAdlLongs: bigint
//   minPnlFactorAfterAdlShorts: bigint

//   maxPnlFactorForDepositsLongs: bigint
//   maxPnlFactorForDepositsShorts: bigint

//   maxPnlFactorForWithdrawalsLongs: bigint
//   maxPnlFactorForWithdrawalsShorts: bigint

//   positionFeeFactorForPositiveImpact: bigint
//   positionFeeFactorForNegativeImpact: bigint

//   negativePositionImpactFactor: bigint
//   positivePositionImpactFactor: bigint
//   positionImpactExponentFactor: bigint

//   negativeMaxPositionImpactFactor: bigint
//   positiveMaxPositionImpactFactor: bigint
//   maxPositionImpactFactorForLiquidations: bigint

//   swapFeeFactorForPositiveImpact: bigint
//   swapFeeFactorForNegativeImpact: bigint

//   negativeSwapImpactFactor: bigint
//   positiveSwapImpactFactor: bigint
//   swapImpactExponentFactor: bigint

//   minCollateralUsd: bigint

//   borrowingFactorForLongs: bigint
//   borrowingFactorForShorts: bigint

//   borrowingExponentFactorForLongs: bigint
//   borrowingExponentFactorForShorts: bigint

//   fundingFactor: bigint
//   fundingExponentFactor: bigint

//   virtualMarketId?: string;
//   virtualTokenIdForIndexToken?: string;

//   isDisabled?: boolean;
// }



// export interface IMarketPoolValueInfo extends ILogTxType<"MarketPoolValueInfo"> {
//   market: viem.Address
//   poolValue: bigint
//   longPnl: bigint
//   shortPnl: bigint
//   netPnl: bigint
//   longTokenAmount: bigint
//   shortTokenAmount: bigint
//   longTokenUsd: bigint
//   shortTokenUsd: bigint
//   totalBorrowingFees: bigint
//   borrowingFeePoolFactor: bigint
//   impactPoolAmount: bigint
//   marketTokensSupply: bigint
// }

interface CollateralType {
  longToken: bigint
  shortToken: bigint
}

export type PositionType = {
  long: CollateralType
  short: CollateralType
}


export interface BaseFundingValues {
  fundingFeeAmountPerSize: PositionType
  claimableFundingAmountPerSize: PositionType
}

interface GetNextFundingAmountPerSizeResult {
  longsPayShorts: boolean;
  fundingFactorPerSecond: bigint

  fundingFeeAmountPerSizeDelta: PositionType
  claimableFundingAmountPerSizeDelta: PositionType
}

interface VirtualInventory {
    virtualPoolAmountForLongToken: bigint;
    virtualPoolAmountForShortToken: bigint;
    virtualInventoryForPositions: bigint;
}

export type IMarketPoolValueInfo = {

  marketInfo: {
    market: IMarket
    borrowingFactorPerSecondForLongs: bigint
    borrowingFactorPerSecondForShorts: bigint
    baseFunding: BaseFundingValues
    nextFunding: GetNextFundingAmountPerSizeResult
    virtualInventory: VirtualInventory
    isDisabled: boolean;
  },


  // longToken: TokenData
  // shortToken: TokenData
  // indexToken: TokenData

  // longPoolAmount: bigint
  // shortPoolAmount: bigint

  maxLongPoolAmount: bigint
  maxShortPoolAmount: bigint

  longPoolAmountAdjustment: bigint
  shortPoolAmountAdjustment: bigint

  // poolValueMax: bigint
  // poolValueMin: bigint

  reserveFactorLong: bigint
  reserveFactorShort: bigint

  openInterestReserveFactorLong: bigint
  openInterestReserveFactorShort: bigint

  borrowingFactorLong: bigint
  borrowingFactorShort: bigint
  borrowingExponentFactorLong: bigint
  borrowingExponentFactorShort: bigint

  fundingFactor: bigint
  fundingExponentFactor: bigint

  positionImpactPoolAmount: bigint

  minCollateralFactor: bigint
  minCollateralFactorForOpenInterestLong: bigint
  minCollateralFactorForOpenInterestShort: bigint

  swapImpactPoolAmountLong: bigint
  swapImpactPoolAmountShort: bigint

  maxPnlFactorForTradersLong: bigint
  maxPnlFactorForTradersShort: bigint

  // pnlLongMin: bigint
  // pnlLongMax: bigint
  // pnlShortMin: bigint
  // pnlShortMax: bigint

  // netPnlMin: bigint
  // netPnlMax: bigint

  // totalBorrowingFees: bigint


  // claimableFundingAmountLong?: bigint
  // claimableFundingAmountShort?: bigint

  longInterestUsd: bigint
  shortInterestUsd: bigint
  longInterestInTokens: bigint
  shortInterestInTokens: bigint

  positionFeeFactorForPositiveImpact: bigint
  positionFeeFactorForNegativeImpact: bigint
  positionImpactFactorPositive: bigint
  positionImpactFactorNegative: bigint
  maxPositionImpactFactorPositive: bigint
  maxPositionImpactFactorNegative: bigint
  maxPositionImpactFactorForLiquidations: bigint
  positionImpactExponentFactor: bigint

  swapFeeFactorForPositiveImpact: bigint
  swapFeeFactorForNegativeImpact: bigint
  swapImpactFactorPositive: bigint
  swapImpactFactorNegative: bigint
  swapImpactExponentFactor: bigint


  virtualMarketId?: string;
  virtualLongTokenId?: string;
  virtualShortTokenId?: string;
}


