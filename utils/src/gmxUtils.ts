import { AbiEvent } from "abitype"
import {
  BASIS_POINTS_DIVISOR,
  CHAIN,
  CHAIN_NATIVE_DESCRIPTION,
  FUNDING_RATE_PRECISION, IntervalTime, LIQUIDATION_FEE, MARGIN_FEE_BASIS_POINTS, MAX_LEVERAGE,
  TOKEN_ADDRESS_DESCRIPTION, mapArrayBy
} from "gmx-middleware-const"
import * as viem from "viem"
import { ITraderSummary, ILogEvent, IPositionSettled, IPositionSlot, IPriceInterval, IPriceIntervalIdentity, ITokenDescription } from "./types.js"
import { easeInExpo, formatFixed, getDenominator, getMappedValue, groupArrayMany, readableUnitAmount, streamOf } from "./utils.js"
import { map } from "@most/core"
import { Stream } from "@most/types"


export function safeDiv(a: bigint, b: bigint): bigint {
  if (b === 0n) {
    return 0n
  }

  return a / b
}

export function div(a: bigint, b: bigint): bigint {
  return safeDiv(a * BASIS_POINTS_DIVISOR, b)
}

export function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

export function max(a: bigint, b: bigint): bigint {
  return a > b ? a : b
}

export function minMax(minValue: bigint, maxValue: bigint, value: bigint): bigint {
  return value < minValue ? minValue : value > maxValue ? maxValue : value
}


export function abs(a: bigint): bigint {
  return a < 0n ? -a : a
}

export function bnDiv(a: bigint, b: bigint): number {
  return formatBps(div(a, b))
}

export function formatBps(a: bigint): number {
  return formatFixed(a, 4)
}

export function getAdjustedDelta(size: bigint, sizeDeltaUsd: bigint, pnl: bigint) {
  if (size === 0n) {
    return 0n
  }

  return sizeDeltaUsd * pnl / size
}

export function getPriceDeltaPercentage(positionPrice: bigint, price: bigint) {
  const priceDelta = price - positionPrice

  return priceDelta / positionPrice
}

export function getPriceDelta(isLong: boolean, entryPrice: bigint, priceChange: bigint) {
  return isLong ? priceChange - entryPrice : entryPrice - priceChange
}

export function getPnL(isLong: boolean, entryPrice: bigint, priceChange: bigint, size: bigint) {
  if (size === 0n) {
    return 0n
  }

  const priceDelta = getPriceDelta(isLong, entryPrice, priceChange)
  return size * priceDelta / entryPrice
}

export function getSlotNetPnL(position: IPositionSlot, markPrice: bigint) {
  const delta = getPnL(position.isLong, position.averagePrice, markPrice, position.size)
  return position.realisedPnl + delta - position.cumulativeFee
}

export function getDeltaPercentage(delta: bigint, collateral: bigint) {
  return div(delta, collateral)
}

export function getNextAveragePrice(islong: boolean, size: bigint, nextPrice: bigint, pnl: bigint, sizeDelta: bigint) {
  const nextSize = size + sizeDelta
  const divisor = islong ? nextSize + pnl : nextSize + -pnl

  return nextPrice * nextSize / divisor
}


export function getTokenAmount(amountUsd: bigint, price: bigint, decimals: number) {
  return amountUsd * getDenominator(decimals) / price
}

export function getTokenUsd(amount: bigint, price: bigint, decimals: number) {
  return amount * price / getDenominator(decimals)
}


export function getMarginFees(size: bigint) {
  return size * MARGIN_FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR
}

export function getLiquidationPrice(isLong: boolean, collateral: bigint, size: bigint, averagePrice: bigint) {
  const liquidationAmount = div(size, MAX_LEVERAGE)
  const liquidationDelta = collateral - liquidationAmount
  const priceDelta = liquidationDelta * averagePrice / size

  return isLong ? averagePrice - priceDelta : averagePrice + priceDelta
}

export function getLiquidationPriceFromDelta(isLong: boolean, size: bigint, collateral: bigint, averagePrice: bigint, liquidationAmount: bigint) {
  if (liquidationAmount > collateral) {
    const liquidationDelta = liquidationAmount - collateral
    const priceDeltaToLiquidate = liquidationDelta * averagePrice / size
    return isLong ? averagePrice + priceDeltaToLiquidate : averagePrice - priceDeltaToLiquidate
  }

  const liquidationDelta = collateral - liquidationAmount
  const priceDelta = liquidationDelta * averagePrice / size

  return isLong ? averagePrice - priceDelta : averagePrice + priceDelta
}


