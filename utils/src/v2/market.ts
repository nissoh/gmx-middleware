import { getTokenUsd } from "../gmxUtils.js"
import { IMarketInfo, IMarketUsageInfo, IMarketPrice, IMarketFees } from "../typesGMXV2.js"
import * as GMX from "gmx-middleware-const"
import { TimelineTime } from "../utils.js"
import { applyFactor, factor } from "../mathUtils.js"

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

export function getMaxReservedUsd(marketInfo: IMarketInfo, marketPrice: IMarketPrice, isLong: boolean) {
  const poolUsd = getPoolUsd(marketInfo, marketPrice, isLong, false)
  const openInterestReserveFactor = isLong ? marketInfo.config.openInterestReserveFactorLong : marketInfo.config.openInterestReserveFactorShort
  const reserveFactor = isLong ? marketInfo.config.reserveFactorLong : marketInfo.config.reserveFactorShort

  if (openInterestReserveFactor < reserveFactor) {
    return poolUsd * openInterestReserveFactor / GMX.PRECISION
  }

  return poolUsd * reserveFactor / GMX.PRECISION
}

export function getAvailableReservedUsd(marketInfo: IMarketInfo, marketPrice: IMarketPrice, isLong: boolean) {
  const isSpotOnly = marketInfo.market.indexToken === GMX.ADDRESS_ZERO

  if (isSpotOnly) return 0n

  const maxReservedUsd = getMaxReservedUsd(marketInfo, marketPrice, isLong)
  const openInterestUsd = isLong
    ? getTokenUsd(marketPrice.longTokenPrice.min, marketInfo.usage.longInterestInTokens)
    : marketInfo.usage.shortInterestUsd

  return maxReservedUsd - openInterestUsd
}


export function getBorrowingFactorPerInterval(fees: IMarketFees, isLong: boolean, interval: GMX.IntervalTime) {
  const factorPerSecond = isLong
    ? fees.borrowingFactorPerSecondForLongs
    : fees.borrowingFactorPerSecondForShorts

  return factorPerSecond * BigInt(interval)
}

export function getFundingFactorPerInterval(marketPrice: IMarketPrice, usage: IMarketUsageInfo, fees: IMarketFees, interval: GMX.IntervalTime) {
  const longInterestUsd = getTokenUsd(marketPrice.longTokenPrice.max, usage.longInterestInTokens)
  const shortInterestUsd = getTokenUsd(marketPrice.shortTokenPrice.max, usage.shortInterestUsd)

  const ratio = factor(usage.longInterestUsd, usage.shortInterestUsd)

  return applyFactor(ratio, fees.nextFunding.fundingFactorPerSecond) * BigInt(interval)
}


export function getFundingFactorPerInterval2(marketPrice: IMarketPrice, usage: IMarketUsageInfo, fees: IMarketFees, isLong: boolean, interval: GMX.IntervalTime) {
  const longsPayShorts = fees.nextFunding.longsPayShorts
  const isLargerSide = isLong ? longsPayShorts : !longsPayShorts

  const longInterestUsd = getTokenUsd(marketPrice.longTokenPrice.max, usage.longInterestInTokens)
  const shortInterestUsd = getTokenUsd(marketPrice.shortTokenPrice.max, usage.shortInterestInTokens)
  const ratio = factor(longInterestUsd, shortInterestUsd)

  if (isLargerSide) return fees.nextFunding.fundingFactorPerSecond * BigInt(interval)

  return applyFactor(ratio, fees.nextFunding.fundingFactorPerSecond) * BigInt(interval)
}

