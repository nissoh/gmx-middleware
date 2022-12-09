import * as rewardTracker from "../../generated/RewardTracker/RewardTracker"
import { getTokenUsdAmount, TokenDecimals, _storeStake } from "./../helpers"
import * as rewardRouterV2 from "../../generated/RewardRouterV2/RewardRouterV2"
import { GLP, GMX } from "./constant"


export function handleStakeGmx(event: rewardRouterV2.StakeGmx): void {
  _storeStake(event, true, event.params.account, event.params.token.toHex(), event.address, event.params.amount, getTokenUsdAmount(event.params.amount, GMX, TokenDecimals.GMX))
}

export function handleUnstakeGmx(event: rewardRouterV2.UnstakeGmx): void {
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
