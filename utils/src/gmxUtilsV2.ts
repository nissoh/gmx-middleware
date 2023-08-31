import * as GMX from "gmx-middleware-const"
import * as viem from "viem"
import { abs } from "./gmxUtils.js"
import { IPositionSlot } from "./types.js"
import { IMarketPoolValueInfo, IOraclePrice, IPositionAdjustment, PositionFeesInfo } from "./typesGMXV2.js"
import { getDenominator, getMappedValue, getTokenDenominator } from "./utils.js"




export function getOraclePrice(price: IOraclePrice, isLong: boolean, maximize = false) {
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

export function getPriceImpactUsd(
  marketInfo: IMarketPoolValueInfo,
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

    return calculateImpactForSameSideRebalance(currentDiff, nextDiff, factor, exponentFactor)
  } 

  return calculateImpactForCrossoverRebalance(currentDiff, nextDiff, factorPositive, factorNegative, exponentFactor,)
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

  return deltaDiffUsd
}

export function calculateImpactForSameSideRebalance(
  currentDiff: bigint,
  nextDiff: bigint,
  factor: bigint,
  exponentFactor: bigint,
) {

  const currentImpact = applyImpactFactor(currentDiff, factor, exponentFactor)
  const nextImpact = applyImpactFactor(nextDiff, factor, exponentFactor)

  const deltaDiff = abs(currentImpact - nextImpact)

  return deltaDiff
}

export function applyImpactFactor(diff: bigint, factor: bigint, exponent: bigint): bigint {
  // Convert diff and exponent to float js numbers
  const _diff = Number(diff) / 10 ** 30
  const _exponent = Number(exponent) / 10 ** 30

  // Pow and convert back to BigNumber with 30 decimals
  const result = BigInt(Math.round(_diff ** _exponent * 10 ** 30))

  return result * factor / getDenominator(30)
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


export function getPositionDeltaPnlUsd(position: IPositionAdjustment, price: IOraclePrice, sizeDeltaAmount: bigint) {
    const totalPositionPnl = getPositionPnlUsd(position, price)

    if (totalPositionPnl <= 0n) {
      return totalPositionPnl
    }

    const positionPnlUsd = totalPositionPnl * sizeDeltaAmount / position.sizeInTokens

    return positionPnlUsd
}

export function getPositionPnlUsd(position: IPositionAdjustment, price: IOraclePrice) {
    const executionPrice = pickPriceForPnl(price, position.isLong, false)
    // position.sizeInUsd is the cost of the tokens, positionValue is the current worth of the tokens
    const positionValue = position.sizeInTokens * executionPrice
    const totalPositionPnl = position.isLong ? positionValue - position.sizeInUsd : position.sizeInUsd - positionValue

    if (totalPositionPnl <= 0n) {
      return totalPositionPnl
    }

    return totalPositionPnl
}

export function getSlotNetPnL(position: IPositionSlot, markPrice: IOraclePrice) {
  const lst = position.latestUpdate
  const delta = getPositionPnlUsd(lst, markPrice)

  return position.realisedPnl + delta - position.cumulativeFee
}

export function getEntryPrice(indexToken: viem.Address, sizeInTokens: bigint, sizeInUsd: bigint) {
  return sizeInUsd / sizeInTokens * getTokenDenominator(indexToken)
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


export function getPriceImpactForPosition(
  marketInfo: IMarketPoolValueInfo,
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


  if (!(abs(marketInfo.marketInfo.virtualInventory.virtualInventoryForPositions) > 0n)) {
    return priceImpactUsd
  }

  const virtualInventoryParams = getNextOpenInterestForVirtualInventory(
    marketInfo.marketInfo.virtualInventory.virtualInventoryForPositions,
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

function getNextOpenInterestForVirtualInventory(
  virtualInventory: bigint,
  usdDelta: bigint,
  isLong: boolean,
) {

  let currentLongUsd = 0n
  let currentShortUsd = 0n

  if (virtualInventory > 0n) {
    currentShortUsd = virtualInventory
  } else {
    currentLongUsd = virtualInventory * -1n
  }

  if (usdDelta < 0n) {
    const offset = abs(usdDelta)
    currentLongUsd = currentLongUsd + offset
    currentShortUsd = currentShortUsd + offset
  }

  return getNextOpenInterestParams(currentLongUsd, currentShortUsd, usdDelta, isLong)
}

const FLOAT_PRECISION = 10n ** 30n
const FLOAT_PRECISION_SQRT = 10n ** 15n


export function getFundingAmount(
        latestFundingAmountPerSize: bigint,
        positionFundingAmountPerSize: bigint,
        positionSizeInUsd: bigint,
    ): bigint {
        // a user could avoid paying funding fees by continually updating the position
        // before the funding fee becomes large enough to be chargeable
        // to avoid this, funding fee amounts should be rounded up
        //
        // this could lead to large additional charges if the token has a low number of decimals
        // or if the token's value is very high, so care should be taken to inform users of this
        //
        // if the calculation is for the claimable amount, the amount should be rounded down instead

        // divide the result by Precision.FLOAT_PRECISION * Precision.FLOAT_PRECISION_SQRT as the fundingAmountPerSize values
        // are stored based on FLOAT_PRECISION_SQRT values

        const fundingDiffFactor = latestFundingAmountPerSize - positionFundingAmountPerSize

        const denominator = FLOAT_PRECISION * FLOAT_PRECISION_SQRT
        return positionSizeInUsd * fundingDiffFactor / denominator
    }

function getPositionFundingFees(
        positionFees: PositionFeesInfo,
        position: IPositionAdjustment
    ) {
        const fundingFeeAmount = getFundingAmount(
            positionFees.latestFundingFeeAmountPerSize,
            position.fundingFeeAmountPerSize,
            position.sizeInUsd,
        )

        const claimableLongTokenAmount = getFundingAmount(
            positionFees.latestLongTokenClaimableFundingAmountPerSize,
            position.longTokenClaimableFundingAmountPerSize,
            position.sizeInUsd,
        )

        const claimableShortTokenAmount = getFundingAmount(
            positionFees.latestShortTokenClaimableFundingAmountPerSize,
            position.shortTokenClaimableFundingAmountPerSize,
            position.sizeInUsd,
        )

        return { fundingFeeAmount, claimableLongTokenAmount, claimableShortTokenAmount }
    }