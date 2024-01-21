import * as GMX from "gmx-middleware-const"
import * as viem from "viem"
import { getNativeTokenAddress } from "./gmxUtils.js"
import { ADDRESS_ZERO, getDenominator, getSafeMappedValue } from "common-utils"



export function resolveAddress<TChain extends viem.Chain>(chain: TChain, indexToken: viem.Address): viem.Address {
  if (indexToken === ADDRESS_ZERO) {
    return getNativeTokenAddress(chain)
  }

  const contractAddressMap = getSafeMappedValue(GMX.TOKEN_ADDRESS_DESCRIPTION_MAP, indexToken, indexToken as any)

  if (contractAddressMap === null) {
    throw new Error(`Token ${indexToken} does not exist`)
  }

  return indexToken
}

export function adjustForDecimals(amount: bigint, divDecimals: number, mulDecimals: number) {
  return amount * getDenominator(mulDecimals) / getDenominator(divDecimals)
}



// export function getAmountByRatio(
//   chain: viem.Chain,
//   fromToken: viem.Address,
//   toToken: viem.Address,
//   fromTokenAmount: bigint,
//   ratio: bigint,
//   shouldInvertRatio?: boolean,
// ) {
//   if (resolveAddress(chain, fromToken) === toToken || fromTokenAmount === 0n) return fromTokenAmount

//   const _ratio = shouldInvertRatio ? GMX.PERCISION * GMX.PERCISION / ratio : ratio
//   const adjustedDecimalsRatio = adjustForDecimals(_ratio, fromToken.decimals, toToken.decimals)

//   return fromTokenAmount * adjustedDecimalsRatio / GMX.PERCISION
// }