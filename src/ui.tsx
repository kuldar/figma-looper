import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { rgbToHex, hexToRgb } from './utils'
import './lib/figma-plugin-ds.css'
import './lib/figma-plugin-ds.min'
import './ui.css'

// Default config
const defaultConfig = {
  iterations: 25,
  x: 5,
  y: 5,
  rotation: 5,
  scaleX: 0,
  scaleY: 0,
  opacity: 1,
  opacityEnd: 0,
  fillColor: null,
  fillColorEnd: null,
  strokeColor: null,
  strokeColorEnd: null,
  strokeWeight: null,
  strokeWeightEnd: null,
}

// Define color config ids
const colorInputIds = ['fillColor', 'fillColorEnd', 'strokeColor', 'strokeColorEnd']
const opacityInputIds = ['opacity', 'opacityEnd']

// App
const App = () => {

  // Set state to default config
  const [configState, setConfigState] = React.useState(defaultConfig)

  onmessage = ({ data }) => {
    const message = data.pluginMessage
    if (message.type === 'looper-config') {
      console.log(message.config)
      if (message.config) { setConfigState(message.config) }
    }
  }

  React.useEffect(() => {
    // (window as any).selectMenu.init()
    (window as any).iconInput.init()
  }, [])

  // Send a create message
  const onCreate = () => parent.postMessage({ pluginMessage: {...configState, type: 'create' }}, '*')

  // Send a cancel message
  const onCancel = () => parent.postMessage({ pluginMessage: { type: 'cancel' }}, '*')

  // Update value of a setting
  const setConfigValue = ({id, value}) => {
    const newConfig = configState

    if (value === '') {
      newConfig[id] = null
    } else if (opacityInputIds.includes(id)) {
      newConfig[id] = value / 100
    } else if (colorInputIds.includes(id)) {
      newConfig[id] = { color: hexToRgb(value), opacity: 1 }
    } else {
      newConfig[id] = parseFloat(value)
    }

    return setConfigState(newConfig)
  }

  // Get value of a setting
  const getState = (id) => {
    const configValue = configState[id]

    if (configValue !== null) {
      if (colorInputIds.includes(id)) {
        return rgbToHex(configState[id].color)
      } else if (opacityInputIds.includes(id)) {
        return `${Math.round(configState[id]*100)}`
      } else {
        return configState[id].toString()
      }
    }
  }

  // Color input component
  // const ColorInput = ({ placeholder='', id }) => {
  //   return (
  //     <div className="input-icon">
  //       <div className='input-icon__icon'>
  //         <div className={`icon`} style={{ display: 'flex' }}>
  //           <div className="icon-color" style={{ backgroundColor: `#${getState(id)}` }}/>
  //         </div>
  //       </div>

  //       <input
  //         id={id}
  //         type="input"
  //         className="input-icon__input"
  //         defaultValue={getState(id)}
  //         placeholder={placeholder}
  //         onChange={e => setConfigValue({ id, value: e.target.value })}
  //       />
  //     </div>
  //   )
  // }

  // Icon input component
  const IconInput = ({ icon, iconLetter = '', placeholder='', id, type = '', min = '', max = '' }) => {
    return (
      <div className="input-icon">
        <div className='input-icon__icon'>
          <div className={`icon icon--${icon} icon--black-3`}>{icon === 'text' && iconLetter}</div>
        </div>

        <input
          id={id}
          type={type}
          min={min}
          max={max}
          className="input-icon__input"
          defaultValue={getState(id)}
          placeholder={placeholder}
          onChange={e => setConfigValue({ id, value: e.target.value })}
        />
      </div>
    )
  }

  // Render the UI
  return (
    <div>
      <div className="section-title">Iterations</div>
      <IconInput type="number" min="1" icon="layout-grid-uniform" id="iterations" placeholder="Iterations" />
      <div className="section-title">Change Steps</div>
      <div className="row">
        <IconInput type="number" min="0" icon="text" iconLetter="X" id="x" placeholder="px" />
        <IconInput type="number" min="0" icon="text" iconLetter="Y" id="y" placeholder="px" />
        <IconInput type="number" icon="angle" id="rotation" placeholder="Angle" />
      </div>
      <div className="section-title">Scale</div>
      <div className="row">
        <IconInput type="number" icon="text" iconLetter="X" id="scaleX" placeholder="Increment by px" />
        <IconInput type="number" icon="text" iconLetter="Y" id="scaleY" placeholder="Increment by px" />
      </div>
      <div className="section-title">Opacity in %</div>
      <div className="row">
        <IconInput type="number" min="0" max="100" icon="visible" id="opacity" placeholder="Opacity" />
        <IconInput type="number" min="0" max="100" icon="visible" id="opacityEnd" placeholder="End Opacity" />
      </div>
      <div className="section-title">Fill</div>
      <div className="row">
        <IconInput icon="blend-empty" id="fillColor" placeholder="Color" />
        <IconInput icon="blend-empty" id="fillColorEnd" placeholder="End Color" />
        {/* <ColorInput id="fillColor" placeholder="Color" /> */}
        {/* <ColorInput id="fillColorEnd" placeholder="End Color" /> */}
      </div>
      <div className="section-title">Stroke</div>
      <div className="row">
        <IconInput icon="blend-empty" id="strokeColor" placeholder="Color" />
        <IconInput icon="blend-empty" id="strokeColorEnd" placeholder="End Color" />
        {/* <ColorInput id="strokeColor" placeholder="Color" /> */}
        {/* <ColorInput id="strokeColorEnd" placeholder="End Color" /> */}
      </div>
      <div className="row">
        <IconInput type="number" min="0" max="1000" icon="stroke-weight" id="strokeWeight" placeholder="Weight" />
        <IconInput type="number" min="0" max="1000" icon="stroke-weight" id="strokeWeightEnd" placeholder="End Weight" />
      </div>
      <div style={{ height: '16px' }} />
      <div className="buttons">
        <button className="button button--secondary" onClick={onCancel}>Cancel</button>
        <button className="button button--primary" id="create" onClick={onCreate}>Create</button>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('react-page'))