import { AbiEvent } from "abitype"
import {
  BASIS_POINTS_DIVISOR,
  CHAIN,
  CHAIN_ADDRESS_MAP,
  CHAIN_NATIVE_DESCRIPTION,
  FUNDING_RATE_PRECISION, IntervalTime,
  MARGIN_FEE_BASIS_POINTS,
  TOKEN_ADDRESS_DESCRIPTION_MAP, mapArrayBy
} from "gmx-middleware-const"
import * as viem from "viem"
import { factor, getBasisPoints } from "./mathUtils.js"
import { ILogEvent, IOraclePrice, IPositionListSummary, IPositionSettled, IPositionSlot, IPriceInterval, IPriceIntervalIdentity, ITokenDescription } from "./types.js"
import { easeInExpo, formatFixed, getMappedValue, groupArrayMany, parseFixed, readableUnitAmount } from "./utils.js"



export function lst<T>(a: readonly T[]): T {
  if (a.length === 0) throw new Error('empty array')
  return a[a.length - 1]
}

export function div(a: bigint, b: bigint): bigint {
  if (b === 0n) return 0n

  return a * BASIS_POINTS_DIVISOR / b
}

export function formatDiv(a: bigint, b: bigint): number {
  return formatFixed(a * BASIS_POINTS_DIVISOR / b, 4)
}

