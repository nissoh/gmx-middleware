import { IntervalTime, PRECISION, applyFactor, factor, getTokenUsd } from "common-utils"
import { IMarketFees, IMarketInfo, IMarketPrice, IMarketUsageInfo } from "./types.js"

export function getPoolUsd(
  marketInfo: IMarketInfo,
  marketPrice: IMarketPrice,
  isLong: boolean,
  maximize: boolean = false
) {
  const poolAmount = isLong ? marketInfo.pool.longTokenAmount : marketInfo.pool.shortTokenAmount
  const price = isLong
    ? maximize ? marketPrice.longTokenPrice.max : marketPrice.longTokenPrice.min
    : maximize ? marketPrice.shortTokenPrice.max : marketPrice.shortTokenPrice.min

  return getTokenUsd(price, poolAmount)
}



export function getPoolUsdWithoutPnl(
  marketPrice: IMarketPrice,
  marketInfo: IMarketInfo,
  isLong: boolean,
  maximize: boolean = false
) {
  const poolAmount = isLong ? marketInfo.pool.longTokenAmount : marketInfo.pool.shortTokenAmount
  const price = isLong
    ? maximize ? marketPrice.longTokenPrice.max : marketPrice.longTokenPrice.min
    : maximize ? marketPrice.shortTokenPrice.max : marketPrice.shortTokenPrice.min

  return getTokenUsd(price, poolAmount)
}




export function getAvailableReservedUsd(marketInfo: IMarketInfo, marketPrice: IMarketPrice, isLong: boolean) {
  const maxReservedUsd = getMaxReservedUsd(marketInfo, marketPrice, isLong)
  const openInterestUsd = isLong
    ? getTokenUsd(marketPrice.longTokenPrice.min, marketInfo.usage.longInterestInTokens)
    : marketInfo.usage.shortInterestUsd

  return maxReservedUsd - openInterestUsd
}


export function getMaxReservedUsd(marketInfo: IMarketInfo, marketPrice: IMarketPrice, isLong: boolean) {
  const poolUsd = getPoolUsd(marketInfo, marketPrice, isLong)
  const openInterestReserveFactor = isLong ? marketInfo.config.openInterestReserveFactorLong : marketInfo.config.openInterestReserveFactorShort
  const reserveFactor = isLong ? marketInfo.config.reserveFactorLong : marketInfo.config.reserveFactorShort

  if (openInterestReserveFactor < reserveFactor) {
    return poolUsd * openInterestReserveFactor / PRECISION
  }

  return poolUsd * reserveFactor / PRECISION
}

// export function getReservedUsd(marketInfo: MarketInfo, isLong: boolean) {
//   const { indexToken } = marketInfo;

//   if (isLong) {
//     return convertToUsd(marketInfo.longInterestInTokens, marketInfo.indexToken.decimals, indexToken.prices.maxPrice)!;
//   } else {
//     return marketInfo.shortInterestUsd;
//   }
// }

export function getReservedUsd(marketInfo: IMarketInfo, marketPrice: IMarketPrice, isLong: boolean) {
  if (isLong) {
    return getTokenUsd(marketPrice.longTokenPrice.max, marketInfo.usage.longInterestInTokens)
  } else {
    return marketInfo.usage.shortInterestUsd
  }
}

// export function getAvailableUsdLiquidityForPosition(marketInfo: MarketInfo, isLong: boolean) {
//   if (marketInfo.isSpotOnly) {
//     return BigNumber.from(0);
//   }

//   const maxReservedUsd = getMaxReservedUsd(marketInfo, isLong);
//   const reservedUsd = getReservedUsd(marketInfo, isLong);

//   const maxOpenInterest = getMaxOpenInterestUsd(marketInfo, isLong);
//   const currentOpenInterest = getOpenInterestUsd(marketInfo, isLong);

//   const availableLiquidityBasedOnMaxReserve = maxReservedUsd.sub(reservedUsd);
//   const availableLiquidityBasedOnMaxOpenInterest = maxOpenInterest.sub(currentOpenInterest);

//   const result = availableLiquidityBasedOnMaxReserve.lt(availableLiquidityBasedOnMaxOpenInterest)
//     ? availableLiquidityBasedOnMaxReserve
//     : availableLiquidityBasedOnMaxOpenInterest;

//   return result.lt(0) ? BigNumber.from(0) : result;
// }

export function getAvailableUsdLiquidityForPosition(marketInfo: IMarketInfo, marketPrice: IMarketPrice, isLong: boolean) {
  const maxReservedUsd = getMaxReservedUsd(marketInfo, marketPrice, isLong)
  const reservedUsd = getReservedUsd(marketInfo, marketPrice, isLong)

  // const maxOpenInterest = isLong ? marketInfo.maxOpenInterestLong : marketInfo.maxOpenInterestShort
  const maxOpenInterestUsd = isLong
    ? getTokenUsd(marketInfo.price.longTokenPrice.max, marketInfo.usage.longInterestInTokensUsingLongToken) + getTokenUsd(marketInfo.price.shortTokenPrice.max, marketInfo.usage.longInterestInTokensUsingShortToken)
    : getTokenUsd(marketInfo.price.longTokenPrice.max, marketInfo.usage.shortInterestInTokensUsingLongToken) + getTokenUsd(marketInfo.price.shortTokenPrice.max, marketInfo.usage.shortInterestInTokensUsingShortToken)
  const currentOpenInterest = 0n // getOpenInterestUsd(marketInfo, marketPrice, isLong)

  const availableLiquidityBasedOnMaxReserve = maxReservedUsd - reservedUsd
  const availableLiquidityBasedOnMaxOpenInterest = maxOpenInterestUsd - currentOpenInterest

  const result = availableLiquidityBasedOnMaxReserve < availableLiquidityBasedOnMaxOpenInterest
    ? availableLiquidityBasedOnMaxReserve
    : availableLiquidityBasedOnMaxOpenInterest

  return result < 0n ? 0n : result
}


export function getBorrowingFactorPerInterval(fees: IMarketFees, isLong: boolean, interval: IntervalTime) {
  const factorPerSecond = isLong
    ? fees.borrowingFactorPerSecondForLongs
    : fees.borrowingFactorPerSecondForShorts

  return factorPerSecond * BigInt(interval)
}

export function getFundingFactorPerInterval(usage: IMarketUsageInfo, fees: IMarketFees, interval: IntervalTime) {
  const ratio = factor(usage.longInterestUsd, usage.shortInterestUsd)

  return applyFactor(ratio, fees.nextFunding.fundingFactorPerSecond) * BigInt(interval)
}


export function getFundingFactorPerInterval2(marketPrice: IMarketPrice, usage: IMarketUsageInfo, fees: IMarketFees, isLong: boolean, interval: IntervalTime) {
  const longsPayShorts = fees.nextFunding.longsPayShorts
  const isLargerSide = isLong ? longsPayShorts : !longsPayShorts

  const longInterestUsd = getTokenUsd(marketPrice.longTokenPrice.max, usage.longInterestInTokens)
  const shortInterestUsd = getTokenUsd(marketPrice.shortTokenPrice.max, usage.shortInterestInTokens)
  const ratio = factor(longInterestUsd, shortInterestUsd)

  if (isLargerSide) return fees.nextFunding.fundingFactorPerSecond * BigInt(interval)

  return applyFactor(ratio, fees.nextFunding.fundingFactorPerSecond) * BigInt(interval)
}

