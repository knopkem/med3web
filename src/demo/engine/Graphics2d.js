/**
 * @fileOverview Graphics2d
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';
import { connect } from 'react-redux';

import Modes2d from '../store/Modes2d';
import ToolPick from './tools2d//ToolPick';
import ToolZoom from './tools2d//ToolZoom';
import Tools2dType from './tools2d/ToolTypes';

// import { timingSafeEqual } from 'crypto';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class Graphics2d some text later...
 */
class Graphics2d extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.m_sliceRatio = 0.5;
    this.m_mode2d = Modes2d.TRANSVERSE;

    // scale
    this.m_zoom = 1;
    this.m_xPos = 0;
    this.m_yPos = 0;

    // animation
    this.animate = this.animate.bind(this);
    this.m_frameId = null;
    // actual render window dimenison
    this.state = {
      wRender: 0,
      hRender: 0,
      stateMouseDown: false,
      xMouse: -1,
      yMouse: -1,
    };

    // tools2d
    this.m_toolPick = new ToolPick(this);
    this.m_toolZoom = new ToolZoom(this);
  }
  start() {
    if (this.m_frameId === null) {
      this.m_frameId = requestAnimationFrame(this.animate);
    }
  }
  stop() {
    cancelAnimationFrame(this.m_frameId);
    this.m_frameId = null;
  }
  animate() {
    // this.renderScene();
    // this.m_frameId = window.requestAnimationFrame(this.animate);
  }
  componentDidMount() {
    // this.start();
    this.renderScene();
    // detect actual render window dims
    const w = this.m_mount.clientWidth;
    const h = this.m_mount.clientHeight;
    if (this.state.wRender === 0) {
      this.setState({ wRender: w });
      this.setState({ hRender: h });

      // tools 2d setup
      const vol = this.props.volume;
      console.log(`gra2d. vol = ${vol}`);
      this.m_toolPick.setScreenDim(w, h);
      this.m_toolPick.setVolume(vol);
      this.m_toolZoom.setScreenDim(w, h);
      this.m_toolZoom.setVolume(vol);
    }
  }
  componentWillUnmount() {
    // this.stop()
  }
  componentDidUpdate() {
    this.renderScene();
  }
  renderScene() {
    const objCanvas = this.m_mount;
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.getContext('2d');
    const w = objCanvas.clientWidth;
    const h = objCanvas.clientHeight;
    if (w * h === 0) {
      return;
    }
    ctx.fillStyle = 'rgb(240, 240, 240)';
    ctx.fillRect(0,0, w, h);
    // console.log(`render scene 2d. screen = ${w} * ${h}`);

    // Test draw chessboard
    const NEED_TEST_RAINBOW = false;
    if (NEED_TEST_RAINBOW) {
      const wImg = 800;
      const hImg = 600;
      const imgData = ctx.createImageData(wImg, hImg);
      const dataDst = imgData.data;
      let j = 0;
      for (let y = 0; y < hImg; y++) {
        for (let x = 0; x < wImg; x++) {
          dataDst[j + 0] = Math.floor(255 * x / wImg);
          dataDst[j + 1] = Math.floor(255 * y / hImg);
          dataDst[j + 2] = 120;
          dataDst[j + 3] = 255;
          j += 4;
        } // for (x)
      } // for (y)
      ctx.putImageData(imgData, 0, 0); 
    }

    const store = this.props;
    const vol = store.volume;
    const mode2d = store.mode2d;
    const sliceRatio = store.slider2d;


    if (vol !== null) {
      if (vol.m_dataArray === null) {
        console.log('Graphics2d. Volume has no data array');
        return;
      }
      const xDim = vol.m_xDim;
      const yDim = vol.m_yDim;
      const zDim = vol.m_zDim;
      const xyDim = xDim * yDim;
      const dataSrc = vol.m_dataArray; // 8 byte array
      if (dataSrc.length !== xDim * yDim * zDim) {
        console.log(`Bad src data len = ${dataSrc.length}, but expect ${xDim}*${yDim}*${zDim}`);
      }

      // console.log(`Graphics2d. mode=${this.m_mode2d} slice src=${xDim}*${yDim}*${zDim} into ${w}*${h}`);

      const imgData = ctx.createImageData(w, h);
      const dataDst = imgData.data;
      if (dataDst.length !== w * h * 4) {
        console.log(`Bad dst data len = ${dataDst.length}, but expect ${w}*${h}*4`);
      }

      const xPos = store.render2dxPos;
      const yPos = store.render2dyPos;
      const zoom = store.render2dZoom;
      // console.log(`Gra2d. RenderScene. zoom=${zoom}, xyPos=${xPos}, ${yPos}`);
      if (mode2d === Modes2d.TRANSVERSE) {
        // z slice
        const zSlice = Math.floor(zDim * sliceRatio);
        const zOff = zSlice * xyDim;
        const xStep = zoom * xDim / w
        const yStep = zoom * yDim / h;
        let j = 0;
        let ay = yPos * yDim;
        for (let y = 0; y < h; y++, ay += yStep) {
          const ySrc = Math.floor(ay);
          const yOff = ySrc * xDim;
          let ax = xPos * xDim;
          for (let x = 0; x < w; x++, ax += xStep) {
            const xSrc = Math.floor(ax);
            const val = dataSrc[zOff + yOff + xSrc];

            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } else if (mode2d === Modes2d.SAGGITAL) {
        // x slice
        const xSlice = Math.floor(xDim * sliceRatio);

        const yStep = yDim / w
        const zStep = zDim / h;
        let j = 0;
        let az = 0.0;
        for (let y = 0; y < h; y++, az += zStep) {
          const zSrc = Math.floor(az);
          const zOff = zSrc * xDim * yDim;
          let ay = 0.0;
          for (let x = 0; x < w; x++, ay += yStep) {
            const ySrc = Math.floor(ay);
            const yOff = ySrc * xDim;
            const val = dataSrc[zOff + yOff + xSlice];

            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      } else if (mode2d === Modes2d.CORONAL) {
        // y slice
        const ySlice = Math.floor(yDim * sliceRatio);
        const yOff = ySlice * xDim;

        const xStep = xDim / w
        const zStep = zDim / h;
        let j = 0;
        let az = 0.0;
        for (let y = 0; y < h; y++, az += zStep) {
          const zSrc = Math.floor(az);
          const zOff = zSrc * xDim * yDim;
          let ax = 0.0;
          for (let x = 0; x < w; x++, ax += xStep) {
            const xSrc = Math.floor(ax);
            const val = dataSrc[zOff + yOff + xSrc];

            dataDst[j + 0] = val;
            dataDst[j + 1] = val;
            dataDst[j + 2] = val;
            dataDst[j + 3] = 255; // opacity

            j += 4;
          } // for (x)
        } // for (y)
      }

      ctx.putImageData(imgData, 0, 0); 
      // render all tools
      this.m_toolPick.render(ctx);

    } // if not empty vol
  } // render scene
  onMouseWheel(evt) {
    const store = this.props;
    const indexTools2d = store.indexTools2d;
    if (indexTools2d === Tools2dType.ZOOM) {
      this.m_toolZoom.onMouseWheel(store, evt);
    }
  }
  onMouseUp(evt) {
    const store = this.props;
    const indexTools2d = store.indexTools2d;
    if (indexTools2d === Tools2dType.ZOOM) {
      this.m_toolZoom.onMouseUp();
    }
  }
  onMouseMove(evt) {
    const store = this.props;
    const indexTools2d = store.indexTools2d;
    const box = this.m_mount.getBoundingClientRect();
    const xContainer = evt.clientX - box.left;
    const yContainer = evt.clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;

    if (indexTools2d === Tools2dType.ZOOM) {
      this.m_toolZoom.onMouseMove(store, xScr, yScr);
    }
  }
  onMouseDown(evt) {
    const box = this.m_mount.getBoundingClientRect();
    const xContainer = evt.clientX - box.left;
    const yContainer = evt.clientY - box.top;
    const xScr = xContainer;
    const yScr = yContainer;
    // console.log(`onMouseDown. down = ${xScr}, ${yScr}`);

    const store = this.props;
    const indexTools2d = store.indexTools2d;
    // console.log(`onMouseDown. tool index = ${indexTools2d}`);

    const mode2d = store.mode2d;
    const sliceRatio = store.slider2d;

    switch (indexTools2d) {
    case Tools2dType.INTENSITY:
      this.m_toolPick.onMouseDown(xScr, yScr, mode2d, sliceRatio, this.m_zoom, this.m_xPos, this.m_yPos);
      break;
    case Tools2dType.ZOOM:
      this.m_toolZoom.onMouseDown(xScr, yScr);
      break;
    default:
      // not defined
    } // switch
    // force update
    this.forceUpdate();
  } // onMouseDown
  forceUpdate() {
    this.setState({ state: this.state });
  }
  /**
   * Main component render func callback
   */
  render() {
    const vol = this.props.volume;
    if (vol !== null) {
      this.m_vol = vol;
    }
    this.m_sliceRatio = this.props.sliderValue;
    this.m_mode2d = this.props.mode2d;

    const styleObj = {
      width: '100%',
      height: '100%',
    };

    const jsxGrapNonSized = <canvas ref={ (mount) => {this.m_mount = mount} } style={styleObj} />
    const jsxGrapSized = <canvas ref={ (mount) => {this.m_mount = mount} } width={this.state.wRender} height={this.state.hRender}
      onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} onWheel={this.onMouseWheel} />
    const jsx = (this.state.wRender > 0) ? jsxGrapSized : jsxGrapNonSized;
    return jsx;
  }
}

export default connect(store => store)(Graphics2d);
