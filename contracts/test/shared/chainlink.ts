export function toChainlinkPrice(value: number) {
  return parseInt(value * Math.pow(10, 8))
}

