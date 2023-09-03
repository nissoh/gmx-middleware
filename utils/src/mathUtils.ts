import { BASIS_POINTS_DIVISOR, PERCISION } from "gmx-middleware-const"



export function safeDiv(a: bigint, b: bigint): bigint {
  if (b === 0n) {
    return 0n
  }

  return a / b
}

export function factor(a: bigint, b: bigint): bigint {
  return a * PERCISION / b
}

export function applyFactor(value: bigint, factor: bigint): bigint {
  return value * factor / PERCISION
}

export function getBasisPoints(numerator: bigint, denominator: bigint) {
  if (denominator === 0n) {
    return 0n
  }

  return numerator * BASIS_POINTS_DIVISOR / denominator
}


export function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

export function max(a: bigint, b: bigint): bigint {
  return a > b ? a : b
}

export function minMax(minValue: bigint, maxValue: bigint, value: bigint): bigint {
  return value < minValue ? minValue : value > maxValue ? maxValue : value
}

export function abs(a: bigint): bigint {
  return a < 0n ? -a : a
}

export function delta(a: bigint, b: bigint): bigint {
  return a > b ? a - b : b - a;
}