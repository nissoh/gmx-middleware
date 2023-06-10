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
