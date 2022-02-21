import { AnswerUpdated } from '../generated/ChainlinkAggregatorETH/ChainlinkAggregator'
import { AddLiquidity, RemoveLiquidity } from "../generated/GlpManager/GlpManager"
import { AVAX, BI_22_PRECISION, GLP_AVALANCHE, intervalUnixTime, _changeLatestPricefeed, _storeGlpPricefeed, _storePricefeed } from "./helpers"

export function handleAnswerUpdatedAVAX(event: AnswerUpdated): void {
  const price = event.params.current.times(BI_22_PRECISION)

  _changeLatestPricefeed(AVAX, price, event)

  _storePricefeed(event, AVAX, intervalUnixTime.SEC, price)
  _storePricefeed(event, AVAX, intervalUnixTime.MIN15, price)
  _storePricefeed(event, AVAX, intervalUnixTime.MIN60, price)
  _storePricefeed(event, AVAX, intervalUnixTime.HR4, price)
  _storePricefeed(event, AVAX, intervalUnixTime.HR24, price)
  _storePricefeed(event, AVAX, intervalUnixTime.DAY7, price)
}


export function handleAddLiquidity(event: AddLiquidity): void {
  _storeGlpPricefeed(GLP_AVALANCHE, event, event.params.aumInUsdg, event.params.glpSupply)
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  _storeGlpPricefeed(GLP_AVALANCHE, event, event.params.aumInUsdg, event.params.glpSupply)
}

