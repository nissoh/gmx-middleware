import { AnswerUpdated } from '../generated/ChainlinkAggregatorETH/ChainlinkAggregator'
import { AddLiquidity, RemoveLiquidity } from "../generated/GlpManager/GlpManager"
import { Swap } from '../generated/UniswapPool/UniswapPoolV3'
import { BTC, getByAmoutFromFeed, GLP_ARBITRUM, GMX, intervalUnixTime, LINK, BI_22_PRECISION, TokenDecimals, UNI, WETH, _changeLatestPricefeed, _storeGlpPricefeed, _storePricefeed, BI_18_PRECISION } from "./helpers"

export function handleAnswerUpdatedETH(event: AnswerUpdated): void {
  const price = event.params.current.times(BI_22_PRECISION)

  _changeLatestPricefeed(WETH, price, event)

  _storePricefeed(event, WETH, intervalUnixTime.SEC, price)
  _storePricefeed(event, WETH, intervalUnixTime.MIN15, price)
  _storePricefeed(event, WETH, intervalUnixTime.MIN60, price)
  _storePricefeed(event, WETH, intervalUnixTime.HR4, price)
  _storePricefeed(event, WETH, intervalUnixTime.HR24, price)
  _storePricefeed(event, WETH, intervalUnixTime.DAY7, price)
}

export function handleAnswerUpdatedBTC(event: AnswerUpdated): void {
  const price = event.params.current.times(BI_22_PRECISION)

  _changeLatestPricefeed(BTC, price, event)

  _storePricefeed(event, BTC, intervalUnixTime.SEC, price)
  _storePricefeed(event, BTC, intervalUnixTime.MIN15, price)
  _storePricefeed(event, BTC, intervalUnixTime.MIN60, price)
  _storePricefeed(event, BTC, intervalUnixTime.HR4, price)
  _storePricefeed(event, BTC, intervalUnixTime.HR24, price)
  _storePricefeed(event, BTC, intervalUnixTime.DAY7, price)
}

export function handleAnswerUpdatedLINK(event: AnswerUpdated): void {
  const price = event.params.current.times(BI_22_PRECISION)

  _changeLatestPricefeed(LINK, price, event)

  _storePricefeed(event, LINK, intervalUnixTime.SEC, price)
  _storePricefeed(event, LINK, intervalUnixTime.MIN15, price)
  _storePricefeed(event, LINK, intervalUnixTime.MIN60, price)
  _storePricefeed(event, LINK, intervalUnixTime.HR4, price)
  _storePricefeed(event, LINK, intervalUnixTime.HR24, price)
  _storePricefeed(event, LINK, intervalUnixTime.DAY7, price)
}

export function handleAnswerUpdatedUNI(event: AnswerUpdated): void {
  const price = event.params.current.times(BI_22_PRECISION)

  _changeLatestPricefeed(UNI, price, event)

  _storePricefeed(event, UNI, intervalUnixTime.SEC, price)
  _storePricefeed(event, UNI, intervalUnixTime.MIN15, price)
  _storePricefeed(event, UNI, intervalUnixTime.MIN60, price)
  _storePricefeed(event, UNI, intervalUnixTime.HR4, price)
  _storePricefeed(event, UNI, intervalUnixTime.HR24, price)
  _storePricefeed(event, UNI, intervalUnixTime.DAY7, price)
}

export function handleUniswapGmxEthSwap(event: Swap): void {
  const ethPerGmx = event.params.amount0.times(BI_18_PRECISION).div(event.params.amount1)
  const priceUsd = getByAmoutFromFeed(ethPerGmx, WETH, TokenDecimals.WETH)

  _changeLatestPricefeed(GMX, priceUsd, event)

  _storePricefeed(event, GMX, intervalUnixTime.SEC, priceUsd)
  _storePricefeed(event, GMX, intervalUnixTime.MIN15, priceUsd)
  _storePricefeed(event, GMX, intervalUnixTime.MIN60, priceUsd)
  _storePricefeed(event, GMX, intervalUnixTime.HR4, priceUsd)
  _storePricefeed(event, GMX, intervalUnixTime.HR24, priceUsd)
  _storePricefeed(event, GMX, intervalUnixTime.DAY7, priceUsd)
}



export function handleAddLiquidity(event: AddLiquidity): void {
  _storeGlpPricefeed(GLP_ARBITRUM, event, event.params.aumInUsdg, event.params.glpSupply)
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  _storeGlpPricefeed(GLP_ARBITRUM, event, event.params.aumInUsdg, event.params.glpSupply)
}


