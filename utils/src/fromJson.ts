import {
  ITrade, IIdentifiableEntity, IPositionClose, IPositionDecrease,
  IPositionIncrease, IPositionLiquidated, IPositionUpdate, IAccountSummary, IAbstractPositionDelta, IPriceLatest,
} from "./types"


function baseEntityJson<T extends  IIdentifiableEntity>(json: T): T {
  return { ...json }
}

function positonCloseJson(json: IPositionClose) {
  const realisedPnl = BigInt(json?.realisedPnl)
  const collateral = BigInt(json?.collateral)
  const entryFundingRate = BigInt(json?.entryFundingRate)
  const averagePrice = BigInt(json?.averagePrice)
  const size = BigInt(json?.size)

  return { ...baseEntityJson(json), size, collateral, entryFundingRate, realisedPnl, averagePrice }
}

function positionLiquidatedJson(json: IPositionLiquidated): IPositionLiquidated {
  const collateral = BigInt(json?.collateral)
  const markPrice = BigInt(json?.markPrice)
  const size = BigInt(json?.size)
  const realisedPnl = BigInt(json?.realisedPnl)
  const reserveAmount = BigInt(json?.reserveAmount)

  return { ...baseEntityJson(json), size, markPrice, realisedPnl, collateral, reserveAmount, }
}

function positionDeltaJson<T extends IAbstractPositionDelta>(json: T): T {
  const fee = BigInt(json.fee)
  const sizeDelta = BigInt(json.sizeDelta)
  const collateralDelta = BigInt(json.collateralDelta)

  return { ...json, fee, sizeDelta, collateralDelta, }
}

function positionIncreaseJson(json: IPositionIncrease): IPositionIncrease {
  const price = BigInt(json.price)
  return { ...json, ...positionDeltaJson(json), price }
}

function positionDecreaseJson(json: IPositionDecrease): IPositionDecrease {
  const price = BigInt(json.price)
  return { ...json, ...positionDeltaJson(json), price }
}

function positionUpdateJson(json: IPositionUpdate): IPositionUpdate {
  const collateral = BigInt(json?.collateral)
  const averagePrice = BigInt(json?.averagePrice)
  const size = BigInt(json?.size)
  const entryFundingRate = BigInt(json?.entryFundingRate)
  const realisedPnl = BigInt(json?.realisedPnl)
  const reserveAmount = BigInt(json?.reserveAmount)

  return { ...json, collateral, averagePrice, size, entryFundingRate, realisedPnl, reserveAmount }
}


function toTradeJson<T extends ITrade>(json: T): T {
  const decreaseList = json.decreaseList?.map(positionDecreaseJson).sort((a, b) => a.timestamp - b .timestamp)
  const increaseList = json.increaseList?.map(positionIncreaseJson).sort((a, b) => a.timestamp - b .timestamp)
  const updateList = json.updateList?.map(positionUpdateJson).sort((a, b) => a.timestamp - b.timestamp)
  
  const realisedPnl = BigInt(json.realisedPnl)
  const averagePrice = BigInt(json.averagePrice)
  const collateral = BigInt(json.collateral)
  const collateralDelta = BigInt(json.collateralDelta)

  return {
    ...json, decreaseList, increaseList, updateList,
    realisedPnl,
    averagePrice,
    collateral,
    collateralDelta,
    fee: BigInt(json.fee),
    size: BigInt(json.size),
    sizeDelta: BigInt(json.sizeDelta),
    realisedPnlPercentage: BigInt(json.realisedPnlPercentage)
  }
}




function toTradeSummary<T extends ITrade>(json: T): T {
  const size = BigInt(json.size)
  const collateral = BigInt(json.collateral)
  const fee = BigInt(json.fee)

  return { ...json, size, collateral, fee  }
}


function accountSummaryJson(json: IAccountSummary): IAccountSummary {
  const realisedPnl = BigInt(json?.realisedPnl)
  const realisedPnlPercentage = BigInt(json?.realisedPnlPercentage)
  const fee = BigInt(json?.fee)
  const collateral = BigInt(json?.collateral)
  const size = BigInt(json?.size)

  return { ...json, ...positionDeltaJson(json),  collateral, fee, size, realisedPnl, realisedPnlPercentage }
}


function priceLatestJson(json: IPriceLatest): IPriceLatest {
  const value = BigInt(json.value)

  return { ...json, value }
}



export const fromJson = {
  positonCloseJson,
  positionLiquidatedJson,
  positionIncreaseJson,
  positionDecreaseJson,
  positionUpdateJson,
  toTradeJson,
  accountSummaryJson,
  toTradeSummary,
  priceLatestJson,
}