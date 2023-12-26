import { map, periodic } from "@most/core"
import * as GMX from "gmx-middleware-const"
import { groupArrayByKey, groupArrayByKeyMap, unixTimestampNow } from "./utils.js"
import { IMarketCreatedEvent } from "./typesGMXV2.js"


const intervals = [
  { label: 'year', seconds: GMX.TIME_INTERVAL_MAP.MONTH * 12 },
  { label: 'month', seconds: GMX.TIME_INTERVAL_MAP.MONTH },
  { label: 'day', seconds: GMX.TIME_INTERVAL_MAP.HR24 },
  { label: 'hr', seconds: GMX.TIME_INTERVAL_MAP.MIN * 60 },
  { label: 'min', seconds: GMX.TIME_INTERVAL_MAP.MIN },
  { label: 'sec', seconds: GMX.TIME_INTERVAL_MAP.SEC }
] as const

export function timeSince(time: number) {
  const timeDelta = Math.abs(unixTimestampNow() - time)
  const interval = intervals.find(i => i.seconds < timeDelta)

  if (!interval) {
    return 'now'
  }

  const count = Math.floor(timeDelta / interval.seconds)
  return `${count} ${interval.label}${count !== 1 ? 's' : ''}`
}

export const everySec = map(unixTimestampNow, periodic(1000))

export const displayDate = (unixTime: number | bigint) => {
  return `${new Date(Number(unixTime) * 1000).toDateString()} ${new Date(Number(unixTime) * 1000).toLocaleTimeString()}`
}

export const countdown = (targetDate: number) => {
  return map(now => countdownFn(targetDate, now), everySec)
}

