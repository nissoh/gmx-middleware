import * as GMX from "gmx-middleware-const"
import * as viem from "viem"
import { IPositionSlot } from "./types.js"
import { IMarketInfo, IMarketPoolValueInfo, IMarketPrice, IOraclePrice, IPositionAdjustment, PositionFeesInfo, PositionReferralFees, PriceMinMax } from "./typesGMXV2.js"
import { getDenominator, getMappedValue, getTokenDenominator } from "./utils.js"
import { abs, applyFactor } from "./mathUtils.js"
import { getTokenUsd } from "./gmxUtils.js"




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


export function getPoolUsdWithoutPnl(
  marketInfo: IMarketInfo,
  marketPoolInfo: IMarketPoolValueInfo,
  marketPrice: IMarketPrice,
  isLong: boolean,
  maxPrice: boolean
) {
  const tokenDescription = getMappedValue(GMX.TOKEN_ADDRESS_DESCRIPTION_MAP, isLong ? marketInfo.market.longToken : marketInfo.market.shortToken)
  const poolAmount = isLong ? marketPoolInfo.longPoolAmount : marketPoolInfo.shortPoolAmount
  const token = isLong ? marketPrice.longTokenPrice : marketPrice.shortTokenPrice
  const price = maxPrice ? token.max : token.min


  return getTokenUsd(tokenDescription.decimals, price, poolAmount)
}

export function getPositionPnlUsd(
  marketInfo: IMarketInfo,
  marketPoolInfo: IMarketPoolValueInfo,
  marketPrice: IMarketPrice,
  isLong: boolean,
  sizeInUsd: bigint,
  sizeInTokens: bigint,
  markPrice: bigint,
) {

  const indexTokenDescription = getMappedValue(GMX.TOKEN_ADDRESS_DESCRIPTION_MAP, marketInfo.market.indexToken)
  const positionValueUsd = getTokenUsd(indexTokenDescription.decimals, markPrice, sizeInTokens)

  let totalPnl = isLong ? positionValueUsd - sizeInUsd : sizeInUsd - positionValueUsd

  if (totalPnl <= 0n) {
    return totalPnl
  }

  const poolPnl = isLong ? marketPoolInfo.pnlLongMax : marketPoolInfo.pnlShortMax
  const poolUsd = getPoolUsdWithoutPnl(marketInfo, marketPoolInfo, marketPrice, isLong, false)

  const cappedPnl = getCappedPoolPnl(
    marketPoolInfo,
    poolUsd,
    isLong,
    true,
  )

  const WEI_PRECISION = getDenominator(18)


  if (cappedPnl !== poolPnl && cappedPnl > 0n && poolPnl > 0n) {
    totalPnl = totalPnl * (cappedPnl / WEI_PRECISION) / (poolPnl / WEI_PRECISION)
  }

  return totalPnl
}


export function getCappedPoolPnl(marketPoolInfo: IMarketPoolValueInfo, poolUsd: bigint, isLong: boolean, maximize: boolean) {
  let poolPnl: bigint

  if (isLong) {
    poolPnl = maximize ? marketPoolInfo.pnlLongMax : marketPoolInfo.pnlLongMin
  } else {
    poolPnl = maximize ? marketPoolInfo.pnlShortMax : marketPoolInfo.pnlShortMin
  }

  if (poolPnl <= 0n) {
    return poolPnl
  }

  const maxPnlFactor = isLong
    ? marketPoolInfo.maxPnlFactorForTradersLong
    : marketPoolInfo.maxPnlFactorForTradersShort

  const maxPnl = applyFactor(poolUsd, maxPnlFactor)

  return poolPnl > maxPnl ? maxPnl : poolPnl
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
  marketInfo: IMarketInfo,
  marketPoolInfo: IMarketPoolValueInfo,
  sizeDeltaUsd: bigint,
  isLong: boolean,
) {

  const nextLongUsd = marketPoolInfo.longInterestUsd + (isLong ? sizeDeltaUsd : 0n)
  const nextShortUsd = marketPoolInfo.shortInterestUsd + (isLong ? 0n : sizeDeltaUsd)


  const priceImpactUsd = getPriceImpactUsd(
    marketPoolInfo,
    nextLongUsd,
    nextShortUsd,
    marketPoolInfo.positionImpactFactorPositive,
    marketPoolInfo.positionImpactFactorNegative,
    marketPoolInfo.positionImpactExponentFactor,
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
    marketPoolInfo,
    virtualInventoryParams.nextLongUsd,
    virtualInventoryParams.nextShortUsd,
    marketPoolInfo.positionImpactFactorPositive,
    marketPoolInfo.positionImpactFactorNegative,
    marketPoolInfo.positionImpactExponentFactor,
  )

  return priceImpactUsdForVirtualInventory < priceImpactUsd ? priceImpactUsdForVirtualInventory : priceImpactUsd
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

        const denominator = GMX.PERCISION * FLOAT_PRECISION_SQRT
        return positionSizeInUsd * fundingDiffFactor / denominator
    }

