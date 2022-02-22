import { ethereum, store, log } from "@graphprotocol/graph-ts"
import * as contract from "../generated/gmxVault/gmxVault"

import {
  ClosePosition,
  DecreasePosition,
  IncreasePosition, LiquidatePosition, UpdatePosition, Trade, PriceLatest
} from "../generated/schema"

import { calculatePositionDelta, calculatePositionDeltaPercentage, ZERO_BI } from "./helpers"


const namedEventId = (name: string, ev: ethereum.Event): string => name + ':' + ev.transaction.hash.toHex()
const namedKeyEventId = (name: string, key: string): string => name + ':' + key


export function handleIncreasePosition(event: contract.IncreasePosition): void {
  const timestamp = event.block.timestamp.toI32()
  const entity = new IncreasePosition(namedEventId('IncreasePosition', event)) // we prevent 

  const activeTradeKey = event.params.key.toHex()

  entity.indexedAt = timestamp

  entity.account = event.params.account.toHex()
  entity.collateralToken = event.params.collateralToken.toHex()
  entity.indexToken = event.params.indexToken.toHex()
  entity.isLong = event.params.isLong
  entity.key = activeTradeKey

  entity.collateralDelta = event.params.collateralDelta
  entity.sizeDelta = event.params.sizeDelta
  entity.price = event.params.price
  entity.fee = event.params.fee

  entity.save()
  

  const activeAggTradeKey = namedKeyEventId('Trade', activeTradeKey)
  let aggTrade = Trade.load(activeAggTradeKey)

  if (aggTrade === null) {
    aggTrade = new Trade(activeAggTradeKey)
    
    aggTrade.indexedAt = entity.indexedAt
    aggTrade.indexToken = entity.indexToken

    aggTrade.account = entity.account
    aggTrade.collateralToken = entity.collateralToken
    aggTrade.indexToken= entity.indexToken
    aggTrade.key = entity.key
    aggTrade.isLong = entity.isLong

    aggTrade.status = "open"

    aggTrade.increaseList = []
    aggTrade.decreaseList = []
    aggTrade.updateList = []

    aggTrade.sizeDelta = ZERO_BI
    aggTrade.collateralDelta = ZERO_BI
    aggTrade.fee = ZERO_BI

    aggTrade.size = ZERO_BI
    aggTrade.collateral = ZERO_BI
    aggTrade.averagePrice = ZERO_BI

    aggTrade.realisedPnl = ZERO_BI
    aggTrade.realisedPnlPercentage = ZERO_BI
  }


  const increaseList = aggTrade.increaseList
  increaseList.push(entity.id)
  aggTrade.increaseList = increaseList

  aggTrade.collateralDelta = aggTrade.collateralDelta.plus(entity.collateralDelta)
  aggTrade.sizeDelta = aggTrade.sizeDelta.plus(entity.sizeDelta)
  aggTrade.fee = aggTrade.fee.plus(entity.fee)

  aggTrade.save()
}

export function handleDecreasePosition(event: contract.DecreasePosition): void {
  const timestamp = event.block.timestamp.toI32()
  const activeTradeKey = event.params.key.toHex()
  const tradeId = namedEventId('DecreasePosition', event)
  const entity = new DecreasePosition(tradeId)

  entity.indexedAt = timestamp

  entity.account = event.params.account.toHex()
  entity.collateralToken = event.params.collateralToken.toHex()
  entity.indexToken = event.params.indexToken.toHex()
  entity.isLong = event.params.isLong
  entity.key = event.params.key.toHex()

  entity.collateralDelta = event.params.collateralDelta
  entity.sizeDelta = event.params.sizeDelta
  entity.price = event.params.price
  entity.fee = event.params.fee


  entity.save()

  const activeAggTradeKey = namedKeyEventId('Trade', activeTradeKey)
  const aggTrade = Trade.load(activeAggTradeKey)

  if (aggTrade) {
    const decreaseList = aggTrade.decreaseList
    decreaseList.push(entity.id)

    aggTrade.decreaseList = decreaseList
    aggTrade.fee = aggTrade.fee.plus(entity.fee)

    aggTrade.save()
  } else {
    log.error('unable to attach entity to account aggregation: aggregatedId: #{}', [entity.id])
  }

}

