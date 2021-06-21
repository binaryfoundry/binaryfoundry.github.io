var is_data_channel_open = false;
var message_send_time = performance.now();
var webRTCServer = null;

var timer;
var destFld = null;
var startBtn = null;
var endBtn = null;
var webrtc = null;
var videoSize = null;
var fsMaxBtn;
var fsMinBtn;
var resizeContent;

var isFullScreen = false;
var isInCall = null;

var _rtc = null;

function openFullscreen() {
  var elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

class AntRTC {
    constructor() {
        this.data_channel = null;
        this.dest = 'local:';
        this.rvstream = null;
        this.remoteVideo = null;
        this.preview = null;
        this.calling = false;
        this.mic = false;
        this.cam = false;
        this.mediaConnected = false;
        this.timeoutRunning = false;
        this.iceTimeout = 3000;
        this.peerConnection = null;
        this.httpRequest = null;
        this.localStream = null;
        this.constraints = {
          voiceActivityDetection: false,
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        };
    }

    call() {
        console.info('WebRTC call');
        this.calling = true;
        this.timeoutRunning = false;

        this.peerConnection = new RTCPeerConnection();

        this.peerConnection.onicecandidate = this.onIceCandidate.bind(this);
        this.peerConnection.oniceconnectionstatechange = this.onIceConnectionStateChanged.bind(this);
        this.peerConnection.onicegatheringstatechange = this.onIceGatheringStateChange.bind(this);
        this.peerConnection.ontrack = this.onRemoteTrackAdded.bind(this);
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
            console.debug('WebRTC BW creating offer:', JSON.stringify(this.constraints));
        }

        //data channel should be created before createOffer
        this.CreateDataChannel();

        this.peerConnection
            .createOffer(this.constraints)
            .then(this.onCreateOfferSuccess.bind(this))
            .catch(error => {
                this.doGatewayDisconnect();
                console.error('WebRTC failed to create offer:', error.toString())
            });
        }

    onIceCandidate(evt) {
        console.debug(`BW onIceCandidate ${evt}`);
        if (evt.candidate) {
            if (!this.timeoutRunning) {
                this.timeoutRunning = true;
                const that = this;

                setTimeout(function () {
                    console.debug('dialVSP from timeout '+ that.iceTimeout);
                    that.dialVSP();
                }, that.iceTimeout);
            }
            console.debug('WebRTC onIceCandidate: ' + JSON.stringify(evt.candidate));
            return;
        }
        console.debug('dialVSP from onIceCandidate null');
        this.dialVSP();
    }

    onIceConnectionStateChanged(evt) {
        if (this.peerConnection && this.peerConnection.iceConnectionState) {
            console.info('WebRTC ICE connection state: ' + this.peerConnection.iceConnectionState);

            if (this.peerConnection.iceConnectionState === 'completed' || this.peerConnection.iceConnectionState === 'connected') {
                this.mediaConnected = true;
                mediaConnnected(evt);
                const that = this;
                this.remoteVideo.play();
            }
        }
    }

    onIceGatheringStateChange() {
        if (this.peerConnection && this.peerConnection.iceGatheringState) {
            console.info('WebRTC ICE gathering state: ' + this.peerConnection.iceGatheringState);
        }
    }

    onCreateOfferSuccess(desc) {
        this.peerConnection.setLocalDescription(desc);
        //console.log("Offer sdp" +desc.sdp);
    }

    onRemoteTrackAdded(evt) {
        console.log('onRemoteTrackAdded');
        if (typeof evt.streams === 'undefined' || evt.streams.length === 0) {
            console.warn('WebRTC onRemoteTrackAdded: no streams');
            return;
        }

        const stream = evt.streams[0];
        this.remoteVideo.srcObject = stream;
        this.rvstream=stream;
        console.info(`WebRTC onRemoteTrackAdded attached ${stream.id} to ${this.remoteVideo.id} streams`+ evt.streams.length);
    }

    dialVSP() {
        if (this.calling) {
            this.calling = false;

            webRTCServer = '52-50-227-66.xip.antstream.com';//window.location.host;
            //console.log(webRTCServer);
            //if (!webRTCServer) {
            //    webRTCServer = 'vps-ln-01.trulience.com';
            //}

            let params = new URLSearchParams(window.location.search);
            let dialURL = `https://${webRTCServer}/sdp?destination=${this.dest}&session=${params.get("session")}`;
            this.httpRequest = new XMLHttpRequest();
            this.httpRequest.open('POST', dialURL);
            this.httpRequest.setRequestHeader('Content-Type', 'application/sdp');
            this.httpRequest.onreadystatechange = this.VSPResponse.bind(this);

            if (this.peerConnection && this.peerConnection.localDescription) {
                this.httpRequest.send(this.peerConnection.localDescription.sdp);
                console.log('Sending offer sdp' + this.peerConnection.localDescription.sdp);
            } else {
                console.log("Peer Connection already Closed!");
                this.doGatewayDisconnect();
            }
        }
    }

    VSPResponse() {
        if (this.httpRequest.readyState !== this.httpRequest.DONE) return;

        if (this.httpRequest.status !== 200) {
            console.warn(`WebRTC answer failed: status = ${this.httpRequest.status}`);
            this.doGatewayDisconnect();
            //this.stop();
            return;
        }

        let sdp = this.httpRequest.responseText.replace('42001f', '42e01f');

        sdp = sdp.replace('maxaveragebitrate=510000', 'maxaveragebitrate=48000');

        console.info('WebRTC answer SDP received:' + sdp.length + 'bytes');
        console.debug('WebRTC answer SDP:\n' + sdp);

        this.peerConnection
            .setRemoteDescription({ type: 'answer', sdp: sdp })
            .then(() => {
                console.log('WebRTC answer SDP accepted, media starting');
            })
            .catch(error => {
                console.error('Offer SDP unacceptable:', error.toString());
                this.doGatewayDisconnect();
            });
    }

    doGatewayDisconnect() {
        mediaDisconnected();
    }

    CreateDataChannel() {
        console.info("test data channel started");
        this.data_channel = this.peerConnection.createDataChannel("AntDataChannel");

        this.data_channel.onopen = function (e) {
            console.info("AntDataChannel is open now");
            is_data_channel_open=true;
            message_send_time=performance.now();
        };

        this.data_channel.onerror = function (error) {
            console.info("data channel error: ", error);
        };

        this.data_channel.onmessage = function (e) {
            try {
                var obj = JSON.parse(e.data);
                if (!obj.hasOwnProperty("type")) {
                    throw "Dc Message with Unknown Type";
                }
                console.log(obj);
                if (obj.type === "VIDEO SETUP MESSAGE") {
                    videoSize = obj;
                    resizeContent();
                }
            }
            catch(e) {
                console.log(e);
                throw e;
            }
        };
    }
};

