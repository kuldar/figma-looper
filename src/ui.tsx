import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { rgbToHex, hexToRgb } from './utils'
import './lib/figma-plugin-ds.css'
import './lib/figma-plugin-ds.min'
import './ui.css'

import { Select } from 'react-figma-plugin-ds';

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
  const onDelete = () => parent.postMessage({ pluginMessage: { type: 'delete' }}, '*')

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

  const selectPresetsHandler = (option) => {
    
    let currentState = {...configState}

    switch(option.value) {
      case 'default': setConfigState(defaultConfig); break;
      case 'rotate_opacity': setConfigState({
        iterations: currentState.iterations,
        x: null,
        y: null,
        rotation: 5,
        scaleX: null,
        scaleY: null,
        opacity: 1,
        opacityEnd: 0,
        fillColor: null,
        fillColorEnd: null,
        strokeColor: null,
        strokeColorEnd: null,
        strokeWeight: null,
        strokeWeightEnd: null,
      }); break; 
      case 'rotate_scale_opacity': setConfigState({
        iterations: currentState.iterations,
        x: null,
        y: null,
        rotation: 5,
        scaleX: 5,
        scaleY: 5,
        opacity: 1,
        opacityEnd: 0,
        fillColor: null,
        fillColorEnd: null,
        strokeColor: null,
        strokeColorEnd: null,
        strokeWeight: null,
        strokeWeightEnd: null,
      }); break;
      case 'rotate_scale_move_x_opacity': setConfigState({
        iterations: currentState.iterations,
        x: 5,
        y: null,
        rotation: 5,
        scaleX: 5,
        scaleY: 5,
        opacity: 1,
        opacityEnd: 0,
        fillColor: null,
        fillColorEnd: null,
        strokeColor: null,
        strokeColorEnd: null,
        strokeWeight: null,
        strokeWeightEnd: null,
      }); break;
      case 'rotate_scale_move_y_opacity': 
        setConfigState({
          iterations: currentState.iterations,
          x: null,
          y: 5,
          rotation: 5,
          scaleX: 5,
          scaleY: 5,
          opacity: 1,
          opacityEnd: 0,
          fillColor: null,
          fillColorEnd: null,
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;
        case 'rotate_scale_move_x_y_opacity': 
        setConfigState({
          iterations: currentState.iterations,
          x: 5,
          y: 5,
          rotation: 5,
          scaleX: 5,
          scaleY: 5,
          opacity: 1,
          opacityEnd: 0,
          fillColor: null,
          fillColorEnd: null,
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;
        case 'scale_move_x_opacity': 
        setConfigState({
          iterations: currentState.iterations,
          x: 5,
          y: null,
          rotation: null,
          scaleX: 5,
          scaleY: 5,
          opacity: 1,
          opacityEnd: 0,
          fillColor: null,
          fillColorEnd: null,
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;
        case 'scale_move_y_opacity': 
        setConfigState({
          iterations: currentState.iterations,
          x: null,
          y: 5,
          rotation: null,
          scaleX: 5,
          scaleY: 5,
          opacity: 1,
          opacityEnd: 0,
          fillColor: null,
          fillColorEnd: null,
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;
        case 'scale_move_x_y_opacity': 
        setConfigState({
          iterations: currentState.iterations,
          x: 5,
          y: 5,
          rotation: null,
          scaleX: 5,
          scaleY: 5,
          opacity: 1,
          opacityEnd: 0,
          fillColor: null,
          fillColorEnd: null,
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;
        case 'color_000_fff_opacity': 
        setConfigState({
          iterations: currentState.iterations,
          x: null,
          y: null,
          rotation: null,
          scaleX: null,
          scaleY: null,
          opacity: 1,
          opacityEnd: 0,
          fillColor: { color: hexToRgb("000000"), opacity: 1 },
          fillColorEnd: { color: hexToRgb("FFFFFF"), opacity: 1 },
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;
        case 'color_2F80ED_9B51E0_opacity': 
        setConfigState({
          iterations: currentState.iterations,
          x: null,
          y: null,
          rotation: null,
          scaleX: null,
          scaleY: null,
          opacity: 1,
          opacityEnd: 0,
          fillColor: { color: hexToRgb("2F80ED"), opacity: 1 },
          fillColorEnd: { color: hexToRgb("9B51E0"), opacity: 1 },
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;
        case 'activate_all': 
        setConfigState({
          iterations: currentState.iterations,
          x: 5,
          y: 5,
          rotation: 5,
          scaleX: 5,
          scaleY: 5,
          opacity: 1,
          opacityEnd: 0,
          fillColor: { color: hexToRgb("000000"), opacity: 1 },
          fillColorEnd: { color: hexToRgb("FFFFFF"), opacity: 1 },
          strokeColor: { color: hexToRgb("000000"), opacity: 1 },
          strokeColorEnd: { color: hexToRgb("FFFFFF"), opacity: 1 },
          strokeWeight: 1,
          strokeWeightEnd: 5,
        }); break;
        case 'move_x': 
        setConfigState({
          iterations: currentState.iterations,
          x: 5,
          y: null,
          rotation: null,
          scaleX: null,
          scaleY: null,
          opacity: 1,
          opacityEnd: 1,
          fillColor: null,
          fillColorEnd: null,
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break; 
        case 'move_y': 
        setConfigState({
          iterations: currentState.iterations,
          x: null,
          y: 5,
          rotation: null,
          scaleX: null,
          scaleY: null,
          opacity: 1,
          opacityEnd: 1,
          fillColor: null,
          fillColorEnd: null,
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;
        case 'move_x_y_opacity': 
        setConfigState({
          iterations: currentState.iterations,
          x: 5,
          y: 5,
          rotation: null,
          scaleX: null,
          scaleY: null,
          opacity: 1,
          opacityEnd: 0,
          fillColor: null,
          fillColorEnd: null,
          strokeColor: null,
          strokeColorEnd: null,
          strokeWeight: null,
          strokeWeightEnd: null,
        }); break;

    }
  }

  // Render the UI
  return (
    <div>
      <div className="section-title">Iterations <span className="error">{ errors.iterations }</span></div>
      <IconInput type="number" min="1" icon="layout-grid-uniform" id="iterations" placeholder="Iterations" />
      <div className="section-title">Presets</div>
      <div className="row">
      <Select
          placeholder="Select presets"
          className="select-menu-icon__input icon icon--delete"
          options={[
            {
              divider: false,
              label: 'Reset to default',
              value: 'default'
            },
            {
              divider: false,
              label: 'Rotate + Opacity (100 to 0)',
              value: 'rotate_opacity'
            },
            {
              divider: false,
              label: 'Rotate + Scale + Opacity (100 to 0)',
              value: 'rotate_scale_opacity'
            },
            {
              divider: false,
              label: 'Rotate + Scale + Move X + Opacity',
              value: 'rotate_scale_move_x_opacity'
            },
            {
              divider: false,
              label: 'Rotate + Scale + Move Y + Opacity',
              value: 'rotate_scale_move_y_opacity'
            },
            {
              divider: false,
              label: 'Rotate + Scale + Move X/Y + Opacity',
              value: 'rotate_scale_move_x_y_opacity'
            },
            {
              divider: true,
              label: 'divider',
              value: -1
            },
            {
              divider: false,
              label: 'Scale + Move X + Opacity',
              value: 'scale_move_x_opacity'
            },
            {
              divider: false,
              label: 'Scale + Move Y + Opacity',
              value: 'scale_move_y_opacity'
            },
            {
              divider: false,
              label: 'Scale + Move X/Y + Opacity',
              value: 'scale_move_x_y_opacity'
            },
            {
              divider: true,
              label: 'divider',
              value: -1
            },
            {
              divider: false,
              label: 'Move X',
              value: 'move_x'
            }, 
            {
              divider: false,
              label: 'Move Y',
              value: 'move_y'
            },
            {
              divider: false,
              label: 'Move X/Y + Opacity (100 to 0)',
              value: 'move_x_y_opacity'
            },
            {
              divider: true,
              label: 'divider',
              value: -1
            },
            {
              divider: false,
              label: 'Color #000 to #FFF + Opacity ',
              value: 'color_000_fff_opacity'
            },
            {
              divider: false,
              label: 'Color #2F80ED to #9B51E0 + Opacity ',
              value: 'color_2F80ED_9B51E0_opacity'
            },
            {
              divider: true,
              label: 'divider',
              value: -1
            },
            {
              divider: false,
              label: 'Activate all',
              value: 'activate_all'
            },
          ]}
          onChange={selectPresetsHandler}
        />
      </div>
      <div className="section-title">Position 
      </div>
      <div className="row">
        <IconInput type="number" min="0" icon="text" iconLetter="X" id="x" placeholder="px" />
        <IconInput type="number" min="0" icon="text" iconLetter="Y" id="y" placeholder="px" />
        <IconInput type="number" icon="angle" id="rotation" placeholder="deg °" />
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
        <div className="icon icon--trash icon--button" title="Delete latest creation" onClick={onDelete}></div>
        { isValidSelection
          ? <button className="button button--primary" id="create" onClick={onCreate}>Create</button>
          : <button className="button button--primary " disabled>Select a layer</button>
        }
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('react-page'))