// Hex validation regex
export const validHex = /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i
const validRGB = /\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b/

// RGB to HEX
export const rgbToHex = ({ r, g, b }) => {
  if (validRGB.test(r) && validRGB.test(g) && validRGB.test(b)) {
	r = Math.round(r * 255).toString(16)
	g = Math.round(g * 255).toString(16)
	b = Math.round(b * 255).toString(16)

	if (r.length == 1) r = "0" + r
	if (g.length == 1) g = "0" + g
	if (b.length == 1) b = "0" + b

	const hex = `${r}${g}${b}`

	return hex
  } else {
	  return null
  }
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
  } else {
	return null
  }
}

// Get iteration value
export const getIterationValue = ({ start, end, iterations, iteration }) => {
  const range = Math.abs(start - end)
  const step = range / (iterations - 1)
  const value = start > end
    ? start - step * iteration
    : start + step * iteration
  return (value < 0 ) ? 0 : value
}

export const rotatedTopLeft = (x, y, width, height, rotationAngle) => {
  let cx = x + width / 2;
  let cy = y + height / 2;

  let dx = x - cx;
  let dy = y - cy;
  let originalTopLeftAngleX = Math.atan2(-dy, dx);
  let originalTopLeftAngleY = Math.atan2(dy, -dx);
  let rotatedTopLeftAngleX = originalTopLeftAngleX + rotationAngle;
  let rotatedTopLeftAngleY = originalTopLeftAngleY + rotationAngle;

  let radius = Math.sqrt(width * width + height * height) / 2;

  let rx = cx + radius * Math.cos(rotatedTopLeftAngleX);
  let ry = cy + radius * Math.sin(rotatedTopLeftAngleY);

  return({left: rx, top: ry});
}

export const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
}


export const rotateOriginXY = (nodes, angle = 0, offsetX = 0, offsetY = 0, unitTypeX = "px", unitTypeY = "px") => {
	// keep the position of the elements
	const parents = nodes.map(node => ({
		id: node.id,
		parent: node.parent,
		index: getIndexNode(node)
	}))

	var group = figma.group(nodes, figma.currentPage)
	const [[,,x1], [,,y1]] = group.absoluteTransform

	// using the frame, we will change the center of rotation
	const frameNode = figma.createFrame()
	frameNode.appendChild(group)
	frameNode.x = x1
	frameNode.y = y1

	const [[,,x2], [,,y2]] = group.absoluteTransform

	// relative position of the center of rotation
	if (unitTypeX === "%") {
		offsetX = group.width * offsetX
	}
	if (unitTypeY === "%") {
		offsetY = group.height * offsetY
	}

	// сorrect the position of the group after moving to frame
	group.x -= (x2 - x1)
	group.y -= (y2 - y1)

	// change the center of rotation
	group.x -= offsetX
	group.y -= offsetY
	frameNode.x += offsetX
	frameNode.y += offsetY

	frameNode.rotation = angle

	// get rid of the frame
	const [[,,x3],[,,y3]] = group.absoluteTransform
	figma.currentPage.appendChild(group)
	frameNode.remove()

	group.x = x3
	group.y = y3
	group.rotation = angle
	
	// shake out the nodes in a new not rotated group. Node rotation is maintained
	group = figma.group(group.children, figma.currentPage)
	const totalX = group.x, totalY = group.y
	const totalWidth = group.width
	const totalHeight = group.height

	// return the elements to their original positions
	nodes.forEach(n => {
		let p = parents.find(p => p.id == n.id)

		if (p) {
			p.parent.insertChild(p.index, n)
		} else {
			// never know what ..
			figma.currentPage.appendChild(n)
		}

		let [[, , x4], [, , y4]] = n.absoluteTransform
		let [[, , x5], [, , y5]] = n.relativeTransform

		n.x = n.x + x5 - x4
		n.y = n.y + y5 - y4
	})

	
	function getIndexNode(node) {
		const id = node.id
		const index = node.parent.children.findIndex(item => item.id === id)
		return index < 0 ? 0 : index
	}

	// return total x, y, width, height all group elements
	return {
		x: totalX,
		y: totalY,
		width: totalWidth,    
		height: totalHeight,
	}
}

// const getMidPoint = (x, y , width, height, cosa, sina) => {

//   let wp = width / 2;
//   let hp = height / 2;
//   return {
//     px: (x + wp * cosa - hp * sina),
//     py: (y + wp * sina + hp * cosa)
//   }
// }


// const getAbsoluteMidPoint = (x, y , width, height, angle_degress) => {
//   let angle_rad = angle_degress * Math.PI / 180;
//   let cosa = Math.cos(angle_rad)
//   let sina = Math.sin(angle_rad)
//   let wp = width / 2;
//   let hp = height / 2;
//   return {
//     px: (x + wp * cosa - hp * sina),
//     py: (y + wp * sina + hp * cosa)
//   }
// }