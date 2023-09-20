import * as GMX from "gmx-middleware-const"
import * as viem from "viem"
import { ILogOrderedEvent, ILogTxType, IPosition } from "./types.js"


export enum OrderType {
  // the order will be cancelled if the minOutputAmount cannot be fulfilled
  MarketSwap = 0,
  // @dev LimitSwap: swap token A to token B if the minOutputAmount can be fulfilled
  LimitSwap = 1,
  // @dev MarketIncrease: increase position at the current market price
  // the order will be cancelled if the position cannot be increased at the acceptablePrice
  MarketIncrease = 2,
  // @dev LimitIncrease: increase position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  LimitIncrease = 3,
  // @dev MarketDecrease: decrease position at the curent market price
  // the order will be cancelled if the position cannot be decreased at the acceptablePrice
  MarketDecrease = 4,
  // @dev LimitDecrease: decrease position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  LimitDecrease = 5,
  // @dev StopLossDecrease: decrease position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  StopLossDecrease = 6,
  // @dev Liquidation: allows liquidation of positions if the criteria for liquidation are met
  Liquidation = 7,
}

export enum DecreasePositionSwapType {
  NoSwap = 0,
  SwapPnlTokenToCollateralToken = 1,
  SwapCollateralTokenToPnlToken = 2,
}

export type IEventEmitterAbi = typeof GMX.CONTRACT['42161']['EventEmitter']['abi']

export type IEventLog1Args = ILogOrderedEvent<IEventEmitterAbi, 'EventLog1'>


export interface PositionReferralFees {
  referralCode: viem.Hex
  affiliate: viem.Address
  trader: viem.Address
  totalRebateFactor: bigint
  traderDiscountFactor: bigint
  totalRebateAmount: bigint
  traderDiscountAmount: bigint
  affiliateRewardAmount: bigint

}


export interface PositionFundingFees {
  fundingFeeAmount: bigint
  claimableLongTokenAmount: bigint
  claimableShortTokenAmount: bigint
  latestFundingFeeAmountPerSize: bigint
  latestLongTokenClaimableFundingAmountPerSize: bigint
  latestShortTokenClaimableFundingAmountPerSize: bigint
}


export interface PositionBorrowingFees {
  borrowingFeeUsd: bigint
  borrowingFeeAmount: bigint
  borrowingFeeReceiverFactor: bigint
  borrowingFeeAmountForFeeReceiver: bigint
}

export interface PositionUiFees {
  uiFeeReceiver: viem.Address
  uiFeeReceiverFactor: bigint
  uiFeeAmount: bigint
}

export interface PriceMinMax {
  min: bigint
  max: bigint
}


    
export interface PositionFees {
  referral: PositionReferralFees
  funding: PositionFundingFees
  borrowing: PositionBorrowingFees
  ui: PositionUiFees
  collateralTokenPrice: PriceMinMax
  positionFeeFactor: bigint
  protocolFeeAmount: bigint
  positionFeeReceiverFactor: bigint
  feeReceiverAmount: bigint
  feeAmountForPool: bigint
  positionFeeAmountForPool: bigint
  positionFeeAmount: bigint
  totalCostAmountExcludingFunding: bigint
  totalCostAmount: bigint
}


export interface ExecutionPriceResult {
  priceImpactUsd: bigint
  priceImpactDiffUsd: bigint
  executionPrice: bigint
}



export interface PositionInfo {
  position: {
    addresses: IPositionAddresses,
    numbers: IPositionNumbers
    flags: {
      isLong: boolean
    }
  }
  fees: PositionFees
  executionPriceResult: ExecutionPriceResult
  basePnlUsd: bigint
  uncappedBasePnlUsd: bigint
  pnlAfterPriceImpactUsd: bigint
}

export type IPositionAddresses = {
  account: viem.Address
  collateralToken: viem.Address
  market: viem.Address
}

