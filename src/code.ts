import { getIterationValue, rotateOriginXY} from './utils'

type ValidType = VectorNode | StarNode | LineNode | EllipseNode | PolygonNode | RectangleNode | TextNode
const supportedTypes = ['VECTOR', 'STAR', 'LINE', 'ELLIPSE', 'POLYGON', 'RECTANGLE', 'TEXT', 'GROUP']

let lastNodes = [];
let lastSelectedNodeParent = null;
let lastSelectedNode = null;
let currentGroup = null;

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
    figma.showUI(__html__, { width: 300, height: 550 })
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

    // Save config for future
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
      if (opacity !== null) { 
        selectedNode.opacity = opacity 
      }
      if (fillColor !== null && selectedNode.fills) { 
        selectedNode.fills = [{ type: 'SOLID', ...fillColor }] 
      }
      if (strokeColor !== null && selectedNode.strokes) { 
        selectedNode.strokes = [{ type: 'SOLID', ...strokeColor }] 
      }
      if (strokeWeight !== null && selectedNode.strokeWeight) { 
        selectedNode.strokeWeight = strokeWeight 
      }

      lastSelectedNode = selectedNode;
      lastNodes = []

      // Start looping
      for (let iteration = 1; iteration < iterations; iteration++) {
        const node = selectedNode.clone()
        node.name = node.name + "_" + iteration;
        selectedNodeParent.insertChild(0, node)
        let clonedNodesArray:SceneNode[] = []
        clonedNodesArray.push(node)
        lastNodes.push(node)

        if (selectedNode.type === 'LINE') {
          node.resize(node.width + scaleX * iteration, 0)
        } else {
          node.resize(node.width + scaleX * iteration, node.height + scaleY * iteration)
        }
        
        node.x = node.x - ((scaleX * iteration) / 2)
        node.y = node.y - ((scaleY * iteration) / 2)

        if (rotation !== null) {
          rotateOriginXY(clonedNodesArray, (rotation * iteration), .5, .5, "%", "%")
        }
        node.x = node.x + (x * iteration)
        node.y = node.y + (y * iteration)

        if (opacityEnd !== null) {
          node.opacity = getIterationValue({ start: opacity, end:opacityEnd, iterations, iteration })
        }

        if (fillColorEnd !== null && node.fills) {
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

        if (strokeColorEnd !== null && node.strokes) {
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

        if (strokeWeightEnd !== null && node.strokeWeight) {
          node.strokeWeight = getIterationValue({ start: strokeWeight, end: strokeWeightEnd, iterations, iteration })
        }
      }
      const nodes = [selectedNode, ...lastNodes]
      const nodesGroup: GroupNode = figma.group(nodes, selectedNodeParent)
      nodesGroup.name = 'LooperGroup'
      lastSelectedNodeParent = selectedNodeParent;
      currentGroup = nodesGroup;
      // Select and focus the group
      figma.currentPage.selection = [nodesGroup]
      figma.viewport.scrollAndZoomIntoView([nodesGroup])
    }
  } else if (msg.type === 'delete') {
    if (lastNodes && lastNodes.length) {
      lastNodes.forEach( element => {
        if (!element.removed) {
          element.remove();
        }
      });
      if (!lastSelectedNode.removed && !lastSelectedNodeParent.removed && lastSelectedNode.parent === currentGroup) {
        lastSelectedNodeParent.appendChild(lastSelectedNode)
      }
    }
  } else {
    // That's all folks, thanks for coming!
    figma.closePlugin()
  }
}