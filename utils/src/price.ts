import * as GMX from "gmx-middleware-const"
import * as viem from "viem"
import { IMarketInfo, IMarketPrice, IOraclePrice, IPriceMinMax, IPriceOracleMap } from "./types.js"
import { abs, applyFactor, delta, getDenominator, getMappedValue, getTokenUsd, groupArrayByKeyMap } from "common-utils"




export function getPriceImpactUsd(
  currentLongUsd: bigint,
  currentShortUsd: bigint,
  nextLongUsd: bigint,
  nextShortUsd: bigint,
  factorPositive: bigint,
  factorNegative: bigint,
  exponentFactor: bigint
) {

  if (nextLongUsd < 0n || nextShortUsd < 0n) {
    return 0n
  }

  const currentDiff = delta(currentLongUsd, currentShortUsd)
  const nextDiff = delta(nextLongUsd, nextShortUsd)

  const isSameSideRebalance = currentLongUsd < currentShortUsd === nextLongUsd < nextShortUsd


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
  marketPrice: IMarketPrice,
  marketPoolInfo: IMarketInfo,
  sizeDeltaUsd: bigint,
  isLong: boolean,
) {
  const priceImpactDeltaUsd = getPriceImpactForPosition(marketPoolInfo, sizeDeltaUsd, isLong)

  if (priceImpactDeltaUsd < 0n) return priceImpactDeltaUsd

  const impactPoolAmount = marketPoolInfo.usage.positionImpactPoolAmount

  const maxPriceImpactUsdBasedOnImpactPool = getTokenUsd(
    marketPrice.indexTokenPrice.min,
    impactPoolAmount,
  )!

  let cappedImpactUsd = priceImpactDeltaUsd

  if (cappedImpactUsd > maxPriceImpactUsdBasedOnImpactPool) {
    cappedImpactUsd = maxPriceImpactUsdBasedOnImpactPool
  }

  const maxPriceImpactFactor = marketPoolInfo.config.maxPositionImpactFactorPositive
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

  const longInterestInUsd = marketInfo.usage.longInterestUsd
  const shortInterestInUsd = marketInfo.usage.shortInterestUsd
    

  const nextLongUsd = longInterestInUsd + (isLong ? sizeDeltaUsd : 0n)
  const nextShortUsd = shortInterestInUsd + (isLong ? 0n : sizeDeltaUsd)

  const priceImpactUsd = getPriceImpactUsd(
    longInterestInUsd,
    shortInterestInUsd,
    nextLongUsd,
    nextShortUsd,
    marketInfo.config.positionImpactFactorPositive,
    marketInfo.config.positionImpactFactorNegative,
    marketInfo.config.positionImpactExponentFactor,
  )

  if (priceImpactUsd > 0n) {
    return priceImpactUsd
  }


  if (!(abs(marketInfo.fees.virtualInventory.virtualInventoryForPositions) > 0n)) {
    return priceImpactUsd
  }

  const virtualInventoryParams = getNextOpenInterestForVirtualInventory(
    marketInfo.fees.virtualInventory.virtualInventoryForPositions,
    sizeDeltaUsd,
    isLong
  )

  const priceImpactUsdForVirtualInventory = getPriceImpactUsd(
    longInterestInUsd,
    shortInterestInUsd,
    virtualInventoryParams.nextLongUsd,
    virtualInventoryParams.nextShortUsd,
    marketInfo.config.positionImpactFactorPositive,
    marketInfo.config.positionImpactFactorNegative,
    marketInfo.config.positionImpactExponentFactor,
  )

  return priceImpactUsdForVirtualInventory < priceImpactUsd ? priceImpactUsdForVirtualInventory : priceImpactUsd
}


