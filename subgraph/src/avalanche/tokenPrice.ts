import { PriceUpdate } from '../../generated/FastPriceFeed/FastPriceEvents'
import { AddLiquidity, RemoveLiquidity } from "../../generated/GlpManager/GlpManager"
import { _storeDefaultPricefeed, _storeGlpAddLiqPricefeed, _storeGlpRemoveLiqPricefeed } from "../helpers"
import { GLP } from './constant'


export function handleFastPriceEvent(event: PriceUpdate): void {
  const price = event.params.price
  const token = event.params.token.toHex()
  _storeDefaultPricefeed(token, event, price)
}

export function handleAddLiquidity(event: AddLiquidity): void {
  _storeGlpAddLiqPricefeed(GLP, event)
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  _storeGlpRemoveLiqPricefeed(GLP, event)
}

