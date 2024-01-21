import { BASIS_POINTS_DIVISOR, IntervalTime } from "common-utils"
import { arbitrum, avalanche } from "viem/chains"
import { ARBITRUM_ADDRESS } from "./chain/arbitrum.js"
import { AVALANCHE_ADDRESS } from "./chain/avalanche.js"


export const MAX_LEVERAGE_FACTOR = 100n * BASIS_POINTS_DIVISOR
export const MIN_LEVERAGE_FACTOR = 11000n
export const DEDUCT_USD_FOR_GAS = 10n ** 30n * 2n

export const LIQUIDATION_FEE = 10n ** 5n

export const TAX_BASIS_POINTS = 50n
export const STABLE_TAX_BASIS_POINTS = 5n
export const MINT_BURN_FEE_BASIS_POINTS = 25n
export const SWAP_FEE_BASIS_POINTS = 30n
export const STABLE_SWAP_FEE_BASIS_POINTS = 1n
export const MARGIN_FEE_BASIS_POINTS = 10n

export const FUNDING_RATE_PRECISION = 1000000n




export const PRICEFEED_INTERVAL = [
  IntervalTime.MIN5,
  IntervalTime.MIN15,
  IntervalTime.MIN60,
  IntervalTime.HR6,
  IntervalTime.HR24,
  IntervalTime.DAY7,
] as const

export const TRADE_CONTRACT_MAPPING = {
  [arbitrum.id]: ARBITRUM_ADDRESS,
  [avalanche.id]: AVALANCHE_ADDRESS
} as const

export type ContractChain = keyof typeof TRADE_CONTRACT_MAPPING




// export enum MarketEvent {
//   MarketPoolValueInfo = "0x4d61726b6574506f6f6c56616c7565496e666f",
//   PoolAmountUpdated = "0x506f6f6c416d6f756e7455706461746564",
//   SwapImpactPoolAmountUpdated = "0x53776170496d70616374506f6f6c416d6f756e7455706461746564",
//   PositionImpactPoolAmountUpdated = '0x506f736974696f6e496d70616374506f6f6c416d6f756e7455706461746564',
//   OpenInterestUpdated = '0x4f70656e496e74657265737455706461746564',
//   OpenInterestInTokensUpdated = '0x4f70656e496e746572657374496e546f6b656e7355706461746564',
//   CollateralSumUpdated = '0x436f6c6c61746572616c53756d55706461746564',
//   CumulativeBorrowingFactorUpdated = '0x43756d756c6174697665426f72726f77696e67466163746f7255706461746564',
//   FundingFeeAmountPerSizeUpdated = '0x46756e64696e67466565416d6f756e7450657253697a6555706461746564',
//   ClaimableFundingAmountPerSizeUpdated = '0x436c61696d61626c6546756e64696e67416d6f756e7450657253697a6555706461746564',
//   FundingFeesClaimed = '0x46756e64696e6746656573436c61696d6564',
//   ClaimableFundingUpdated = '0x436c61696d61626c6546756e64696e6755706461746564',
//   ClaimableCollateralUpdated = '0x436c61696d61626c65436f6c6c61746572616c55706461746564',
//   CollateralClaimed = '0x436f6c6c61746572616c436c61696d6564',
//   UiFeeFactorUpdated = '0x5569466565466163746f7255706461746564',
//   MarketCreated = '0x4d61726b657443726561746564',
// }

// export enum FeeEvent {
//   FeesClaimed = '0x46656573436c61696d6564',
//   UiFeesClaimed = '0x556946656573436c61696d6564',
// }


// export enum OracleEvent {
//   OraclePriceUpdate = '0x4f7261636c655072696365557064617465',
//   SignerAdded = '0x5369676e65724164646564',
//   SignerRemoved = '0x5369676e657252656d6f766564',
// }

// export enum OrderEvent {
//   OrderExecuted = '0x4f726465724578656375746564',
//   OrderUpdated = '0x4f7264657255706461746564',
//   OrderSizeDeltaAutoUpdated = '0x4f7264657253697a6544656c74614175746f55706461746564',
//   OrderCollateralDeltaAmountAutoUpdated = '0x4f72646572436f6c6c61746572616c44656c7461416d6f756e744175746f55706461746564',
//   OrderCancelled = '0x4f7264657243616e63656c6c6564',
//   OrderFrozen = '0x4f7264657246726f7a656e',
// }

// export enum PositionEvent {
//   PositionIncrease = '0x506f736974696f6e496e637265617365',
//   PositionDecrease = '0x506f736974696f6e4465637265617365',
//   InsufficientFundingFeePayment = '0x496e73756666696369656e7446756e64696e674665655061796d656e74',
//   PositionFeesInfo = '0x506f736974696f6e46656573496e666f',
//   PositionFeesCollected = '0x506f736974696f6e46656573436f6c6c6563746564',
// }
