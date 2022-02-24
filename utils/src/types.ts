import { CHAIN } from "."
import { ARBITRUM_TRADEABLE_ADDRESS, ARBITRUM_USD_COINS, AVALANCHE_TRADEABLE_ADDRESS, TOKEN_SYMBOL } from "./address"
import { intervalInMsMap } from "./constant"



export type Address = string

export interface TokenAbstract {
  name: string
  symbol: TOKEN_SYMBOL
  decimals: number
}

export interface Token extends TokenAbstract {
  address: ARBITRUM_USD_COINS
}

export interface TradeableToken extends TokenAbstract {
  address: ARBITRUM_TRADEABLE_ADDRESS
}

export interface Transaction {
  token: Token,
  from: Address
  to: Address
  value: bigint
}

export enum PricefeedAddress {
  GLP = '_0x321F653eED006AD1C29D174e17d96351BDe22649'
}

export const CHAINLINK_USD_FEED_ADRESS = {
  [ARBITRUM_TRADEABLE_ADDRESS.WBTC]: "0xae74faa92cb67a95ebcab07358bc222e33a34da7",
  [ARBITRUM_TRADEABLE_ADDRESS.WETH]: "0x37bc7498f4ff12c19678ee8fe19d713b87f6a9e6",
  // [TOKEN_SYMBOL.BNB]: "0xc45ebd0f901ba6b2b8c7e70b717778f055ef5e6d",
  [ARBITRUM_TRADEABLE_ADDRESS.LINK]: "0xdfd03bfc3465107ce570a0397b247f546a42d0fa",
  [ARBITRUM_TRADEABLE_ADDRESS.UNI]: "0x68577f915131087199fe48913d8b416b3984fd38",
}


export interface IIdentifiableEntity {
  id: string
}
export interface IEntityIndexed extends IIdentifiableEntity {
  timestamp: number
}

export type TypeName<T extends string> = { __typename: T }
export type IndexedType<T extends string> = TypeName<T> & IEntityIndexed

export interface IPositionDelta {
  delta: bigint
  deltaPercentage: bigint
}

export interface IAbstractPosition {
  account: Address
  collateralToken: string
  indexToken: ARBITRUM_TRADEABLE_ADDRESS
  isLong: boolean
  key: string
}

export type IAbstractPositionDelta = {
  collateralDelta: bigint
  sizeDelta: bigint
  fee: bigint
}

export type IAbstractPositionStake = {
  collateral: bigint
  size: bigint
}

export type IAbstractRealisedPosition = IAbstractPositionStake & {
  realisedPnl: bigint
  realisedPnlPercentage: bigint
}

export type IPositionIncrease = IAbstractPosition & IAbstractPositionDelta & IndexedType<'IncreasePosition'> & { price: bigint }
export type IPositionDecrease = IAbstractPosition & IAbstractPositionDelta & IndexedType<'DecreasePosition'> & { price: bigint }

export type IPositionUpdate = IAbstractPositionStake & {
  key: string
  averagePrice: bigint
  realisedPnl: bigint
  entryFundingRate: bigint
  reserveAmount: bigint
} & IndexedType<'UpdatePosition'>

export type IPositionLiquidated = IAbstractPositionStake & {
  reserveAmount: bigint
  realisedPnl: bigint
  markPrice: bigint
} & IndexedType<'LiquidatePosition'>

export type IPositionClose = IAbstractPosition & IAbstractPositionStake & {
  size: bigint
  averagePrice: bigint
  realisedPnl: bigint
  entryFundingRate: bigint
  reserveAmount: bigint
} & IndexedType<'ClosePosition'>


export enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  LIQUIDATED = 'liquidated',
}

export type IAbstractTrade = IAbstractPositionDelta & IAbstractRealisedPosition & IAbstractPositionStake

interface ITradeAbstract<T extends TradeStatus = TradeStatus> extends IEntityIndexed, IAbstractTrade, IAbstractPosition {
  account: Address
  status: T
  averagePrice: bigint

  increaseList: IPositionIncrease[]
  decreaseList: IPositionDecrease[]
  updateList: IPositionUpdate[]
}

export type ITradeOpen = ITradeAbstract<TradeStatus.OPEN>
export type ITradeClosed = ITradeAbstract<TradeStatus.CLOSED> & {settledTimestamp: number, closedPosition: IPositionClose}
export type ITradeLiquidated = ITradeAbstract<TradeStatus.LIQUIDATED> & {settledTimestamp: number, liquidatedPosition: IPositionLiquidated}
export type ITradeSettled = ITradeClosed | ITradeLiquidated
export type ITrade = ITradeSettled | ITradeOpen

export interface IAccountSummary extends IAbstractTrade {
  account: string

  settledTradeCount: number
  winTradeCount: number
  openTradeCount: number
  claim: IClaim | null,
}

export interface IPriceLatest {
  id: ARBITRUM_TRADEABLE_ADDRESS | AVALANCHE_TRADEABLE_ADDRESS
  value: bigint
  timestamp: string
}
export interface IPricefeed {
  id: string
  timestamp: number
  o: bigint
  h: bigint
  l: bigint
  c: bigint
  tokenAddress: ARBITRUM_TRADEABLE_ADDRESS | AVALANCHE_TRADEABLE_ADDRESS
}


export enum IClaimSource {
  TWITTER = 'TWITTER',
  ENS = 'ENS',
}


export interface IClaim {
  name: string
  account: Address
  sourceType: IClaimSource
  data: string
}

export interface Account {
  address: string
  settledPositionCount: number
  profitablePositionsCount: number
  realisedPnl: bigint
  claim: IClaim | null
}

export interface IChainParamApi {
  chain: CHAIN.AVALANCHE | CHAIN.ARBITRUM
}

export interface IAccountQueryParamApi {
  account: Address
}

export interface AccountHistoricalDataApi extends IAccountQueryParamApi {
  timeInterval: intervalInMsMap
}

export interface ITimerangeParamApi {
  from: number
  to: number
}

export interface IPagePositionParamApi {
  offset: number
  pageSize: number
}

export interface ISortParamApi<T extends string | number | symbol> {
  sortBy: T
  sortDirection: 'desc' | 'asc'
}

export interface IPageParapApi<T> extends IPagePositionParamApi {
  page: T[]
}

export interface IPricefeedParamApi extends Partial<IPagePositionParamApi>, Partial<ITimerangeParamApi> {
  feedAddress: string
}

export interface ILeaderboardRequest extends IPagePositionParamApi, IChainParamApi, ISortParamApi<keyof IAccountSummary> {
  timeInterval: intervalInMsMap.HR24 | intervalInMsMap.DAY7 | intervalInMsMap.MONTH
}

export type IOpenTradesParamApi = IChainParamApi & IPagePositionParamApi & ISortParamApi<keyof ITradeOpen>

export enum TradeDirection {
  SHORT = 'short',
  LONG = 'long'
}

export enum TradeType {
  OPEN = 'open',
  CLOSED = 'closed',
  LIQUIDATED = 'liquidated',
}

export interface IRequestTradeQueryparam extends IIdentifiableEntity {
  status: TradeStatus,
}