function  connectRTCDirectly(preview, remoteVideo) {
    if (_rtc) {
        console.log('connectRTCDirectly => _rtc not null, so return');
        return;
    }

    console.log('connectRTCDirectly => Instantiate RTC()');

    _rtc = new AntRTC();
    _rtc.preview = preview;
    _rtc.remoteVideo = document.getElementById("remoteVideo");

    console.log('connectRTCDirectly => calling - dialRTC() where webRTC Server = '+this._webRTCServerFromURLParams);

    _rtc.call();
}

if (document.addEventListener) {
    document.addEventListener('fullscreenchange', exitHandler, false);
    document.addEventListener('mozfullscreenchange', exitHandler, false);
    document.addEventListener('MSFullscreenChange', exitHandler, false);
    document.addEventListener('webkitfullscreenchange', exitHandler, false);
}

function exitHandler() {
    if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement !== null) {
        isFullScreen = false;
    }
};

window.onload = function () {
    destFld = document.getElementById("webrtcAddressInputId");
    webRTCServer = document.getElementById("webrtcServerInputId");
    startBtn = document.getElementById("startBtnId");
    endBtn = document.getElementById("stopBtnId");

    fsMaxBtn = document.getElementById("fsMaxBtnId");
    fsMinBtn = document.getElementById("fsMinBtnId");
    resizeContent();
};

window.onunload = function () {
    if (webrtc) {
        webrtc.stop();
    }
};

function destChanged() {
    startBtn.disabled = destFld.value.search(":") < 0;
}

function maximiseScreen() {
    fullscreen();
    isFullScreen = true;
}

function minimiseScreen() {
    fullscreen();
    isFullScreen = false;
}

function fullscreen() {
    var element = document.getElementById("remoteVideo");
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitEnterFullscreen) {
        element.webkitEnterFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else {
        element.classList.toggle("Fullscreen");
    }
}

function mediaConnnected() {
    console.log("MEDIA CONNECTED - SUCCESSFULLY");
    $('#spinner-id').hide();
    isInCall = true;
    //showToast("Call Connected Successfully");
}

function mediaDisconnected() {
    console.log("MEDIA DISCONNECTED!!");
    if (isInCall=== null) {
        showToastError('Call Disconnected');
    }
    resetStatus();
}

function startCall() {
    console.log("startCall---1");
    startBtn.style.display = 'none';
    $('#spinner-id').show();
    document.getElementById("remoteVideo").muted = false;

    connectRTCDirectly();

    isInCall = null;
    timer = window.setTimeout(terminateIfCallNotStarted,12000);
}

