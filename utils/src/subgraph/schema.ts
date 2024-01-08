import { IPositionDecrease, IPositionFeesCollected, IPositionIncrease, IPositionLink, IPositionOpen, IPositionSettled, IPriceCandle, IPriceCandleSeed } from "../types.js"
import { ISchema } from "./query.js"



const positionIncrease: ISchema<IPositionIncrease> = {
  id: 'string',

  account: 'address',
  market: 'address',
  collateralToken: 'address',

  sizeInTokens: 'uint256',
  sizeInUsd: 'uint256',
  collateralAmount: 'uint256',
  borrowingFactor: 'uint256',
  fundingFeeAmountPerSize: 'uint256',
  longTokenClaimableFundingAmountPerSize: 'uint256',
  shortTokenClaimableFundingAmountPerSize: 'uint256',
  executionPrice: 'uint256',
  indexTokenPriceMax: 'uint256',
  indexTokenPriceMin: 'uint256',
  collateralTokenPriceMax: 'uint256',
  collateralTokenPriceMin: 'uint256',
  sizeDeltaUsd: 'uint256',
  sizeDeltaInTokens: 'uint256',
  orderType: 'uint256',

  collateralDeltaAmount: 'int256',
  priceImpactUsd: 'int256',
  priceImpactAmount: 'int256',
  
  isLong: 'bool',

  orderKey: 'uint256',
  positionKey: 'uint256',

  blockTimestamp: 'uint256',
  transactionHash: 'string',

  __typename: 'PositionIncrease',
}

const positionDecrease: ISchema<IPositionDecrease> = {
  id: 'string',

  account: 'address',
  market: 'address',
  collateralToken: 'address',

  sizeInTokens: 'uint256',
  sizeInUsd: 'uint256',
  collateralAmount: 'uint256',
  borrowingFactor: 'uint256',
  fundingFeeAmountPerSize: 'uint256',
  longTokenClaimableFundingAmountPerSize: 'uint256',
  shortTokenClaimableFundingAmountPerSize: 'uint256',
  executionPrice: 'uint256',
  indexTokenPriceMax: 'uint256',
  indexTokenPriceMin: 'uint256',
  collateralTokenPriceMax: 'uint256',
  collateralTokenPriceMin: 'uint256',
  sizeDeltaUsd: 'uint256',
  sizeDeltaInTokens: 'uint256',
  collateralDeltaAmount: 'uint256',
  valuesPriceImpactDiffUsd: 'uint256',
  orderType: 'uint256',

  priceImpactUsd: 'int256',
  basePnlUsd: 'int256',
  uncappedBasePnlUsd: 'int256',
  
  isLong: 'bool',

  orderKey: 'uint256',
  positionKey: 'uint256',

  blockTimestamp: 'uint256',
  transactionHash: 'string',

  __typename: 'PositionDecrease',
}

const positionFeeUpdate: ISchema<IPositionFeesCollected> = {
  id: 'string',

  orderKey: 'uint256',
  positionKey: 'uint256',
  referralCode: 'string',

  market: 'address',
  collateralToken: 'address',
  affiliate: 'address',
  trader: 'address',
  uiFeeReceiver: 'address',

  collateralTokenPriceMin: 'uint256',
  collateralTokenPriceMax: 'uint256',
  tradeSizeUsd: 'uint256',
  totalRebateFactor: 'uint256',
  traderDiscountFactor: 'uint256',
  totalRebateAmount: 'uint256',
  traderDiscountAmount: 'uint256',
  affiliateRewardAmount: 'uint256',
  fundingFeeAmount: 'uint256',
  claimableLongTokenAmount: 'uint256',
  claimableShortTokenAmount: 'uint256',
  latestFundingFeeAmountPerSize: 'uint256',
  latestLongTokenClaimableFundingAmountPerSize: 'uint256',
  latestShortTokenClaimableFundingAmountPerSize: 'uint256',
  borrowingFeeUsd: 'uint256',
  borrowingFeeAmount: 'uint256',
  borrowingFeeReceiverFactor: 'uint256',
  borrowingFeeAmountForFeeReceiver: 'uint256',
  positionFeeFactor: 'uint256',
  protocolFeeAmount: 'uint256',
  positionFeeReceiverFactor: 'uint256',
  feeReceiverAmount: 'uint256',
  feeAmountForPool: 'uint256',
  positionFeeAmountForPool: 'uint256',
  positionFeeAmount: 'uint256',
  totalCostAmount: 'uint256',
  uiFeeReceiverFactor: 'uint256',
  uiFeeAmount: 'uint256',

  isIncrease: 'bool',

  blockTimestamp: 'uint256',
  transactionHash: 'string',

  __typename: 'PositionFeesCollected',

}

const positionLink: ISchema<IPositionLink> = {
  id: 'string',
  key: 'uint256',

  increaseList: positionIncrease,
  decreaseList: positionDecrease,
  feeUpdateList: positionFeeUpdate,
 
  __typename: 'PositionLink',
}

const position = {
  id: 'string',
  link: positionLink,

  key: 'string',

  account: 'address',
  market: 'address',
  collateralToken: 'address',
  indexToken: 'address',

  sizeInUsd: 'uint256',
  sizeInTokens: 'uint256',
  collateralAmount: 'uint256',
  realisedPnlUsd: 'uint256',

  cumulativeSizeUsd: 'uint256',
  cumulativeSizeToken: 'uint256',
  cumulativeCollateralUsd: 'uint256',
  cumulativeCollateralToken: 'uint256',

  maxSizeUsd: 'uint256',
  maxSizeToken: 'uint256',
  maxCollateralToken: 'uint256',
  maxCollateralUsd: 'uint256',

  isLong: 'bool',

  blockTimestamp: 'uint256',
  transactionHash: 'string',
} as const

const positionOpen: ISchema<IPositionOpen> = {
  ...position,
  __typename: 'PositionOpen',
}
const positionSettled: ISchema<IPositionSettled> = { 
  ...position,
  __typename: 'PositionSettled',
}

const priceCandleSeed: ISchema<IPriceCandleSeed> = {
  id: 'string',
  token: 'address',
  interval: 'string',
  timestamp: 'number',

  o: 'uint',
  h: 'uint',
  l: 'uint',
  c: 'uint',

  __typename: 'PriceCandleSeed',
}

const priceCandle: ISchema<IPriceCandle> = {
  id: 'string',
  token: 'address',
  interval: 'string',
  timestamp: 'number',

  o: 'uint',
  h: 'uint',
  l: 'uint',
  c: 'uint',

  __typename: 'PriceCandle',
}


export const schema = { 
  positionSettled, positionOpen, positionLink,
  
  positionIncrease, positionDecrease,

  priceCandleSeed, priceCandle,
}



// const processSeed: IPositionSettled = {
//   ...fillQuery(schema.positionSettled)
// }


// const gmxTradingSubgraph = replaySubgraphQuery(
//   {
//     subgraph: `https://gateway-arbitrum.network.thegraph.com/api/${import.meta.env.THE_GRAPH}/subgraphs/id/DJ4SBqiG8A8ytcsNJSuUU2gDTLFXxxPrAN8Aags84JH2`,
//     parentStoreScope: rootStoreScope,
//   },
//   schema.positionSettled,
//   processSeed
// )
