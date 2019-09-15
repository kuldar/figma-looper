// Hex validation regex
const validHex = /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i

// RGB to HEX
export const rgbToHex = ({ r, g, b }) => {
  r = Math.round(r * 255).toString(16)
  g = Math.round(g * 255).toString(16)
  b = Math.round(b * 255).toString(16)

  if (r.length == 1) r = "0" + r
  if (g.length == 1) g = "0" + g
  if (b.length == 1) b = "0" + b

  const hex = `${r}${g}${b}`

  return hex
}

// HEX to RGB
export const hexToRgb = h => {
  let r = "0x"
  let g = "0x"
  let b = "0x"

  if (validHex.test(h)) {

    // 3 digits
    if (h.length == 3) {
      r = r + h[0] + h[0]
      g = g + h[1] + h[1]
      b = b + h[2] + h[2]

    // 6 digits
    } else if (h.length == 6) {
      r = r + h[0] + h[1]
      g = g + h[2] + h[3]
      b = b + h[4] + h[5]
    }

    const rgb = {
      r: +r/255,
      g: +g/255,
      b: +b/255
    }

    return rgb
  }
}

// Get iteration value
export const getIterationValue = ({ start, end, iterations, iteration }) => {
  const range = Math.abs(start - end)
  const step = range / (iterations - 1)
  const value = start > end
    ? start - step * iteration
    : start + step * iteration

  return value
}