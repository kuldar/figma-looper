import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { rgbToHex, hexToRgb } from './utils'
import './lib/figma-plugin-ds.css'
import './lib/figma-plugin-ds.min'
import './ui.css'

// Config
const colorInputIds = ['fillColor', 'fillColorEnd', 'strokeColor', 'strokeColorEnd']
const opacityInputIds = ['opacity', 'opacityEnd']
const noErrors = { iterations: '', opacity: '' }
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

// App
const App = () => {

  // Create state for config, validation and errors
  const [configState, setConfigState] = React.useState(defaultConfig)
  const [isValidSelection, setIsValidSelection] = React.useState(false)
  const [errors, setErrors] = React.useState(noErrors)

  // React to messages
  onmessage = ({ data }) => {
    const message = data.pluginMessage

    // Set config
    if (message.type === 'looper-config' && message.config) {
      setConfigState(message.config)
    }

    // Handle selection change
    if (message.type === 'selection-change') {
      setIsValidSelection(message.selection)
    }
  }

  // Not sure if I need two of those
  React.useEffect(() => { (window as any).iconInput.init() }, [])
  React.useEffect(() => { (window as any).disclosure.init() }, [])

  // Send a create message
  const onCreate = () => {
    let { ...currentErrors } = noErrors
    const { iterations, opacity, opacityEnd } = configState

    if (iterations < 2 || iterations > 1000) {
      currentErrors.iterations = 'Between 2 and 1000'
    }

    if (opacity > 1 || opacity < 0 || opacityEnd > 1 || opacityEnd < 0) {
      currentErrors.opacity = 'Between 0 and 100'
    }

    if (Object.values(currentErrors).every(error => error === '')) {
      setErrors(currentErrors)
      parent.postMessage({ pluginMessage: {...configState, type: 'create' }}, '*')
    } else {
      setErrors(currentErrors)
    }

  }

  // Send a cancel message
  const onCancel = () => parent.postMessage({ pluginMessage: { type: 'cancel' }}, '*')

  // Update value of a setting
  const setConfigValue = ({ id, value }) => {
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
          onChange={({ target }) => setConfigValue({ id, value: target.value })}
        />
      </div>
    )
  }

  // Render the UI
  return (
    <div>
      <div className="section-title">Iterations <span className="error">{ errors.iterations }</span></div>
      <IconInput type="number" min="1"  icon="layout-grid-uniform" id="iterations" placeholder="Iterations" />

      <div className="section-title">Position</div>
      <div className="row">
        <IconInput type="number" min="0" icon="text" iconLetter="X" id="x" placeholder="px" />
        <IconInput type="number" min="0" icon="text" iconLetter="Y" id="y" placeholder="px" />
        <IconInput type="number" icon="angle" id="rotation" placeholder="deg" />
      </div>
      <div className="section-title">Scale <span>(px)</span></div>
      <div className="row">
        <IconInput type="number" icon="text" iconLetter="W" id="scaleX" placeholder="Width" />
        <IconInput type="number" icon="text" iconLetter="H" id="scaleY" placeholder="Height" />
      </div>
      <div className="section-title">Opacity <span>(%)</span> <span className="error">{ errors.opacity }</span></div>
      <div className="row">
        <IconInput type="number" min="0" max="100" icon="visible" id="opacity" placeholder="Start Opacity" />
        <IconInput type="number" min="0" max="100" icon="visible" id="opacityEnd" placeholder="End Opacity" />
      </div>
      <div className="section-title">Fill <span>(HEX)</span></div>
      <div className="row">
        <IconInput icon="blend-empty" id="fillColor" placeholder="Start Color" />
        <IconInput icon="blend-empty" id="fillColorEnd" placeholder="End Color" />
      </div>
      <div className="section-title">Stroke <span>(HEX / px)</span></div>
      <div className="row">
        <IconInput icon="blend-empty" id="strokeColor" placeholder="Start Color" />
        <IconInput icon="blend-empty" id="strokeColorEnd" placeholder="End Color" />
      </div>
      <div className="row">
        <IconInput type="number" min="0" max="1000" icon="stroke-weight" id="strokeWeight" placeholder="Start Weight" />
        <IconInput type="number" min="0" max="1000" icon="stroke-weight" id="strokeWeightEnd" placeholder="End Weight" />
      </div>
      <div style={{ height: '16px' }} />
      <div className="buttons">
        <button className="button button--secondary" onClick={onCancel}>Cancel</button>
        { isValidSelection
          ? <button className="button button--primary" id="create" onClick={onCreate}>Create</button>
          : <button className="button button--primary" disabled>Select a layer</button>
        }
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('react-page'))