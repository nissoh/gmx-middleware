import {
  CHAIN_NATIVE_TO_SYMBOL, TOKEN_ADDRESS_TO_SYMBOL, TOKEN_DESCRIPTION_MAP, CHAIN, BASIS_POINTS_DIVISOR,
  FUNDING_RATE_PRECISION, LIQUIDATION_FEE, MARGIN_FEE_BASIS_POINTS, MAX_LEVERAGE
} from "gmx-middleware-const"
import { ITokenDescription, ITrade, ITradeSettled } from "./types.js"
import { easeInExpo, formatFixed, getDenominator, getMappedValue, getSafeMappedValue, groupByMapMany } from "./utils.js"
import * as viem from "viem"


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


export function isTradeSettled(trade: ITrade | ITradeSettled): trade is ITradeSettled {
  return `settlement` in trade
}

export function getAveragePrice(trade: ITrade | ITradeSettled): bigint {
  return isTradeSettled(trade) ? 'averagePrice' in trade.settlement ? trade.settlement.averagePrice : trade.settlement.markPrice : trade.updateList[trade.updateList.length - 1].averagePrice
}

export function getTradeTotalFee(trade: ITrade | ITradeSettled): bigint {
  return [...trade.increaseList, ...trade.decreaseList].reduce((seed, next) => seed + next.fee, 0n)
}

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
  return TOKEN_DESCRIPTION_MAP[getMappedValue(TOKEN_ADDRESS_TO_SYMBOL, token)]
}


export function getNativeTokenDescription(chain: CHAIN): ITokenDescription {
  const symbol = getMappedValue(CHAIN_NATIVE_TO_SYMBOL, chain)
  return TOKEN_DESCRIPTION_MAP[symbol]
}