export function getPositionFundingFees(positionFees: PositionFeesInfo, position: IPositionAdjustment) {
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

export function getMarkPrice(price: PriceMinMax, isIncrease: boolean, isLong: boolean) {
  const shouldUseMaxPrice = isIncrease ? isLong : !isLong

  return shouldUseMaxPrice ? price.max : price.min
}

export function getEntryPrice(sizeInUsd: bigint, sizeInTokens: bigint, indexToken: viem.Address) {
  if (sizeInTokens <= 0n) return 0n

  return sizeInUsd / sizeInTokens * getTokenDenominator(indexToken)
}

export function getPositionPendingFeesUsd(pendingFundingFeesUsd: bigint, pendingBorrowingFeesUsd: bigint) {

  return pendingBorrowingFeesUsd + pendingFundingFeesUsd
}


export function getPositionFee(
  marketInfo: IMarketPoolValueInfo,
  sizeDeltaUsd: bigint,
  forPositiveImpact: boolean,
  referralInfo: PositionReferralFees
) {
  const factor = forPositiveImpact
    ? marketInfo.positionFeeFactorForPositiveImpact
    : marketInfo.positionFeeFactorForNegativeImpact

  const positionFeeUsd = applyFactor(sizeDeltaUsd, factor)

  if (!referralInfo) {
    return { positionFeeUsd, discountUsd: 0n, totalRebateUsd: 0n }
  }

  const totalRebateUsd = applyFactor(positionFeeUsd, referralInfo.totalRebateFactor)
  const discountUsd = applyFactor(totalRebateUsd, referralInfo.traderDiscountFactor)

  

  return {
    positionFeeUsd: positionFeeUsd - discountUsd,
    discountUsd,
    totalRebateUsd,
  }
}

export function getPositionNetValue(
  collateralUsd: bigint,
  pendingFundingFeesUsd: bigint,
  pendingBorrowingFeesUsd: bigint,
  pnl: bigint,
  closingFeeUsd: bigint,
) {

  const pendingFeesUsd = getPositionPendingFeesUsd(pendingFundingFeesUsd, pendingBorrowingFeesUsd)

  return collateralUsd - pendingFeesUsd - closingFeeUsd + pnl
}



export function getLiquidationPrice(
  collateralToken: viem.Address,
  indexToken: viem.Address,
  sizeInUsd: bigint,
  sizeInTokens: bigint,
  collateralAmount: bigint,
  collateralUsd: bigint,
  marketInfo: IMarketInfo,
  marketPoolInfo: IMarketPoolValueInfo,
  pendingFundingFeesUsd: bigint,
  pendingBorrowingFeesUsd: bigint,
  minCollateralUsd: bigint,
  isLong: boolean,
  userReferralInfo: PositionReferralFees,
  useMaxPriceImpact = false,
) {

  if (sizeInUsd <= 0n || sizeInTokens <= 0n) {
    return 0n
  }

  const closingFeeUsd = getPositionFee(marketPoolInfo, sizeInUsd, false, userReferralInfo).positionFeeUsd
  const totalPendingFeesUsd = getPositionPendingFeesUsd(pendingFundingFeesUsd, pendingBorrowingFeesUsd)
  const totalFeesUsd = totalPendingFeesUsd + closingFeeUsd

  const maxNegativePriceImpactUsd = -applyFactor(sizeInUsd, marketPoolInfo.maxPositionImpactFactorForLiquidations)

  let priceImpactDeltaUsd = 0n

  if (useMaxPriceImpact) {
    priceImpactDeltaUsd = maxNegativePriceImpactUsd
  } else {
    priceImpactDeltaUsd = getPriceImpactForPosition(marketInfo, marketPoolInfo, -sizeInUsd, isLong)

    if (priceImpactDeltaUsd < maxNegativePriceImpactUsd) {
      priceImpactDeltaUsd = maxNegativePriceImpactUsd
    }

    // Ignore positive price impact
    if (priceImpactDeltaUsd > 0n) {
      priceImpactDeltaUsd = 0n
    }
  }

  let liquidationCollateralUsd = applyFactor(sizeInUsd, marketPoolInfo.minCollateralFactor)
  if (liquidationCollateralUsd < minCollateralUsd) {
    liquidationCollateralUsd = minCollateralUsd
  }

  let liquidationPrice = 0n

  const indexTokenDescription = getMappedValue(GMX.TOKEN_ADDRESS_DESCRIPTION_MAP, indexToken)
  const indexTokenDenominator = getDenominator(indexTokenDescription.decimals)

  if (collateralToken === indexToken) {
    if (isLong) {
      const denominator = sizeInTokens + collateralAmount
      if (denominator === 0n) return 0n
      
      liquidationPrice = (sizeInUsd + liquidationCollateralUsd - priceImpactDeltaUsd + totalFeesUsd) / denominator * indexTokenDenominator
    } else {
      const denominator = sizeInTokens - collateralAmount
      if (denominator === 0n) return 0n

      liquidationPrice = (sizeInUsd - liquidationCollateralUsd + priceImpactDeltaUsd - totalFeesUsd) / denominator * indexTokenDenominator
    }
  } else {
    if (sizeInTokens === 0n) return 0n
    const remainingCollateralUsd = collateralUsd + priceImpactDeltaUsd - totalPendingFeesUsd - closingFeeUsd

    if (isLong) {
      liquidationPrice = (liquidationCollateralUsd - remainingCollateralUsd + sizeInUsd) / sizeInTokens * indexTokenDenominator
    } else {
      liquidationPrice = (liquidationCollateralUsd - remainingCollateralUsd - sizeInUsd) / -sizeInTokens * indexTokenDenominator
    }
  }

  if (liquidationPrice <= 0n) return 0n

  return liquidationPrice
}


export function getLeverage(
  sizeInUsd: bigint,
  collateralUsd: bigint,
  pnl: bigint,
  pendingFundingFeesUsd: bigint,
  pendingBorrowingFeesUsd: bigint,
) {
  const totalPendingFeesUsd = getPositionPendingFeesUsd(pendingFundingFeesUsd, pendingBorrowingFeesUsd)

  const remainingCollateralUsd = collateralUsd + pnl - totalPendingFeesUsd

  if (remainingCollateralUsd <= 0n) {
    return 0n
  }

  return sizeInUsd * 10000n / remainingCollateralUsd
}