export function parseBps(a: number | string): bigint {
  return parseFixed(a, 4)
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



// export function getPoolUsdWithoutPnl(
//   marketInfo: MarketPoolValueInfo,
//   isLong: boolean,
//   priceType: "minPrice" | "maxPrice" | "midPrice"
// ) {
//   const poolAmount = isLong ? marketInfo.longTokenAmount : marketInfo.shortTokenAmount
//   const token = isLong ? marketInfo.longToken : marketInfo.shortToken

//   let price: BigNumber

//   if (priceType === "minPrice") {
//     price = token.prices?.minPrice
//   } else if (priceType === "maxPrice") {
//     price = token.prices?.maxPrice
//   } else {
//     price = getMidPrice(token.prices)
//   }

//   return convertToUsd(poolAmount, token.decimals, price)!
// }


export function getPnL(isLong: boolean, entryPrice: bigint, priceChange: bigint, size: bigint) {
  if (size === 0n) {
    return 0n
  }

  const priceDelta = getPriceDelta(isLong, entryPrice, priceChange)
  return size * priceDelta / entryPrice
}


export function getDeltaPercentage(delta: bigint, collateral: bigint) {
  return factor(delta, collateral)
}

export function getNextAveragePrice(islong: boolean, size: bigint, nextPrice: bigint, pnl: bigint, sizeDelta: bigint) {
  const nextSize = size + sizeDelta
  const divisor = islong ? nextSize + pnl : nextSize + -pnl

  return nextPrice * nextSize / divisor
}


export function getTokenAmount(price: bigint, amountUsd: bigint) {
  return amountUsd / price
}

export function getTokenUsd(price: bigint, tokenAmount: bigint) {
  return tokenAmount ? tokenAmount * price : 0n
}


export function getMarginFees(size: bigint) {
  return size * MARGIN_FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR
}

// export function getLiquidationPrice(isLong: boolean, collateral: bigint, size: bigint, averagePrice: bigint) {
//   const liquidationAmount = factor(size, MAX_LEVERAGE_FACTOR)
//   const liquidationDelta = collateral - liquidationAmount
//   const priceDelta = liquidationDelta * averagePrice / size

//   return isLong ? averagePrice - priceDelta : averagePrice + priceDelta
// }

// export function getLiquidationPriceFromDelta(isLong: boolean, size: bigint, collateral: bigint, averagePrice: bigint, liquidationAmount: bigint) {
//   if (liquidationAmount > collateral) {
//     const liquidationDelta = liquidationAmount - collateral
//     const priceDeltaToLiquidate = liquidationDelta * averagePrice / size
//     return isLong ? averagePrice + priceDeltaToLiquidate : averagePrice - priceDeltaToLiquidate
//   }

//   const liquidationDelta = collateral - liquidationAmount
//   const priceDelta = liquidationDelta * averagePrice / size

//   return isLong ? averagePrice - priceDelta : averagePrice + priceDelta
// }


// export function getNextLiquidationPrice(
//   isLong: boolean,
//   size: bigint,
//   collateralUsd: bigint,
//   averagePriceUsd: bigint,

//   entryFundingRate = 0n,
//   cumulativeFundingRate = 0n,
//   pnl = 0n,

//   sizeDeltaUsd = 0n,
//   collateralDeltaUsd = 0n,
// ) {

//   const nextSize = size + sizeDeltaUsd

//   if (nextSize === 0n) {
//     return 0n
//   }

//   const adjustedLossAmount = pnl < 0n ? sizeDeltaUsd * pnl / size : 0n
//   const nextCollateral = collateralUsd + collateralDeltaUsd - adjustedLossAmount // deduct loss off collateral


//   const fundingFee = getFundingFee(entryFundingRate, cumulativeFundingRate, size)
//   const positionFee = getMarginFees(size) + LIQUIDATION_FEE + fundingFee


//   const liquidationPriceForFees = getLiquidationPriceFromDelta(
//     isLong,
//     nextSize,
//     nextCollateral,
//     averagePriceUsd,
//     positionFee,
//   )

//   const liquidationPriceForMaxLeverage = getLiquidationPriceFromDelta(
//     isLong,
//     nextSize,
//     nextCollateral,
//     averagePriceUsd,
//     factor(nextSize, MAX_LEVERAGE_FACTOR)
//   )


//   if (isLong) {
//     // return the higher price
//     return liquidationPriceForFees > liquidationPriceForMaxLeverage
//       ? liquidationPriceForFees
//       : liquidationPriceForMaxLeverage
//   }

//   // return the lower price
//   return liquidationPriceForMaxLeverage > liquidationPriceForFees
//     ? liquidationPriceForFees
//     : liquidationPriceForMaxLeverage

// }

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



export function liquidationWeight(isLong: boolean, liquidationPrice: bigint, markPrice: IOraclePrice) {
  const weight = isLong ? getBasisPoints(liquidationPrice, markPrice.max) : getBasisPoints(markPrice.max, liquidationPrice)
  const value = easeInExpo(formatFixed(weight, 4))
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
  return getMappedValue(TOKEN_ADDRESS_DESCRIPTION_MAP, token)
}


export function getNativeTokenDescription(chain: viem.Chain): ITokenDescription {
  return getMappedValue(CHAIN_NATIVE_DESCRIPTION, chain.id)
}

export function getNativeTokenAddress(chain: viem.Chain): viem.Address {
  return getMappedValue(CHAIN_ADDRESS_MAP, chain.id).NATIVE_TOKEN
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
  return getblockOrderIdentifier(idxObj.blockNumber) + (idxObj.transactionIndex * 1000 + idxObj.logIndex)
}

export function getblockOrderIdentifier(blockNumber: bigint): number {
  return Number(blockNumber * 1000000n)
}


export function mapKeyToAbiParam<T extends viem.Log<bigint, number, false, any, true, viem.Abi, string>>(abiEvent: AbiEvent, log: T) {
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



export function getIntervalIdentifier(token: viem.Address, interval: IntervalTime): IPriceIntervalIdentity {
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

export function summariesTrader(tradeList: IPositionSettled[]): IPositionListSummary {

  const seedAccountSummary: IPositionListSummary = {
    size: 0n,
    collateral: 0n,
    cumulativeLeverage: 0n,
    avgCollateral: 0n,
    avgSize: 0n,
    fee: 0n,
    lossCount: 0,
    pnl: 0n,
    winCount: 0,
  }

  return tradeList.reduce((seed, next, idx): IPositionListSummary => {
    const idxBn = BigInt(idx) + 1n

    const size = seed.size + next.maxSizeUsd
    const collateral = seed.collateral + next.maxCollateralUsd
    const cumulativeLeverage = seed.cumulativeLeverage + factor(next.maxSizeUsd, next.maxCollateralUsd)

    const avgSize = size / idxBn
    const avgCollateral = collateral / idxBn


    const fee = seed.fee + next.cumulativeFee
    const pnl = seed.fee + next.realisedPnl


    const winCount = seed.winCount + (next.realisedPnl > 0n ? 1 : 0)
    const lossCount = seed.lossCount + (next.realisedPnl <= 0n ? 1 : 0)


    return {
      size,
      collateral,
      cumulativeLeverage,
      avgCollateral,
      avgSize,
      fee,
      lossCount,
      pnl,
      winCount,
    }
  }, seedAccountSummary)
}

export function leaderboardTrader(positionMap: Record<viem.Hex, IPositionSettled>): IPositionListSummary[] {
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


