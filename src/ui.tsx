import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { rgbToHex, hexToRgb, validHex } from './utils'
import * as presetsConfig from "./presetsConfig.json";
import { Select, Button, Checkbox } from 'react-figma-plugin-ds';
import './lib/figma-plugin-ds.css'
import './ui.css'

// Config
let timeout = null;
const colorInputIds = ['fillColor', 'fillColorEnd', 'strokeColor', 'strokeColorEnd']
const opacityInputIds = ['opacity', 'opacityEnd']
const noErrors = { iterations: '', opacity: '', scale: '', strokeWeight: '' }
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
  colorFilled: false,
  fillColor: {
    color: {
        r: 0,
        g: 0,
        b: 0
    },
    opacity: 1
  },
  fillColorEnd: {
    color: {
        r: 0,
        g: 0,
        b: 0
    },
    opacity: 1
  },
  strokeFilled: false,
  strokeColor: {
    color: {
        r: 0,
        g: 0,
        b: 0
    },
    opacity: 1
  },
  strokeColorEnd: {
    color: {
        r: 0,
        g: 0,
        b: 0
    },
    opacity: 1
  },
  strokeWeight: null,
  strokeWeightEnd: null
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
      try {
        setConfigState(message.config)
        setLoading(true)
      } catch(e) {
        setConfigState(defaultConfig)
        console.log('Loaded defaultConfig')
        setLoading(true)
      }
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
    const { iterations, opacity, opacityEnd, scaleX, scaleY, strokeWeight, strokeWeightEnd } = configState

    if (iterations < 1 || iterations > 1000) {
      currentErrors.iterations = 'Between 1 and 1000'
    }

    if (opacity > 1 || opacity < 0 || opacityEnd > 1 || opacityEnd < 0 || opacity > 100 || opacityEnd > 100 ) {
      currentErrors.opacity = 'Between 0 and 100'
    }

    if ((scaleX && scaleX < 0.01) || (scaleY && scaleY < 0.01)) {
      currentErrors.scale = 'ScaleX or ScaleY should be >= 0.01'
    }
    
    if ((strokeWeight && strokeWeight < 0) || (strokeWeightEnd && strokeWeightEnd < 0)) {
      currentErrors.strokeWeight = 'Stroke weight should be >= 0'
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
    //console.log(id + ",  " + value)
    if (value === '') {
      newConfig[id] = null
    } else if (opacityInputIds.includes(id)) {
      newConfig[id] = value / 100
    } else if (colorInputIds.includes(id)) {
      newConfig[id] = { color: hexToRgb(value.replace("#", "")), opacity: 1 }
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
      } else if (configValue === undefined) {
        configState[id] = defaultConfig[id]
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

  const ColorInput = ({ id }) => {
    let oldValue = null;
    const inputTypeColor = React.useRef()
    const inputTypeColorText = React.useRef()
    return (
      <div className="inline-flex">
        <input
          id={id}
          type="color"
          key={id}
          className="input__field input--color"
          defaultValue={"#" + getState(id)}
          ref={inputTypeColor}
          onChange={ ({ target }) => {
              let iE = inputTypeColorText.current as HTMLInputElement
              iE.value = target.value.replace("#", "")?.toUpperCase()
              clearTimeout(timeout)
              timeout = setTimeout(() => {
                setConfigValue({ id, value: target.value }) 
              }, 500)
            } 
          }
        />
        <input
          id={id}
          type="text"
          key={id+"inputfield"}
          className="input__field input--color--field"
          ref={inputTypeColorText}
          defaultValue={getState(id)?.toUpperCase()}
          onFocus={ (event) => {
              oldValue = event.target.value
              event.target.select()
            }
          }
          onBlur={ (event) => {
              let eventTarget = event.target as HTMLInputElement
              let iE = inputTypeColor.current as HTMLInputElement
              if (validHex.test(eventTarget.value)) {
                  iE.value = "#" + eventTarget.value
                  setConfigValue({ id, value: eventTarget.value })
              } else {
                eventTarget.value = oldValue
              }
            }
          }
          onKeyPress={ (event) => {
            let eventTarget = event.target as HTMLInputElement
            if (event.key === "Enter") {
                eventTarget.blur()
            }
          } 
        }
        />
      </div>
    )
  }

  const selectPresetsHandler = async (option) => {
    let currentState = configState
    let selectedPreset = await presetsConfig.presets.find(el => el.value === option.value)
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
  
  const colorFilledChangeHandler = () => {
    let currentState = {...configState}
    setConfigState({...currentState, colorFilled: !currentState.colorFilled});
  }

  const strokeFilledChangeHandler = () => {
    let currentState = {...configState}
    setConfigState({...currentState, strokeFilled: !currentState.strokeFilled});
  }
  
  // Render the UI
  return (
    <>
      {loading ? (
        <>
          <div className="section-title">Iterations <span className="error">{errors.iterations}</span></div>
          <IconInput type="number" min="1" icon="layout-grid-uniform" id="iterations" placeholder="Iterations" />
          <div className="iterCont flex justify-content-between align-items-center mt-xxxsmall mb-xxxsmall ml-xxxsmall mr-xxxsmall">
            <div className="flex horizontally-scrolled-items ">
              <Button className="buttonIter" isSecondary onClick={(event) => {event.target.scrollIntoView({ inline: 'center'}); changeIterations(10);}}>10</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {event.target.scrollIntoView({ inline: 'center'}); changeIterations(15);}}>15</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(20); event.target.scrollIntoView({ inline: 'center'})}}>20</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(25); event.target.scrollIntoView({ inline: 'center'})}}>25</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(30); event.target.scrollIntoView({ inline: 'center'})}}>30</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(35); event.target.scrollIntoView({ inline: 'center'})}}>35</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(40); event.target.scrollIntoView({ inline: 'center'})}}>40</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => { event.target.scrollIntoView({inline: 'center'}); changeIterations(50);}}>50</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(80); event.target.scrollIntoView({ inline: 'center'})}}>80</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(100); event.target.scrollIntoView({ inline: 'center'})}}>100</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(120); event.target.scrollIntoView({ inline: 'center'})}}>120</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(150); event.target.scrollIntoView({ inline: 'center'})}}>150</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(150); event.target.scrollIntoView({ inline: 'center'})}}>180</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(200); event.target.scrollIntoView({ inline: 'center'})}}>200</Button>
              <Button className="buttonIter" isSecondary onClick={(event) => {changeIterations(250); event.target.scrollIntoView({ inline: 'center'})}}>250</Button>
            </div>
            <div id="overlayContainer"></div>
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
          <div className="section-title">
            Fill <span>(HEX)</span>
          </div>
          <div className="row"> 
            <div className="checkbox">
              <input id="colorFilled" type="checkbox" className="checkbox__box" checked={getState("colorFilled")} onChange={() => colorFilledChangeHandler()} />
              <label htmlFor="colorFilled" className="checkbox__label">Fill with</label>
            </div>
            <ColorInput id="fillColor" />
            <ColorInput id="fillColorEnd" /> 
          </div>
          <div className="section-title">Stroke <span>(HEX / px)</span><span className="error">{errors.strokeWeight}</span></div>
          <div className="row">
            <div className="checkbox">
              <input id="strokeFilled" type="checkbox" className="checkbox__box" checked={getState("strokeFilled")} onChange={() => strokeFilledChangeHandler()} />
              <label htmlFor="strokeFilled" className="checkbox__label">Fill with</label>
            </div>
            <ColorInput id="strokeColor" />
            <ColorInput id="strokeColorEnd" />
          </div>
          <div className="row mt-xxxsmall">
            <IconInput type="number" min="0" max="1000" icon="stroke-weight" id="strokeWeight" placeholder="Start Weight" />
            <IconInput type="number" min="0" max="1000" icon="stroke-weight" id="strokeWeightEnd" placeholder="End Weight" />
          </div>
          <div className="buttons mt-xsmall">
            <Checkbox
              className="livePreview"
              label="Auto update"
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