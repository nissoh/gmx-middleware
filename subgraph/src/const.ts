import { BigInt } from "@graphprotocol/graph-ts"

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000"

export const BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)
export const FUNDING_RATE_PRECISION = BigInt.fromI32(1000000)
export const MARGIN_FEE_BASIS_POINTS = BigInt.fromI32(10)


export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const BI_18 = BigInt.fromI32(18)
export const BI_10 = BigInt.fromI32(10)

export const BI_12_PRECISION = BigInt.fromI32(10).pow(12)
export const BI_18_PRECISION = BigInt.fromI32(10).pow(18)
export const BI_22_PRECISION = BigInt.fromI32(10).pow(22)