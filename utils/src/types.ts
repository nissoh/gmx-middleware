import { Stream } from "@most/types"
import { Abi, ExtractAbiEvent } from "abitype"
import * as GMX from "gmx-middleware-const"
import { CHAIN, IntervalTime, TOKEN_SYMBOL } from "gmx-middleware-const"
import * as viem from "viem"


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
  transactionIndex: TIndex
  logIndex: TIndex
}

export interface ILogOrdered {
  orderId: number
}

export type ILogType<T extends string> = { __typename: T } // & IIdentifiableEntity

// export type ILogSubgraphType<T extends string> = ILogType<T> & ILogIndex & {
export type ILogSubgraphType<T extends string> = ILogType<T> & {
  // blockTimestamp: bigint
  // transactionHash: string
}

export type ILogArgs<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = viem.GetEventArgs<TAbi, TEventName, { Required: true }>
export type ILogEvent<TAbi extends viem.Abi = viem.Abi,TEventName extends string = string> = NonNullableStruct<viem.Log<bigint, number, ExtractAbiEvent<TAbi, TEventName>, true, TAbi, TEventName>> // ILogIndex & ILogOrdered & viem.GetEventArgs<TAbi, TEventName, { Required: true }>
export type ILogOrderedEvent<TAbi extends viem.Abi = viem.Abi,TEventName extends string = string> = ILogOrdered & ILogEvent<TAbi, TEventName>


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

export interface IAbstractPositionIdentity {
  account: viem.Address
  collateralToken: viem.Address
  indexToken: viem.Address
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
  size: bigint
  collateral: bigint
  realisedPnl: bigint
}

export interface IVaultPosition extends IAbstractPositionStake {
  averagePrice: bigint
  entryFundingRate: bigint
  reserveAmount: bigint
  lastIncreasedTime: bigint
}


export type IPositionIncrease = ILogArgs<typeof GMX.abi.vault, 'IncreasePosition'>
export type IPositionDecrease = ILogArgs<typeof GMX.abi.vault, 'DecreasePosition'>
export type IPositionUpdate = ILogArgs<typeof GMX.abi.vault, 'UpdatePosition'>
export type IPositionLiquidated = ILogArgs<typeof GMX.abi.vault, 'LiquidatePosition'>
export type IPositionClose = ILogArgs<typeof GMX.abi.vault, 'ClosePosition'>
export type IExecuteIncreasePosition = ILogArgs<typeof GMX.abi.positionRouter, 'ExecuteIncreasePosition'>
export type IExecuteDecreasePosition = ILogArgs<typeof GMX.abi.positionRouter, 'ExecuteDecreasePosition'>




export enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  LIQUIDATED = 'liquidated',
}



// export interface IPositionLink extends ILogSubgraphType<'PositionLink'> {
export interface IPositionLink extends ILogSubgraphType<'PositionLink'> {
  // account: viem.Address
  // collateralToken: viem.Address
  // indexToken: viem.Address
  // isLong: boolean
  // key: viem.Hex // keecak256(account, indexToken, collateralToken, isLong)

  increaseList: (IPositionIncrease & ILogSubgraphType<'IncreasePosition'>)[]
  decreaseList: (IPositionDecrease & ILogSubgraphType<'DecreasePosition'>)[]
  updateList: (IPositionUpdate & ILogSubgraphType<'UpdatePosition'>)[]
}


export interface IPosition {
  idCount: number
  link: IPositionLink
  account: viem.Address
  collateralToken: viem.Address
  indexToken: viem.Address
  isLong: boolean
  key: viem.Hex

  size: bigint
  collateral: bigint
  averagePrice: bigint
  entryFundingRate: bigint
  reserveAmount: bigint
  realisedPnl: bigint

  cumulativeSize: bigint
  cumulativeCollateral: bigint
  cumulativeFee: bigint

  maxSize: bigint
  maxCollateral: bigint
}

export interface IPositionSlot extends ILogSubgraphType<'PositionSlot'>, IPosition {}


// export interface IPositionSettled extends ILogSubgraphType<'PositionSettled'>, ILogIndex, IAbstractPositionIdentity, IAbstractPositionKey {
export interface IPositionSettled extends ILogSubgraphType<'PositionSettled'>, IPosition {
  settlePrice: bigint
  isLiquidated: boolean
}


export interface IStake extends ILogSubgraphType<"Stake"> {
  id: string
  account: viem.Address
  contract: string
  token: string
  amount: bigint
  amountUsd: bigint
  timestamp: number
}


export interface IAccountSummary {
  account: viem.Address

  size: bigint
  collateral: bigint
  fee: bigint
  pnl: bigint
  leverage: bigint

  avgLeverage: bigint
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

export interface IPricefeed extends ILogSubgraphType<'Pricefeed'> {
  o: bigint
  h: bigint
  l: bigint
  c: bigint
  tokenAddress: viem.Address
  blockTimestamp: number
}

export interface IPriceLatest extends ILogSubgraphType<'PriceLatest'> {
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
export type IRequestTradeListApi = IChainParamApi & IRequestPagePositionApi & IRequestSortApi<keyof IPositionSettled> & { status: TradeStatus }


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



