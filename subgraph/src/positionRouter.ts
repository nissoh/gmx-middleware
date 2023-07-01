import { Bytes } from "@graphprotocol/graph-ts"
import {
  CreateDecreasePosition as CreateDecreasePositionEvent,
  CreateIncreasePosition as CreateIncreasePositionEvent,
  ExecuteDecreasePosition as ExecuteDecreasePositionEvent,
  ExecuteIncreasePosition as ExecuteIncreasePositionEvent
} from "../generated/PositionRouter/PositionRouter"
import {
  CreateDecreasePosition,
  CreateIncreasePosition,
  ExecuteDecreasePosition,
  ExecuteIncreasePosition
} from "../generated/schema"


// const getTradeLinkId = (id: i32, key: Bytes): Bytes => {
//   return Bytes.fromUTF8('TradeLink')
//     .concatI32(id)
//     .concat(key)
// }

// const getPositionKey = (account: Bytes, key: Bytes): Bytes => {
//   return Bytes.fromUTF8('TradeLink')
//     .concatI32(id)
//     .concat(key)
// }

export function handleCreateDecreasePosition(
  event: CreateDecreasePositionEvent
): void {
  const entity = new CreateDecreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.path = event.params.path.map<Bytes>((e: Bytes) => e)
  entity.indexToken = event.params.indexToken
  entity.collateralDelta = event.params.collateralDelta
  entity.sizeDelta = event.params.sizeDelta
  entity.isLong = event.params.isLong
  entity.receiver = event.params.receiver
  entity.acceptablePrice = event.params.acceptablePrice
  entity.minOut = event.params.minOut
  entity.executionFee = event.params.executionFee
  entity.index = event.params.index
  entity.queueIndex = event.params.queueIndex
  entity.blockNumber = event.params.blockNumber
  entity.blockTime = event.params.blockTime

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}

export function handleCreateIncreasePosition(
  event: CreateIncreasePositionEvent
): void {
  const entity = new CreateIncreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.path = event.params.path.map<Bytes>((e: Bytes) => e)
  entity.indexToken = event.params.indexToken
  entity.amountIn = event.params.amountIn
  entity.minOut = event.params.minOut
  entity.sizeDelta = event.params.sizeDelta
  entity.isLong = event.params.isLong
  entity.acceptablePrice = event.params.acceptablePrice
  entity.executionFee = event.params.executionFee
  entity.index = event.params.index
  entity.queueIndex = event.params.queueIndex
  entity.blockNumber = event.params.blockNumber
  entity.blockTime = event.params.blockTime
  entity.gasPrice = event.params.gasPrice

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}


export function handleExecuteDecreasePosition(
  event: ExecuteDecreasePositionEvent
): void {
  const entity = new ExecuteDecreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.path = event.params.path.map<Bytes>((e: Bytes) => e)
  entity.indexToken = event.params.indexToken
  entity.collateralDelta = event.params.collateralDelta
  entity.sizeDelta = event.params.sizeDelta
  entity.isLong = event.params.isLong
  entity.receiver = event.params.receiver
  entity.acceptablePrice = event.params.acceptablePrice
  entity.minOut = event.params.minOut
  entity.executionFee = event.params.executionFee
  entity.blockGap = event.params.blockGap
  entity.timeGap = event.params.timeGap

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}

export function handleExecuteIncreasePosition(
  event: ExecuteIncreasePositionEvent
): void {
  const entity = new ExecuteIncreasePosition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.path = event.params.path.map<Bytes>((e: Bytes) => e)
  entity.indexToken = event.params.indexToken
  entity.amountIn = event.params.amountIn
  entity.minOut = event.params.minOut
  entity.sizeDelta = event.params.sizeDelta
  entity.isLong = event.params.isLong
  entity.acceptablePrice = event.params.acceptablePrice
  entity.executionFee = event.params.executionFee
  entity.blockGap = event.params.blockGap
  entity.timeGap = event.params.timeGap

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex

  entity.save()
}

