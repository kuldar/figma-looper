import { getIterationValue } from './utils'

type ValidType = VectorNode | StarNode | LineNode | EllipseNode | PolygonNode | RectangleNode | TextNode
const supportedTypes = ['VECTOR', 'STAR', 'LINE', 'ELLIPSE', 'POLYGON', 'RECTANGLE', 'TEXT', 'GROUP']

const isValidSelection = () => {
  const selection = figma.currentPage.selection
  if (selection.length === 1) {
    return supportedTypes.includes(selection[0].type)
  } else {
    return false
  }
}

const main = () => {
  figma.clientStorage.getAsync('looper-config').then(config => {
    figma.showUI(__html__, { width: 280, height: 480 })
    figma.ui.postMessage({ type: 'looper-config', config})
    figma.ui.postMessage({ type: 'selection-change', selection: isValidSelection() })
  })
}

main()

// @ts-ignore
figma.on('selectionchange', () => {
  figma.ui.postMessage({ type: 'selection-change', selection: isValidSelection() })
})

// Respond to message
figma.ui.onmessage = msg => {

  // Loop action
  if (msg.type === 'create') {

    const { type, ...config } = msg
    figma.clientStorage.setAsync('looper-config', config)

    // Entered values
    const {
      iterations,
      x,
      y,
      rotation,
      scaleX,
      scaleY,
      opacity,
      opacityEnd,
      fillColor,
      fillColorEnd,
      strokeColor,
      strokeColorEnd,
      strokeWeight,
      strokeWeightEnd,
    } = config

    // Currently selected node
    const selectedNode: ValidType = figma.currentPage.selection[0] as ValidType

    // Proceed only with Vector Nodes
    if (supportedTypes.includes(selectedNode.type)) {
      const selectedNodeParent = selectedNode.parent

      // Set styles for selected node
      if (opacity !== null) { selectedNode.opacity = opacity }
      if (fillColor !== null) { selectedNode.fills = [{ type: 'SOLID', ...fillColor }] }
      if (strokeColor !== null) { selectedNode.strokes = [{ type: 'SOLID', ...strokeColor }] }
      if (strokeWeight !== null) { selectedNode.strokeWeight = strokeWeight }

      // Add selected node to array
      const nodes = [selectedNode]
      const nodesGroup: FrameNode = figma.group(nodes, selectedNodeParent)
      nodesGroup.name = 'LooperGroup'

      // Start looping
      for (let iteration = 1; iteration < iterations; iteration++) {
        const node = selectedNode.clone()
        nodesGroup.insertChild(0, node)

        node.x = selectedNode.x + (x * iteration)
        node.y = selectedNode.y + (y * iteration)
        node.rotation = selectedNode.rotation + (rotation * iteration)

        node.resize(node.width + scaleX * iteration, node.height + scaleY * iteration)
        node.x = node.x - ((scaleX * iteration) / 2)
        node.y = node.y - ((scaleY * iteration) / 2)

        if (opacityEnd !== null) {
          node.opacity = getIterationValue({ start: opacity, end:opacityEnd, iterations, iteration })
        }

        if (fillColorEnd !== null) {
          node.fills = [{
            type: 'SOLID',
            opacity: 1,
            color: {
              r: getIterationValue({ start: fillColor.color.r, end: fillColorEnd.color.r, iterations, iteration }),
              g: getIterationValue({ start: fillColor.color.g, end: fillColorEnd.color.g, iterations, iteration }),
              b: getIterationValue({ start: fillColor.color.b, end: fillColorEnd.color.b, iterations, iteration })
            }
          }]
        }

        if (strokeColorEnd !== null) {
          node.strokes = [{
            type: 'SOLID',
            opacity: 1,
            color: {
              r: getIterationValue({ start: strokeColor.color.r, end: strokeColorEnd.color.r, iterations, iteration }),
              g: getIterationValue({ start: strokeColor.color.g, end: strokeColorEnd.color.g, iterations, iteration }),
              b: getIterationValue({ start: strokeColor.color.b, end: strokeColorEnd.color.b, iterations, iteration })
            }
          }]
        }

        if (strokeWeightEnd !== null) {
          node.strokeWeight = getIterationValue({ start: strokeWeight, end: strokeWeightEnd, iterations, iteration })
        }
      }

      // Select and focus the group
      figma.currentPage.selection = [nodesGroup]
      figma.viewport.scrollAndZoomIntoView([nodesGroup])
    }
  } else {
    // That's all folks, thanks for coming!
    figma.closePlugin()
  }
}