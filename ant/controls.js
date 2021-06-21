window.getDevicePixelRatio = function () {
    if (window.screen.systemXDPI !== undefined &&
      window.screen.logicalXDPI !== undefined &&
      window.screen.systemXDPI > window.screen.logicalXDPI) {
        return window.screen.systemXDPI / window.screen.logicalXDPI;
    }
    else if (window.devicePixelRatio !== undefined) {
        return window.devicePixelRatio;
    }
    return 1;
};

window.mobileAndTabletCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

function initControls() {
  if (!window.mobileAndTabletCheck()) {
    return;
  }

  const canvas = document.getElementById("controlsCanvas");
  const context = canvas.getContext("2d");

  const marginSize = 18;

  const buttonSize = 7;
  const buttonBorderSize = 2;
  const buttonTouchSize = 9;

  var btn0 = { id: 2, color: 'blue', touchId: null };
  var btn1 = { id: 1, color: 'green', touchId: null };
  var btn2 = { id: 0, color: 'red', touchId: null };
  var btnStart = { id: 9, color: 'red', touchId: null };
  var buttons = [btn0, btn1, btn2, btnStart];

  var joyTouchId = null;
  var joyStart = null;
  var joyPosition = {};
  const joyThrowUnits = 10;
  const joyStickSize = buttonSize * 1.5;
  const joyStickColor = 'red';
  const joyThrowActivateMarginPercent = 75;

  var touchControlState = 0;
  var touches = {};

  function controlsReposition() {
    const pixelRatio = window.getDevicePixelRatio();
    const canvasWidth = canvas.width = window.innerWidth - 1;
    const canvasHeight = canvas.height = window.innerHeight - 1;

    const margin = marginSize * pixelRatio;

    btn0.x = canvasWidth - margin;
    btn0.y = canvasHeight - margin;

    btn1.x = btn0.x - margin;
    btn1.y = canvasHeight - margin;

    btn2.x = btn1.x - margin;
    btn2.y = canvasHeight - margin;

    btnStart.x = canvasWidth - margin;
    btnStart.y = margin;
  }

  function controlsUpdate() {
    const pixelRatio = window.getDevicePixelRatio();

    touchControlState = 0;

    // Handle joystick logic
    if (joyTouchId != null) {
      const px = touches[joyTouchId].pageX;
      const py = touches[joyTouchId].pageY;
      const sx = joyStart.pageX;
      const sy = joyStart.pageY;
      const dx = px - sx;
      const dy = py - sy;
      const dd = dx * dx + dy * dy;

      joyPosition.x = px;
      joyPosition.y = py;

      if (dd > 0.1) {
        const tu = joyThrowUnits * pixelRatio;
        const au = tu * (joyThrowActivateMarginPercent / 100.0);
        const d = Math.sqrt(dd);
        const nx = dx / d;
        const ny = dy / d;
        // Constrain position
        if (d > tu) {
          const ud = d - tu;
          joyPosition.x -= nx * ud;
          joyPosition.y -= ny * ud;
        }
        // Check if direction is pressed
        if (d > au) {
          if (ny < -0.5) touchControlState |= (1 << 0);
          if (ny >  0.5) touchControlState |= (1 << 1);
          if (nx < -0.5) touchControlState |= (1 << 2);
          if (nx >  0.5) touchControlState |= (1 << 3);
        }
      }
    }

    // Handle button logic
    for (const button of buttons) {
      if (button.touchId != null) {
        touchControlState |= (1 << (4 + button.id));
        // Hack start + coin
        if (button.id == 9) {
          touchControlState |= (1 << 15);
          touchControlState |= (1 << 14);
        }
      }
    }

    window.touchControlState = touchControlState;
  }

  function touchCopy({ identifier, pageX, pageY }) {
    return { identifier, pageX, pageY };
  }

  function touchById(idToFind) {
    if (touches.hasOwnProperty(idToFind)) {
      return touches[idToFind];
    }
    return null;
  }

  function touchUpdate(t, begin) {
    controlsReposition();
    const pixelRatio = window.getDevicePixelRatio();
    const normX = t.pageX / window.innerWidth;

    // Detect if touch was for joystick
    if (joyTouchId == null) {
      if (normX < 0.5 && begin) {
        joyTouchId = t.identifier;
        joyStart = touchCopy(t);
      }
    }
    else if (joyTouchId != null) {
      if (!touches.hasOwnProperty(joyTouchId)) {
        joyTouchId = null;
        joyStart = null;
      }
    }

    // Check if touch was for button
    for (const button of buttons) {
      if (button.touchId == null && begin && touches.hasOwnProperty(t.identifier)) {
        const px = touches[t.identifier].pageX;
        const py = touches[t.identifier].pageY;
        const sx = button.x;
        const sy = button.y;
        const dx = px - sx;
        const dy = py - sy;
        const dd = dx * dx + dy * dy;
        const ts = buttonTouchSize * pixelRatio;
        if (dd < ts * ts) {
          button.touchId = t.identifier;
        }
      }
      else if (button.touchId != null) {
        if (!touches.hasOwnProperty(button.touchId)) {
          button.touchId = null;
        }
      }
    }

    controlsUpdate();
  }

  function handleTouchStart(e) {
    e.preventDefault();
    const changedTouches = e.changedTouches;
    for (var i = 0; i < changedTouches.length; i++) {
      const t = changedTouches[i];
      touches[t.identifier] = touchCopy(t);
      touchUpdate(t, true);
    }
    //console.log(JSON.stringify(touches));
  }

  function handleTouchMove(e) {
    e.preventDefault();
    const changedTouches = e.changedTouches;
    for (var i = 0; i < changedTouches.length; i++) {
      const existingTouch = touchById(changedTouches[i].identifier);
      if (existingTouch != null) {
        const t = changedTouches[i];
        touches[t.identifier] = touchCopy(t);
        touchUpdate(t, false);
      }
    }
    //console.log(JSON.stringify(touches));
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    const changedTouches = e.changedTouches;
    for (var i = 0; i < changedTouches.length; i++) {
      const t = changedTouches[i];
      const existingTouch = touchById(t.identifier);
      if (existingTouch != null) {
        delete touches[t.identifier];
        touchUpdate(t, false);
      }
    }
    //console.log(JSON.stringify(touches));
  }

  function handleTouchCancel(e) {
    e.preventDefault();
    const changedTouches = e.changedTouches;
    for (var i = 0; i < changedTouches.length; i++) {
      const t = changedTouches[i];
      const existingTouch = touchById(t.identifier);
      if (existingTouch != null) {
        delete touches[t.identifier];
        touchUpdate(t, false);
      }
    }
    //console.log(JSON.stringify(touches));
  }

  canvas.addEventListener("touchstart", handleTouchStart, false);
  canvas.addEventListener("touchend", handleTouchEnd, false);
  canvas.addEventListener("touchcancel", handleTouchCancel, false);
  canvas.addEventListener("touchmove", handleTouchMove, false);

  function drawButton(color, size, x, y) {
    const pixelRatio = window.getDevicePixelRatio();
    const radius = size * pixelRatio;

    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.lineWidth = buttonBorderSize * pixelRatio;
    context.strokeStyle = 'black';
    context.stroke();
  }

  function controlsRender() {
    controlsReposition();
    controlsUpdate();

    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const btn of buttons) {
        const size = buttonSize * (btn.touchId != null ? 1.1 : 1);
        drawButton(btn.color, size, btn.x, btn.y);
    }

    if (joyTouchId != null) {
      drawButton(joyStickColor, joyStickSize, joyPosition.x, joyPosition.y);
    }
  }

  window.addEventListener('resize', controlsRender, false);

  function update(timestamp = 0) {
    controlsRender();
    window.requestAnimationFrame(update);
  }

  update();
};