export function getMarkPrice(price: IPriceMinMax, isIncrease: boolean, isLong: boolean) {
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



// Signed Prices
// To get the latest signed price information for sending transactions:
// {
//     "id": "1242386390",
//     "minBlockNumber": 164915223,
//     "minBlockHash": null,
//     "oracleDecimals": null,
//     "tokenSymbol": "ETH",
//     "tokenAddress": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
//     "minPrice": null,
//     "maxPrice": null,
//     "signer": null,
//     "signature": null,
//     "signatureWithoutBlockHash": null,
//     "createdAt": "2023-12-29T10:15:08.255Z",
//     "minBlockTimestamp": null,
//     "oracleKeeperKey": "realtimeFeed",
//     "maxBlockTimestamp": 1703844907,
//     "maxBlockNumber": 164915224,
//     "maxBlockHash": "0x9128656166fbfc678d4261157a55a3d2643fe69a0bd38ea7db081b4ed101366f",
//     "maxPriceFull": "2366066074010000",
//     "minPriceFull": "2365810898560000",
//     "oracleKeeperRecordId": null,
//     "oracleKeeperFetchType": "ws",
//     "oracleType": "realtimeFeed",
//     "blob": "0x000637558ae605b87120ff75c52308703f79ebafba207a65d69705ec7ba8beb70000000000000000000000000000000000000000000000000000000012e3be19000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002c00000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012074aca63821bf7ead199e924d261d277cbec96d1026ab65267d655c51b453691400000000000000000000000000000000000000000000000000000000658e9c2b000000000000000000000000000000000000000000000000000000371617a135000000000000000000000000000000000000000000000000000000371554f2400000000000000000000000000000000000000000000000000000003716da50290000000000000000000000000000000000000000000000000000000009d468189128656166fbfc678d4261157a55a3d2643fe69a0bd38ea7db081b4ed101366f0000000000000000000000000000000000000000000000000000000009d4681700000000000000000000000000000000000000000000000000000000658e9c2b0000000000000000000000000000000000000000000000000000000000000004df7cd1c994c57352532cf49a0b1de5a791b2e9cc4e267786b59814b7aee75e08a4f2ef7e8b0dd79cab5dd6ed2c91fc038da4c645d366c1560ceac4f6d4989a11721b3e5d45d9a551d06907b3385133c8373cc63b2b9f71072e2f53f0b20c28689f6d436cd010a1add6d9a6ae651e20ff76ba380afc43e8afd0a64b9be265290d000000000000000000000000000000000000000000000000000000000000000412fde004a5c2285defe03416bb10e8e19a3d794e635165fd5d65ea0fb3843a0e4f1edd2287148ad93d7c62045de30b4d464a8116b52f19c1324e4bab4661165b6b3bfedbf81de92bfb89ef62f3d013600ea62a86ebd24c261df1e089b3fc2dbe17b007e5e04c1d5875da912d581df4a44088a05c76a8757e012d4bd5031449cf"
// }
// Arbitrum URL: https://arbitrum-api.gmxinfra.io/signed_prices/latest
// Avalanche URL: https://avalanche-api.gmxinfra.io/signed_prices/latest
interface ISignedPrice {
  id: string
  minBlockNumber: number
  minBlockHash: string | null
  oracleDecimals: number | null
  tokenSymbol: string
  tokenAddress: string
  minPrice: number | null
  maxPrice: number | null
  signer: string | null
  signature: string | null
  signatureWithoutBlockHash: string | null
  createdAt: string
  minBlockTimestamp: number | null
  oracleKeeperKey: string
  maxBlockTimestamp: number
  maxBlockNumber: number
  maxBlockHash: string
  maxPriceFull: string
  minPriceFull: string
  oracleKeeperRecordId: string | null
  oracleKeeperFetchType: string
  oracleType: string
  blob: string
}

export async function querySignedPrices(): Promise<IPriceOracleMap> {
  const x = await fetch('https://arbitrum-api.gmxinfra.io/signed_prices/latest')


  const res = await x.json() as {signedPrices: ISignedPrice[]}
  return groupArrayByKeyMap(res.signedPrices, price => viem.getAddress(price.tokenAddress), (price, token) => {

    const priceMin = BigInt(price.minPriceFull)
    const priceMax = BigInt(price.maxPriceFull)

    return {
      priceSourceType: 0n,
      timestamp: price.maxBlockTimestamp,
      token,
      min: priceMin,
      max: priceMax,
    }
  })
}

