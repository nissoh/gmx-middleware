import { getTokenUsd } from "../gmxUtils.js"
import { IMarketInfo, IMarketPrice } from "../typesGMXV2.js"
import * as GMX from "gmx-middleware-const"
import { TimelineTime } from "../utils.js"
import { applyFactor, factor } from "../mathUtils.js"

export function getPoolUsd(
  marketInfo: IMarketInfo,
  marketPrice: IMarketPrice,
  isLong: boolean,
  maximize: boolean = false
) {
  const poolAmount = isLong ? marketInfo.longTokenAmount : marketInfo.shortTokenAmount
  const price = isLong
   ? maximize ? marketPrice.longTokenPrice.max : marketPrice.longTokenPrice.min
   : maximize ? marketPrice.shortTokenPrice.max : marketPrice.shortTokenPrice.min

  return getTokenUsd(price, poolAmount)
}

export function getMaxReservedUsd(marketInfo: IMarketInfo, marketPrice: IMarketPrice, isLong: boolean) {
  const poolUsd = getPoolUsd(marketInfo, marketPrice, isLong, false)
  const reserveFactor = isLong ? marketInfo.reserveFactorLong : marketInfo.reserveFactorShort
  const openInterestReserveFactor = isLong ? marketInfo.openInterestReserveFactorLong : marketInfo.openInterestReserveFactorShort

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
    ? getTokenUsd(marketPrice.longTokenPrice.min, marketInfo.longInterestInTokens)
    : getTokenUsd(marketPrice.shortTokenPrice.min, marketInfo.shortInterestInTokens)

  return maxReservedUsd - openInterestUsd
}


export function getBorrowingFactorPerInterval(marketInfo: IMarketInfo, isLong: boolean, interval: GMX.IntervalTime) {
  const factorPerSecond = isLong
    ? marketInfo.borrowingFactorPerSecondForLongs
    : marketInfo.borrowingFactorPerSecondForShorts

  return factorPerSecond * BigInt(interval)
}


export function getFundingFactorPerInterval(marketPrice: IMarketPrice ,marketInfo: IMarketInfo, isLong: boolean, interval: GMX.IntervalTime) {
  const longsPayShorts = marketInfo.nextFunding.longsPayShorts
  const isLargerSide = isLong ? longsPayShorts : !longsPayShorts

  if (isLargerSide) return -marketInfo.nextFunding.fundingFactorPerSecond * BigInt(interval)

  const longInterestUsd = getTokenUsd(marketPrice.longTokenPrice.max, marketInfo.longInterestInTokens)
  const shortInterestUsd = getTokenUsd(marketPrice.longTokenPrice.max, marketInfo.shortInterestInTokens)

  const largerInterestUsd = longsPayShorts ? longInterestUsd : shortInterestUsd
  const smallerInterestUsd = longsPayShorts ? shortInterestUsd : longInterestUsd

  const ratio = smallerInterestUsd > 0n
    ? factor(largerInterestUsd, smallerInterestUsd)
    : 0n

  return applyFactor(ratio, marketInfo.nextFunding.fundingFactorPerSecond) * BigInt(interval)

}

