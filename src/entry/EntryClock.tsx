import { useEffect, useState } from 'react'

const bangkok = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

/** The live menu clock is independent from the incident's authored 03:12 time. */
export function EntryClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  return (
    <time dateTime={now.toISOString()} aria-label="เวลาประเทศไทย">
      EAST BANK / {bangkok.format(now)} <small>UTC+7</small>
    </time>
  )
}
