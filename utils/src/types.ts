import { Stream } from "@most/types"
import { Abi } from "abitype"
import { CHAIN, IntervalTime, TOKEN_SYMBOL } from "gmx-middleware-const"
import * as viem from "viem"


export type ITokenSymbol = keyof typeof TOKEN_SYMBOL

export interface ITokenDescription {
  name: string
  symbol: ITokenSymbol
  isStable: boolean
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


export interface IIdentifiableEntity {
  id: string
}

export interface IEntityIndexed extends IIdentifiableEntity {
  transactionIndex: number | bigint
  logIndex: number | bigint
  blockNumber: bigint
  blockTimestamp: number
}

export type TypeName<T extends string> = { __typename: T }
export type IIndexedLogType<T extends string> = TypeName<T> & IEntityIndexed

export interface IAbstractPositionIdentity {
  indexToken: viem.Address
  collateralToken: viem.Address
  account: viem.Address
  isLong: boolean
}

export type IAbstractPositionKey = {
  key: string
}

export type IAbstractPositionAdjustment = {
  collateralDelta: bigint
  sizeDelta: bigint
}

export type IAbstractPositionStake = {
  collateral: bigint
  size: bigint
  realisedPnl: bigint
  averagePrice: bigint
}

export type IAbstractPosition = IAbstractPositionStake & IAbstractPositionIdentity


export interface IVaultPosition extends IAbstractPositionStake {
  entryFundingRate: bigint
  reserveAmount: bigint
  lastIncreasedTime: bigint
}


export interface IPositionIncrease extends IAbstractPositionIdentity, IAbstractPositionAdjustment, IIndexedLogType<'IncreasePosition'> {
  price: bigint, fee: bigint, key: string
}
export interface IPositionDecrease extends IAbstractPositionIdentity, IAbstractPositionAdjustment, IIndexedLogType<'DecreasePosition'> {
  price: bigint, fee: bigint, key: string
}

export interface IPositionUpdate extends IAbstractPositionStake, IAbstractPositionKey, IIndexedLogType<'UpdatePosition'> {
  markPrice: bigint
  averagePrice: bigint
  entryFundingRate: bigint
  reserveAmount: bigint
  key: string
}

export interface IPositionLiquidated extends IAbstractPosition, IIndexedLogType<'LiquidatePosition'> {
  markPrice: bigint
  reserveAmount: bigint
  key: string
}

export interface IPositionClose extends IAbstractPositionStake, IIndexedLogType<'ClosePosition'> {
  entryFundingRate: bigint
  averagePrice: bigint
  reserveAmount: bigint
  key: string
}

export interface KeeperIncreaseRequest {
  account: viem.Address
  path: string[]
  indexToken: string
  amountIn: bigint
  minOut: bigint
  sizeDelta: bigint
  isLong: boolean
  acceptablePrice: bigint
  executionFee: bigint
  blockGap: bigint
  timeGap: bigint
  // key: string
}


export interface KeeperDecreaseRequest {
  account: viem.Address
  path: string[]
  indexToken: string
  collateralDelta: bigint
  sizeDelta: bigint
  isLong: boolean
  receiver: string
  acceptablePrice: bigint
  minOut: bigint
  executionFee: bigint
  blockGap: bigint
  timeGap: bigint
  // key: string
}



export enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  LIQUIDATED = 'liquidated',
}

export type IAbstractTrade = IAbstractPositionAdjustment & IAbstractPositionStake

interface ITradeAbstract<T extends TradeStatus = TradeStatus> extends IEntityIndexed, IVaultPosition, IAbstractPositionIdentity {
  account: viem.Address
  status: T
  averagePrice: bigint
  fee: bigint
  key: string

  increaseList: IPositionIncrease[]
  decreaseList: IPositionDecrease[]
  updateList: IPositionUpdate[]
}

export interface ITrade {
  id: viem.Hex // keecak256(account, indexToken, collateralToken, isLong)

  account: viem.Address
  collateralToken: viem.Address
  indexToken: viem.Address
  isLong: boolean

  increaseList: IPositionIncrease[]
  decreaseList: IPositionDecrease[]
  updateList: IPositionUpdate[]

  maxCollateral: bigint
  maxSize: bigint
}

export interface ITradeSettled extends ITrade {
  isLiquidated: boolean

  settlement: IPositionClose | IPositionLiquidated
}


export interface IStake extends IIndexedLogType<"Stake"> {
  id: string
  account: viem.Address
  contract: string
  token: string
  amount: bigint
  amountUsd: bigint
  timestamp: number
}


export interface IAccountSummary {
  realisedPnl: bigint
  cumSize: bigint
  cumCollateral: bigint
  avgCollateral: bigint
  avgSize: bigint
  account: viem.Address
  fee: bigint
  winCount: number
  lossCount: number
  maxCollateral: bigint
  avgLeverage: bigint
  openPnl: bigint
  pnl: bigint
  cumulativeLeverage: bigint
}


export interface IPriceTimeline {
  id: string
  value: bigint
  tokenAddress: viem.Address
  timestamp: string
}

export interface IPricefeed extends IIndexedLogType<'Pricefeed'> {
  timestamp: number
  o: bigint
  h: bigint
  l: bigint
  c: bigint
  tokenAddress: viem.Address
}

export interface IPriceLatest extends IIndexedLogType<'PriceLatest'> {
  value: bigint
  id: viem.Address
  timestamp: number
}

export type IPriceLatestMap = {
  [P in viem.Address]: IPriceLatest
}


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



export type IRequestAccountTradeListApi = IChainParamApi & IRequestPagePositionApi & IRequestAccountApi & { status?: TradeStatus }
export type IRequestPageApi = IRequestPagePositionApi & IChainParamApi & IRequestTimerangeApi



export type IRequestAccountApi = IChainParamApi & { account: viem.Address }

export type IRequestPriceTimelineApi = IChainParamApi & IRequestTimerangeApi & { tokenAddress: viem.Address }
export type IRequestAccountHistoricalDataApi = IChainParamApi & IRequestAccountApi & IRequestTimerangeApi
export type IRequestPricefeedApi = IChainParamApi & IRequestTimerangeApi & { interval: IntervalTime, tokenAddress: viem.Address }
export type IRequestTradeListApi = IChainParamApi & IRequestPagePositionApi & IRequestSortApi<keyof ITradeAbstract> & { status: TradeStatus }


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
  TIncludeActions extends boolean = true,
  TPublicClient extends viem.PublicClient<TTransport, TChain, TIncludeActions> = viem.PublicClient<TTransport, TChain, TIncludeActions>
> = ContractParams<TAbi, TAddress> & { client: TPublicClient }