export function getNextLiquidationPrice(
  isLong: boolean,
  size: bigint,
  collateralUsd: bigint,
  averagePriceUsd: bigint,

  entryFundingRate = 0n,
  cumulativeFundingRate = 0n,
  pnl = 0n,

  sizeDeltaUsd = 0n,
  collateralDeltaUsd = 0n,
) {

  const nextSize = size + sizeDeltaUsd

  if (nextSize === 0n) {
    return 0n
  }

  const adjustedLossAmount = pnl < 0n ? sizeDeltaUsd * pnl / size : 0n
  const nextCollateral = collateralUsd + collateralDeltaUsd - adjustedLossAmount // deduct loss off collateral


  const fundingFee = getFundingFee(entryFundingRate, cumulativeFundingRate, size)
  const positionFee = getMarginFees(size) + LIQUIDATION_FEE + fundingFee


  const liquidationPriceForFees = getLiquidationPriceFromDelta(
    isLong,
    nextSize,
    nextCollateral,
    averagePriceUsd,
    positionFee,
  )

  const liquidationPriceForMaxLeverage = getLiquidationPriceFromDelta(
    isLong,
    nextSize,
    nextCollateral,
    averagePriceUsd,
    div(nextSize, MAX_LEVERAGE)
  )


  if (isLong) {
    // return the higher price
    return liquidationPriceForFees > liquidationPriceForMaxLeverage
      ? liquidationPriceForFees
      : liquidationPriceForMaxLeverage
  }

  // return the lower price
  return liquidationPriceForMaxLeverage > liquidationPriceForFees
    ? liquidationPriceForFees
    : liquidationPriceForMaxLeverage

}

export function isPositionSettled(trade: IPositionSlot | IPositionSettled): trade is IPositionSettled {
  return `isLiquidated` in trade
}

// export function getAveragePrice(trade: IPositionSlot | IPositionSettled): bigint {
//   return trade.averagePrice
// }

// export function getTradeTotalFee(trade: IPositionSlot | IPositionSettled): bigint {
//   return [...trade.increaseList, ...trade.decreaseList].reduce((seed, next) => seed + next.fee, 0n)
// }

export function getFundingFee(entryFundingRate: bigint, cumulativeFundingRate: bigint, size: bigint) {
  if (size === 0n) {
    return 0n
  }

  const fundingRate = cumulativeFundingRate - entryFundingRate
  return size * fundingRate / FUNDING_RATE_PRECISION
}



export function liquidationWeight(isLong: boolean, liquidationPriceUSD: bigint, markPriceUSD: bigint) {
  const weight = isLong ? div(liquidationPriceUSD, markPriceUSD) : div(markPriceUSD, liquidationPriceUSD)
  const newLocal = formatFixed(weight, 4)
  const value = easeInExpo(newLocal)
  return value > 1 ? 1 : value
}


export function validateIdentityName(name: string) {
  if (typeof name === 'string' && name.startsWith('@') && !(/^@?(\w){1,15}$/.test(name))) {
    throw new Error('Invalid twitter handle')
  }

  if (typeof name !== 'string' || name.length > 15 || String(name).length < 4) {
    throw new Error('Invalid name')
  }

}

export function getTokenDescription(token: viem.Address): ITokenDescription {
  return getMappedValue(TOKEN_ADDRESS_DESCRIPTION, token)
}


export function getNativeTokenDescription(chain: CHAIN): ITokenDescription {
  return getMappedValue(CHAIN_NATIVE_DESCRIPTION, chain)
}


export function orderEvents<T extends ILogEvent>(arr: T[]): T[] {
  return arr.sort((a, b) => {

    if (typeof b.blockNumber !== 'bigint') throw new Error('blockNumber is not a bigint')
    if (typeof b.transactionIndex !== 'number') throw new Error('transactionIndex is not a number')
    if (typeof b.logIndex !== 'number') throw new Error('logIndex is not a number')

    const order = a.blockNumber === b.blockNumber // same block?, compare transaction index
      ? a.transactionIndex === b.transactionIndex //same transaction?, compare log index
        ? a.logIndex - b.logIndex
        : a.transactionIndex - b.transactionIndex
      : Number(a.blockNumber - b.blockNumber) // compare block number

    return order
  }
  )
}


