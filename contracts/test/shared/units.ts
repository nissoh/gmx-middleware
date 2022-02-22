import { ethers } from "ethers"

export function toUsd(value: number) {
  const normalizedValue = parseInt(value * Math.pow(10, 10))
  return ethers.BigNumber.from(normalizedValue).mul(ethers.BigNumber.from(10).pow(20))
}

export function toNormalizedPrice(value: number) {
  const normalizedValue = parseInt(value * Math.pow(10, 10))
  return ethers.BigNumber.from(normalizedValue).mul(ethers.BigNumber.from(10).pow(20))
}

