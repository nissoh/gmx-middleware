import * as rewardRouterV2 from "../../generated/RewardRouterV2/RewardRouterV2"
import * as rewardRouterV1 from "../../generated/RewardRouterV1/RewardRouter"
import * as rewardTracker from "../../generated/RewardTracker/RewardTracker"
import { getTokenUsdAmount, TokenDecimals, _storeStake } from "../helpers"
import { GLP, GMX } from "./constant"



export function handleStakeGmxV1(event: rewardRouterV1.StakeGmx): void {
  _storeStake(event, true, event.params.account, GMX, event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GMX, TokenDecimals.GMX))
}

export function handleUnstakeGmxV1(event: rewardRouterV1.UnstakeGmx): void {
  _storeStake(event, false, event.params.account, GMX, event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GMX, TokenDecimals.GMX))
}

export function handleStakeGmxV2(event: rewardRouterV2.StakeGmx): void {
  _storeStake(event, true, event.params.account, event.params.token.toHex(), event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GMX, TokenDecimals.GMX))
}

export function handleUnstakeGmxV2(event: rewardRouterV2.UnstakeGmx): void {
  _storeStake(event, false, event.params.account, event.params.token.toHex(), event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GMX, TokenDecimals.GMX))
}

export function handleStakeGlp(event: rewardRouterV2.StakeGlp): void {
  _storeStake(event, true, event.params.account, GLP, event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GLP, TokenDecimals.GLP))
}

export function handleUnstakeGlp(event: rewardRouterV2.UnstakeGlp): void {
  _storeStake(event, false, event.params.account, GLP, event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GLP, TokenDecimals.GLP))
}


export function handleDepositVesting(event: rewardTracker.Claim): void {
  _storeStake(event, true, event.params.receiver, GMX, event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GMX, TokenDecimals.GMX))
}
export function handleWithdrawVesting(event: rewardTracker.Claim): void {
  _storeStake(event, false, event.params.receiver, GMX, event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GMX, TokenDecimals.GMX))
}