export type IPositionNumbers = {
  sizeInTokens: bigint
  collateralAmount: bigint
  borrowingFactor: bigint
  fundingFeeAmountPerSize: bigint
  longTokenClaimableFundingAmountPerSize: bigint
  shortTokenClaimableFundingAmountPerSize: bigint
}

export type IPositionAdjustment = IPositionAddresses & IPositionNumbers & {
  isLong: boolean

  orderType: bigint
  orderKey: viem.Hex
  positionKey: viem.Hex

  sizeInUsd: bigint

  executionPrice: bigint
  'indexTokenPrice.max': bigint
  'indexTokenPrice.min': bigint
  'collateralTokenPrice.max': bigint
  'collateralTokenPrice.min': bigint
  sizeDeltaUsd: bigint
  sizeDeltaInTokens: bigint
  collateralDeltaAmount: bigint

  priceImpactAmount: bigint
  priceImpactUsd: bigint
}


export type IPositionIncrease =  ILogTxType<'PositionIncrease'> & IPositionAdjustment & {
}

export type IPositionDecrease = ILogTxType<'PositionDecrease'> & IPositionAdjustment & {
  'values.priceImpactDiffUsd': bigint
  basePnlUsd: bigint
  uncappedBasePnlUsd: bigint
}

export type IOraclePrice = PriceMinMax & {
  isPriceFeed: boolean
  token: viem.Address
}


export type IInsolventClose = {
  orderKey: viem.Hex
  positionCollateralAmount: bigint
  remainingCostUsd: bigint
  basePnlUsd: bigint
}

export interface IMarketToken {
  // salt: viem.Hex
  indexToken: viem.Address
  longToken: viem.Address
  shortToken: viem.Address
}


export interface IMarketPrice {
  indexTokenPrice: IOraclePrice,
  longTokenPrice: IOraclePrice,
  shortTokenPrice: IOraclePrice
}

export type IMarket = IMarketToken & {
  marketToken: viem.Address
}

export interface IMarketPoolInfo {
  poolValue: bigint
  longPnl: bigint
  shortPnl: bigint
  netPnl: bigint

  longTokenAmount: bigint
  shortTokenAmount: bigint
  longTokenUsd: bigint
  shortTokenUsd: bigint

  borrowingFeePoolFactor: bigint
  totalBorrowingFees: bigint

  impactPoolAmount: bigint
}

export interface IMarketInfo {
    // Reader.MarketInfo
  market: IMarket,
  poolInfo: IMarketPoolInfo,
  borrowingFactorPerSecondForLongs: bigint
  borrowingFactorPerSecondForShorts: bigint
  baseFunding: IBaseFundingValues
  nextFunding: IGetNextFundingAmountPerSizeResult
  virtualInventory: IVirtualInventory
  isDisabled: boolean


  maxPnlFactorForTradersLong: bigint
  maxPnlFactorForTradersShort: bigint

  reserveFactorLong: bigint
  reserveFactorShort: bigint

  openInterestReserveFactorLong: bigint
  openInterestReserveFactorShort: bigint

  longInterestInTokens: bigint
  shortInterestInTokens: bigint

  shortInterestUsd: bigint

  positionFeeFactorForPositiveImpact: bigint
  positionFeeFactorForNegativeImpact: bigint
  minCollateralFactor: bigint

  longInterestInTokensUsingLongToken: bigint
  longInterestInTokensUsingShortToken: bigint
  shortInterestInTokensUsingLongToken: bigint
  shortInterestInTokensUsingShortToken: bigint

  // longInterestUsd: bigint
  // shortInterestUsd: bigint

  maxPositionImpactFactorForLiquidations: bigint

  positionImpactFactorPositive: bigint
  positionImpactFactorNegative: bigint
  positionImpactExponentFactor: bigint

  maxPositionImpactFactorPositive: bigint
  positionImpactPoolAmount: bigint

}

export type IMarketCreatedEvent = ILogTxType<'MarketCreated'> & IMarket & {
  salt: viem.Hex
}