export function countdownFn(targetDate: number | bigint, now: number | bigint) {
  const distance = Number(targetDate) - Number(now)

  const days = Math.floor(distance / (60 * 60 * 24))
  const hours = Math.floor((distance % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((distance % (60 * 60)) / 60)
  const seconds = Math.floor(distance % 60)

  return `${days ? days + "d " : ''} ${hours ? hours + "h " : ''} ${minutes ? minutes + "m " : ''} ${seconds ? seconds + "s " : ''}`
}

export function getIntervalBasedOnTimeframe(maxColumns: number, from: number, to: number) {
  const delta = to - from

  const interval = maxColumns < delta / GMX.TIME_INTERVAL_MAP.DAY7
    ? GMX.TIME_INTERVAL_MAP.DAY7 : maxColumns < delta / GMX.TIME_INTERVAL_MAP.HR24
      ? GMX.TIME_INTERVAL_MAP.HR24 : maxColumns < delta / GMX.TIME_INTERVAL_MAP.HR4
        ? GMX.TIME_INTERVAL_MAP.HR4 : maxColumns < delta / GMX.TIME_INTERVAL_MAP.MIN60
          ? GMX.TIME_INTERVAL_MAP.MIN60 : maxColumns < delta / GMX.TIME_INTERVAL_MAP.MIN15
            ? GMX.TIME_INTERVAL_MAP.MIN15 : GMX.TIME_INTERVAL_MAP.MIN5

  return interval
}

function padZero(str: string | number, len = 2) {
  const zeros = new Array(len).join('0')
  return (zeros + str).slice(-len)
}

export function invertColor(hex: string, bw = true) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1)
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.')
  }
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  if (bw) {
    // https://stackoverflow.com/a/3943023/112731
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
      ? '#000000'
      : '#FFFFFF'
  }


  // pad each with zeros and return
  return "#" + padZero((255 - r).toString(16)) + padZero((255 - g).toString(16)) + padZero((255 - b).toString(16))
}
export const TEMP_MARKET_LIST: IMarketCreatedEvent[] = [
  {
    id: "0x0",
    salt: "0xcfe90e5ac88e584b5e4416cc28f9784da4079d230cb1c3dc18c8d9d2bd321e0a",
    indexToken: "0x47904963fc8b2340414262125aF798B9655E58Cd",
    longToken: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    marketToken: "0x47c031236e19d024b42f8AE6780E44A573170703",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x8421bfe6f90cb4715b184ab13d3f1a0df8b413bae0e076fa2d9591f66c6ebc53"
  },
  {
    id: "0x1",
    salt: "0x703726be3690002b6bf6a284db0688f129c2ab3d374d2dd906d9a910a3b776e2",
    indexToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x80ef8c8a10babfaad5c9b2c97d0f4b0f30f61ba6ceb201ea23f5c5737e46bc36"
  },
  {
    id: "0x2",
    salt: "0xd11668b36ff53464c08a37cb99eabc90bdcef45857afa2f38c8f223e79a8e78d",
    indexToken: "0xC4da4c24fd591125c3F47b340b6f4f76111883d8",
    longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    marketToken: "0x6853EA96FF216fAb11D2d930CE3C508556A4bdc4",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x19a0f23c4a4f3c932664171336e0207a07a275a929c3a124755276b7f789f382"
  },
  {
    id: "0x3",

    salt: "0x0811a10c64a22c940db63f865694ac89ea503886340a2e525d42fdee0bc24b05",
    indexToken: "0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07",
    longToken: "0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07",
    marketToken: "0x09400D9DB990D5ed3f35D7be61DfAEB900Af03C9",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x30fa870e8c153b5e94701297d8c87f75cd6c92d1bee5b162a3543638408ca3a1"
  },
  {
    id: "0x4",
    salt: "0x4ce3913a89beedd18ff8edfaba98f8c4547a9d70e145b2e1dde20322c02e91fb",
    indexToken: "0xB46A094Bc4B0adBD801E14b9DB95e05E28962764",
    longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    marketToken: "0xD9535bB5f58A1a75032416F2dFe7880C30575a41",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x092f90b524f55983d788fb6b525aade72f4777c4896c0428b2393527f4e4db8c"
  },
  {
    id: "0x4",

    salt: "0x0d9a030ebfcb00d99f196c94e74b761b07788f1979d0c8571588837357a49133",
    indexToken: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
    longToken: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
    marketToken: "0xc7Abb2C5f3BF3CEB389dF0Eecd6120D451170B50",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0xb408fed6009da89125214643ffa13497afc459b4d7e10cfa7c632f232bda367f"
  },
  {
    id: "0x4",

    salt: "0x3c7a8934b0669f6df863e9d50497d93c6e4690a6ff917fdfb5ee7061bb5c9293",
    indexToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    longToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    marketToken: "0x7f1fa204bb700853D36994DA19F830b6Ad18455C",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x1a7c06be1bcb7d8927104314c4b6a3f4a41c5589b92c79dc8a413e6d6e0cac88"
  },
  {
    id: "0x4",

    salt: "0xf3da5e53ef1c8cc1f6709047e4594ef30911bc96021e43f043329eac84e4ad20",
    indexToken: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    longToken: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    marketToken: "0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x465a300657a0d316f92b225d1f61698db87a2d1889252488ee5a66bf33ca538b"
  },
  {
    id: "0x4",
    salt: "0xbe44601abf931730d881718e6111e5feff41bb21f72d567938d3d3c00c6eeed4",
    indexToken: "0x0000000000000000000000000000000000000000",
    longToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    marketToken: "0x9C2433dFD71096C435Be9465220BB2B189375eA7",
    shortToken: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x7758e5ff6bec78bec60328b1a5d2f719b47d9eb1859d8ccc1095176370c4394e"
  },
  {
    id: "0x4",
    salt: "0x880d86abec9268cbb3ed060ce62339024494eb1140e5641320f1aea2a1d5549c",
    indexToken: "0x0000000000000000000000000000000000000000",
    longToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    marketToken: "0xB686BcB112660343E6d15BDb65297e110C8311c4",
    shortToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x0a7726e1e881ac0dc4cae253147117f0268fb639bd61076858dd3da7e72e1a0f"
  },
  {
    id: "0x4",
    salt: "0xa03a0e256c6a69ad57b83c7f66108b66e7cceb0e54cc34721ed728b6f9a2cf47",
    indexToken: "0x0000000000000000000000000000000000000000",
    longToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    marketToken: "0xe2fEDb9e6139a182B98e7C2688ccFa3e9A53c665",
    shortToken: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x462470e7529bfc0ff898b5cb24c7ea9a056c3c422510be562ad6bc0d3d594ac1"
  },
  {
    id: "0x4",
    salt: "0x7773a968a1a0c6bbd3044b88a30a8caefaa748ed04a03cec1082b215a1e658ed",
    indexToken: "0xc14e065b0067dE91534e032868f5Ac6ecf2c6868",
    longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    marketToken: "0x0CCB4fAa6f1F1B30911619f1184082aB4E25813c",
    shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    __typename: "MarketCreated",
    blockTimestamp: 0n,
    transactionHash: "0x93dbfec9c353671eec2fc40a66e31e5054e3859e76fcdc96f47af9eb3d6777e7"
  }
]

export const TEMP_MARKET_TOKEN_MARKET_MAP = groupArrayByKey(TEMP_MARKET_LIST, x => x.marketToken)
export const TEMP_INDEX_TOKEN_MARKET = groupArrayByKey(TEMP_MARKET_LIST, x => x.indexToken)
