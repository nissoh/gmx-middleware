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
  PositionLink,
  UpdatePosition
} from "../generated/schema"
import * as vaultPricefeed from "../generated/Vault/VaultPricefeed"
import { ZERO_BI } from "./const"

const vaultPricefeedAddress = Address.fromString("0x2d68011bcA022ed0E474264145F46CC4de96a002")

const getPositionLinkId = (id: i32, key: Bytes): Bytes => {
  return Bytes.fromUTF8('PositionLink')
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
  const PositionLinkId = getPositionLinkId(countId, event.params.key)

  positionSlot.link = PositionLinkId
  positionSlot.idCount = countId

  positionSlot.cumulativeCollateral = positionSlot.size.plus(event.params.collateralDelta)
  positionSlot.cumulativeSize = positionSlot.size.plus(event.params.sizeDelta)
  positionSlot.cumulativeFee = positionSlot.cumulativeFee.plus(event.params.fee)


  if (PositionLink.load(PositionLinkId) === null) {
    const positionLink = new PositionLink(PositionLinkId)

    positionLink.account = event.params.account
    positionLink.collateralToken = event.params.collateralToken
    positionLink.indexToken = event.params.indexToken
    positionLink.isLong = event.params.isLong
    positionLink.key = event.params.key

    positionLink.blockNumber = event.block.number
    positionLink.blockTimestamp = event.block.timestamp
    positionLink.transactionHash = event.transaction.hash
    positionLink.transactionIndex = event.transaction.index
    positionLink.logIndex = event.logIndex

    positionLink.save()
  }


  const entity = new IncreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.link = PositionLinkId
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
    // throw new Error("PositionLink is null")
  }

  positionSlot.cumulativeFee = positionSlot.cumulativeFee.plus(event.params.fee)

  const entity = new DecreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.link = getPositionLinkId(positionSlot.idCount, event.params.key)
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

export function handleUpdatePosition(event: UpdatePositionEvent): void {
  const positionSlot = PositionSlot.load(event.params.key)

  if (positionSlot === null) {
    return
    // throw new Error("PositionLink is null")
  }

  positionSlot.collateral = event.params.collateral
  positionSlot.realisedPnl = event.params.realisedPnl
  positionSlot.averagePrice = event.params.averagePrice
  positionSlot.size = event.params.size
  positionSlot.reserveAmount = event.params.reserveAmount
  positionSlot.entryFundingRate = event.params.entryFundingRate
  positionSlot.maxCollateral = event.params.collateral > positionSlot.maxCollateral ? event.params.collateral : positionSlot.maxCollateral
  positionSlot.maxSize = event.params.size > positionSlot.maxSize ? event.params.size : positionSlot.maxSize

  positionSlot.save()



  const entity = new UpdatePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )


  entity.link = getPositionLinkId(positionSlot.idCount, event.params.key)
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
    // throw new Error("PositionLink is null")
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

  positionSettled.settlePrice = event.params.markPrice
  positionSettled.isLiquidated = false

  positionSettled.blockNumber = event.block.number
  positionSettled.blockTimestamp = event.block.timestamp
  positionSettled.transactionHash = event.transaction.hash
  positionSettled.transactionIndex = event.transaction.index
  positionSettled.logIndex = event.logIndex

  _resetPositionSlot(positionSlot)
  positionSlot.save()
  positionSettled.save()



  const entity = new LiquidatePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.link = getPositionLinkId(positionSlot.idCount, event.params.key)
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
    // throw new Error("PositionLink is null")
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

  positionSettled.settlePrice = vaultPricefeed.VaultPricefeed.bind(vaultPricefeedAddress).getPrimaryPrice(Address.fromBytes(positionSlot.indexToken), false)
  positionSettled.isLiquidated = false

  positionSettled.blockNumber = event.block.number
  positionSettled.blockTimestamp = event.block.timestamp
  positionSettled.transactionHash = event.transaction.hash
  positionSettled.transactionIndex = event.transaction.index
  positionSettled.logIndex = event.logIndex

  _resetPositionSlot(positionSlot)
  positionSlot.save()
  positionSettled.save()

  const entity = new ClosePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )


  if (positionSlot === null) {
    throw new Error('positionSlot is null')
  }
  entity.link = getPositionLinkId(positionSlot.idCount, event.params.key)
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



