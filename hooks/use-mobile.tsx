"use client"

import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    // Check if window is defined (browser environment)
    if (typeof window === "undefined") return

    // Initial check for screen size
    setIsMobile(window.innerWidth < breakpoint)

    // Check if it's a touch device
    setIsTouchDevice(
      "ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0,
    )

    // Handler for window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [breakpoint])

  // Return true if either screen size is mobile or it's a touch device
  return isMobile || isTouchDevice
}