function terminateIfCallNotStarted(isTerminatedManually) {
    console.log("terminateIfCallNotStarted ---1---- isInCall = "+isInCall);
    if (isInCall === null) {
        if (_rtc) {
            isInCall = false;
            mediaDisconnected();
            _rtc = null;
        }
        showToastError(isTerminatedManually ? 'Call Terminated' : 'Call Timed out');
    }
    console.log("terminateIfCallNotStarted ---2---- isInCall = "+isInCall);
}

function resetStatus() {
    $('#spinner-id').hide();
    clearTimeout(timer);
    startBtn.style.display = '';
    endBtn.style.display = 'none';
}

function showButtons(event) {
    if (!startBtn) {
        startBtn = document.getElementById("startBtnId");
    }

    if (!endBtn) {
        endBtn = document.getElementById("stopBtnId");
    }

    if (!fsMaxBtn) {
        fsMaxBtn = document.getElementById("fsMaxBtnId");
    }

    if (!fsMinBtn) {
        fsMinBtn = document.getElementById("fsMinBtnId");
    }

    if (_rtc  && isInCall) {
        //endBtn.style.display = '';
    }

    if (isFullScreen) {
        fsMinBtn.style.display = '';
    }
    else {
        fsMaxBtn.style.display = '';
    }
}

function hideButtons(event) {
    if (!startBtn) {
        startBtn = document.getElementById("startBtnId");
    }

    if (!endBtn) {
        endBtn = document.getElementById("stopBtnId");
    }

    if (!fsMaxBtn) {
        fsMaxBtn = document.getElementById("fsMaxBtnId");
    }

    if (!fsMinBtn) {
        fsMinBtn = document.getElementById("fsMinBtnId");
    }

    endBtn.style.display = 'none';
    fsMaxBtn.style.display = 'none';
    fsMinBtn.style.display = 'none';
}

function endCall() {
    startBtn.style.display = '';
    endBtn.style.display = 'none';

    if (_rtc) {
        isInCall = false;
        mediaDisconnected();
        _rtc = null;
    }
    //showToast('Call Ended');
}

function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

window.addEventListener('click', function(e) {
    var allowedIdsArr = ['settings-icon-id', 'webrtcServerInputId', 'webrtcAddressInputId', 'inputGroup-sizing-sm'];
    if (!allowedIdsArr.includes(e.target.id)) {
        $('#collapse1').removeClass('show');
    }
});

function showToast(message) {
    Toastify({
    text: message,
    duration: 5000,
    newWindow: true,
    close: true,
    gravity: "bottom", // `top` or `bottom`
    position: 'right', // `left`, `center` or `right`
    backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
    stopOnFocus: true, // Prevents dismissing of toast on hover
    onClick: function(){} // Callback after click
    }).showToast();
}

function showToastError(message) {
Toastify({
    text: message,
    duration: 5000,
    newWindow: true,
    close: true,
    gravity: "bottom", // `top` or `bottom`
    position: 'right', // `left`, `center` or `right`
    backgroundColor: "linear-gradient(to right, #F7B42C, #FC575E)",
    stopOnFocus: true, // Prevents dismissing of toast on hover
    onClick: function(){} // Callback after click
    }).showToast();
}

resizeContent = function() {
    var videoContent = $("#videoContent");
    var remoteVideo = $('#remoteVideo');
    var startBtn = $('#startBtnId');

    var cw = window.innerWidth;
    var ch = window.innerHeight;
    var ct = videoContent.offset().top;
    var cl = videoContent.offset().left;

    if (videoSize == null) {
        startBtn.removeAttr('hidden');
    }
    else {
        remoteVideo.removeAttr('hidden');
        var ow = remoteVideo[0].videoWidth;
        var oh = remoteVideo[0].videoHeight;

        var aspect = videoSize.aspect;
        if (aspect < 0) aspect = ow / oh;

        var vw, vh;
        if (ch * aspect < cw) {
            vw = Math.round(ch * aspect);
            vh = ch;
        }
        else {
            vw = cw;
            vh = Math.round(cw / aspect);
        }
        remoteVideo.width(vw + "px").height(vh + "px");
        remoteVideo.css('margin-top', + (((ch / 2) - (vh / 2)) - ct) + "px");
        remoteVideo.css('margin-left', + (((cw / 2) - (vw / 2)) - cl) + "px");
    }

    var sw = startBtn.outerWidth();
    var sh = startBtn.outerHeight();
    startBtn.css('margin-top', + (((ch / 2) - (sh / 2)) ) + "px");
    startBtn.css('margin-left', + (((cw / 2) - (sw / 2)) ) + "px");
};

