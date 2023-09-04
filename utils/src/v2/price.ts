import { getTokenUsd } from "../gmxUtils.js"
import { abs, applyFactor } from "../mathUtils.js"
import { IMarket, IMarketInfo, IMarketPrice, IOraclePrice, PriceMinMax } from "../typesGMXV2.js"
import { getMappedValue, getDenominator } from "../utils.js"
import * as GMX from "gmx-middleware-const"



export function getPriceImpactUsd(
  marketInfo: IMarketInfo,
  nextLongUsd: bigint,
  nextShortUsd: bigint,
  factorPositive: bigint,
  factorNegative: bigint,
  exponentFactor: bigint
) {

  if (nextLongUsd < 0n || nextShortUsd < 0n) {
    return 0n
  }

  const currentDiff = abs(marketInfo.longInterestUsd - marketInfo.shortInterestUsd)
  const nextDiff = abs(nextLongUsd - nextShortUsd)
  const isSameSideRebalance = marketInfo.longInterestUsd < marketInfo.shortInterestUsd === nextLongUsd < nextShortUsd


  if (isSameSideRebalance) {
    const hasPositiveImpact = nextDiff < currentDiff
    const factor = hasPositiveImpact ? factorPositive : factorNegative

    return calculateImpactForSameSideRebalance(currentDiff, nextDiff, hasPositiveImpact, factor, exponentFactor)
  } 

  return calculateImpactForCrossoverRebalance(currentDiff, nextDiff, factorPositive, factorNegative, exponentFactor,)
}



export function calculateImpactForSameSideRebalance(
  currentDiff: bigint,
  nextDiff: bigint,
  hasPositiveImpact: boolean,
  factor: bigint,
  exponentFactor: bigint
) {
  const currentImpact = applyImpactFactor(currentDiff, factor, exponentFactor)
  const nextImpact = applyImpactFactor(nextDiff, factor, exponentFactor)

  const deltaDiff = abs(currentImpact - nextImpact)

  return hasPositiveImpact ? deltaDiff : 0n - deltaDiff
}


export function calculateImpactForCrossoverRebalance(
  currentDiff: bigint,
  nextDiff: bigint,
  factorPositive: bigint,
  factorNegative: bigint,
  exponentFactor: bigint,
) {
  const positiveImpact = applyImpactFactor(currentDiff, factorPositive, exponentFactor)
  const negativeImpactUsd = applyImpactFactor(nextDiff, factorNegative, exponentFactor)

  const deltaDiffUsd = abs(positiveImpact - negativeImpactUsd)

  return positiveImpact > negativeImpactUsd ? deltaDiffUsd : 0n - deltaDiffUsd
}


export function getCappedPositionImpactUsd(
  market: IMarket,
  marketPrice: IMarketPrice,
  marketPoolInfo: IMarketInfo,
  sizeDeltaUsd: bigint,
  isLong: boolean,
) {
  const priceImpactDeltaUsd = getPriceImpactForPosition(marketPoolInfo, sizeDeltaUsd, isLong)

  if (priceImpactDeltaUsd < 0n) return priceImpactDeltaUsd

  const impactPoolAmount = marketPoolInfo.positionImpactPoolAmount

  const maxPriceImpactUsdBasedOnImpactPool = getTokenUsd(
    marketPrice.indexTokenPrice.min,
    impactPoolAmount,
  )!

  let cappedImpactUsd = priceImpactDeltaUsd

  if (cappedImpactUsd > maxPriceImpactUsdBasedOnImpactPool) {
    cappedImpactUsd = maxPriceImpactUsdBasedOnImpactPool
  }

  const maxPriceImpactFactor = marketPoolInfo.maxPositionImpactFactorPositive
  const maxPriceImpactUsdBasedOnMaxPriceImpactFactor = applyFactor(abs(sizeDeltaUsd), maxPriceImpactFactor)

  if (cappedImpactUsd > maxPriceImpactUsdBasedOnMaxPriceImpactFactor) {
    cappedImpactUsd = maxPriceImpactUsdBasedOnMaxPriceImpactFactor
  }

  return cappedImpactUsd
}

