import * as rewardTracker from "../../generated/RewardTracker/RewardTracker"
import {
  BonusGmxTrackerTransfer,
  FeeGlpTrackerTransfer,
  FeeGmxTrackerTransfer,
  StakedGlpTrackerTransfer,
  StakedGmxTrackerTransfer,
  StakedGlpTrackerClaim,
  StakedGmxTrackerClaim,
  FeeGmxTrackerClaim,
  FeeGlpTrackerClaim,
} from "../../generated/schema"
import { getByAmoutFromFeed, TokenDecimals, _storeStake, getIdFromEvent } from "./../helpers"
import * as rewardRouterV2 from "../../generated/RewardRouterV2/RewardRouterV2"
import { GLP, GMX, WAVAX } from "./constant"



export function handleStakeGmx(event: rewardRouterV2.StakeGmx): void {
  _storeStake(event, true, event.params.account, GMX, event.params.amount)
}

export function handleUnstakeGmx(event: rewardRouterV2.UnstakeGmx): void {
  _storeStake(event, false, event.params.account, GMX, event.params.amount)
}

export function handleStakeGlp(event: rewardRouterV2.StakeGlp): void {
  _storeStake(event, true, event.params.account, GLP, event.params.amount)
}

export function handleUnstakeGlp(event: rewardRouterV2.UnstakeGlp): void {
  _storeStake(event, false, event.params.account, GLP, event.params.amount)
}


export function handleStakedGmxTrackerTransfer(event: rewardTracker.Transfer): void {
  const id = getIdFromEvent(event)
  const entity = new StakedGmxTrackerTransfer(id)

  entity.from = event.params.from.toHexString()
  entity.to = event.params.to.toHexString()
  entity.value = event.params.value
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}

export function handleBonusGmxTrackerTransfer(event: rewardTracker.Transfer): void {
  const id = getIdFromEvent(event)
  const entity = new BonusGmxTrackerTransfer(id)

  entity.from = event.params.from.toHexString()
  entity.to = event.params.to.toHexString()
  entity.value = event.params.value
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}
export function handleFeeGmxTrackerTransfer(event: rewardTracker.Transfer): void {
  const id = getIdFromEvent(event)
  const entity = new FeeGmxTrackerTransfer(id)

  entity.from = event.params.from.toHexString()
  entity.to = event.params.to.toHexString()
  entity.value = event.params.value
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}
export function handleFeeGlpTrackerTransfer(event: rewardTracker.Transfer): void {
  const id = getIdFromEvent(event)
  const entity = new FeeGlpTrackerTransfer(id)

  entity.from = event.params.from.toHexString()
  entity.to = event.params.to.toHexString()
  entity.value = event.params.value
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}
export function handleStakedGlpTrackerTransfer(event: rewardTracker.Transfer): void {
  const id = getIdFromEvent(event)
  const entity = new StakedGlpTrackerTransfer(id)

  entity.from = event.params.from.toHexString()
  entity.to = event.params.to.toHexString()
  entity.value = event.params.value
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}



export function handleFeeGlpTrackerClaim(event: rewardTracker.Claim): void {
  const id = getIdFromEvent(event)
  const entity = new FeeGlpTrackerClaim(id)

  entity.receiver = event.params.receiver.toHexString()
  entity.amount = event.params.amount
  entity.amountUsd = getByAmoutFromFeed(event.params.amount, WAVAX, TokenDecimals.AVAX)

  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}

export function handleFeeGmxTrackerClaim(event: rewardTracker.Claim): void {
  const id = getIdFromEvent(event)
  const entity = new FeeGmxTrackerClaim(id)

  entity.receiver = event.params.receiver.toHexString()
  entity.amount = event.params.amount
  entity.amountUsd = getByAmoutFromFeed(event.params.amount, WAVAX, TokenDecimals.AVAX)
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}

export function handleStakedGlpTrackerClaim(event: rewardTracker.Claim): void {
  const id = getIdFromEvent(event)
  const entity = new StakedGlpTrackerClaim(id)

  entity.receiver = event.params.receiver.toHexString()
  entity.amount = event.params.amount
  entity.amountUsd = getByAmoutFromFeed(event.params.amount, GLP, TokenDecimals.GLP)
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}

export function handleStakedGmxTrackerClaim(event: rewardTracker.Claim): void {
  const id = getIdFromEvent(event)
  const entity = new StakedGmxTrackerClaim(id)

  entity.receiver = event.params.receiver.toHexString()
  entity.amount = event.params.amount
  entity.amountUsd = getByAmoutFromFeed(event.params.amount, GMX, TokenDecimals.GMX)
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}