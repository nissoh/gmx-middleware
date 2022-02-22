import { AnswerUpdated } from '../../generated/ChainlinkAggregatorETH/ChainlinkAggregator'
import { AddLiquidity, RemoveLiquidity } from "../../generated/GlpManager/GlpManager"
import { BI_22_PRECISION, _storeDefaultPricefeed, _storeGlpAddLiqPricefeed, _storeGlpRemoveLiqPricefeed } from "../helpers"
import { GLP, WAVAX, WETHE } from './constant'

export function handleAnswerUpdatedBTC(event: AnswerUpdated): void {
  const price = event.params.current.times(BI_22_PRECISION)

  _storeDefaultPricefeed('BTC', event, price)
}

export function handleAnswerUpdatedAVAX(event: AnswerUpdated): void {
  const price = event.params.current.times(BI_22_PRECISION)

  _storeDefaultPricefeed(WAVAX, event, price)
}

export function handleAnswerUpdatedETH(event: AnswerUpdated): void {
  const price = event.params.current.times(BI_22_PRECISION)

  _storeDefaultPricefeed(WETHE, event, price)
}

export function handleAddLiquidity(event: AddLiquidity): void {
  _storeGlpAddLiqPricefeed(GLP, event)
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  _storeGlpRemoveLiqPricefeed(GLP, event)
}

