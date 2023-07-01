import { Address, Bytes } from "@graphprotocol/graph-ts"
import {
  ClosePosition as ClosePositionEvent,
  DecreasePosition as DecreasePositionEvent,
  IncreasePosition as IncreasePositionEvent,
  LiquidatePosition as LiquidatePositionEvent,
  Swap as SwapEvent,
  UpdatePosition as UpdatePositionEvent
} from "../generated/Vault/Vault"
import {
  ClosePosition,
  DecreasePosition,
  IncreasePosition,
  LiquidatePosition,
  PositionSettled,
  PositionSlot,
  Swap,
  TradeLink,
  UpdatePosition
} from "../generated/schema"
import * as vaultPricefeed from "../generated/Vault/VaultPricefeed"
import { ZERO_BI } from "./const"

const vaultPricefeedAddress = Address.fromString("0x2d68011bcA022ed0E474264145F46CC4de96a002")

const getTradeLinkId = (id: i32, key: Bytes): Bytes => {
  return Bytes.fromUTF8('TradeLink')
    .concatI32(id)
    .concat(key)
}


export function handleIncreasePosition(event: IncreasePositionEvent): void {
  let positionSlot = PositionSlot.load(event.params.key)

  // init slot
  if (positionSlot === null) {
    positionSlot = new PositionSlot(event.params.key)

    positionSlot.account = event.params.account
    positionSlot.collateralToken = event.params.collateralToken
    positionSlot.indexToken = event.params.indexToken
    positionSlot.isLong = event.params.isLong
    positionSlot.key = event.params.key

    _resetPositionSlot(positionSlot)
  }

  const countId = positionSlot.size.equals(ZERO_BI) ? positionSlot.idCount + 1 : positionSlot.idCount
  const tradeLinkId = getTradeLinkId(countId, event.params.key)

  positionSlot.link = tradeLinkId
  positionSlot.idCount = countId

  positionSlot.collateral = positionSlot.collateral.plus(event.params.collateralDelta)
  positionSlot.size = positionSlot.size.plus(event.params.sizeDelta)

  positionSlot.cumulativeCollateral = positionSlot.size.plus(event.params.collateralDelta)
  positionSlot.cumulativeSize = positionSlot.size.plus(event.params.sizeDelta)
  positionSlot.cumulativeFee = positionSlot.cumulativeFee.plus(event.params.fee)


  if (TradeLink.load(tradeLinkId) === null) {
    const tradeLink = new TradeLink(tradeLinkId)

    tradeLink.account = event.params.account
    tradeLink.collateralToken = event.params.collateralToken
    tradeLink.indexToken = event.params.indexToken
    tradeLink.isLong = event.params.isLong
    tradeLink.key = event.params.key

    tradeLink.blockNumber = event.block.number
    tradeLink.blockTimestamp = event.block.timestamp
    tradeLink.transactionHash = event.transaction.hash
    tradeLink.transactionIndex = event.transaction.index
    tradeLink.logIndex = event.logIndex

    tradeLink.save()
  }


  const entity = new IncreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.link = tradeLinkId
  entity.key = event.params.key
  entity.account = event.params.account
  entity.collateralToken = event.params.collateralToken
  entity.indexToken = event.params.indexToken
  entity.collateralDelta = event.params.collateralDelta
  entity.sizeDelta = event.params.sizeDelta
  entity.isLong = event.params.isLong
  entity.price = event.params.price
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  positionSlot.save()
  entity.save()
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  const positionSlot = PositionSlot.load(event.params.key)

  if (positionSlot === null) {
    return
    // throw new Error("TradeLink is null")
  }

  
  const entity = new DecreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.link = getTradeLinkId(positionSlot.idCount, event.params.key)
  entity.key = event.params.key
  entity.account = event.params.account
  entity.collateralToken = event.params.collateralToken
  entity.indexToken = event.params.indexToken
  entity.collateralDelta = event.params.collateralDelta
  entity.sizeDelta = event.params.sizeDelta
  entity.isLong = event.params.isLong
  entity.price = event.params.price
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}

