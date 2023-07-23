import { ARBITRUM_ADDRESS } from "./chain/arbitrum.js"
import { AVALANCHE_ADDRESS } from "./chain/avalanche.js"
import { CHAIN } from "./common.js"
import { TOKEN_SYMBOL } from "./symbol.js"
import { groupByKeyMap } from "./utils.js"


export const TOKEN_DESCRIPTION_LIST = [
  {
    name: "GLP",
    symbol: TOKEN_SYMBOL.GLP,
    decimals: 18,
    isStable: false,
  },
  {
    name: "GMX",
    symbol: TOKEN_SYMBOL.GMX,
    decimals: 18,
    isStable: false,
  },
  {
    name: "Escrow GMX",
    symbol: TOKEN_SYMBOL.ESGMX,
    decimals: 18,
    isStable: false,
  },
  {
    name: "Avalanche",
    symbol: TOKEN_SYMBOL.AVAX,
    decimals: 18,
    isStable: false,
  },
  {
    name: "Wrapped AVAX",
    symbol: TOKEN_SYMBOL.WAVAX,
    decimals: 18,
    isStable: false,
  },
  {
    name: "Chainlink",
    symbol: TOKEN_SYMBOL.LINK,
    decimals: 18,
    isStable: false,
  },
  {
    name: "Bitcoin (WBTC.e)",
    symbol: TOKEN_SYMBOL.WBTCE,
    decimals: 8,
    isStable: false,
  },
  {
    name: "Wrapped Bitcoin",
    symbol: TOKEN_SYMBOL.WBTC,
    decimals: 8,
    isStable: false,
  },
  {
    name: "Bitcoin (BTC.b)",
    symbol: TOKEN_SYMBOL.BTCB,
    decimals: 8,
    isStable: false,
  },
  {
    name: "Ethereum",
    symbol: TOKEN_SYMBOL.ETH,
    decimals: 18,
    isStable: false,
  },
  {
    name: "Wrapped Ethereum",
    symbol: TOKEN_SYMBOL.WETH,
    decimals: 18,
    isStable: false,
  },
  {
    name: "Uniswap",
    symbol: TOKEN_SYMBOL.UNI,
    decimals: 18,
    isStable: false,
  },
  {
    name: "USD Coin",
    symbol: TOKEN_SYMBOL.USDC,
    decimals: 6,
    isStable: true,
  },
  {
    name: "USD Coin (USDC.e)",
    symbol: TOKEN_SYMBOL.USDCE,
    decimals: 6,
    isStable: true,
  },
  {
    name: "Tether",
    symbol: TOKEN_SYMBOL.USDT,
    decimals: 6,
    isStable: true,
  },
  {
    name: "Dai",
    symbol: TOKEN_SYMBOL.DAI,
    decimals: 18,
    isStable: true,
  },
  {
    name: "Frax",
    symbol: TOKEN_SYMBOL.FRAX,
    decimals: 18,
    isStable: true,
  },
  {
    name: "Magic Internet Money",
    symbol: TOKEN_SYMBOL.MIM,
    decimals: 18,
    isStable: true,
  },
  
] as const

export const TOKEN_DESCRIPTION_MAP = groupByKeyMap(TOKEN_DESCRIPTION_LIST, token => token.symbol, x => x)

export const CHAIN_ADDRESS_MAP = {
  [CHAIN.AVALANCHE]: AVALANCHE_ADDRESS,
  [CHAIN.ARBITRUM]: ARBITRUM_ADDRESS,
}

export const CHAIN_NATIVE_DESCRIPTION = {
  [CHAIN.AVALANCHE]: TOKEN_DESCRIPTION_MAP.AVAX,
  [CHAIN.ARBITRUM]: TOKEN_DESCRIPTION_MAP.ETH,
} as const

export const TOKEN_ADDRESS_DESCRIPTION = {
  [ARBITRUM_ADDRESS.NATIVE_TOKEN]: TOKEN_DESCRIPTION_MAP.WETH,

  [ARBITRUM_ADDRESS.GLP]: TOKEN_DESCRIPTION_MAP.GLP,
  [ARBITRUM_ADDRESS.GMX]: TOKEN_DESCRIPTION_MAP.GMX,
  [ARBITRUM_ADDRESS.ES_GMX]: TOKEN_DESCRIPTION_MAP.ESGMX,

  [ARBITRUM_ADDRESS.LINK]: TOKEN_DESCRIPTION_MAP.LINK,
  [ARBITRUM_ADDRESS.UNI]: TOKEN_DESCRIPTION_MAP.UNI,
  [ARBITRUM_ADDRESS.WBTC]: TOKEN_DESCRIPTION_MAP.WBTC,

  [ARBITRUM_ADDRESS.DAI]: TOKEN_DESCRIPTION_MAP.DAI,
  [ARBITRUM_ADDRESS.FRAX]: TOKEN_DESCRIPTION_MAP.FRAX,
  [ARBITRUM_ADDRESS.MIM]: TOKEN_DESCRIPTION_MAP.MIM,
  [ARBITRUM_ADDRESS.USDC]: TOKEN_DESCRIPTION_MAP.USDC,
  [ARBITRUM_ADDRESS.USDT]: TOKEN_DESCRIPTION_MAP.USDT,


  [AVALANCHE_ADDRESS.NATIVE_TOKEN]: TOKEN_DESCRIPTION_MAP.AVAX,

  [AVALANCHE_ADDRESS.GMX]: TOKEN_DESCRIPTION_MAP.GMX,
  [AVALANCHE_ADDRESS.GLP]: TOKEN_DESCRIPTION_MAP.GLP,
  [AVALANCHE_ADDRESS.ES_GMX]: TOKEN_DESCRIPTION_MAP.ESGMX,

  [AVALANCHE_ADDRESS.WBTCE]: TOKEN_DESCRIPTION_MAP.WBTC,
  [AVALANCHE_ADDRESS.BTCB]: TOKEN_DESCRIPTION_MAP.BTCB,
  [AVALANCHE_ADDRESS.WETHE]: TOKEN_DESCRIPTION_MAP.ETH,
  [AVALANCHE_ADDRESS.MIM]: TOKEN_DESCRIPTION_MAP.MIM,
  [AVALANCHE_ADDRESS.USDC]: TOKEN_DESCRIPTION_MAP.USDC,
  [AVALANCHE_ADDRESS.USDCE]: TOKEN_DESCRIPTION_MAP.USDCE,
} as const





