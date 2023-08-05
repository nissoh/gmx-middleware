import { Stream } from "@most/types"
import { Abi, ExtractAbiEvent } from "abitype"
import * as GMX from "gmx-middleware-const"
import { CHAIN, IntervalTime, TOKEN_SYMBOL } from "gmx-middleware-const"
import * as viem from "viem"


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
  transactionIndex: TIndex
  logIndex: TIndex
}

export interface ILogOrdered {
  orderId: number
}

export type ILogTypeName<T extends string> = { __typename: T } // & IIdentifiableEntity

export type ILogType<T extends string> = ILogTypeName<T> & {
  blockTimestamp: number
}

export type ILogTxType<T extends string> = ILogTypeName<T> & {
  blockTimestamp: number
  transactionHash: viem.Hex
}


export type ILogArgs<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = viem.GetEventArgs<TAbi, TEventName, { Required: true }>
export type ILogEvent<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = viem.Log<bigint, number, false, ExtractAbiEvent<TAbi, TEventName>, true, TAbi, TEventName> // ILogIndex & ILogOrdered & viem.GetEventArgs<TAbi, TEventName, { Required: true }>
export type ILogOrderedEvent<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = ILogOrdered & Omit<ILogEvent<TAbi, TEventName>, 'data'>
export type ILog<TAbi extends viem.Abi = viem.Abi, TEventName extends string = string> = ILogTxType<TEventName> & ILogArgs<TAbi, TEventName> 


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

export interface IAbstractRouteIdentity {
  collateralToken: viem.Address
  indexToken: viem.Address
  isLong: boolean
}

export interface IAbstractPositionIdentity extends IAbstractRouteIdentity {
  account: viem.Address
}

export type IAbstractPositionKey = {
  key: viem.Hex
}

export type IAbstractPositionAdjustment = {
  collateralDelta: bigint
  sizeDelta: bigint
}

export type IAbstractPositionStake = {
  size: bigint
  collateral: bigint
}

export interface IVaultPosition extends IAbstractPositionStake {
  realisedPnl: bigint
  averagePrice: bigint
  entryFundingRate: bigint
  reserveAmount: bigint
  lastIncreasedTime: bigint
}


export type IPositionIncrease = ILog<typeof GMX.abi.vault, 'IncreasePosition'>
export type IPositionDecrease = ILog<typeof GMX.abi.vault, 'DecreasePosition'>
export type IPositionUpdate = ILog<typeof GMX.abi.vault, 'UpdatePosition'> & { markPrice: bigint }
export type IPositionLiquidated = ILog<typeof GMX.abi.vault, 'LiquidatePosition'>
export type IPositionClose = ILog<typeof GMX.abi.vault, 'ClosePosition'>
export type IExecuteIncreasePosition = ILog<typeof GMX.abi.positionRouter, 'ExecuteIncreasePosition'>
export type IExecuteDecreasePosition = ILog<typeof GMX.abi.positionRouter, 'ExecuteDecreasePosition'>


export interface IPositionLink {
  increaseList: IPositionIncrease[]
  decreaseList: IPositionDecrease[]
  updateList: IPositionUpdate[]
}


export interface IPosition<TypeName extends string = string> extends ILogTxType<TypeName>, IVaultPosition {
  requestKey: viem.Hex
  link: IPositionLink
  account: viem.Address
  collateralToken: viem.Address
  indexToken: viem.Address
  isLong: boolean
  key: viem.Hex

  // size: bigint
  // collateral: bigint
  // averagePrice: bigint
  // entryFundingRate: bigint
  // reserveAmount: bigint
  // realisedPnl: bigint

  cumulativeSize: bigint
  cumulativeCollateral: bigint
  cumulativeFee: bigint

  maxSize: bigint
  maxCollateral: bigint
}

export type IPositionSlot = IPosition<'PositionSlot'>


export interface IPositionSettled extends IPosition<'PositionSettled'> {
  settlePrice: bigint
  settlement: IPositionClose | IPositionLiquidated
  isLiquidated: boolean
}


export interface IStake extends ILogTxType<"Stake"> {
  id: string
  account: viem.Address
  contract: string
  token: string
  amount: bigint
  amountUsd: bigint
  timestamp: number
}


export interface ITraderSummary {
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


export type IPriceIntervalIdentity = `${viem.Address}:${IntervalTime}`
export interface IPriceInterval extends ILogType<'PriceInterval'> {
  o: bigint // open
  h: bigint // high
  l: bigint // low
  c: bigint // close
}


export interface IPriceLatest extends ILogType<'PriceLatest'> {
  value: bigint
  id: viem.Address
  timestamp: number
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



