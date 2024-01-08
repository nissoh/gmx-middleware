import { Stream } from "@most/types"
import { Abi, ExtractAbiEvent } from "abitype"
import { CHAIN, IntervalTime, TOKEN_SYMBOL } from "gmx-middleware-const"
import * as viem from "viem"
import * as GMX from "gmx-middleware-const"

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Nullable<T> = {
  [P in keyof T]: T[P] | null
}
export type NonNullableStruct<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

export type ITokenSymbol = keyof typeof TOKEN_SYMBOL

export interface IIdentifiableEntity {
  id: string
}

export interface ILogIndex<TQuantity = bigint, TIndex = number> {
  blockNumber: TQuantity
  // transactionIndex: TIndex
  logIndex: TIndex
}

export interface ILogOrdered {
  orderId: number
}

export type ILogTypeId<T extends string> = {
  __typename: T
  id: string
}

export type ILogTxType<T extends string> = ILogTypeId<T> & {
  blockTimestamp: bigint
  transactionHash: viem.Hex
}


export type ILogArgs<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = viem.GetEventArgs<TAbi, TEventName, { Required: true }>
export type ILogEvent<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = viem.Log<bigint, number, false, ExtractAbiEvent<TAbi, TEventName>, true, TAbi, TEventName> // ILogIndex & ILogOrdered & viem.GetEventArgs<TAbi, TEventName, { Required: true }>
export type ILogOrderedEvent<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = ILogOrdered & Omit<ILogEvent<TAbi, TEventName>, 'data'>
export type ILog<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = ILogTxType<TEventName> & ILogArgs<TAbi, TEventName> 


export interface ITokenDescription {
  name: string
  symbol: ITokenSymbol
  isUsd: boolean
  decimals: number
}


export interface IEnsRegistration {
  id: string
  labelName: string
  expiryDate: number
  domain: {
    resolvedAddress: {
      id: string
    }
    resolver: {
      texts: string[]
    }
  }
}

export interface ITransaction {
  token: ITokenDescription,
  from: viem.Address
  to: viem.Address
  value: bigint
}

export interface IAbstractPositionParams {
  collateralToken: viem.Address
  indexToken: viem.Address
  isLong: boolean
}

export interface IAbstractPositionIdentity extends IAbstractPositionParams {
  account: viem.Address
  key: viem.Hex
}


export type IAbstractPositionAdjustment = {
  collateralDelta: bigint
  sizeDelta: bigint
}




export enum PositionStatus {
  OPEN,
  CLOSED,
  LIQUIDATED
}




export interface IPosition<TypeName extends 'PositionOpen' | 'PositionSettled'> extends ILogTxType<TypeName> {
  link: IPositionLink

  key: viem.Hex

  account: viem.Address
  market: viem.Address
  collateralToken: viem.Address
  indexToken: viem.Address

  sizeInUsd: bigint
  sizeInTokens: bigint
  collateralAmount: bigint
  realisedPnlUsd: bigint

  cumulativeSizeUsd: bigint
  cumulativeSizeToken: bigint
  cumulativeCollateralUsd: bigint
  cumulativeCollateralToken: bigint

  maxSizeUsd: bigint
  maxSizeToken: bigint
  maxCollateralUsd: bigint
  maxCollateralToken: bigint

  isLong: boolean
}

export type IPositionOpen = IPosition<'PositionOpen'>
export type IPositionSettled = IPosition<'PositionSettled'>





export interface IStake extends ILogTxType<"Stake"> {
  id: string
  account: viem.Address
  contract: string
  token: string
  amount: bigint
  amountUsd: bigint
  timestamp: number
}


export interface IPositionListSummary {
  size: bigint
  collateral: bigint
  fee: bigint
  pnl: bigint
  cumulativeLeverage: bigint
  avgSize: bigint
  avgCollateral: bigint

  winCount: number
  lossCount: number
}


export interface IPriceTimeline {
  id: string
  value: bigint
  tokenAddress: viem.Address
  timestamp: string
}


export interface IPriceCandleDto {
  token: viem.Address
  interval: IntervalTime
  timestamp: number
  o: bigint // open
  h: bigint // high
  l: bigint // low
  c: bigint // close
}

export interface IPricetick {
  price: bigint
  timestamp: number
}

export type IPriceTickListMap = Record<viem.Address, IPricetick[]>
export type IPriceLatestMap = Record<viem.Address, IPriceCandleDto>

export type IPriceCandleListMap = Record<viem.Address, IPriceCandleDto[]>
export type IPriceOracleMap = Record<viem.Address, IOraclePrice>

export interface IPriceCandle extends IPriceCandleDto, ILogTypeId<'PriceCandle'> {}
export interface IPriceCandleSeed extends IPriceCandleDto, ILogTypeId<'PriceCandleSeed'> {}



export interface IChainParamApi {
  chain: CHAIN
}


export interface IRequestTimerangeApi {
  from: number
  to: number
}

export interface IRequestPagePositionApi {
  offset: number
  pageSize: number
}

export interface IRequestSortApi<T> {
  selector: keyof T
  direction: 'desc' | 'asc'
}



export type IRequestAccountTradeListApi = IChainParamApi & IRequestPagePositionApi & IRequestAccountApi
export type IRequestPageApi = IRequestPagePositionApi & IChainParamApi & IRequestTimerangeApi



export type IRequestAccountApi = IChainParamApi & { account: viem.Address }

export type IRequestPriceTimelineApi = IChainParamApi & IRequestTimerangeApi & { tokenAddress: viem.Address }
export type IRequestAccountHistoricalDataApi = IChainParamApi & IRequestAccountApi & IRequestTimerangeApi
export type IRequestPricefeedApi = IChainParamApi & IRequestTimerangeApi & { interval: IntervalTime, tokenAddress: viem.Address }
export type IRequestTradeListApi = IChainParamApi & IRequestPagePositionApi & IRequestSortApi<keyof IPositionSettled>


export interface IRequestGraphEntityApi extends IChainParamApi, IIdentifiableEntity { }



export interface IResponsePageApi<T> extends IRequestPagePositionApi {
  page: T[]
}

export type StreamInputArray<T extends readonly unknown[]> = {
  [P in keyof T]: Stream<T[P]>;
}

export type StreamInput<T> = {
  [P in keyof T]: Stream<T[P]> | T[P]
}

export type ContractParams<
  TAbi extends Abi,
  TAddress extends viem.Address = viem.Address,
> = {
  abi: TAbi
  address: TAddress
}

export type ContractClientParams<
  TAbi extends Abi,
  TAddress extends viem.Address = viem.Address,
  TTransport extends viem.Transport = viem.Transport,
  TChain extends viem.Chain = viem.Chain,
> = ContractParams<TAbi, TAddress> & { client: viem.PublicClient<TTransport, TChain> }


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


export interface IPositionFeesCollected extends ILogTxType<'PositionFeeUpdate'> {
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


export interface IPositionLink extends ILogTypeId<'PositionLink'> {
  id: string
  key: viem.Hex

  increaseList: IPositionIncrease[]
  decreaseList: IPositionDecrease[]
  feeUpdateList: IPositionFeesCollected[]
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

