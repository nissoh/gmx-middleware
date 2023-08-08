import { ARBITRUM_ADDRESS } from "./chain/arbitrum.js"
import { AVALANCHE_ADDRESS } from "./chain/avalanche.js"


export enum CHAIN {
  ETH = 1,
  ETH_ROPSTEN = 3,
  ETH_KOVAN = 42,
  ETH_RINKBY = 4,
  ETH_GOERLI = 5,

  BSC = 56,
  BSC_TESTNET = 97,

  ARBITRUM = 42161,
  ARBITRUM_RINKBY = 421611,
  AVALANCHE = 43114
}

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as const
export const BYTES32_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000" as const

export const USD_DECIMALS = 30
export const USDG_DECIMALS = 18

export const BASIS_POINTS_DIVISOR = 10000n
export const DEPOSIT_FEE = 30n
export const LIMIT_LEVERAGE = 1000000n
export const MAX_LEVERAGE = 1000000n
export const MIN_LEVERAGE = 11000n
export const LEVERAGE_LIQUIDAITON = 1000000n
export const DEDUCT_USD_FOR_GAS = 10n ** 30n * 2n

export const USD_PERCISION = 10n ** 30n
export const LIQUIDATION_FEE = 10n ** 5n

export const TAX_BASIS_POINTS = 50n
export const STABLE_TAX_BASIS_POINTS = 5n
export const MINT_BURN_FEE_BASIS_POINTS = 25n
export const SWAP_FEE_BASIS_POINTS = 30n
export const STABLE_SWAP_FEE_BASIS_POINTS = 1n
export const MARGIN_FEE_BASIS_POINTS = 10n

export const FUNDING_RATE_PRECISION = 1000000n


export const TIME_INTERVAL_MAP = {
  SEC: 1,
  MIN: 60,
  MIN5: 300,
  MIN15: 900,
  MIN30: 1800,
  MIN60: 3600,
  HR2: 7200,
  HR4: 14400,
  HR8: 28800,
  HR24: 86400,
  DAY7: 604800,
  MONTH: 2628000,
  MONTH2: 5256000,
  YEAR: 31536000
} as const

export type IntervalTime = typeof TIME_INTERVAL_MAP[keyof typeof TIME_INTERVAL_MAP]


export const TRADE_CONTRACT_MAPPING = {
  [CHAIN.ARBITRUM]: ARBITRUM_ADDRESS,
  [CHAIN.AVALANCHE]: AVALANCHE_ADDRESS
} as const

export type ContractChain = keyof typeof TRADE_CONTRACT_MAPPING


export const EXPLORER_URL = {
  [CHAIN.ETH]: "https://etherscan.io/",
  [CHAIN.ETH_KOVAN]: "https://kovan.etherscan.io/",
  [CHAIN.ETH_ROPSTEN]: "https://ropsten.etherscan.io/",
  [CHAIN.ETH_RINKBY]: "https://rinkeby.etherscan.io/",
  [CHAIN.ETH_GOERLI]: "https://goerli.etherscan.io/",

  [CHAIN.BSC]: "https://bscscan.com/",
  [CHAIN.BSC_TESTNET]: "https://testnet.bscscan.com/",

  [CHAIN.ARBITRUM]: "https://arbiscan.io/",
  [CHAIN.ARBITRUM_RINKBY]: "https://testnet.arbiscan.io/",
  [CHAIN.AVALANCHE]: "https://snowtrace.io/",
}