$(window).resize(function() {
    resizeContent();
});

var packet = 0;
var keyState = 0;

document.addEventListener('keydown', function(event) {
    const key = event.key;
    event.preventDefault();
    switch(key) {
        case 'ArrowUp':    keyState |= (1 << 0); break;
        case 'ArrowDown':  keyState |= (1 << 1); break;
        case 'ArrowLeft':  keyState |= (1 << 2); break;
        case 'ArrowRight': keyState |= (1 << 3); break;
        case 'z':          keyState |= (1 << 4); break;
        case 'x':          keyState |= (1 << 5); break;
        case 'c':          keyState |= (1 << 6); break;
        case 'v':          keyState |= (1 << 7); break;
        case 'a':          keyState |= (1 << 8); break;
        case 's':          keyState |= (1 << 9); break;
        case 'd':          keyState |= (1 << 10); break;
        case 'f':          keyState |= (1 << 11); break;
        case 'Enter':
            keyState |= (1 << 13);
            keyState |= (1 << 14);
            break;
        case 'Escape':     keyState |= (1 << 15); break;
    }
});

document.addEventListener('keyup', function(event) {
    const key = event.key;
    event.preventDefault();
    switch(key) {
        case 'ArrowUp':    keyState &= ~(1 << 0); break;
        case 'ArrowDown':  keyState &= ~(1 << 1); break;
        case 'ArrowLeft':  keyState &= ~(1 << 2); break;
        case 'ArrowRight': keyState &= ~(1 << 3); break;
        case 'z':          keyState &= ~(1 << 4); break;
        case 'x':          keyState &= ~(1 << 5); break;
        case 'c':          keyState &= ~(1 << 6); break;
        case 'v':          keyState &= ~(1 << 7); break;
        case 'a':          keyState &= ~(1 << 8); break;
        case 's':          keyState &= ~(1 << 9); break;
        case 'd':          keyState &= ~(1 << 10); break;
        case 'f':          keyState &= ~(1 << 11); break;
        case 'Enter':
            keyState &= ~(1 << 13);
            keyState &= ~(1 << 14);
            break;
        case 'Escape':     keyState &= ~(1 << 15); break;
    }
});

var haveEvents = 'ongamepadconnected' in window;
var controllers = {};

window.addEventListener("gamepadconnected", function(e) {
    controllers[e.gamepad.index] = e.gamepad;
});

window.addEventListener("gamepaddisconnected", function (e) {
    delete controllers[e.gamepad.index];
});

function scangamepads() {
    var gamepads = navigator.getGamepads ?
    navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (gamepads[i].index in controllers) {
                controllers[gamepads[i].index] = gamepads[i];
            } else {
                addgamepad(gamepads[i]);
            }
        }
    }
}

function pollControls() {
    var padState = 0;
    for (j in controllers) {
        var b = controllers[j].buttons;
        b[9].pressed  ? padState |= (1 << 13) : padState &= ~(1 << 13);
        b[12].pressed ? padState |= (1 << 0) : padState &= ~(1 << 0);
        b[13].pressed ? padState |= (1 << 1) : padState &= ~(1 << 1);
        b[14].pressed ? padState |= (1 << 2) : padState &= ~(1 << 2);
        b[15].pressed ? padState |= (1 << 3) : padState &= ~(1 << 3);
        b[2].pressed  ? padState |= (1 << 4) : padState &= ~(1 << 4);
        b[0].pressed  ? padState |= (1 << 5) : padState &= ~(1 << 5);
        b[1].pressed  ? padState |= (1 << 6) : padState &= ~(1 << 6);
    }
    packet = padState | keyState;
    if (window.touchControlState !== undefined) {
        packet |= window.touchControlState;
    }
}

function sendControlsPacket() {
     if (is_data_channel_open) {
        var bytearray = new Uint8Array(8);
        var dv = new DataView(bytearray.buffer);
        dv.setInt32(0, packet, true);

        message_send_time = performance.now();
        this._rtc.data_channel.send(bytearray.buffer);
    }
}

var lastStateChangePacket = 0;
setInterval(function() {
    if (!haveEvents) {
        scangamepads();
    }
    pollControls();
    if (packet != lastStateChangePacket) {
        lastStateChangePacket = packet;
        sendControlsPacket();
    }
}, 4);

function update(timestamp = 0) {
    if (!haveEvents) {
        scangamepads();
    }

    try { resizeContent(); } catch(e) {};
    pollControls();
    sendControlsPacket();
    window.requestAnimationFrame(update);
}

update();