export function getEventOrderIdentifier<T extends ILogEvent>(idxObj: T): number {
  if (idxObj.blockNumber === null || idxObj.transactionIndex === null || idxObj.logIndex === null) throw new Error('blockNumber is null')
  return Number(idxObj.blockNumber * 1000000n + BigInt(idxObj.transactionIndex * 1000 + idxObj.logIndex))
}


export function mapKeyToAbiParam<T extends viem.Log<bigint, number, any, true, viem.Abi, string>>(abiEvent: AbiEvent, log: T) {
  const bigIntKeys = [
    'blockNumber', 'transactionIndex', 'logIndex',
    ...abiEvent.inputs.filter(x => x.type === 'uint256' || x.type === 'int256').map(x => x.name)
  ]
  const args = log.args as any
  const jsonObj: any = {}
  for (const key in args) {
    const jsonValue = args[key]
    const value = bigIntKeys.includes(key)
      ? getMappedValue(abiParamParseMap, jsonValue)(jsonValue)
      : args[key]
    jsonObj[key] = value

  }

  return jsonObj
}

export function parseJsonAbiEvent(abiEvent: AbiEvent) {
  const bigIntKeys = mapArrayBy(abiEvent.inputs, x => x.name || 'none', x => x.type)

  return bigIntKeys
}

export const abiParamParseMap = {
  uint256: BigInt,
  uint: BigInt,
  string: String,
  'int': Number,
  bool: Boolean,
  int256: BigInt,
} as const



export function getIntervalIdentifier(token: string, interval: IntervalTime): IPriceIntervalIdentity {
  return `${token}:${interval}`
}

export function createPricefeedCandle(blockTimestamp: number, price: bigint): IPriceInterval {
  return { blockTimestamp, o: price, h: price, l: price, c: price, __typename: 'PriceInterval' }
}

export function createMovingAverageCalculator(windowValues: number[], windowSize: number, newValue: number) {
    let sum = 0

    if (windowValues.length === windowSize) {
        sum -= windowValues.shift() || 0
    }

    windowValues.push(newValue)
    sum += newValue

    return sum / windowValues.length
}

export function summariesTrader(tradeList: IPositionSettled[]): ITraderSummary {
  const account = tradeList[0].account

  const seedAccountSummary: ITraderSummary = {
      account,
      size: 0n,
      collateral: 0n,
      leverage: 0n,

      avgLeverage: 0n,
      avgCollateral: 0n,
      avgSize: 0n,

      fee: 0n,
      lossCount: 0,
      pnl: 0n,
      winCount: 0,
    }

    return tradeList.reduce((seed, next, idx): ITraderSummary => {
      const idxBn = BigInt(idx) + 1n

      const size = seed.size + next.maxSize
      const collateral = seed.collateral + next.maxCollateral
      const leverage = seed.leverage + div(next.maxSize, next.maxCollateral)

      const avgSize = size / idxBn
      const avgCollateral = collateral / idxBn
      const avgLeverage = leverage / idxBn


      const fee = seed.fee + next.cumulativeFee
      const pnl = seed.fee + next.realisedPnl


      const winCount = seed.winCount + (next.realisedPnl > 0n ? 1 : 0)
      const lossCount = seed.lossCount + (next.realisedPnl <= 0n ? 1 : 0)


      return {
        account,
        size,
        collateral,
        leverage,

        avgLeverage,
        avgCollateral,
        avgSize,
        fee,
        lossCount,
        pnl,
        winCount,
      }
    }, seedAccountSummary)
}

export function leaderboardTrader(positionMap: Record<viem.Hex, IPositionSettled>): ITraderSummary[] {
  const tradeListMap = groupArrayMany(Object.values(positionMap), a => a.account)
  const tradeListEntries = Object.values(tradeListMap)
  const summaryList = tradeListEntries.map(tradeList => summariesTrader(tradeList))

  return summaryList
}

export const tokenAmount = (token: viem.Address, amount: bigint) => {
  const tokenDesc = getTokenDescription(token)
  const newLocal = formatFixed(amount, tokenDesc.decimals)
  
  return readableUnitAmount(newLocal)
}

export const tokenAmountLabel = (token: viem.Address, amount: bigint) => {
  const tokenDesc = getTokenDescription(token)
  const newLocal = formatFixed(amount, tokenDesc.decimals)
  
  return readableUnitAmount(newLocal) + ' ' + tokenDesc.symbol
}

export const leverageLabel = (leverage: bigint) => {
  return `${readableUnitAmount(formatBps(leverage))}x`
}


