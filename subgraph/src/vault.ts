import { Address } from "@graphprotocol/graph-ts"
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
  PositionSlot,
  Swap,
  UpdatePosition
} from "../generated/schema"
import * as vaultPricefeed from "../generated/Vault/VaultPricefeed"
import { ZERO_BI } from "./const"

const vaultPricefeedAddress = Address.fromString("0x2d68011bcA022ed0E474264145F46CC4de96a002")


export function handleClosePosition(event: ClosePositionEvent): void {
  const entity = new ClosePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  const positionSlot = PositionSlot.load(event.params.key)

  if (positionSlot === null) {
    throw new Error('positionSlot is null')
  }

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

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  const entity = new DecreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
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

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  const entity = new IncreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
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

  let positionSlot = PositionSlot.load(event.params.key)

  // init slot
  if (positionSlot === null) {
    positionSlot = new PositionSlot(event.params.key)

    positionSlot.account = event.params.account
    positionSlot.collateralToken = event.params.collateralToken
    positionSlot.indexToken = event.params.indexToken
    positionSlot.isLong = event.params.isLong

    positionSlot.save()
  }

  entity.save()

}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  const entity = new LiquidatePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
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

export function handleUpdatePosition(event: UpdatePositionEvent): void {
  const entity = new UpdatePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  const positionSlot = PositionSlot.load(event.params.key)

  if (positionSlot === null) {
    throw new Error('positionSlot is null')
  }

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