export function getPriceImpactForPosition(
  marketInfo: IMarketInfo,
  sizeDeltaUsd: bigint,
  isLong: boolean,
) {
  const nextLongUsd = marketInfo.longInterestUsd + (isLong ? sizeDeltaUsd : 0n)
  const nextShortUsd = marketInfo.shortInterestUsd + (isLong ? 0n : sizeDeltaUsd)


  const priceImpactUsd = getPriceImpactUsd(
    marketInfo,
    nextLongUsd,
    nextShortUsd,
    marketInfo.positionImpactFactorPositive,
    marketInfo.positionImpactFactorNegative,
    marketInfo.positionImpactExponentFactor,
  )

  if (priceImpactUsd > 0n) {
    return priceImpactUsd
  }


  if (!(abs(marketInfo.virtualInventory.virtualInventoryForPositions) > 0n)) {
    return priceImpactUsd
  }

  const virtualInventoryParams = getNextOpenInterestForVirtualInventory(
    marketInfo.virtualInventory.virtualInventoryForPositions,
    sizeDeltaUsd,
    isLong
  )

  const priceImpactUsdForVirtualInventory = getPriceImpactUsd(
    marketInfo,
    virtualInventoryParams.nextLongUsd,
    virtualInventoryParams.nextShortUsd,
    marketInfo.positionImpactFactorPositive,
    marketInfo.positionImpactFactorNegative,
    marketInfo.positionImpactExponentFactor,
  )

  return priceImpactUsdForVirtualInventory < priceImpactUsd ? priceImpactUsdForVirtualInventory : priceImpactUsd
}


export function getMarkPrice(price: PriceMinMax, isIncrease: boolean, isLong: boolean) {
  const shouldUseMaxPrice = getShouldUseMaxPrice(isIncrease, isLong)

  return shouldUseMaxPrice ? price.max : price.min
}



function getNextOpenInterestForVirtualInventory(
  virtualInventory: bigint,
  deltaUsd: bigint,
  isLong: boolean,
) {

  let currentLongUsd = 0n
  let currentShortUsd = 0n

  if (virtualInventory > 0n) {
    currentShortUsd = virtualInventory
  } else {
    currentLongUsd = virtualInventory * -1n
  }

  if (deltaUsd < 0n) {
    const offset = abs(deltaUsd)
    currentLongUsd = currentLongUsd + offset
    currentShortUsd = currentShortUsd + offset
  }

  return getNextOpenInterestParams(currentLongUsd, currentShortUsd, deltaUsd, isLong)
}

function getNextOpenInterestParams(
  currentLongUsd: bigint,
  currentShortUsd: bigint,
  usdDelta: bigint,
  isLong: boolean,
) {

  let nextLongUsd = currentLongUsd
  let nextShortUsd = currentShortUsd

  if (isLong) {
    nextLongUsd = currentLongUsd + usdDelta
  } else {
    nextShortUsd = currentShortUsd + usdDelta
  }

  return {
    currentLongUsd,
    currentShortUsd,
    nextLongUsd,
    nextShortUsd,
  }
}



export function getOraclePriceUsd(price: IOraclePrice, isLong: boolean, maximize = false) {
  const pickedPrice = pickPriceForPnl(price, isLong, maximize)
  const desc = getMappedValue(GMX.TOKEN_ADDRESS_DESCRIPTION_MAP, price.token)
  
  return pickedPrice * getDenominator(desc.decimals)
}

export function getPriceUsd(price: IOraclePrice, isLong: boolean, maximize = false) {
  const pickedPrice = pickPriceForPnl(price, isLong, maximize)
  const desc = getMappedValue(GMX.TOKEN_ADDRESS_DESCRIPTION_MAP, price.token)
  
  return pickedPrice * getDenominator(desc.decimals)
}

// @dev pick the min or max price depending on whether it is for a long or short position
// and whether the pending pnl should be maximized or not
function pickPriceForPnl(price: IOraclePrice, isLong: boolean, maximize: boolean) {
    // for long positions, pick the larger price to maximize pnl
    // for short positions, pick the smaller price to maximize pnl
    if (isLong) {
        return maximize ? price.max : price.min
    }

    return maximize ? price.min : price.max
}


export function getPriceImpactByAcceptablePrice(
  sizeDeltaUsd: bigint,
  acceptablePrice: bigint,
  indexPrice: bigint,
  isLong: boolean,
  isIncrease: boolean
) {

  const shouldFlipPriceDiff = isIncrease ? !isLong : isLong
  const priceDiff = (indexPrice - acceptablePrice) * (shouldFlipPriceDiff ? -1n : 1n)
  const priceImpactDeltaUsd = sizeDeltaUsd * priceDiff / acceptablePrice
  const priceImpactDeltaAmount = priceImpactDeltaUsd / indexPrice

  return {
    priceImpactDeltaUsd,
    priceImpactDeltaAmount,
  }
}



export function getShouldUseMaxPrice(isIncrease: boolean, isLong: boolean) {
  return isIncrease ? isLong : !isLong
}

const FLOAT_PRECISION = 10n ** 30n

function applyImpactFactor(diff: bigint, factor: bigint, exponent: bigint): bigint {
  const _diff = Number(diff) / 10 ** 30
  const _exponent = Number(exponent) / 10 ** 30

  // Pow and convert back to BigNumber with 30 decimals
  const result = BigInt(Math.round(_diff ** _exponent * 10 ** 30))

  return result * factor / FLOAT_PRECISION
}

