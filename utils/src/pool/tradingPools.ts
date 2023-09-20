
import { awaitPromises, map } from "@most/core"
import { Stream } from "@most/types"
import { ARBITRUM_ADDRESS, AVALANCHE_ADDRESS, CHAIN, PRECISION, TOKEN_DESCRIPTION_MAP } from "gmx-middleware-const"
import { Address, PublicClient } from "viem"
import { getNativeTokenDescription } from "../index.js"
import { expandDecimals, getDenominator, zipState } from "../utils.js"


export async function getUniV3PoolPrice(client: PublicClient, decimals: number, poolAddress: Address) {
  const [sqrtPriceX96] = await client.readContract({
    abi: univ3Pool,
    address: poolAddress,
    functionName: 'slot0'
  })

  const denominator = getDenominator(decimals)
  const price = sqrtPriceX96 * sqrtPriceX96 * denominator >> 192n
  return price
}


export async function getUniV2PoolPrice(client: PublicClient, decimals: number, poolAddress: Address) {
  const [reserve0, reserve1] = await client.readContract({
    abi: univ2Pool,
    address: poolAddress,
    functionName: 'getReserves'
  })

  const denominator = getDenominator(decimals)
  const ratio = reserve1 * denominator / reserve0

  return ratio
}



function getGmxPerNetworkToken(client: PublicClient) {
  if (client.chain?.id === CHAIN.AVALANCHE) {
    return getUniV2PoolPrice(client, TOKEN_DESCRIPTION_MAP.GMX.decimals, AVALANCHE_ADDRESS.TraderJoeUniPool)
  }

  return getUniV3PoolPrice(
    client,
    TOKEN_DESCRIPTION_MAP.GMX.decimals,
    ARBITRUM_ADDRESS.UniswapGmxEthPool
  )
}

export function getGmxPriceUsd(client: Stream<PublicClient>, networkTokenUsd: Stream<bigint>) {
  const gmxPerNetworkToken = awaitPromises(map(getGmxPerNetworkToken, client))
  const state = zipState({ gmxPerNetworkToken, networkTokenUsd, client })

  return map(params => {
    if (!params.client.chain) {
      throw new Error('client chain is not defined')
    }

    const networkTokenDescription = getNativeTokenDescription(params.client.chain)
    const price = params.networkTokenUsd * PRECISION / expandDecimals(params.gmxPerNetworkToken, 30 - networkTokenDescription.decimals)

    return price
  }, state)
}

export async function getAvalancheNetworkTokenUsd(client: PublicClient) {
  if (client.chain?.id !== CHAIN.AVALANCHE) {
    throw new Error('given chain is not avalanche')
  }

  const price = await getUniV2PoolPrice(
    client,
    TOKEN_DESCRIPTION_MAP.WAVAX.decimals,
    '0xf4003f4efbe8691b60249e6afbd307abe7758adb'
  )

  const usdPrice = expandDecimals(price, 30 - TOKEN_DESCRIPTION_MAP.USDC.decimals)

  return usdPrice
}

export async function getArbitrumNetworkTokenUsd(client: PublicClient) {
  if (client.chain?.id !== CHAIN.ARBITRUM) {
    throw new Error('given chain is not arbitrum')
  }

  const price = await getUniV3PoolPrice(
    client,
    TOKEN_DESCRIPTION_MAP.WETH.decimals,
    '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'
  )

  const usdPrice = expandDecimals(price, 30 - TOKEN_DESCRIPTION_MAP.USDC.decimals)
  return usdPrice
}

export function getClientNativeTokenUsd(client: Stream<PublicClient>) {
  const nativeTokenPrice = awaitPromises(map(async client => {
    if (!client.chain) {
      throw new Error('client.chain is undefined')
    }

    if (client.chain.id === CHAIN.ARBITRUM) {
      return getArbitrumNetworkTokenUsd(client)
    } else if (client.chain.id === CHAIN.AVALANCHE) {
      return getArbitrumNetworkTokenUsd(client)
    }

    throw new Error('unsupported chain')
  }, client))
  return nativeTokenPrice
}




