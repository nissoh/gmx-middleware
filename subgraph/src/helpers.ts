import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts"
import { Transaction, PriceLatest, Pricefeed, Stake } from "../generated/schema"
import { getIntervalId, getIntervalIdentifier } from "./interval"

export const BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)

export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const BI_18 = BigInt.fromI32(18)
export const BI_10 = BigInt.fromI32(10)

export const BI_12_PRECISION = BigInt.fromI32(10).pow(12)
export const BI_18_PRECISION = BigInt.fromI32(10).pow(18)
export const BI_22_PRECISION = BigInt.fromI32(10).pow(18)


export const WETH = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"
export const BTC = "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f"
export const LINK = "0xf97f4df75117a78c1a5a0dbb814af92458539fb4"
export const UNI = "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0"
export const USDT = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"
export const USDC = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"
export const MIM = "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a"
export const SPELL = "0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af"
export const SUSHI = "0xd4d42f0b6def4ce0383636770ef773390d85c61a"
export const FRAX = "0x17fc002b466eec40dae837fc4be5c67993ddbd6f"
export const DAI = "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"
export const GMX = "0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a"
export const GLP_ARBITRUM = "0x321F653eED006AD1C29D174e17d96351BDe22649"

export const GLP_AVALANCHE = "0xe1ae4d4b06A5Fe1fc288f6B4CD72f9F8323B107F"
export const AVAX = "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"


// ARBITRUM
export const GMX_STAKING_ARB = "0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a"
export const esGMX_STAKING_ARB = "0xf42ae1d54fd613c9bb14810b0588faaa09a426ca"
export const GLP_STAKING_ARB = "0x1addd80e6039594ee970e5872d247bf0414c8903"

// AVALANCHE
export const GMX_STAKING_AVAX = "0x62edc0692bd897d2295872a9ffcac5425011c661"
export const esGMX_STAKING_AVAX = "0xff1489227bbaac61a9209a08929e4c2a526ddd17"
export const GLP_STAKING_AVAX = "0x01234181085565ed162a948b6a5e88758cd7c7b8"


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


export function getByAmoutFromFeed(amount: BigInt, feedAddress: string, decimals: TokenDecimals): BigInt {
  const priceUsd = getTokenPrice(feedAddress)
  const denominator = BigInt.fromI32(10).pow(decimals as u8)

  return amount.times(priceUsd).div(denominator)
}


export function getTokenPrice(feedAddress: string): BigInt {
  const chainlinkPriceEntity = PriceLatest.load(feedAddress)

  if (chainlinkPriceEntity == null) {
    log.warning(`Pricefeed doesn't exist: ${feedAddress}`, [])
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


export function _changeLatestPricefeed(feedAddress: string, price: BigInt, event: ethereum.Event): PriceLatest {
  let entity = PriceLatest.load(feedAddress)
  if (entity === null) {
    entity = new PriceLatest(feedAddress)
  }

  entity.timestamp = event.block.timestamp.toI32()
  entity.value = price
  entity.save()

  return entity
}

export function _storePricefeed(event: ethereum.Event, feedAddress: string, interval: intervalUnixTime, price: BigInt): void {
  const intervalID = getIntervalId(interval, event)
  const id = getIntervalIdentifier(event, feedAddress, interval)


  let entity = Pricefeed.load(id)
  if (entity == null) {
    entity = new Pricefeed(id)

    entity.interval = '_' + interval.toString()
    entity.feed = '_' + feedAddress
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



export function _storeGlpPricefeed(feedAddress: string, event: ethereum.Event, aumInUsdg: BigInt, glpSupply: BigInt): void {
  const price = glpSupply.equals(ZERO_BI) ? ZERO_BI : aumInUsdg.times(BI_18_PRECISION).div(glpSupply).times(BI_12_PRECISION)

  _changeLatestPricefeed(feedAddress, price, event)

  _storePricefeed(event, feedAddress, intervalUnixTime.SEC, price)
  _storePricefeed(event, feedAddress, intervalUnixTime.MIN15, price)
  _storePricefeed(event, feedAddress, intervalUnixTime.MIN60, price)
  _storePricefeed(event, feedAddress, intervalUnixTime.HR4, price)
  _storePricefeed(event, feedAddress, intervalUnixTime.HR24, price)
  _storePricefeed(event, feedAddress, intervalUnixTime.DAY7, price)
}



export function _storeStake(event: ethereum.Event, isAdd: boolean, account: Address, token: string, amount: BigInt, feedAddress: string): void {
  const entity = new Stake(getIdFromEvent(event))

  entity.account = account.toHexString()
  entity.token = '_' + token
  entity.amount = isAdd ? amount : negate(amount)
  entity.amountUsd = getByAmoutFromFeed(amount, feedAddress, 18)
  entity.transaction = _createTransactionIfNotExist(event)
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}

