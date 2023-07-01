import { map, periodic } from "@most/core"
import * as GMX from "gmx-middleware-const"
import { unixTimestampNow } from "./utils.js"


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
