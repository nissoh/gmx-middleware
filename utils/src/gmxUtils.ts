import { AbiEvent } from "abitype"
import {
  BASIS_POINTS_DIVISOR,
  CHAIN_ADDRESS_MAP,
  CHAIN_NATIVE_DESCRIPTION,
  FUNDING_RATE_PRECISION,
  MARGIN_FEE_BASIS_POINTS,
  TOKEN_ADDRESS_DESCRIPTION_MAP, mapArrayBy
} from "gmx-middleware-const"
import * as viem from "viem"
import { factor, getBasisPoints } from "./mathUtils.js"
import { ILogEvent, IPositionOpen, IPositionSettled, ITokenDescription } from "./types.js"
import { easeInExpo, formatFixed, getMappedValue, parseFixed } from "./utils.js"

export function findClosest<T extends readonly number[]> (arr: T, chosen: number): T[number] {
  return arr.reduce((a, b) => b - chosen < chosen - a ? b : a)
}

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
  return price ? amountUsd / price : 0n
}

export function getTokenUsd(price: bigint, tokenAmount: bigint) {
  return tokenAmount ? tokenAmount * price : 0n
}


export function getMarginFees(size: bigint) {
  return size * MARGIN_FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR
}

export function isPositionSettled(trade: IPositionOpen | IPositionSettled): trade is IPositionSettled {
  return trade.__typename === 'PositionSettled'
}

export function isPositionOpen(trade: IPositionOpen | IPositionSettled): trade is IPositionOpen {
  return trade.__typename === 'PositionOpen'
}


export function getFundingFee(entryFundingRate: bigint, cumulativeFundingRate: bigint, size: bigint) {
  if (size === 0n) {
    return 0n
  }

  const fundingRate = cumulativeFundingRate - entryFundingRate
  return size * fundingRate / FUNDING_RATE_PRECISION
}



export function liquidationWeight(isLong: boolean, liquidationPrice: bigint, markPrice: bigint) {
  const weight = isLong ? getBasisPoints(liquidationPrice, markPrice) : getBasisPoints(markPrice, liquidationPrice)
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
  'uint[]': (x: string[]) => x.map(BigInt),
  string: String,
  'string[]': (x: string[]) => x.map(String),
  number: Number,
  'number[]': (x: number[]) => x.map(Number),
  'int': BigInt,
  'int[]': (x: string[]) => x.map(BigInt),
  address: viem.getAddress,
  'address[]': (x: string) => viem.getAddress(x),
  bool: Boolean,
  'bool[]': (x: boolean[]) => x.map(Boolean),
  int256: BigInt,
} as const



export function getShortHash(name: string, obj: any) {
  const str = JSON.stringify(obj)
  let hash = 0

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
    
  return `${name}-${hash.toString(16)}`
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

