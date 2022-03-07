import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts"
import { AddLiquidity, RemoveLiquidity } from "../generated/GlpManager/GlpManager"
import { Transaction, PriceTimeline, Pricefeed, Stake, PriceLatest } from "../generated/schema"
import { getIntervalId, getIntervalIdentifier } from "./interval"

export const BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)

export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const BI_18 = BigInt.fromI32(18)
export const BI_10 = BigInt.fromI32(10)

export const BI_12_PRECISION = BigInt.fromI32(10).pow(12)
export const BI_18_PRECISION = BigInt.fromI32(10).pow(18)
export const BI_22_PRECISION = BigInt.fromI32(10).pow(22)


export enum TokenDecimals {
  USDC = 6,
  USDT = 6,
  BTC = 8,
  WETH = 18,
  LINK = 18,
  UNI = 18,
  MIM = 18,
  SPELL = 18,
  SUSHI = 18,
  AVAX = 18,
  FRAX = 18,
  DAI = 18,
  GMX = 18,
  GLP = 18,
}


export enum intervalUnixTime {
  SEC = 1,
  SEC60 = 60,
  MIN5 = 300,
  MIN15 = 900,
  MIN30 = 1800,
  MIN60 = 3600,
  HR2 = 7200,
  HR4 = 14400,
  HR8 = 28800,
  HR24 = 86400,
  DAY7 = 604800,
  MONTH = 2628000,
  MONTH2 = 5256000
}



export function negate(n: BigInt): BigInt {
  return n.abs().times(BigInt.fromI32(-1))
}

export function timestampToDay(timestamp: BigInt): BigInt {
  return BigInt.fromI32(86400).times(BigInt.fromI32(86400)).div(timestamp)
}


export function getByAmoutFromFeed(amount: BigInt, tokenAddress: string, decimals: TokenDecimals): BigInt {
  const priceUsd = getTokenPrice(tokenAddress)
  const denominator = BigInt.fromI32(10).pow(decimals as u8)

  return amount.times(priceUsd).div(denominator)
}


export function getTokenPrice(tokenAddress: string): BigInt {
  const chainlinkPriceEntity = PriceTimeline.load(tokenAddress)

  if (chainlinkPriceEntity == null) {
    log.warning(`Pricefeed doesn't exist: ${tokenAddress}`, [])
    return ONE_BI
  }

  return chainlinkPriceEntity.value
}


export function getIdFromEvent(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + ':' + event.logIndex.toString()
}

export function _createTransaction(event: ethereum.Event, id: string): Transaction {
  const to = event.transaction.to
  const entity = new Transaction(id)

  entity.timestamp = event.block.timestamp.toI32()
  entity.blockNumber = event.block.number.toI32()
  entity.from = event.transaction.from.toHexString()

  if (to !== null) {
    entity.to = to.toHexString()
  }

  return entity
}

export function _createTransactionIfNotExist(event: ethereum.Event): string {
  const id = event.transaction.hash.toHexString()
  let entity = Transaction.load(id)

  if (entity === null) {
    entity = _createTransaction(event, id)
    entity.save()
  }

  return id
}

export function calculatePositionDelta(marketPrice: BigInt, isLong: boolean, size: BigInt, averagePrice: BigInt): BigInt {
  const priceDelta = averagePrice.gt(marketPrice) ? averagePrice.minus(marketPrice) : marketPrice.minus(averagePrice)

  if (priceDelta.equals(ONE_BI) || averagePrice.equals(ONE_BI)) {
    return ZERO_BI
  }

  const hasProfit = isLong ? marketPrice > averagePrice : marketPrice < averagePrice
  const delta = size.times(priceDelta).div(averagePrice)

  return hasProfit ? delta : negate(delta)
}

export function calculatePositionDeltaPercentage(delta: BigInt, collateral: BigInt): BigInt {
  if (collateral.equals(ONE_BI)) {
    return ZERO_BI
  }

  return  delta.times(BASIS_POINTS_DIVISOR).div(collateral)
}


export function _changeLatestPricefeed(tokenAddress: string, price: BigInt, event: ethereum.Event): PriceLatest {
  let entity = PriceLatest.load(tokenAddress)
  if (entity === null) {
    entity = new PriceLatest(tokenAddress)
  }

  entity.timestamp = event.block.timestamp.toI32()
  entity.value = price
  entity.save()

  return entity
}

export function _addPriceToTimeline(tokenAddress: string, price: BigInt, event: ethereum.Event): PriceTimeline {
  const id = tokenAddress + ':' + event.block.timestamp.toI32().toString()
  const entity = new PriceTimeline(id)

  entity.timestamp = event.block.timestamp.toI32()
  entity.tokenAddress = '_' + tokenAddress
  entity.value = price
  entity.save()

  return entity
}

export function _storePricefeed(event: ethereum.Event, symbol: string, interval: intervalUnixTime, price: BigInt): void {
  const intervalID = getIntervalId(interval, event)
  const id = getIntervalIdentifier(event, symbol, interval)

  let entity = Pricefeed.load(id)
  if (entity == null) {
    entity = new Pricefeed(id)

    entity.interval = '_' + interval.toString()
    entity.tokenAddress = '_' + symbol
    entity.timestamp = intervalID * interval
    entity.o = price
    entity.h = price
    entity.l = price
  }

  if (price > entity.h) {
    entity.h = price
  }

  if (price < entity.l) {
    entity.l = price
  }

  entity.c = price

  entity.save()
}



export function _storeGlpAddLiqPricefeed(priceFeed: string, event: AddLiquidity): void {
  const price = event.params.aumInUsdg.equals(ZERO_BI)
    ? ONE_BI :
    event.params.aumInUsdg.times(BI_18_PRECISION).div(event.params.glpSupply).times(BI_12_PRECISION)

  _storeDefaultPricefeed(priceFeed, event, price)
}

export function _storeGlpRemoveLiqPricefeed(priceFeed: string, event: RemoveLiquidity): void {
  const price = event.params.aumInUsdg.equals(ZERO_BI)
    ? ONE_BI :
    event.params.aumInUsdg.times(BI_18_PRECISION).div(event.params.glpSupply).times(BI_12_PRECISION)

  _storeDefaultPricefeed(priceFeed, event, price)
}

export function _storeDefaultPricefeed(tokenAddress: string, event: ethereum.Event, price: BigInt): void {
  _changeLatestPricefeed(tokenAddress, price, event)
  _addPriceToTimeline(tokenAddress, price, event)

  _storePricefeed(event, tokenAddress, intervalUnixTime.MIN15, price)
  _storePricefeed(event, tokenAddress, intervalUnixTime.MIN60, price)
  _storePricefeed(event, tokenAddress, intervalUnixTime.HR4, price)
  _storePricefeed(event, tokenAddress, intervalUnixTime.HR24, price)
  _storePricefeed(event, tokenAddress, intervalUnixTime.DAY7, price)
}

export function _storeStake(event: ethereum.Event, isAdd: boolean, account: Address, token: string, contract: Address, amount: BigInt): void {
  const entity = new Stake(getIdFromEvent(event))

  entity.account = account.toHexString()
  entity.contract = contract.toHexString()
  entity.token = '_' + token
  entity.amount = isAdd ? amount : negate(amount)
  entity.transaction = _createTransactionIfNotExist(event)
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}

