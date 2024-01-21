
import { awaitPromises, map } from "@most/core"
import { Stream } from "@most/types"
import { PRECISION, expandDecimals, getDenominator, zipState } from "common-utils"
import { ARBITRUM_ADDRESS, AVALANCHE_ADDRESS, TOKEN_DESCRIPTION_MAP } from "gmx-middleware-const"
import { Address, PublicClient } from "viem"
import { getNativeTokenDescription } from "../gmxUtils.js"
import { arbitrum, avalanche } from "viem/chains"
import univ3Pool from './uniV3.abi.js'
import univ2Pool from './uniV2.abi.js'

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
  if (client.chain?.id === avalanche.id) {
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
  if (client.chain?.id !== avalanche.id) {
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
  if (client.chain?.id !== arbitrum.id) {
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

    if (client.chain.id === arbitrum.id) {
      return getArbitrumNetworkTokenUsd(client)
    } else if (client.chain.id === avalanche.id) {
      return getArbitrumNetworkTokenUsd(client)
    }

    throw new Error('unsupported chain')
  }, client))
  return nativeTokenPrice
}

