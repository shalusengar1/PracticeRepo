
import * as React from "react"

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < breakpoint)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return !!isMobile
}

// For convenience, export these common breakpoints
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  LAPTOP: 1024,
  DESKTOP: 1280,
}