export function handleUpdatePosition(event: contract.UpdatePosition): void {
  const timestamp = event.block.timestamp.toI32()
  const activeTradeKey = event.params.key.toHex()
  const tradeId = namedEventId('UpdatePosition', event)
  const entity = new UpdatePosition(tradeId)

  entity.indexedAt = timestamp
  entity.key = activeTradeKey

  entity.size = event.params.size
  entity.collateral = event.params.collateral
  entity.reserveAmount = event.params.reserveAmount
  entity.realisedPnl = event.params.realisedPnl
  entity.averagePrice = event.params.averagePrice
  entity.entryFundingRate = event.params.entryFundingRate
    

  const activeAggTradeKey = namedKeyEventId('Trade', activeTradeKey)
  const aggTrade = Trade.load(activeAggTradeKey)

  if (aggTrade) {
    const price = entity.markPrice ? entity.markPrice : PriceLatest.load(aggTrade.indexToken)!.value
    const updates = aggTrade.updateList

    updates.push(entity.id)

    aggTrade.updateList = updates

    aggTrade.size = entity.size
    aggTrade.collateral = entity.collateral
    aggTrade.averagePrice = entity.averagePrice

    const realisedPnl = calculatePositionDelta(price, aggTrade.isLong, entity.size, entity.averagePrice)
    const deltaPercentage = calculatePositionDeltaPercentage(realisedPnl, aggTrade.collateral)

    aggTrade.realisedPnl = entity.realisedPnl.plus(realisedPnl)
    aggTrade.realisedPnlPercentage = aggTrade.realisedPnlPercentage.plus(deltaPercentage)

    aggTrade.save()

  } else {
    log.error('unable to attach entity to account aggregation: aggregatedId #{}', [entity.id])
  }

  entity.save()

}

export function handleClosePosition(event: contract.ClosePosition): void {
  const timestamp = event.block.timestamp.toI32()
  const activeTradeKey = event.params.key.toHex()
  const tradeId = namedEventId('ClosePosition', event)
  const entity = new ClosePosition(tradeId)

  entity.indexedAt = timestamp
  entity.key = activeTradeKey

  entity.size = event.params.size
  entity.collateral = event.params.collateral
  entity.reserveAmount = event.params.reserveAmount
  entity.realisedPnl = event.params.realisedPnl
  entity.averagePrice = event.params.averagePrice
  entity.entryFundingRate = event.params.entryFundingRate

  entity.save()

  const activeAggTradeKey = namedKeyEventId('Trade', activeTradeKey)
  const aggTrade = Trade.load(activeAggTradeKey)

  if (aggTrade) {
    const aggTradeSettledId = namedEventId('Trade', event)
    const settledAggTrade = new Trade(aggTradeSettledId)
    settledAggTrade.merge([aggTrade])

    const deltaPercentage = calculatePositionDeltaPercentage(entity.realisedPnl, aggTrade.collateral)

    settledAggTrade.id = aggTradeSettledId
    settledAggTrade.status = 'closed'
    settledAggTrade.settledIndexedAt = entity.indexedAt
    settledAggTrade.realisedPnl = entity.realisedPnl
    settledAggTrade.realisedPnlPercentage = deltaPercentage
    settledAggTrade.save()

    store.remove('Trade', aggTrade.id)
  }
}

export function handleLiquidatePosition(event: contract.LiquidatePosition): void {
  const timestamp = event.block.timestamp.toI32()
  const activeTradeKey = event.params.key.toHex()
  const tradeId = namedEventId('LiquidatePosition', event)
  const entity = new LiquidatePosition(tradeId)

  entity.indexedAt = timestamp
  entity.key = activeTradeKey
  entity.account = event.params.account.toHex()
  entity.collateralToken = event.params.collateralToken.toHex()
  entity.indexToken = event.params.indexToken.toHex()

  entity.isLong = event.params.isLong

  entity.size = event.params.size
  entity.collateral = event.params.collateral
  entity.reserveAmount = event.params.reserveAmount
  entity.realisedPnl = event.params.realisedPnl
  entity.markPrice = event.params.markPrice

  entity.save()

  const activeAggTradeKey = namedKeyEventId('Trade', activeTradeKey)
  const aggTrade = Trade.load(activeAggTradeKey)

  if (aggTrade) {
    const aggTradeSettledId = namedEventId('Trade', event)
    const settledAggTrade = new Trade(aggTradeSettledId)
    settledAggTrade.merge([aggTrade])

    settledAggTrade.id = aggTradeSettledId
    settledAggTrade.status = 'liquidated'
    settledAggTrade.settledIndexedAt = entity.indexedAt
    settledAggTrade.realisedPnl = calculatePositionDelta(entity.markPrice, entity.isLong, entity.size, aggTrade.averagePrice)
    settledAggTrade.realisedPnlPercentage = calculatePositionDeltaPercentage(settledAggTrade.realisedPnl, entity.collateral)
    settledAggTrade.save()

    store.remove('Trade', aggTrade.id)
  }
}

