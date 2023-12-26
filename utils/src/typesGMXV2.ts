import * as GMX from "gmx-middleware-const"
import * as viem from "viem"
import { IAbstractPositionParams, ILogOrderedEvent, ILogTxType } from "./types.js"


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


export interface IPositionFeeUpdate extends ILogTxType<'PositionFeeUpdate'> {
  orderKey: viem.Hex
  positionKey: viem.Hex
  referralCode: viem.Hex

  market: viem.Address
  collateralToken: viem.Address
  affiliate: viem.Address
  trader: viem.Address
  uiFeeReceiver: viem.Address

  collateralTokenPriceMin: bigint
  collateralTokenPriceMax: bigint
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

  isIncrease: boolean
}


export interface IPositionFundingFees {
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

export interface IPositionUiFees {
  uiFeeReceiver: viem.Address
  uiFeeReceiverFactor: bigint
  uiFeeAmount: bigint
}

export interface IPriceMinMax {
  min: bigint
  max: bigint
}


    
export interface IPositionFees {
  referral: PositionReferralFees
  funding: IPositionFundingFees
  borrowing: PositionBorrowingFees
  ui: IPositionUiFees
  collateralTokenPrice: IPriceMinMax
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


export interface IExecutionPriceResult {
  priceImpactUsd: bigint
  priceImpactDiffUsd: bigint
  executionPrice: bigint
}

export type IPositionAddresses = {
  account: viem.Address
  collateralToken: viem.Address
  market: viem.Address
}

export type IPositionNumbers = {
  sizeInUsd: bigint
  sizeInTokens: bigint
  collateralAmount: bigint
  borrowingFactor: bigint
  fundingFeeAmountPerSize: bigint
  longTokenClaimableFundingAmountPerSize: bigint
  shortTokenClaimableFundingAmountPerSize: bigint
}


export interface IPositionInfo {
  position: {
    addresses: IPositionAddresses,
    numbers: IPositionNumbers
    flags: {
      isLong: boolean
    }
  }
  fees: IPositionFees
  executionPriceResult: IExecutionPriceResult
  basePnlUsd: bigint
  uncappedBasePnlUsd: bigint
  pnlAfterPriceImpactUsd: bigint
}


export interface IPositionLink extends ILogTxType<'PositionLink'> {
  id: string
  key: viem.Hex

  account: viem.Address
  market: viem.Address
  collateralToken: viem.Address

  isLong: boolean

  increaseList: IPositionIncrease[]
  decreaseList: IPositionDecrease[]
  feeUpdateList: IPositionFeeUpdate[]
}


export type IPositionIncrease =  ILogTxType<'PositionIncrease'> & IPositionAddresses & IPositionNumbers & {
  link?: IPositionLink

  account: viem.Address
  market: viem.Address
  collateralToken: viem.Address

  executionPrice: bigint
  indexTokenPriceMax: bigint
  indexTokenPriceMin: bigint
  collateralTokenPriceMax: bigint
  collateralTokenPriceMin: bigint
  sizeDeltaUsd: bigint
  sizeDeltaInTokens: bigint
  orderType: bigint

  collateralDeltaAmount: bigint
  priceImpactUsd: bigint
  priceImpactAmount: bigint
  
  isLong: boolean

  orderKey: viem.Hex
  positionKey: viem.Hex
}


export type IPositionDecrease = ILogTxType<'PositionDecrease'> & IPositionAddresses & IPositionNumbers & {
  link?: IPositionLink

  executionPrice: bigint
  indexTokenPriceMax: bigint
  indexTokenPriceMin: bigint
  collateralTokenPriceMax: bigint
  collateralTokenPriceMin: bigint
  sizeDeltaUsd: bigint
  sizeDeltaInTokens: bigint
  collateralDeltaAmount: bigint
  valuesPriceImpactDiffUsd: bigint
  orderType: bigint

  priceImpactUsd: bigint
  basePnlUsd: bigint
  uncappedBasePnlUsd: bigint

  isLong: boolean

  orderKey: viem.Hex
  positionKey: viem.Hex
}

export type IOraclePrice = IPriceMinMax & {
  priceSourceType: bigint
  timestamp: number
  token: viem.Address
}


export type IInsolventClose = {
  orderKey: viem.Hex
  positionCollateralAmount: bigint
  remainingCostUsd: bigint
  basePnlUsd: bigint
}



export interface IMarketPrice {
  indexTokenPrice: IPriceMinMax,
  longTokenPrice: IPriceMinMax,
  shortTokenPrice: IPriceMinMax
}

export type IMarket = {
  indexToken: viem.Address
  longToken: viem.Address
  shortToken: viem.Address
  marketToken: viem.Address
}

export interface IMarketPool {
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

export interface IMarketFees {
  borrowingFactorPerSecondForLongs: bigint
  borrowingFactorPerSecondForShorts: bigint
  baseFunding: IBaseFundingValues
  nextFunding: IGetNextFundingAmountPerSizeResult
  virtualInventory: IVirtualInventory
  isDisabled: boolean
}

export interface IMarketUsageInfo {
  longInterestInTokens: bigint
  shortInterestInTokens: bigint

  longInterestUsd: bigint
  shortInterestUsd: bigint

  longInterestInTokensUsingLongToken: bigint
  longInterestInTokensUsingShortToken: bigint
  shortInterestInTokensUsingLongToken: bigint
  shortInterestInTokensUsingShortToken: bigint

  positionImpactPoolAmount: bigint
}

export interface IMarketConfig {
  reserveFactorLong: bigint
  reserveFactorShort: bigint

  maxPnlFactorForTradersLong: bigint
  maxPnlFactorForTradersShort: bigint

  openInterestReserveFactorLong: bigint
  openInterestReserveFactorShort: bigint

  positionFeeFactorForPositiveImpact: bigint
  positionFeeFactorForNegativeImpact: bigint
  minCollateralFactor: bigint

  positionImpactFactorPositive: bigint
  positionImpactFactorNegative: bigint
  positionImpactExponentFactor: bigint

  maxPositionImpactFactorForLiquidations: bigint
  maxPositionImpactFactorPositive: bigint
}

export interface IMarketInfo {
  market: IMarket
  price: IMarketPrice
  fees: IMarketFees
  pool: IMarketPool
  config: IMarketConfig
  usage: IMarketUsageInfo
}


export type IMarketCreatedEvent = ILogTxType<'MarketCreated'> & IMarket & {
  salt: viem.Hex
}

export type ITradeRoute = IAbstractPositionParams & {
  marketSalt: viem.Address
  routeTypeKey: viem.Hex
}


export type IOraclePriceUpdateEvent = ILogTxType<'OraclePriceUpdate'> & {
  token: viem.Address
  maxPrice: bigint
  minPrice: bigint
  priceSourceType: bigint
  timestamp: bigint
}


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