export type IOraclePriceUpdateEvent = ILogTxType<'MarketCreated'> & {
  token: viem.Address
  maxPrice: bigint
  minPrice: bigint
  isPriceFeed: boolean
}





// export type IMarketConfig = {
//   reserveFactorLongs: bigint
//   reserveFactorShorts: bigint

//   openInterestReserveFactorLongs: bigint
//   openInterestReserveFactorShorts: bigint

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

//   virtualMarketId?: string
//   virtualTokenIdForIndexToken?: string

//   isDisabled?: boolean
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

interface ICollateralType {
  longToken: bigint
  shortToken: bigint
}

export type IPositionType = {
  long: ICollateralType
  short: ICollateralType
}


export interface IBaseFundingValues {
  fundingFeeAmountPerSize: IPositionType
  claimableFundingAmountPerSize: IPositionType
}

export interface IGetNextFundingAmountPerSizeResult {
  longsPayShorts: boolean
  fundingFactorPerSecond: bigint

  fundingFeeAmountPerSizeDelta: IPositionType
  claimableFundingAmountPerSizeDelta: IPositionType
}

export interface IVirtualInventory {
    virtualPoolAmountForLongToken: bigint
    virtualPoolAmountForShortToken: bigint
    virtualInventoryForPositions: bigint
}

// export interface IMarketInfo {
//     borrowingFactorPerSecondForLongs: bigint
//     borrowingFactorPerSecondForShorts: bigint
//     baseFunding: IBaseFundingValues
//     nextFunding: IGetNextFundingAmountPerSizeResult
//     virtualInventory: IVirtualInventory
//     isDisabled: boolean
//     price: IMarketPrice
// }

// export type IMarketPoolValueInfo = {

//   // marketInfo: IMarketInfo,


//   // longToken: TokenData
//   // shortToken: TokenData
//   // indexToken: TokenData

//   longPoolAmount: bigint
//   shortPoolAmount: bigint

//   maxLongPoolAmount: bigint
//   maxShortPoolAmount: bigint

//   longPoolAmountAdjustment: bigint
//   shortPoolAmountAdjustment: bigint

//   // poolValueMax: bigint
//   // poolValueMin: bigint

//   reserveFactorLong: bigint
//   reserveFactorShort: bigint

//   openInterestReserveFactorLong: bigint
//   openInterestReserveFactorShort: bigint

//   borrowingFactorLong: bigint
//   borrowingFactorShort: bigint
//   borrowingExponentFactorLong: bigint
//   borrowingExponentFactorShort: bigint

//   fundingFactor: bigint
//   fundingExponentFactor: bigint


//   minCollateralFactor: bigint
//   minCollateralFactorForOpenInterestLong: bigint
//   minCollateralFactorForOpenInterestShort: bigint

//   swapImpactPoolAmountLong: bigint
//   swapImpactPoolAmountShort: bigint

//   maxPnlFactorForTradersLong: bigint
//   maxPnlFactorForTradersShort: bigint

//   pnlLongMin: bigint
//   pnlShortMin: bigint

//   pnlLongMax: bigint
//   pnlShortMax: bigint

//   // netPnlMin: bigint
//   // netPnlMax: bigint

//   // totalBorrowingFees: bigint


//   // claimableFundingAmountLong?: bigint
//   // claimableFundingAmountShort?: bigint


//   
//   

//   positionFeeFactorForPositiveImpact: bigint
//   positionFeeFactorForNegativeImpact: bigint
//   maxPositionImpactFactorNegative: bigint
//   maxPositionImpactFactorForLiquidations: bigint
//   positionImpactExponentFactor: bigint

//   swapFeeFactorForPositiveImpact: bigint
//   swapFeeFactorForNegativeImpact: bigint
//   swapImpactFactorPositive: bigint
//   swapImpactFactorNegative: bigint
//   swapImpactExponentFactor: bigint


//   virtualMarketId?: string
//   virtualLongTokenId?: string
//   virtualShortTokenId?: string
// }