const univ3Pool = [{ inputs: [], stateMutability: "nonpayable", type: "constructor" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "owner", type: "address" }, { indexed: true, internalType: "int24", name: "tickLower", type: "int24" }, { indexed: true, internalType: "int24", name: "tickUpper", type: "int24" }, { indexed: false, internalType: "uint128", name: "amount", type: "uint128" }, { indexed: false, internalType: "uint256", name: "amount0", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount1", type: "uint256" }], name: "Burn", type: "event" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "owner", type: "address" }, { indexed: false, internalType: "address", name: "recipient", type: "address" }, { indexed: true, internalType: "int24", name: "tickLower", type: "int24" }, { indexed: true, internalType: "int24", name: "tickUpper", type: "int24" }, { indexed: false, internalType: "uint128", name: "amount0", type: "uint128" }, { indexed: false, internalType: "uint128", name: "amount1", type: "uint128" }], name: "Collect", type: "event" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "sender", type: "address" }, { indexed: true, internalType: "address", name: "recipient", type: "address" }, { indexed: false, internalType: "uint128", name: "amount0", type: "uint128" }, { indexed: false, internalType: "uint128", name: "amount1", type: "uint128" }], name: "CollectProtocol", type: "event" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "sender", type: "address" }, { indexed: true, internalType: "address", name: "recipient", type: "address" }, { indexed: false, internalType: "uint256", name: "amount0", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount1", type: "uint256" }, { indexed: false, internalType: "uint256", name: "paid0", type: "uint256" }, { indexed: false, internalType: "uint256", name: "paid1", type: "uint256" }], name: "Flash", type: "event" }, { anonymous: false, inputs: [{ indexed: false, internalType: "uint16", name: "observationCardinalityNextOld", type: "uint16" }, { indexed: false, internalType: "uint16", name: "observationCardinalityNextNew", type: "uint16" }], name: "IncreaseObservationCardinalityNext", type: "event" }, { anonymous: false, inputs: [{ indexed: false, internalType: "uint160", name: "sqrtPriceX96", type: "uint160" }, { indexed: false, internalType: "int24", name: "tick", type: "int24" }], name: "Initialize", type: "event" }, { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "sender", type: "address" }, { indexed: true, internalType: "address", name: "owner", type: "address" }, { indexed: true, internalType: "int24", name: "tickLower", type: "int24" }, { indexed: true, internalType: "int24", name: "tickUpper", type: "int24" }, { indexed: false, internalType: "uint128", name: "amount", type: "uint128" }, { indexed: false, internalType: "uint256", name: "amount0", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount1", type: "uint256" }], name: "Mint", type: "event" }, { anonymous: false, inputs: [{ indexed: false, internalType: "uint8", name: "feeProtocol0Old", type: "uint8" }, { indexed: false, internalType: "uint8", name: "feeProtocol1Old", type: "uint8" }, { indexed: false, internalType: "uint8", name: "feeProtocol0New", type: "uint8" }, { indexed: false, internalType: "uint8", name: "feeProtocol1New", type: "uint8" }], name: "SetFeeProtocol", type: "event" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "sender", type: "address" }, { indexed: true, internalType: "address", name: "recipient", type: "address" }, { indexed: false, internalType: "int256", name: "amount0", type: "int256" }, { indexed: false, internalType: "int256", name: "amount1", type: "int256" }, { indexed: false, internalType: "uint160", name: "sqrtPriceX96", type: "uint160" }, { indexed: false, internalType: "uint128", name: "liquidity", type: "uint128" }, { indexed: false, internalType: "int24", name: "tick", type: "int24" }], name: "Swap", type: "event" }, { inputs: [{ internalType: "int24", name: "tickLower", type: "int24" }, { internalType: "int24", name: "tickUpper", type: "int24" }, { internalType: "uint128", name: "amount", type: "uint128" }], name: "burn", outputs: [{ internalType: "uint256", name: "amount0", type: "uint256" }, { internalType: "uint256", name: "amount1", type: "uint256" }], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "address", name: "recipient", type: "address" }, { internalType: "int24", name: "tickLower", type: "int24" }, { internalType: "int24", name: "tickUpper", type: "int24" }, { internalType: "uint128", name: "amount0Requested", type: "uint128" }, { internalType: "uint128", name: "amount1Requested", type: "uint128" }], name: "collect", outputs: [{ internalType: "uint128", name: "amount0", type: "uint128" }, { internalType: "uint128", name: "amount1", type: "uint128" }], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "address", name: "recipient", type: "address" }, { internalType: "uint128", name: "amount0Requested", type: "uint128" }, { internalType: "uint128", name: "amount1Requested", type: "uint128" }], name: "collectProtocol", outputs: [{ internalType: "uint128", name: "amount0", type: "uint128" }, { internalType: "uint128", name: "amount1", type: "uint128" }], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "factory", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" }, { inputs: [], name: "fee", outputs: [{ internalType: "uint24", name: "", type: "uint24" }], stateMutability: "view", type: "function" }, { inputs: [], name: "feeGrowthGlobal0X128", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [], name: "feeGrowthGlobal1X128", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "recipient", type: "address" }, { internalType: "uint256", name: "amount0", type: "uint256" }, { internalType: "uint256", name: "amount1", type: "uint256" }, { internalType: "bytes", name: "data", type: "bytes" }], name: "flash", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "uint16", name: "observationCardinalityNext", type: "uint16" }], name: "increaseObservationCardinalityNext", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "uint160", name: "sqrtPriceX96", type: "uint160" }], name: "initialize", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "liquidity", outputs: [{ internalType: "uint128", name: "", type: "uint128" }], stateMutability: "view", type: "function" }, { inputs: [], name: "maxLiquidityPerTick", outputs: [{ internalType: "uint128", name: "", type: "uint128" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "recipient", type: "address" }, { internalType: "int24", name: "tickLower", type: "int24" }, { internalType: "int24", name: "tickUpper", type: "int24" }, { internalType: "uint128", name: "amount", type: "uint128" }, { internalType: "bytes", name: "data", type: "bytes" }], name: "mint", outputs: [{ internalType: "uint256", name: "amount0", type: "uint256" }, { internalType: "uint256", name: "amount1", type: "uint256" }], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "uint256", name: "", type: "uint256" }], name: "observations", outputs: [{ internalType: "uint32", name: "blockTimestamp", type: "uint32" }, { internalType: "int56", name: "tickCumulative", type: "int56" }, { internalType: "uint160", name: "secondsPerLiquidityCumulativeX128", type: "uint160" }, { internalType: "bool", name: "initialized", type: "bool" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "uint32[]", name: "secondsAgos", type: "uint32[]" }], name: "observe", outputs: [{ internalType: "int56[]", name: "tickCumulatives", type: "int56[]" }, { internalType: "uint160[]", name: "secondsPerLiquidityCumulativeX128s", type: "uint160[]" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], name: "positions", outputs: [{ internalType: "uint128", name: "liquidity", type: "uint128" }, { internalType: "uint256", name: "feeGrowthInside0LastX128", type: "uint256" }, { internalType: "uint256", name: "feeGrowthInside1LastX128", type: "uint256" }, { internalType: "uint128", name: "tokensOwed0", type: "uint128" }, { internalType: "uint128", name: "tokensOwed1", type: "uint128" }], stateMutability: "view", type: "function" }, { inputs: [], name: "protocolFees", outputs: [{ internalType: "uint128", name: "token0", type: "uint128" }, { internalType: "uint128", name: "token1", type: "uint128" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "uint8", name: "feeProtocol0", type: "uint8" }, { internalType: "uint8", name: "feeProtocol1", type: "uint8" }], name: "setFeeProtocol", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "slot0", outputs: [{ internalType: "uint160", name: "sqrtPriceX96", type: "uint160" }, { internalType: "int24", name: "tick", type: "int24" }, { internalType: "uint16", name: "observationIndex", type: "uint16" }, { internalType: "uint16", name: "observationCardinality", type: "uint16" }, { internalType: "uint16", name: "observationCardinalityNext", type: "uint16" }, { internalType: "uint8", name: "feeProtocol", type: "uint8" }, { internalType: "bool", name: "unlocked", type: "bool" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "int24", name: "tickLower", type: "int24" }, { internalType: "int24", name: "tickUpper", type: "int24" }], name: "snapshotCumulativesInside", outputs: [{ internalType: "int56", name: "tickCumulativeInside", type: "int56" }, { internalType: "uint160", name: "secondsPerLiquidityInsideX128", type: "uint160" }, { internalType: "uint32", name: "secondsInside", type: "uint32" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "recipient", type: "address" }, { internalType: "bool", name: "zeroForOne", type: "bool" }, { internalType: "int256", name: "amountSpecified", type: "int256" }, { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" }, { internalType: "bytes", name: "data", type: "bytes" }], name: "swap", outputs: [{ internalType: "int256", name: "amount0", type: "int256" }, { internalType: "int256", name: "amount1", type: "int256" }], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "int16", name: "", type: "int16" }], name: "tickBitmap", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [], name: "tickSpacing", outputs: [{ internalType: "int24", name: "", type: "int24" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "int24", name: "", type: "int24" }], name: "ticks", outputs: [{ internalType: "uint128", name: "liquidityGross", type: "uint128" }, { internalType: "int128", name: "liquidityNet", type: "int128" }, { internalType: "uint256", name: "feeGrowthOutside0X128", type: "uint256" }, { internalType: "uint256", name: "feeGrowthOutside1X128", type: "uint256" }, { internalType: "int56", name: "tickCumulativeOutside", type: "int56" }, { internalType: "uint160", name: "secondsPerLiquidityOutsideX128", type: "uint160" }, { internalType: "uint32", name: "secondsOutside", type: "uint32" }, { internalType: "bool", name: "initialized", type: "bool" }], stateMutability: "view", type: "function" }, { inputs: [], name: "token0", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" }, { inputs: [], name: "token1", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" }] as const
const univ2Pool = [{ inputs: [], stateMutability: "nonpayable", type: "constructor" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "owner", type: "address" }, { indexed: true, internalType: "address", name: "spender", type: "address" }, { indexed: false, internalType: "uint256", name: "value", type: "uint256" }], name: "Approval", type: "event" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "sender", type: "address" }, { indexed: false, internalType: "uint256", name: "amount0", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount1", type: "uint256" }, { indexed: true, internalType: "address", name: "to", type: "address" }], name: "Burn", type: "event" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "sender", type: "address" }, { indexed: false, internalType: "uint256", name: "amount0", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount1", type: "uint256" }], name: "Mint", type: "event" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "sender", type: "address" }, { indexed: false, internalType: "uint256", name: "amount0In", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount1In", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount0Out", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount1Out", type: "uint256" }, { indexed: true, internalType: "address", name: "to", type: "address" }], name: "Swap", type: "event" }, { anonymous: false, inputs: [{ indexed: false, internalType: "uint112", name: "reserve0", type: "uint112" }, { indexed: false, internalType: "uint112", name: "reserve1", type: "uint112" }], name: "Sync", type: "event" }, { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "from", type: "address" }, { indexed: true, internalType: "address", name: "to", type: "address" }, { indexed: false, internalType: "uint256", name: "value", type: "uint256" }], name: "Transfer", type: "event" }, { inputs: [], name: "DOMAIN_SEPARATOR", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" }, { inputs: [], name: "MINIMUM_LIQUIDITY", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [], name: "PERMIT_TYPEHASH", outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "address", name: "", type: "address" }], name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "value", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "address", name: "", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "to", type: "address" }], name: "burn", outputs: [{ internalType: "uint256", name: "amount0", type: "uint256" }, { internalType: "uint256", name: "amount1", type: "uint256" }], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "decimals", outputs: [{ internalType: "uint8", name: "", type: "uint8" }], stateMutability: "view", type: "function" }, { inputs: [], name: "factory", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" }, { inputs: [], name: "getReserves", outputs: [{ internalType: "uint112", name: "_reserve0", type: "uint112" }, { internalType: "uint112", name: "_reserve1", type: "uint112" }, { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "_token0", type: "address" }, { internalType: "address", name: "_token1", type: "address" }], name: "initialize", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "kLast", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "to", type: "address" }], name: "mint", outputs: [{ internalType: "uint256", name: "liquidity", type: "uint256" }], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "name", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "", type: "address" }], name: "nonces", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "owner", type: "address" }, { internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "value", type: "uint256" }, { internalType: "uint256", name: "deadline", type: "uint256" }, { internalType: "uint8", name: "v", type: "uint8" }, { internalType: "bytes32", name: "r", type: "bytes32" }, { internalType: "bytes32", name: "s", type: "bytes32" }], name: "permit", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "price0CumulativeLast", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [], name: "price1CumulativeLast", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "to", type: "address" }], name: "skim", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "uint256", name: "amount0Out", type: "uint256" }, { internalType: "uint256", name: "amount1Out", type: "uint256" }, { internalType: "address", name: "to", type: "address" }, { internalType: "bytes", name: "data", type: "bytes" }], name: "swap", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "symbol", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" }, { inputs: [], name: "sync", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "token0", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" }, { inputs: [], name: "token1", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" }, { inputs: [], name: "totalSupply", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "address", name: "to", type: "address" }, { internalType: "uint256", name: "value", type: "uint256" }], name: "transfer", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "address", name: "from", type: "address" }, { internalType: "address", name: "to", type: "address" }, { internalType: "uint256", name: "value", type: "uint256" }], name: "transferFrom", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" }] as const