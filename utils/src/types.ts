import { Stream } from "@most/types"
import { Abi, ExtractAbiEvent } from "abitype"
import { CHAIN, IntervalTime, TOKEN_SYMBOL } from "gmx-middleware-const"
import * as viem from "viem"
import { IOraclePrice, IPositionLink, IPriceMinMax } from "./typesGMXV2.js"


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
  openPnl: bigint
  realisedPnl: bigint
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


export type IPriceIntervalIdentity = `${viem.Address}:${IntervalTime}`
export type IPricefeedMap = Record<IPriceIntervalIdentity, Record<string, IPriceCandle>>
export type IPriceLatestMap = Record<viem.Address, IPriceMinMax>

export interface IPriceCandleDto {
  token: viem.Address
  interval: IntervalTime
  timestamp: number
  o: bigint // open
  h: bigint // high
  l: bigint // low
  c: bigint // close
}

export interface IPriceCandle extends IPriceCandleDto, ILogTypeId<'PriceCandle'> {}
export interface IPriceCandleLatest extends IPriceCandleDto, ILogTypeId<'PriceCandleLatest'> {}



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



// export * from './typesGMXV1.js'
export * from './typesGMXV2.js'

