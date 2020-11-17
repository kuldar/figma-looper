import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { rgbToHex, hexToRgb } from './utils'
import * as presetsConfig from "./presetsConfig.json";
import { Select, Button, Checkbox } from 'react-figma-plugin-ds';
import './lib/figma-plugin-ds.css'
import './ui.css'

// Config

const colorInputIds = ['fillColor', 'fillColorEnd', 'strokeColor', 'strokeColorEnd']
const opacityInputIds = ['opacity', 'opacityEnd']
const noErrors = { iterations: '', opacity: '', scale: '' }
let createClicked = false
const defaultConfig = {
  livePreview: false,
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

const presets = presetsConfig.presets.map((option) => (
  {
    divider: option.divider,
    label:  option.label,
    value: option.value
  }
))

// App
const App = () => {

  // Create state for config, validation and errors
  const [configState, setConfigState] = React.useState(defaultConfig)
  const [isValidSelection, setIsValidSelection] = React.useState(false)
  const [errors, setErrors] = React.useState(noErrors)
  const [loading, setLoading] = React.useState(false);

  // React to messages
  onmessage = ({ data }) => {
    const message = data.pluginMessage

    // Set config
    if (message.type === 'looper-config' && message.config) {
      setConfigState(message.config)
      setLoading(true)
    }

    // Handle selection change
    if (message.type === 'selection-change') {
      setIsValidSelection(message.selection)
    }
  }

  React.useEffect(() => {
    if (configState.livePreview) {
      onCreate()
    } else if (!createClicked) {
      onRevert()
    }
  }, [configState])

  React.useEffect(() => {
    if (loading) {
       console.log('Loaded last config')
    }
  }, [loading]);


  // Send a create message
  const onCreate = () => {
    let { ...currentErrors } = noErrors
    const { iterations, opacity, opacityEnd, scaleX, scaleY } = configState

    if (iterations < 1 || iterations > 1000) {
      currentErrors.iterations = 'Between 1 and 1000'
    }

    if (opacity > 1 || opacity < 0 || opacityEnd > 1 || opacityEnd < 0) {
      currentErrors.opacity = 'Between 0 and 100'
    }

    if ((scaleX && scaleX < 0.01) || (scaleY && scaleY < 0.01)) {
      currentErrors.scale = 'ScaleX or ScaleY should be >= 0.01'
    }

    if (Object.values(currentErrors).every(error => error === '')) {
      setErrors(noErrors)
      parent.postMessage({ pluginMessage: {...configState, type: 'create' }}, '*')
    } else {
      setErrors(currentErrors)
    }
  }

  // Send a cancel message
  const onRevert = () => parent.postMessage({ pluginMessage: { type: 'revert' }}, '*')

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

    setConfigState(newConfig)
    if (configState.livePreview) {
      onCreate()
    }
  }

  // Get value of a setting
  const getState = (id) => {
    const configValue = configState[id]
   
    if (configValue !== null) {
      if (colorInputIds.includes(id)) {
        if (configState[id].color !== undefined && configState[id].color !== null) {
          return rgbToHex(configState[id].color)
        } else {
          return
        }
      } else if (opacityInputIds.includes(id)) {
        return `${Math.round(configState[id]*100)}`
      } else if (typeof configValue === 'boolean') {
        return configValue
      } else {
        return configState[id].toString()
      }
    }
  }

  // Icon input component
  const IconInput = ({ icon, iconLetter = '', placeholder='', id, type = '', min = '', max = '', step='1'}) => {
    return (
      <div className="input input--with-icon">
        <div className={`icon icon--${icon} icon--black-3`}>{icon === 'text' && iconLetter}</div>
        <input
          id={id}
          type={type}
          key={id}
          min={min}
          max={max}
          step={step}
          className="input__field"
          defaultValue={getState(id)}
          placeholder={placeholder}
          onChange={ ({ target }) =>  setConfigValue({ id, value: target.value }) }
          onKeyDown={ handleKeyDown }
        />
      </div>
    )
  }

  const selectPresetsHandler =  (option) => {
    let currentState = {...configState}
    let selectedPreset = presetsConfig.presets.find(el => el.value === option.value)
    setConfigState({ livePreview: currentState.livePreview, iterations: currentState.iterations, ...selectedPreset.objValues })
  }
  
  const handleKeyDown = (e) => {
    if (e.keyCode === 38 && e.shiftKey) {
      e.target.value = parseInt(e.target.value) + 10 - 1;
    } else if (e.keyCode === 40  && e.shiftKey) {
      e.target.value = parseInt(e.target.value) - 10 + 1;
    }
  }

  const changeIterations = (iter) => {
    const currentState = {...configState}
    setConfigState({...currentState, iterations: parseFloat(iter)})
  }

  const livePreviewChangeHandler = () => {
    const currentState = {...configState}
    setConfigState({...currentState, livePreview: !currentState.livePreview});
  }

  // Render the UI
  return (
    <>
      {loading ? (
        <>
          <div className="section-title">Iterations <span className="error">{errors.iterations}</span></div><IconInput type="number" min="1" icon="layout-grid-uniform" id="iterations" placeholder="Iterations" /><div style={{ height: '8px' }} /><div className="buttons">
            <Button className="buttonIter" isSecondary onClick={() => changeIterations(10)}>10</Button>
            <Button className="buttonIter" isSecondary onClick={() => changeIterations(20)}>20</Button>
            <Button className="buttonIter" isSecondary onClick={() => changeIterations(25)}>25</Button>
            <Button className="buttonIter" isSecondary onClick={() => changeIterations(50)}>50</Button>
            <Button className="buttonIter" isSecondary onClick={() => changeIterations(100)}>100</Button>
          </div>
          <div className="section-title">Presets</div><div className="row">
            <Select
              placeholder="Select presets"
              className="select-menu"
              options={presets}
              onChange={selectPresetsHandler} />
          </div>
          <div className="section-title">Position</div>
          <div className="row">
            <IconInput type="number" icon="text" iconLetter="X" id="x" placeholder="px" />
            <IconInput type="number" icon="text" iconLetter="Y" id="y" placeholder="px" />
            <IconInput type="number" icon="angle" id="rotation" placeholder="deg °" />
          </div>
          <div className="section-title">Scale <span>(px)</span><span className="error">{errors.scale}</span></div>
          <div className="row">
            <IconInput type="number" min="0" icon="text" iconLetter="W" id="scaleX" placeholder="Width" />
            <IconInput type="number" min="0" icon="text" iconLetter="H" id="scaleY" placeholder="Height" />
          </div>
          <div className="section-title">Opacity <span>(%)</span> <span className="error">{errors.opacity}</span></div>
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
            <Checkbox
              className="livePreview"
              label="Live preview"
              defaultValue={getState("livePreview")}
              type="switch"
              onChange={() => livePreviewChangeHandler()} />
            {isValidSelection
                ? <button className="button button--primary" id="create" onClick={() => { onCreate(); createClicked = true; } }>Create</button>
                : <button className="button button--primary" disabled>Select a layer</button>
            }
          </div>
          </>
        ) : '' }
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('react-page'))