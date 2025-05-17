export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

export const slideDown = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

export const slideUp = {
  hidden: {
    height: "auto",
    opacity: 1,
  },
  visible: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3 },
  },
}

export const pulse = {
  scale: [1, 1.02, 1],
  transition: { duration: 0.5 },
}