export function handleUpdatePosition(event: UpdatePositionEvent): void {
  const positionSlot = PositionSlot.load(event.params.key)

  if (positionSlot === null) {
    return
    // throw new Error("TradeLink is null")
  }

  positionSlot.collateral = event.params.collateral
  positionSlot.realisedPnl = event.params.realisedPnl
  positionSlot.averagePrice = event.params.averagePrice
  positionSlot.size = event.params.size
  positionSlot.reserveAmount = event.params.reserveAmount
  positionSlot.maxCollateral = event.params.collateral > positionSlot.collateral ? event.params.collateral : positionSlot.maxCollateral
  positionSlot.maxSize = event.params.size > positionSlot.maxSize ? event.params.size : positionSlot.maxSize
  positionSlot.save()



  const entity = new UpdatePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )


  entity.link = getTradeLinkId(positionSlot.idCount, event.params.key)
  entity.account = positionSlot.account
  entity.key = event.params.key
  entity.size = event.params.size
  entity.collateral = event.params.collateral
  entity.averagePrice = event.params.averagePrice
  entity.entryFundingRate = event.params.entryFundingRate
  entity.reserveAmount = event.params.reserveAmount
  entity.realisedPnl = event.params.realisedPnl
  const markPrice = vaultPricefeed.VaultPricefeed.bind(vaultPricefeedAddress).try_getPrimaryPrice(Address.fromBytes(positionSlot.indexToken), false)
  entity.markPrice = markPrice.reverted ? ZERO_BI : markPrice.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  const positionSlot = PositionSlot.load(event.params.key)

  if (positionSlot === null) {
    return
    // throw new Error("TradeLink is null")
  }

  const positionSettled = new PositionSettled(
    Bytes.fromUTF8('PositionSettled').concat(event.transaction.hash.concatI32(event.logIndex.toI32()))
  )
  positionSettled.idCount = positionSlot.idCount
  positionSettled.link = positionSlot.link

  positionSettled.account = positionSlot.account
  positionSettled.collateralToken = positionSlot.collateralToken
  positionSettled.indexToken = positionSlot.indexToken
  positionSettled.isLong = positionSlot.isLong
  positionSettled.key = positionSlot.key

  positionSettled.collateral = positionSlot.collateral
  positionSettled.size = positionSlot.size
  positionSettled.averagePrice = positionSlot.averagePrice
  positionSettled.entryFundingRate = positionSlot.entryFundingRate
  positionSettled.realisedPnl = event.params.realisedPnl
  positionSettled.reserveAmount = event.params.reserveAmount

  positionSettled.cumulativeCollateral = positionSlot.cumulativeCollateral
  positionSettled.cumulativeSize = positionSlot.cumulativeSize
  positionSettled.cumulativeFee = positionSlot.cumulativeFee

  positionSettled.maxCollateral = positionSlot.maxCollateral
  positionSettled.maxSize = positionSlot.maxSize

  positionSettled.markPrice = vaultPricefeed.VaultPricefeed.bind(vaultPricefeedAddress).getPrimaryPrice(Address.fromBytes(positionSlot.indexToken), false)
  positionSettled.isLiquidated = false

  positionSettled.blockTimestamp = event.block.timestamp
  positionSettled.blockNumber = event.block.number
  positionSettled.transactionHash = event.transaction.hash

  _resetPositionSlot(positionSlot)
  positionSlot.save()



  const entity = new LiquidatePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.link = getTradeLinkId(positionSlot.idCount, event.params.key)
  entity.key = event.params.key
  entity.account = event.params.account
  entity.collateralToken = event.params.collateralToken
  entity.indexToken = event.params.indexToken
  entity.isLong = event.params.isLong
  entity.size = event.params.size
  entity.collateral = event.params.collateral
  entity.reserveAmount = event.params.reserveAmount
  entity.realisedPnl = event.params.realisedPnl
  entity.markPrice = event.params.markPrice

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}

export function handleSwap(event: SwapEvent): void {
  const entity = new Swap(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.tokenIn = event.params.tokenIn
  entity.tokenOut = event.params.tokenOut
  entity.amountIn = event.params.amountIn
  entity.amountOut = event.params.amountOut
  entity.amountOutAfterFees = event.params.amountOutAfterFees
  entity.feeBasisPoints = event.params.feeBasisPoints

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}

export function handleClosePosition(event: ClosePositionEvent): void {
  const positionSlot = PositionSlot.load(event.params.key)

  if (positionSlot === null) {
    return
    // throw new Error("TradeLink is null")
  }

  const positionSettled = new PositionSettled(
    Bytes.fromUTF8('PositionSettled').concat(event.transaction.hash.concatI32(event.logIndex.toI32()))
  )
  positionSettled.idCount = positionSlot.idCount
  positionSettled.link = positionSlot.link

  positionSettled.account = positionSlot.account
  positionSettled.collateralToken = positionSlot.collateralToken
  positionSettled.indexToken = positionSlot.indexToken
  positionSettled.isLong = positionSlot.isLong
  positionSettled.key = positionSlot.key

  positionSettled.collateral = positionSlot.collateral
  positionSettled.size = positionSlot.size
  positionSettled.averagePrice = positionSlot.averagePrice
  positionSettled.entryFundingRate = positionSlot.entryFundingRate
  positionSettled.realisedPnl = event.params.realisedPnl
  positionSettled.reserveAmount = event.params.reserveAmount

  positionSettled.cumulativeCollateral = positionSlot.cumulativeCollateral
  positionSettled.cumulativeSize = positionSlot.cumulativeSize
  positionSettled.cumulativeFee = positionSlot.cumulativeFee

  positionSettled.maxCollateral = positionSlot.maxCollateral
  positionSettled.maxSize = positionSlot.maxSize

  positionSettled.markPrice = vaultPricefeed.VaultPricefeed.bind(vaultPricefeedAddress).getPrimaryPrice(Address.fromBytes(positionSlot.indexToken), false)
  positionSettled.isLiquidated = false

  positionSettled.blockTimestamp = event.block.timestamp
  positionSettled.blockNumber = event.block.number
  positionSettled.transactionHash = event.transaction.hash

  _resetPositionSlot(positionSlot)
  positionSlot.save()

  const entity = new ClosePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )


  if (positionSlot === null) {
    throw new Error('positionSlot is null')
  }
  entity.link = getTradeLinkId(positionSlot.idCount, event.params.key)
  entity.account = positionSlot.account
  entity.key = event.params.key
  entity.size = event.params.size
  entity.collateral = event.params.collateral
  entity.averagePrice = event.params.averagePrice
  entity.entryFundingRate = event.params.entryFundingRate
  entity.reserveAmount = event.params.reserveAmount
  entity.realisedPnl = event.params.realisedPnl

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}

function _resetPositionSlot(positionSlot: PositionSlot): PositionSlot {

  positionSlot.collateral = ZERO_BI
  positionSlot.size = ZERO_BI
  positionSlot.averagePrice = ZERO_BI
  positionSlot.entryFundingRate = ZERO_BI
  positionSlot.realisedPnl = ZERO_BI
  positionSlot.reserveAmount = ZERO_BI

  positionSlot.cumulativeCollateral = ZERO_BI
  positionSlot.cumulativeSize = ZERO_BI
  positionSlot.cumulativeFee = ZERO_BI

  positionSlot.maxCollateral = ZERO_BI
  positionSlot.maxSize = ZERO_BI

  return positionSlot
}



