const SHADER_DURATION_MS = 6000;
const RHYTHM_LEAD_MS = 44;
const DEFAULT_MODULATION_BOOST = 0.25;
const ADAPTIVE_RENDER_SCALE_MIN = 0.62;
const ADAPTIVE_RENDER_SCALE_MAX = 1.0;
const ADAPTIVE_RENDER_STEP_DOWN = 0.08;
const ADAPTIVE_RENDER_STEP_UP = 0.04;
const ADAPTIVE_RENDER_HIGH_MS = 26.0;
const ADAPTIVE_RENDER_LOW_MS = 15.4;
const ADAPTIVE_RENDER_COOLDOWN_MS = 650;

const canvas = document.getElementById("gl");
const titleEl = document.getElementById("shaderTitle");
const indexEl = document.getElementById("shaderIndex");
const linkEl = document.getElementById("shaderLink");
const uiDockEl = document.getElementById("uiDock");
const dockToggleBtn = document.getElementById("dockToggleBtn");
const modBoostSliderEl = document.getElementById("modBoostSlider");
const modBoostValueEl = document.getElementById("modBoostValue");
const timerBarEl = document.getElementById("timerBar");
const errorBoxEl = document.getElementById("errorBox");
const pauseBtn = document.getElementById("pauseBtn");
const nextBtn = document.getElementById("nextBtn");
const audioMicBtn = document.getElementById("audioMicBtn");
const audioFileBtn = document.getElementById("audioFileBtn");
const audioStopBtn = document.getElementById("audioStopBtn");
const audioFileInput = document.getElementById("audioFileInput");
const audioStatusEl = document.getElementById("audioStatus");
const audioBpmEl = document.getElementById("audioBpm");
const audioLevelsEl = document.getElementById("audioLevels");
const audioPulseDotEl = document.getElementById("audioPulseDot");
const spectrumEl = document.getElementById("spectrum");
const audioVizCanvas = document.getElementById("audioViz");

const glContextOptions = { antialias: false, preserveDrawingBuffer: false };
const gl2 = canvas.getContext("webgl2", glContextOptions);
const gl = gl2 || canvas.getContext("webgl", glContextOptions);
const isWebGL2 = !!gl2;
if (!gl) {
  throw new Error("WebGL is not available in this browser.");
}

const vertSrc = isWebGL2
  ? `#version 300 es
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`
  : `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const snippets = [];
let current = null;
let currentProgram = null;
let attribPos = -1;
let locRes = null;
let locTime = null;
let locTimeDelta = null;
let locFrame = null;
let locMouse = null;
let locDate = null;
let locFrameRate = null;
let locAudioLevels = null;
let locBeat = null;
let locPulse = null;
let locBpm = null;
let locBreath = null;
let locDance = null;
let locModBoost = null;
let startMs = performance.now();
let lastSwitchMs = performance.now();
let lastRenderMs = performance.now();
let frameNumber = 0;
let paused = false;
let pausedAtMs = 0;
let modulationBoost = DEFAULT_MODULATION_BOOST;
let modulationBoostTarget = DEFAULT_MODULATION_BOOST;
let renderScale = 1.0;
let frameTimeEmaMs = 16.7;
let lastScaleAdjustMs = 0;
const seen = new Set();
const badIds = new Set();
const repairedCodeById = new Map();
const playableIds = [];
const playableSet = new Set();
let probeCursor = 0;

const SPECTRUM_BAR_COUNT = 28;
const AUDIO_TRAIL_SIZE = 200;
const audioState = {
  context: null,
  analyser: null,
  sourceNode: null,
  mediaStream: null,
  audioEl: null,
  objectUrl: null,
  freqData: null,
  timeData: null,
  enabled: false,
  mode: "idle",
  bass: 0,
  mid: 0,
  high: 0,
  level: 0,
  drive: 0,
  beat: 0,
  onset: 0,
  pulse: 0,
  pulseTarget: 0,
  breathe: 0,
  groove: 0,
  swing: 0.5,
  barPhase: 0,
  beatCount: 0,
  phase: 0,
  bpm: 0,
  lastBeatMs: 0,
  lastUpdateMs: 0,
  bassRawPrev: 0,
  fluxAvg: 0,
  beatIntervals: [],
  energyAvg: 0,
  peakHold: 0,
  syncEpochMs: 0,
  syncPeriodMs: 625,
  syncConfidence: 0
};
const uniformTweenState = {
  bass: 0,
  mid: 0,
  high: 0,
  drive: 0,
  beat: 0,
  onset: 0,
  pulse: 0,
  breathe: 0,
  groove: 0,
  swing: 0.5,
  barPhase: 0,
  bpm: 0,
  modBoost: DEFAULT_MODULATION_BOOST
};
const spectrumBars = [];
const levelTrail = new Array(AUDIO_TRAIL_SIZE).fill(0);
const beatTrail = new Array(AUDIO_TRAIL_SIZE).fill(0);
let audioVizCtx = null;

// Top complex shaders for deep shape/space parameter extraction (Muons excluded).
const DEEP_DANCE_SHADER_IDS = new Set([
  "1941576023650492704", // Protostar 2
  "1949897576435581439", // Phosphor 3
  "1940766471753466124", // Protostar
  "1955363029505413337", // Siri
  "1972423422711111894", // Vectors
  "1968828619435782446", // Quasar 2
  "1968820674341810276", // Quasar
  "1945504914253205515", // Phosphor 2
  "1940448131671580897", // Phosphor
  "1940496912718991572", // Neutron
  "1964488165647143241", // Shower
  "1970235131240817039", // Quasar 3
  "1920505484206895334", // CUBE
  "1971666820710203814", // Turbine
  "1915218469894713359", // Sauron
  "1947652770393153850", // Radiant
  "1953128872435745272", // IGNITE
  "1950699117367189854", // LAUNCH
  "1947685461826195605", // Radiant 2
  "1944131286764855701", // Twist
  "1920508035954249883", // Orb
  "1947302262629380126", // Qubit
  "1943750402387648778", // Shard
  "1923882930834751520", // Corridor
  "1915432769385005095", // Ghost Town
  "1974272123863507003", // Inferno
  "1921224922166104360", // Ionize
  "1985477218319909140", // Repulser
  "1938723605048668247", // Stingray
  "1953620412648014334", // Deathstar
  "1937225020398309665", // Digital Maelstrom
  "2016904976174317637", // Frames
  "1975230424982183956", // Lapse 2
  "1936158948630974583", // Surf
  "1963624559447244810", // Fiber
  "1986071686785986848", // Whirl
  "1941609261248786535", // Poof
  "1958193141573353887", // Paradise 3
  "1938247188167147579"  // Firewall
]);

const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
  gl.STATIC_DRAW
);

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2) * renderScale;
  const w = Math.max(1, Math.floor(window.innerWidth * dpr));
  const h = Math.max(1, Math.floor(window.innerHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function compile(type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) || "Unknown shader compile error";
    gl.deleteShader(sh);
    throw new Error(log);
  }
  return sh;
}

function updateAdaptiveRenderScale(nowMs, deltaSec) {
  if (paused || frameNumber < 24 || !Number.isFinite(deltaSec) || deltaSec <= 0) return;

  const sampleMs = Math.min(60, Math.max(8, deltaSec * 1000));
  frameTimeEmaMs = lerp(frameTimeEmaMs, sampleMs, 0.08);

  if (nowMs - lastScaleAdjustMs < ADAPTIVE_RENDER_COOLDOWN_MS) return;

  let nextScale = renderScale;
  if (frameTimeEmaMs > ADAPTIVE_RENDER_HIGH_MS && renderScale > ADAPTIVE_RENDER_SCALE_MIN) {
    nextScale = Math.max(ADAPTIVE_RENDER_SCALE_MIN, renderScale - ADAPTIVE_RENDER_STEP_DOWN);
  } else if (frameTimeEmaMs < ADAPTIVE_RENDER_LOW_MS && renderScale < ADAPTIVE_RENDER_SCALE_MAX) {
    nextScale = Math.min(ADAPTIVE_RENDER_SCALE_MAX, renderScale + ADAPTIVE_RENDER_STEP_UP);
  }

  if (nextScale !== renderScale) {
    renderScale = Math.round(nextScale * 100) / 100;
    lastScaleAdjustMs = nowMs;
    resize();
  }
}

function normalizeSnippet(source, title = "") {
  if (typeof source !== "string") return "";
  let code = source.replace(/\r\n?/g, "\n").trim();

  // Handle accidental markdown fences from scraped content.
  code = code.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();

  const lines = code.split("\n");
  if (lines.length > 0) {
    const first = lines[0].trim().replace(/^['\"]|['\"]$/g, "");
    const normTitle = String(title || "").trim().replace(/^['\"]|['\"]$/g, "");
    const looksLikeLabel = /^[A-Za-z0-9 _?+.-]+$/.test(first) && !/[;(){}=]/.test(first);

    if ((normTitle && first.toLowerCase() === normTitle.toLowerCase()) || looksLikeLabel) {
      lines.shift();
      code = lines.join("\n").trim();
    }
  }

  return code;
}

function applyDeepDanceParameterExtraction(code, shaderId, profile = "full") {
  if (!DEEP_DANCE_SHADER_IDS.has(String(shaderId))) {
    return code;
  }

  let out = code;
  const mode = profile === "core" ? "core" : profile === "light" ? "light" : profile === "medium" ? "medium" : "full";
  const applyStep = mode === "core" || mode === "medium" || mode === "full";
  const applyDepth = mode === "full";
  const applyTone = mode !== "core";
  const applyTrig = mode === "full" || mode === "medium" || mode === "core";
  const applyGeometry = mode === "full" || mode === "medium" || mode === "core" || mode === "light";
  const applySpace = mode === "full" || mode === "medium" || mode === "core";

  // Let common raymarch accumulators respond to pulse envelopes.
  if (applyStep) {
    out = out.replace(/\bz\s*\+=\s*d\b/g, "z += d*ddStep");
    out = out.replace(/\bz\s*\+=\s*f\b/g, "z += f*ddStep");
  }

  // Full profile also modulates depth denominators for stronger structure breathing.
  if (applyDepth) {
    out = out.replace(/\/\s*d\b/g, "/(d*ddDepth)");
    out = out.replace(/\/\s*f\b/g, "/(f*ddDepth)");
  }

  // Remap trig calls through dance-aware macros for broader, visible internal motion.
  if (applyTrig) {
    out = out.replace(/\bsin\s*\(/g, "DDSIN(");
    out = out.replace(/\bcos\s*\(/g, "DDCOS(");
  }

  if (applyGeometry) {
    out = out.replace(/\bnormalize\s*\(/g, "DDNORM(");
  }

  // Remap geometry-heavy operators so extracted envelopes alter shape and volume.
  if (applyGeometry) {
    out = out.replace(/\blength\s*\(/g, "DDLENGTH(");
    out = out.replace(/\bdistance\s*\(/g, "DDDIST(");
    out = out.replace(/\bsmoothstep\s*\(/g, "DDSMOOTHSTEP(");
    out = out.replace(/\bstep\s*\(/g, "DDSTEP(");
    out = out.replace(/\bfract\s*\(/g, "DDFRACT(");
  }

  if (applySpace) {
    out = out.replace(/\bdot\s*\(/g, "DDDOT(");
  }

  // Boost light accumulation directly in snippet math.
  if (applyTone) {
    out = out.replace(/\bo\.rgb\s*\+=/g, "o.rgb += ddEnergy*");
    out = out.replace(/\bo\s*\+=/g, "o += ddEnergy*");

    // Tie final tone-map response to pulse for visible pumping.
    out = out.replace(
      /\bo\s*=\s*tanh\s*\(\s*([^\)]+)\s*\)/g,
      (_m, expr) => `o = tanh((${expr})*ddPulse)`
    );
  }

  const prelude = `
float ddGrooveRaw = clamp(iDance.x, 0.0, 1.0);
float ddOnsetRaw = clamp(iDance.y, 0.0, 1.0);
float ddBeat = clamp(iBeat, 0.0, 1.0);
float ddPulseIn = clamp(iPulse, 0.0, 1.0);
float ddBreath = clamp(iBreath, 0.0, 1.0);
float ddGroove = pow(ddGrooveRaw, 0.72);
float ddOnset = pow(ddOnsetRaw, 0.78);
float ddBoost = clamp(iModBoost, 0.25, 11.0);
float ddHitRaw = clamp(0.60 * ddBeat + 0.56 * ddPulseIn + 0.30 * ddOnset, 0.0, 1.0);
float ddHit = ddHitRaw * ddHitRaw * (3.0 - 2.0 * ddHitRaw);
float ddBarPhase = clamp(iDance.z, 0.0, 1.0);
float ddFlow = smoothstep(0.0, 1.0, ddBarPhase);
float ddShape = clamp(0.74 * ddHit + 0.16 * ddFlow + 0.10 * ddBreath, 0.0, 1.0);
float ddAmp = 0.55 + 0.45 * ddBoost;
float ddShapeBoost = clamp(ddShape * ddAmp, 0.0, 1.55);
float ddStep = ${applyStep ? "0.94 + 0.26 * ddShapeBoost + 0.06 * ddGroove" : "1.0"};
float ddEnergy = ${mode === "light" || mode === "core" ? "0.86 + 0.60 * ddShapeBoost + 0.12 * ddGroove" : "0.82 + 0.74 * ddShapeBoost + 0.14 * ddGroove"};
float ddDepth = ${applyDepth ? "max(0.66, 1.12 - 0.34 * ddShapeBoost - 0.10 * ddBreath)" : "1.0"};
float ddPulse = ${mode === "light" || mode === "core" ? "0.90 + 0.70 * ddShapeBoost + 0.10 * ddBreath" : "0.86 + 0.84 * ddShapeBoost + 0.12 * ddBreath"};
float ddSinFreq = ${applyTrig ? "1.0 + 0.11 * ddShapeBoost + 0.03 * ddFlow" : "1.0"};
float ddCosFreq = ${applyTrig ? "1.0 + 0.09 * ddShapeBoost + 0.02 * ddFlow" : "1.0"};
float ddSinPhase = ${applyTrig ? "0.36 * ddPulseIn + 0.12 * ddOnset" : "0.0"};
float ddCosPhase = ${applyTrig ? "0.22 * ddPulseIn + 0.10 * ddBeat" : "0.0"};
float ddSinAmp = ${applyTrig ? "1.0 + 0.10 * ddShapeBoost" : "1.0"};
float ddCosAmp = ${applyTrig ? "1.0 + 0.08 * ddShapeBoost" : "1.0"};
float ddNormWarp = ${applyGeometry ? "0.14 * ddShapeBoost + 0.06 * ddOnset + 0.05 * ddBreath" : "0.0"};
float ddGeoDrive = ${applyGeometry ? "clamp((0.32 + 0.68 * ddShape) * (0.58 + 0.42 * ddBoost) + 0.18 * ddOnset + 0.10 * ddGroove + 0.08 * ddBreath, 0.0, 1.65)" : "0.0"};
float ddGeoScale = ${applyGeometry ? "0.76 + 0.68 * ddGeoDrive" : "1.0"};
float ddGeoEdge = ${applyGeometry ? "0.70 + 0.52 * ddGeoDrive" : "1.0"};
float ddGeoTile = ${applyGeometry ? "1.0 + 0.40 * ddGeoDrive" : "1.0"};
float ddGeoPhase = ${applyGeometry ? "0.12 * ddFlow + 0.10 * ddPulseIn + 0.06 * ddOnset" : "0.0"};
float ddGeoFractMix = ${applyGeometry ? "clamp(0.16 + 0.44 * ddGeoDrive, 0.0, 0.82)" : "0.0"};
float ddSpaceScale = ${applySpace ? "0.84 + 0.54 * ddGeoDrive" : "1.0"};
float ddSpaceDot = ${applySpace ? "0.82 + 0.38 * ddGeoDrive + 0.10 * ddOnset" : "1.0"};
`;

  return `${prelude}\n${out}`;
}

function fragmentTemplate(snippet, options = {}) {
  const compat = options.compat === true;
  const invokeMainImage = options.invokeMainImage === true;
  const fullMain = options.fullMain === true;
  const versionLine = isWebGL2 ? "#version 300 es\n" : "";
  const colorCompat = isWebGL2
    ? "out vec4 fragColor;\n#define gl_FragColor fragColor\n#define texture2D texture\n#define textureCube texture\n"
    : "";
  const compatBlock = compat
    ? `
#define R r
#define T t
#define O o
#define C o
#define b iChannel0
#define PI 3.14159265359
#define TAU 6.28318530718
#define U ((FC.xy - 0.5 * iResolution.xy) / iResolution.y)
#define fragCoord FC.xy
#define A iAudioLevels
#define BEAT iBeat
#define PULSE iPulse
#define BREATH iBreath
#define D iDance
#define GROOVE iDance.x
#define ONSET iDance.y
#define BAR iDance.z
#define SWING iDance.w
`
    : "";

  const mainImageCall = invokeMainImage ? "\n  mainImage(o, FC.xy);" : "";

  if (fullMain) {
    return `${versionLine}
precision highp float;
const float D_TAU = 6.28318530718;
uniform vec2 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iFrameRate;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform vec4 iAudioLevels;
uniform float iBeat;
uniform float iPulse;
uniform float iBpm;
uniform float iBreath;
uniform vec4 iDance;
uniform float iModBoost;
${colorCompat}
#define TANH(x) ((exp(2.0*(x)) - 1.0) / (exp(2.0*(x)) + 1.0))
#define DDSIN(x) (sin((x) * ddSinFreq + ddSinPhase) * ddSinAmp)
#define DDCOS(x) (cos((x) * ddCosFreq + ddCosPhase) * ddCosAmp)
#define DDNORM(x) (normalize((x) * (1.0 + ddNormWarp)))
#define DDLENGTH(x) (length((x) * ddGeoScale))
#define DDDIST(a, b) (distance((a) * ddSpaceScale, (b) * ddSpaceScale))
#define DDDOT(a, b) (dot((a), (b)) * ddSpaceDot)
#define DDSTEP(edge, x) step((edge) * ddGeoEdge, (x))
#define DDSMOOTHSTEP(edge0, edge1, x) smoothstep((edge0) * ddGeoEdge, (edge1) * ddGeoEdge, (x))
#define DDFRACT(x) (fract((x) * (1.0 + ddGeoFractMix * (ddGeoTile - 1.0)) + ddGeoPhase * ddGeoFractMix))

#define FC gl_FragCoord
${compatBlock}

${snippet}
`;
  }

  return `${versionLine}
precision highp float;
const float D_TAU = 6.28318530718;
uniform vec2 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iFrameRate;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform vec4 iAudioLevels;
uniform float iBeat;
uniform float iPulse;
uniform float iBpm;
uniform float iBreath;
uniform vec4 iDance;
uniform float iModBoost;
${colorCompat}
#define TANH(x) ((exp(2.0*(x)) - 1.0) / (exp(2.0*(x)) + 1.0))
#define DDSIN(x) (sin((x) * ddSinFreq + ddSinPhase) * ddSinAmp)
#define DDCOS(x) (cos((x) * ddCosFreq + ddCosPhase) * ddCosAmp)
#define DDNORM(x) (normalize((x) * (1.0 + ddNormWarp)))
#define DDLENGTH(x) (length((x) * ddGeoScale))
#define DDDIST(a, b) (distance((a) * ddSpaceScale, (b) * ddSpaceScale))
#define DDDOT(a, b) (dot((a), (b)) * ddSpaceDot)
#define DDSTEP(edge, x) step((edge) * ddGeoEdge, (x))
#define DDSMOOTHSTEP(edge0, edge1, x) smoothstep((edge0) * ddGeoEdge, (edge1) * ddGeoEdge, (x))
#define DDFRACT(x) (fract((x) * (1.0 + ddGeoFractMix * (ddGeoTile - 1.0)) + ddGeoPhase * ddGeoFractMix))

#define FC gl_FragCoord
${compatBlock}

void main() {
  float beat = iBeat;
  float pulse = iPulse;
  float breathe = iBreath;
  float groove = iDance.x;
  float onset = iDance.y;
  float barPhase = iDance.z;
  float swing = iDance.w;
  float audioDrive = clamp(iAudioLevels.w, 0.0, 1.0);
  float modBoost = clamp(iModBoost, 0.0, 11.0);
  vec2 r = iResolution.xy;
  float t = iTime;
  vec4 o = vec4(0.0);
  ${snippet}
  ${mainImageCall}

  // Keep modulation forward-only and BPM-synced to avoid back-and-forth motion.
  float beatRamp = fract(barPhase * 4.0 + 0.10 * swing);
  float beatEase = beatRamp * beatRamp * (3.0 - 2.0 * beatRamp);
  float baseMix = 0.10 + 0.22 * beatEase;
  float modMix = clamp((baseMix + 0.24 * groove + 0.34 * pulse + 0.24 * beat + 0.10 * onset) * (0.50 + 0.50 * modBoost), 0.0, 1.0);
  vec3 pulseTint = vec3(
    fract(barPhase + 0.05 + 0.25 * beatEase),
    fract(barPhase + 0.38 + 0.20 * beatEase),
    fract(barPhase + 0.71 + 0.15 * beatEase)
  );
  float hueMix = (0.10 + 0.34 * modMix) * (0.58 + 0.42 * onset);
  o.rgb = mix(o.rgb, o.rgb.zxy, hueMix);
  o.rgb = mix(o.rgb, o.rgb * (0.76 + 0.66 * pulseTint), 0.10 + 0.20 * modMix);
  float luma = dot(o.rgb, vec3(0.2126, 0.7152, 0.0722));
  float geoContrast = 1.0 + (0.08 + 0.26 * modMix) * (0.52 + 0.48 * groove);
  o.rgb = vec3(luma) + (o.rgb - vec3(luma)) * geoContrast;
  o.rgb += (pulseTint - 0.5) * (0.04 + 0.14 * modMix);
  o.rgb *= 0.94 + 0.10 * audioDrive + 0.09 * breathe + 0.06 * modMix;

  if (o.a == 0.0) {
    gl_FragColor = vec4(o.rgb, 1.0);
  } else {
    gl_FragColor = o;
  }
}
`;
}

function buildProgram(snippet, options = {}) {
  const vs = compile(gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentTemplate(snippet, options));
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog) || "Unknown link error";
    gl.deleteProgram(prog);
    throw new Error(log);
  }

  return {
    program: prog,
    attribPos: gl.getAttribLocation(prog, "aPos"),
    locRes: gl.getUniformLocation(prog, "iResolution"),
    locTime: gl.getUniformLocation(prog, "iTime"),
    locTimeDelta: gl.getUniformLocation(prog, "iTimeDelta"),
    locFrame: gl.getUniformLocation(prog, "iFrame"),
    locMouse: gl.getUniformLocation(prog, "iMouse"),
    locDate: gl.getUniformLocation(prog, "iDate"),
    locFrameRate: gl.getUniformLocation(prog, "iFrameRate"),
    locAudioLevels: gl.getUniformLocation(prog, "iAudioLevels"),
    locBeat: gl.getUniformLocation(prog, "iBeat"),
    locPulse: gl.getUniformLocation(prog, "iPulse"),
    locBpm: gl.getUniformLocation(prog, "iBpm"),
    locBreath: gl.getUniformLocation(prog, "iBreath"),
    locDance: gl.getUniformLocation(prog, "iDance"),
    locModBoost: gl.getUniformLocation(prog, "iModBoost")
  };
}

function formatBoostLabel(value) {
  return `${value.toFixed(2)}x`;
}

function setModulationBoost(value, persist = true) {
  const next = Math.max(0.25, Math.min(11, Number.isFinite(value) ? value : DEFAULT_MODULATION_BOOST));
  modulationBoostTarget = next;

  if (modBoostSliderEl) {
    modBoostSliderEl.value = String(Math.round(next * 100));
  }
  if (modBoostValueEl) {
    modBoostValueEl.textContent = formatBoostLabel(next);
  }

  if (persist) {
    try {
      localStorage.setItem("modulationBoost", String(next));
    } catch {
      // no-op
    }
  }
}

function buildProgramWithRepairs(rawSnippet, title = "", shaderId = "") {
  const base = normalizeSnippet(rawSnippet, title);
  const noVersion = base.replace(/^\s*#version\s+\d+\s*es\s*/m, "");
  const fixedTexture = noVersion.replace(/\btexture\s*\(/g, "texture2D(");
  const fixedFragColor = fixedTexture
    .replace(/\bout\s+vec4\s+fragColor\s*;/g, "")
    .replace(/\bfragColor\b/g, "gl_FragColor");
  const fixedTanh = fixedFragColor.replace(/\btanh\s*\(/g, "TANH(");
  const hasMainImage = /\bvoid\s+mainImage\s*\(/.test(base);
  const hasMain = /\bvoid\s+main\s*\(/.test(base);
  const isDeepDanceTarget = DEEP_DANCE_SHADER_IDS.has(String(shaderId));
  const primaryProfile = isDeepDanceTarget ? "medium" : "full";

  const withDanceParams = (src, options, profile = "full") => {
    if (options && options.fullMain) return src;
    return applyDeepDanceParameterExtraction(src, shaderId, profile);
  };

  const attempts = [
    { code: withDanceParams(base, { compat: false, invokeMainImage: false }, primaryProfile), options: { compat: false, invokeMainImage: false }, label: "base" },
    { code: withDanceParams(base, { compat: true, invokeMainImage: false }, primaryProfile), options: { compat: true, invokeMainImage: false }, label: "compat" },
    { code: withDanceParams(fixedTexture, { compat: true, invokeMainImage: false }, primaryProfile), options: { compat: true, invokeMainImage: false }, label: "texture2D" },
    { code: withDanceParams(fixedTanh, { compat: true, invokeMainImage: false }, primaryProfile), options: { compat: true, invokeMainImage: false }, label: "tanhCompat" }
  ];

  if (isDeepDanceTarget) {
    attempts.push(
      { code: withDanceParams(base, { compat: false, invokeMainImage: false }, "full"), options: { compat: false, invokeMainImage: false }, label: "baseFull" },
      { code: withDanceParams(base, { compat: true, invokeMainImage: false }, "full"), options: { compat: true, invokeMainImage: false }, label: "compatFull" },
      { code: withDanceParams(fixedTexture, { compat: true, invokeMainImage: false }, "full"), options: { compat: true, invokeMainImage: false }, label: "texture2DFull" },
      { code: withDanceParams(base, { compat: false, invokeMainImage: false }, "core"), options: { compat: false, invokeMainImage: false }, label: "baseCore" },
      { code: withDanceParams(base, { compat: true, invokeMainImage: false }, "core"), options: { compat: true, invokeMainImage: false }, label: "compatCore" },
      { code: withDanceParams(fixedTexture, { compat: true, invokeMainImage: false }, "core"), options: { compat: true, invokeMainImage: false }, label: "texture2DCore" },
      { code: withDanceParams(base, { compat: false, invokeMainImage: false }, "light"), options: { compat: false, invokeMainImage: false }, label: "baseLight" },
      { code: withDanceParams(base, { compat: true, invokeMainImage: false }, "light"), options: { compat: true, invokeMainImage: false }, label: "compatLight" },
      { code: base, options: { compat: false, invokeMainImage: false }, label: "baseNoDance" },
      { code: base, options: { compat: true, invokeMainImage: false }, label: "compatNoDance" },
      { code: fixedTexture, options: { compat: true, invokeMainImage: false }, label: "texture2DNoDance" },
      { code: fixedTanh, options: { compat: true, invokeMainImage: false }, label: "tanhCompatNoDance" }
    );
  }

  if (hasMainImage) {
    attempts.push({
      code: withDanceParams(fixedTanh, { compat: true, invokeMainImage: true }),
      options: { compat: true, invokeMainImage: true },
      label: "mainImage"
    });
  }

  if (hasMain) {
    attempts.push({
      code: withDanceParams(fixedFragColor, { compat: true, fullMain: true }),
      options: { compat: true, fullMain: true },
      label: "fullMain"
    });
  }

  const errors = [];
  for (const attempt of attempts) {
    try {
      const built = buildProgram(attempt.code, attempt.options);
      return { built, code: attempt.code, strategy: attempt.label };
    } catch (err) {
      errors.push(`${attempt.label}: ${String(err.message || err)}`);
    }
  }

  throw new Error(errors.join("\n\n"));
}

function showError(msg) {
  errorBoxEl.style.display = "block";
  errorBoxEl.textContent = msg;
}

function clearError() {
  errorBoxEl.style.display = "none";
  errorBoxEl.textContent = "";
}

function updateHud() {
  if (!current) {
    titleEl.textContent = "No shader loaded";
    indexEl.textContent = "";
    linkEl.href = "#";
    return;
  }
  titleEl.textContent = current.title || "Untitled";
  indexEl.textContent = `${seen.size}/${playableIds.length || snippets.length} • ${isWebGL2 ? "WebGL2" : "WebGL1"}`;
  linkEl.href = current.url || "#";
}

function isAnimatedSnippet(item) {
  if (!item || typeof item.code !== "string") return false;
  const title = String(item.title || "");
  if (/gradient/i.test(title)) return false;

  // Keep snippets that reference the shared time variable from the wrapper.
  return /\biTime\b|\bt\b/.test(item.code);
}

function randomNext() {
  if (!playableIds.length) return null;

  const availableCount = playableIds.length;
  if (availableCount <= 0) return null;

  if (seen.size >= availableCount) {
    seen.clear();
  }

  const candidates = playableIds.filter((id) => !seen.has(id));
  const pool = candidates.length ? candidates : playableIds;
  const pickId = pool[Math.floor(Math.random() * pool.length)];
  return snippets.find((s) => s.id === pickId) || null;
}

function addPlayable(id) {
  if (playableSet.has(id)) return;
  playableSet.add(id);
  playableIds.push(id);
}

function probeSnippet(item) {
  if (!item || badIds.has(item.id) || playableSet.has(item.id)) return false;
  try {
    const repair = buildProgramWithRepairs(item.code, item.title, item.id);
    repairedCodeById.set(item.id, repair.code);
    gl.deleteProgram(repair.built.program);
    addPlayable(item.id);
    return true;
  } catch {
    badIds.add(item.id);
    return false;
  }
}

function warmupPlayablePool(targetCount = 48) {
  if (!snippets.length) return;
  while (probeCursor < snippets.length && playableIds.length < targetCount) {
    probeSnippet(snippets[probeCursor]);
    probeCursor += 1;
  }
}

function scheduleBackgroundProbe() {
  const step = () => {
    let work = 0;
    while (probeCursor < snippets.length && work < 20) {
      probeSnippet(snippets[probeCursor]);
      probeCursor += 1;
      work += 1;
    }

    if (probeCursor < snippets.length) {
      setTimeout(step, 16);
    }
  };

  setTimeout(step, 16);
}

function tryLoadRandom(maxAttempts = 25) {
  if (!playableIds.length) {
    warmupPlayablePool(16);
  }

  for (let i = 0; i < maxAttempts; i++) {
    const next = randomNext();
    if (!next) return false;

    try {
      const source = repairedCodeById.get(next.id) || next.code;
      const repair = buildProgramWithRepairs(source, next.title, next.id);
      const built = repair.built;
      if (currentProgram) {
        gl.deleteProgram(currentProgram);
      }
      currentProgram = built.program;
      attribPos = built.attribPos;
      locRes = built.locRes;
      locTime = built.locTime;
      locTimeDelta = built.locTimeDelta;
      locFrame = built.locFrame;
      locMouse = built.locMouse;
      locDate = built.locDate;
      locFrameRate = built.locFrameRate;
      locAudioLevels = built.locAudioLevels;
      locBeat = built.locBeat;
      locPulse = built.locPulse;
      locBpm = built.locBpm;
      locBreath = built.locBreath;
      locDance = built.locDance;
      locModBoost = built.locModBoost;
      current = next;
      repairedCodeById.set(next.id, repair.code);
      seen.add(next.id);
      startMs = performance.now();
      lastSwitchMs = performance.now();
      lastRenderMs = performance.now();
      frameNumber = 0;
      clearError();
      updateHud();
      return true;
    } catch (err) {
      badIds.add(next.id);
      playableSet.delete(next.id);
      const idx = playableIds.indexOf(next.id);
      if (idx >= 0) playableIds.splice(idx, 1);
      showError(`Skipping ${next.title} (${next.id})\n${String(err.message || err)}`);
    }
  }

  return false;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothAsymmetric(current, target, rise, fall) {
  const k = target > current ? rise : fall;
  return current + (target - current) * k;
}

function smoothTween(current, target, rate, dt) {
  const t = 1 - Math.exp(-Math.max(0, rate) * Math.max(0.0001, dt));
  return current + (target - current) * t;
}

function smoothPhase01(current, target, rate, dt) {
  let delta = target - current;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;
  const next = current + delta * (1 - Math.exp(-Math.max(0, rate) * Math.max(0.0001, dt)));
  return next - Math.floor(next);
}

function updateTweenedUniformState(nowMs, deltaSec) {
  const dt = Math.min(0.1, Math.max(0.001, Number.isFinite(deltaSec) ? deltaSec : 1 / 60));
  const bpmDetected = audioState.bpm > 0 ? audioState.bpm : 96;
  const bpm = Math.min(190, Math.max(50, bpmDetected));
  const beatPeriodMs = audioState.syncPeriodMs > 0 ? audioState.syncPeriodMs : 60000 / bpm;
  const leadMs = RHYTHM_LEAD_MS;
  const beatEpochMs = audioState.syncEpochMs > 0
    ? audioState.syncEpochMs
    : (audioState.lastBeatMs > 0 ? audioState.lastBeatMs : startMs);

  const beatClockRaw = (nowMs - beatEpochMs + leadMs) / beatPeriodMs;
  const beatClock = Number.isFinite(beatClockRaw) ? beatClockRaw : 0;
  let beatPhase = beatClock % 1;
  if (beatPhase < 0) beatPhase += 1;
  const beatIndex = Math.max(0, Math.floor(beatClock));
  const barPhase = (((beatIndex % 4) + beatPhase) / 4) % 1;

  // Forward-only predictable envelopes from BPM clock (no direct audio envelope driving).
  const beatPulse = Math.exp(-beatPhase * 6.4);
  const onset = Math.max(0, 1 - beatPhase * 3.6);
  const pulse = Math.max(beatPulse, 0.22 + 0.78 * (1 - beatPhase));
  const breathe = beatPhase;
  const groove = Math.min(1, 0.22 + 0.78 * (1 - Math.exp(-beatPhase * 3.0)));
  const drive = 0.40 + 0.60 * beatPulse;
  const bass = 0.28 + 0.72 * beatPulse;
  const mid = 0.24 + 0.46 * (1 - beatPhase);
  const high = 0.20 + 0.34 * beatPhase;
  const swing = 0.5;

  uniformTweenState.bass = smoothTween(uniformTweenState.bass, bass, 9.4, dt);
  uniformTweenState.mid = smoothTween(uniformTweenState.mid, mid, 9.0, dt);
  uniformTweenState.high = smoothTween(uniformTweenState.high, high, 9.0, dt);
  uniformTweenState.drive = smoothTween(uniformTweenState.drive, drive, 9.4, dt);
  uniformTweenState.beat = smoothTween(uniformTweenState.beat, beatPulse, 16.0, dt);
  uniformTweenState.onset = smoothTween(uniformTweenState.onset, onset, 13.0, dt);
  uniformTweenState.pulse = smoothTween(uniformTweenState.pulse, pulse, 12.0, dt);
  uniformTweenState.breathe = smoothTween(uniformTweenState.breathe, breathe, 8.2, dt);
  uniformTweenState.groove = smoothTween(uniformTweenState.groove, groove, 10.5, dt);
  uniformTweenState.swing = smoothTween(uniformTweenState.swing, swing, 12.0, dt);
  uniformTweenState.barPhase = smoothPhase01(uniformTweenState.barPhase, barPhase, 21.0, dt);
  uniformTweenState.bpm = smoothTween(uniformTweenState.bpm, bpm, 9.5, dt);
  uniformTweenState.modBoost = smoothTween(uniformTweenState.modBoost, modulationBoostTarget, 10.0, dt);
  modulationBoost = uniformTweenState.modBoost;
}

function initSpectrumBars() {
  if (!spectrumEl || spectrumBars.length) return;
  for (let i = 0; i < SPECTRUM_BAR_COUNT; i++) {
    const bar = document.createElement("div");
    bar.className = "spectrum-bar";
    spectrumEl.appendChild(bar);
    spectrumBars.push(bar);
  }
}

function initAudioVizCanvas() {
  if (!audioVizCanvas) return;
  if (!audioVizCtx) {
    audioVizCtx = audioVizCanvas.getContext("2d");
  }
  if (!audioVizCtx) return;

  const rect = audioVizCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (audioVizCanvas.width !== w || audioVizCanvas.height !== h) {
    audioVizCanvas.width = w;
    audioVizCanvas.height = h;
  }
}

function pushTrail(arr, value) {
  arr.shift();
  arr.push(value);
}

function drawAudioVisualizer() {
  if (!audioVizCanvas || !audioVizCtx) return;
  initAudioVizCanvas();
  if (!audioVizCtx) return;

  const ctx = audioVizCtx;
  const w = audioVizCanvas.width;
  const h = audioVizCanvas.height;
  if (w <= 0 || h <= 0) return;

  const bass = audioState.bass;
  const mid = audioState.mid;
  const high = audioState.high;
  const level = audioState.level;

  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, `rgba(${Math.floor(10 + high * 20)}, ${Math.floor(14 + mid * 20)}, ${Math.floor(20 + bass * 20)}, 0.95)`);
  bg.addColorStop(1, "rgba(5, 8, 12, 0.98)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = Math.max(1, w * 0.0015);
  for (let i = 1; i <= 4; i++) {
    const y = (h * i) / 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  if (audioState.freqData) {
    const bars = 72;
    const gap = Math.max(1, Math.floor(w * 0.0015));
    const barW = Math.max(2, (w - gap * (bars - 1)) / bars);
    for (let i = 0; i < bars; i++) {
      const t = i / Math.max(1, bars - 1);
      const idx = Math.min(audioState.freqData.length - 1, Math.floor(Math.pow(t, 1.7) * (audioState.freqData.length - 1)));
      const amp = audioState.freqData[idx] / 255;
      const barH = Math.max(2, amp * h * 0.55);
      const x = i * (barW + gap);
      const y = h - barH;
      const hue = Math.floor(185 - t * 145 + level * 20);
      ctx.fillStyle = `hsla(${hue}, 90%, ${45 + amp * 20}%, ${0.35 + amp * 0.5})`;
      ctx.fillRect(x, y, barW, barH);
    }
  }

  if (audioState.timeData && audioState.enabled) {
    ctx.beginPath();
    ctx.lineWidth = Math.max(1.5, w * 0.002);
    ctx.strokeStyle = `rgba(255, ${Math.floor(130 + bass * 90)}, ${Math.floor(90 + high * 130)}, ${0.5 + level * 0.4})`;
    for (let i = 0; i < audioState.timeData.length; i++) {
      const x = (i / (audioState.timeData.length - 1)) * w;
      const v = (audioState.timeData[i] - 128) / 128;
      const y = h * 0.5 + v * h * 0.21;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.lineWidth = Math.max(1.5, w * 0.0022);
  ctx.strokeStyle = `rgba(${Math.floor(70 + bass * 170)}, ${Math.floor(145 + mid * 80)}, ${Math.floor(255 - bass * 80)}, 0.85)`;
  for (let i = 0; i < levelTrail.length; i++) {
    const x = (i / (levelTrail.length - 1)) * w;
    const y = h - levelTrail[i] * h * 0.44;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = Math.max(1, w * 0.0015);
  ctx.strokeStyle = "rgba(255, 107, 0, 0.85)";
  for (let i = 0; i < beatTrail.length; i++) {
    const x = (i / (beatTrail.length - 1)) * w;
    const y = h - beatTrail[i] * h * 0.32;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (audioState.beat > 0.6) {
    ctx.strokeStyle = `rgba(255, 120, 70, ${0.16 + audioState.beat * 0.32})`;
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }
}

function setAudioStatus(text) {
  if (audioStatusEl) {
    audioStatusEl.textContent = text;
  }
}

function updateAudioHud() {
  if (audioBpmEl) {
    audioBpmEl.textContent = audioState.bpm > 0 ? `BPM ${audioState.bpm.toFixed(0)}` : "BPM --";
  }
  if (audioLevelsEl) {
    audioLevelsEl.textContent = `L ${audioState.level.toFixed(2)} B ${audioState.bass.toFixed(2)} G ${audioState.groove.toFixed(2)}`;
  }
  if (audioPulseDotEl) {
    const scale = 0.9 + audioState.pulse * 1.5;
    audioPulseDotEl.style.transform = `scale(${scale.toFixed(3)})`;
    audioPulseDotEl.style.background = audioState.beat > 0.8 ? "#ff6b00" : "#2ed3ff";
  }
}

function updateSpectrum() {
  if (!spectrumBars.length || !audioState.freqData) return;
  const data = audioState.freqData;
  for (let i = 0; i < spectrumBars.length; i++) {
    const t = i / Math.max(1, spectrumBars.length - 1);
    const idx = Math.min(data.length - 1, Math.floor(t * t * (data.length - 1)));
    const amp = data[idx] / 255;
    const scale = 0.08 + amp * 1.2;
    const opacity = 0.28 + amp * 0.72;
    spectrumBars[i].style.transform = `scaleY(${scale.toFixed(3)})`;
    spectrumBars[i].style.opacity = opacity.toFixed(3);
  }
}

function resetAudioMetrics() {
  audioState.bass = 0;
  audioState.mid = 0;
  audioState.high = 0;
  audioState.level = 0;
  audioState.drive = 0;
  audioState.beat = 0;
  audioState.onset = 0;
  audioState.pulse = 0;
  audioState.pulseTarget = 0;
  audioState.breathe = 0;
  audioState.groove = 0;
  audioState.swing = 0.5;
  audioState.barPhase = 0;
  audioState.beatCount = 0;
  audioState.phase = 0;
  audioState.bpm = 0;
  audioState.lastBeatMs = 0;
  audioState.lastUpdateMs = 0;
  audioState.bassRawPrev = 0;
  audioState.fluxAvg = 0;
  audioState.beatIntervals = [];
  audioState.energyAvg = 0;
  audioState.peakHold = 0;
  audioState.syncEpochMs = 0;
  audioState.syncPeriodMs = 625;
  audioState.syncConfidence = 0;

  uniformTweenState.bass = 0;
  uniformTweenState.mid = 0;
  uniformTweenState.high = 0;
  uniformTweenState.drive = 0;
  uniformTweenState.beat = 0;
  uniformTweenState.onset = 0;
  uniformTweenState.pulse = 0;
  uniformTweenState.breathe = 0;
  uniformTweenState.groove = 0;
  uniformTweenState.swing = 0.5;
  uniformTweenState.barPhase = 0;
  uniformTweenState.bpm = 0;
}

function disconnectAudioSource() {
  if (audioState.sourceNode) {
    try {
      audioState.sourceNode.disconnect();
    } catch {
      // no-op
    }
    audioState.sourceNode = null;
  }

  if (audioState.mediaStream) {
    for (const track of audioState.mediaStream.getTracks()) {
      track.stop();
    }
    audioState.mediaStream = null;
  }

  if (audioState.audioEl) {
    audioState.audioEl.pause();
    audioState.audioEl.src = "";
    audioState.audioEl.load();
    audioState.audioEl = null;
  }

  if (audioState.objectUrl) {
    URL.revokeObjectURL(audioState.objectUrl);
    audioState.objectUrl = null;
  }
}

async function ensureAudioGraph() {
  if (!audioState.context) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      throw new Error("Web Audio API is not supported in this browser.");
    }
    audioState.context = new Ctx();
    audioState.analyser = audioState.context.createAnalyser();
    audioState.analyser.fftSize = 2048;
    audioState.analyser.smoothingTimeConstant = 0.9;
    audioState.freqData = new Uint8Array(audioState.analyser.frequencyBinCount);
    audioState.timeData = new Uint8Array(audioState.analyser.fftSize);
    initSpectrumBars();
    initAudioVizCanvas();
  }

  if (audioState.context.state === "suspended") {
    await audioState.context.resume();
  }
}

async function startMicrophoneAudio() {
  await ensureAudioGraph();
  disconnectAudioSource();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    },
    video: false
  });

  const source = audioState.context.createMediaStreamSource(stream);
  source.connect(audioState.analyser);

  audioState.sourceNode = source;
  audioState.mediaStream = stream;
  audioState.enabled = true;
  audioState.mode = "mic";
  resetAudioMetrics();
  setAudioStatus("Mic listening");
}

async function startFileAudio(file) {
  if (!file) return;
  await ensureAudioGraph();
  disconnectAudioSource();

  const objectUrl = URL.createObjectURL(file);
  const el = new Audio();
  el.src = objectUrl;
  el.loop = true;
  el.preload = "auto";
  el.crossOrigin = "anonymous";

  const source = audioState.context.createMediaElementSource(el);
  source.connect(audioState.analyser);
  source.connect(audioState.context.destination);

  await el.play();

  audioState.objectUrl = objectUrl;
  audioState.audioEl = el;
  audioState.sourceNode = source;
  audioState.enabled = true;
  audioState.mode = "file";
  resetAudioMetrics();
  setAudioStatus(`Playing ${file.name}`);
}

function stopAudio() {
  disconnectAudioSource();
  audioState.enabled = false;
  audioState.mode = "idle";
  resetAudioMetrics();
  setAudioStatus("Idle");
  updateAudioHud();
  for (const bar of spectrumBars) {
    bar.style.transform = "scaleY(0.08)";
    bar.style.opacity = "0.28";
  }
  for (let i = 0; i < AUDIO_TRAIL_SIZE; i++) {
    levelTrail[i] = 0;
    beatTrail[i] = 0;
  }
  drawAudioVisualizer();
}

function averageBand(data, sampleRate, lowHz, highHz) {
  const nyquist = sampleRate * 0.5;
  const low = Math.max(0, Math.floor((lowHz / nyquist) * data.length));
  const high = Math.min(data.length - 1, Math.floor((highHz / nyquist) * data.length));
  if (high <= low) return 0;

  let sum = 0;
  for (let i = low; i <= high; i++) {
    sum += data[i];
  }
  return (sum / (high - low + 1)) / 255;
}

function updateBeatSyncClock(nowMs, beatNow, dt) {
  const bpmRef = audioState.bpm > 0 ? audioState.bpm : 96;
  const fallbackPeriod = 60000 / bpmRef;

  if (!Number.isFinite(audioState.syncPeriodMs) || audioState.syncPeriodMs <= 0) {
    audioState.syncPeriodMs = fallbackPeriod;
  }

  if (beatNow) {
    if (audioState.syncEpochMs <= 0) {
      audioState.syncEpochMs = nowMs;
      audioState.syncConfidence = Math.min(1, audioState.syncConfidence + 0.30);
    } else {
      const beatsFromEpoch = (nowMs - audioState.syncEpochMs) / audioState.syncPeriodMs;
      const nearestBeat = Math.max(0, Math.round(beatsFromEpoch));
      const predictedMs = audioState.syncEpochMs + nearestBeat * audioState.syncPeriodMs;
      const phaseErrMs = nowMs - predictedMs;
      audioState.syncEpochMs += phaseErrMs * 0.62;
      audioState.syncConfidence = Math.min(1, audioState.syncConfidence + 0.16);
    }

    if (audioState.beatIntervals.length > 0) {
      const sorted = [...audioState.beatIntervals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      audioState.syncPeriodMs = lerp(audioState.syncPeriodMs, median, 0.26);
    } else {
      audioState.syncPeriodMs = lerp(audioState.syncPeriodMs, fallbackPeriod, 0.12);
    }
  } else {
    audioState.syncConfidence = Math.max(0, audioState.syncConfidence - dt * 0.04);
    audioState.syncPeriodMs = lerp(audioState.syncPeriodMs, fallbackPeriod, 0.035);
  }

  audioState.syncPeriodMs = Math.min(1200, Math.max(300, audioState.syncPeriodMs));
}

function updateAudioReactiveState(nowMs) {
  const dt = audioState.lastUpdateMs > 0
    ? Math.min(0.1, Math.max(0.001, (nowMs - audioState.lastUpdateMs) / 1000))
    : 1 / 60;
  audioState.lastUpdateMs = nowMs;

  if (!audioState.enabled || !audioState.analyser || !audioState.freqData) {
    const relax = Math.exp(-dt * 4.0);
    audioState.bass *= relax;
    audioState.mid *= relax;
    audioState.high *= relax;
    audioState.level *= relax;
    audioState.drive *= relax;
    audioState.beat *= Math.exp(-dt * 7.2);
    audioState.onset *= Math.exp(-dt * 8.2);
    audioState.pulse *= Math.exp(-dt * 2.6);
    audioState.pulseTarget *= Math.exp(-dt * 2.2);
    audioState.breathe = smoothAsymmetric(audioState.breathe, 0, 0.05, 0.06);
    audioState.groove *= Math.exp(-dt * 2.8);
    audioState.swing = smoothAsymmetric(audioState.swing, 0.5, 0.035, 0.035);
    audioState.barPhase = (audioState.barPhase + dt * 0.015) % 1;
    pushTrail(levelTrail, audioState.level);
    pushTrail(beatTrail, Math.max(audioState.beat, audioState.onset * 0.8));
    updateAudioHud();
    drawAudioVisualizer();
    return;
  }

  audioState.analyser.getByteFrequencyData(audioState.freqData);
  if (audioState.timeData) {
    audioState.analyser.getByteTimeDomainData(audioState.timeData);
  }

  const sampleRate = audioState.context ? audioState.context.sampleRate : 44100;
  const bassRaw = averageBand(audioState.freqData, sampleRate, 20, 180);
  const midRaw = averageBand(audioState.freqData, sampleRate, 180, 2000);
  const highRaw = averageBand(audioState.freqData, sampleRate, 2000, 9000);
  const levelRaw = bassRaw * 0.5 + midRaw * 0.33 + highRaw * 0.17;

  audioState.bass = smoothAsymmetric(audioState.bass, bassRaw, 0.11, 0.05);
  audioState.mid = smoothAsymmetric(audioState.mid, midRaw, 0.1, 0.045);
  audioState.high = smoothAsymmetric(audioState.high, highRaw, 0.09, 0.04);
  audioState.level = smoothAsymmetric(audioState.level, levelRaw, 0.1, 0.04);

  const driveTarget = Math.min(1, audioState.bass * 0.9 + audioState.mid * 0.35 + audioState.high * 0.2);
  audioState.drive = smoothAsymmetric(audioState.drive, driveTarget, 0.075, 0.035);

  const flux = Math.max(0, bassRaw - audioState.bassRawPrev);
  audioState.bassRawPrev = bassRaw;
  audioState.energyAvg = audioState.energyAvg === 0 ? levelRaw : lerp(audioState.energyAvg, levelRaw, 0.06);
  audioState.fluxAvg = audioState.fluxAvg === 0 ? flux : lerp(audioState.fluxAvg, flux, 0.06);
  const threshold = audioState.fluxAvg * 1.55 + audioState.energyAvg * 0.35 + 0.016;
  const cooldownMs = 240;
  let beatNow = false;

  if (flux > threshold && bassRaw > audioState.energyAvg * 0.72 && nowMs - audioState.lastBeatMs > cooldownMs) {
    beatNow = true;
    if (audioState.lastBeatMs > 0) {
      const interval = nowMs - audioState.lastBeatMs;
      if (interval > 280 && interval < 1300) {
        audioState.beatIntervals.push(interval);
        if (audioState.beatIntervals.length > 18) {
          audioState.beatIntervals.shift();
        }
      }
    }
    audioState.lastBeatMs = nowMs;
  }

  if (audioState.beatIntervals.length >= 4) {
    const sorted = [...audioState.beatIntervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const bpm = 60000 / median;
    if (bpm >= 50 && bpm <= 190) {
      audioState.bpm = audioState.bpm > 0 ? lerp(audioState.bpm, bpm, 0.12) : bpm;
    }
  }

  if (beatNow) {
    audioState.phase = 0;
    audioState.beatCount += 1;
    audioState.pulseTarget = 1;
  }

  updateBeatSyncClock(nowMs, beatNow, dt);

  const onsetTarget = Math.min(1, flux * 4.8 + (beatNow ? 0.72 : 0));
  audioState.onset = smoothAsymmetric(audioState.onset, onsetTarget, 0.22, 0.09);

  const bpmForPhase = audioState.bpm > 0 ? audioState.bpm : 96;
  const beatPeriodMs = audioState.syncPeriodMs > 0 ? audioState.syncPeriodMs : 60000 / bpmForPhase;
  const leadMs = RHYTHM_LEAD_MS;
  const beatAnchorMs = audioState.syncEpochMs > 0 ? audioState.syncEpochMs : audioState.lastBeatMs;
  if (beatAnchorMs > 0 && Number.isFinite(beatPeriodMs) && beatPeriodMs > 0) {
    const beatPhaseRaw = ((nowMs - beatAnchorMs + leadMs) / beatPeriodMs) % 1;
    const beatPhase = beatPhaseRaw < 0 ? beatPhaseRaw + 1 : beatPhaseRaw;
    audioState.phase = smoothPhase01(audioState.phase, beatPhase, 16.0, dt);
  } else {
    audioState.phase = (audioState.phase + dt * (bpmForPhase / 60)) % 1;
  }
  audioState.barPhase = ((audioState.beatCount % 4) + audioState.phase) / 4;
  const breatheRaw = 0.5 - 0.5 * Math.cos(audioState.barPhase * Math.PI * 2);
  audioState.breathe = smoothAsymmetric(audioState.breathe, Math.pow(breatheRaw, 1.15), 0.09, 0.06);

  const grooveTarget = Math.min(
    1,
    audioState.drive * (0.5 + 0.5 * audioState.breathe) + audioState.onset * 0.22 + audioState.pulse * 0.28 + audioState.beat * 0.12
  );
  audioState.groove = smoothAsymmetric(audioState.groove, grooveTarget, 0.13, 0.08);
  const swingOsc = Math.sin((audioState.phase * 2 + (audioState.beatCount % 2) * 0.5) * Math.PI * 2);
  const swingTarget = 0.5 + 0.18 * swingOsc * (0.25 + audioState.groove * 0.45);
  audioState.swing = smoothAsymmetric(audioState.swing, swingTarget, 0.08, 0.08);
  audioState.swing = Math.min(1, Math.max(0, audioState.swing));

  audioState.beat = Math.max(beatNow ? 1 : 0, audioState.beat * Math.exp(-dt * 8.4));
  audioState.pulseTarget *= Math.exp(-dt * 2.2);
  const beatEnvelope = Math.exp(-audioState.phase * 4.2);
  audioState.pulse = smoothAsymmetric(
    audioState.pulse,
    Math.max(
      audioState.pulseTarget,
      beatEnvelope * (0.45 + 0.45 * audioState.drive),
      audioState.drive * 0.34 * (0.6 + 0.4 * audioState.breathe),
      audioState.groove * 0.3,
      audioState.onset * 0.24
    ),
    0.24,
    0.085
  );
  audioState.peakHold = Math.max(audioState.level, audioState.peakHold * 0.98);

  pushTrail(levelTrail, audioState.level);
  pushTrail(beatTrail, Math.max(audioState.beat, audioState.onset * 0.8));

  updateSpectrum();
  updateAudioHud();
  drawAudioVisualizer();
}

function draw(nowMs) {
  resize();

  if (!paused && nowMs - lastSwitchMs >= SHADER_DURATION_MS) {
    tryLoadRandom();
  }

  const elapsed = paused ? (pausedAtMs - startMs) / 1000 : (nowMs - startMs) / 1000;
  const pct = Math.min(1, (paused ? pausedAtMs - lastSwitchMs : nowMs - lastSwitchMs) / SHADER_DURATION_MS);
  const activeNow = paused ? pausedAtMs : nowMs;
  const deltaSec = Math.max(0, (activeNow - lastRenderMs) / 1000);
  lastRenderMs = activeNow;
  updateAudioReactiveState(activeNow);
  updateTweenedUniformState(activeNow, deltaSec);
  updateAdaptiveRenderScale(activeNow, deltaSec);
  timerBarEl.style.width = `${(pct * 100).toFixed(2)}%`;

  if (currentProgram) {
    gl.useProgram(currentProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(attribPos);
    gl.vertexAttribPointer(attribPos, 2, gl.FLOAT, false, 0, 0);
    if (locRes) gl.uniform2f(locRes, canvas.width, canvas.height);
    if (locTime) gl.uniform1f(locTime, elapsed);
    if (locTimeDelta) gl.uniform1f(locTimeDelta, deltaSec);
    if (locFrame) gl.uniform1i(locFrame, frameNumber);
    if (locFrameRate) gl.uniform1f(locFrameRate, deltaSec > 0 ? 1 / deltaSec : 60);
    if (locMouse) gl.uniform4f(locMouse, 0, 0, 0, 0);
    if (locDate) {
      const d = new Date();
      const secs = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
      gl.uniform4f(locDate, d.getFullYear(), d.getMonth() + 1, d.getDate(), secs);
    }
    if (locAudioLevels) {
      gl.uniform4f(locAudioLevels, uniformTweenState.bass, uniformTweenState.mid, uniformTweenState.high, uniformTweenState.drive);
    }
    if (locBeat) gl.uniform1f(locBeat, uniformTweenState.beat);
    if (locPulse) gl.uniform1f(locPulse, uniformTweenState.pulse);
    if (locBpm) gl.uniform1f(locBpm, uniformTweenState.bpm || 0);
    if (locBreath) gl.uniform1f(locBreath, uniformTweenState.breathe);
    if (locDance) gl.uniform4f(locDance, uniformTweenState.groove, uniformTweenState.onset, uniformTweenState.barPhase, uniformTweenState.swing);
    if (locModBoost) gl.uniform1f(locModBoost, modulationBoost);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frameNumber += 1;
  }

  requestAnimationFrame(draw);
}

function setDockMinimized(minimized) {
  if (!uiDockEl || !dockToggleBtn) return;

  uiDockEl.classList.toggle("minimized", minimized);
  dockToggleBtn.textContent = minimized ? "Open" : "Minimize";
  dockToggleBtn.setAttribute("aria-expanded", minimized ? "false" : "true");

  try {
    localStorage.setItem("uiDockMinimized", minimized ? "1" : "0");
  } catch {
    // no-op
  }
}

dockToggleBtn?.addEventListener("click", () => {
  const minimized = !uiDockEl?.classList.contains("minimized");
  setDockMinimized(Boolean(minimized));
});

try {
  setDockMinimized(localStorage.getItem("uiDockMinimized") === "1");
} catch {
  setDockMinimized(false);
}

modBoostSliderEl?.addEventListener("input", (event) => {
  const raw = Number(event.target?.value ?? Math.round(DEFAULT_MODULATION_BOOST * 100));
  setModulationBoost(raw / 100, true);
});

let initialBoost = DEFAULT_MODULATION_BOOST;
try {
  const stored = Number(localStorage.getItem("modulationBoost"));
  if (Number.isFinite(stored) && stored >= 0.25) {
    initialBoost = stored;
  }
} catch {
  // no-op
}
setModulationBoost(initialBoost, false);
modulationBoost = initialBoost;
modulationBoostTarget = initialBoost;
uniformTweenState.modBoost = initialBoost;

pauseBtn.addEventListener("click", () => {
  if (!paused) {
    paused = true;
    pausedAtMs = performance.now();
    lastRenderMs = pausedAtMs;
    pauseBtn.textContent = "Resume";
    return;
  }

  const now = performance.now();
  const pauseSpan = now - pausedAtMs;
  startMs += pauseSpan;
  lastSwitchMs += pauseSpan;
  lastRenderMs = now;
  paused = false;
  pauseBtn.textContent = "Pause";
});

nextBtn.addEventListener("click", () => {
  tryLoadRandom();
});

audioMicBtn?.addEventListener("click", async () => {
  try {
    await startMicrophoneAudio();
  } catch (err) {
    setAudioStatus(`Mic error: ${String(err.message || err)}`);
  }
});

audioFileBtn?.addEventListener("click", () => {
  audioFileInput?.click();
});

audioFileInput?.addEventListener("change", async (event) => {
  const file = event.target?.files?.[0];
  if (!file) return;
  try {
    await startFileAudio(file);
  } catch (err) {
    setAudioStatus(`File error: ${String(err.message || err)}`);
  } finally {
    audioFileInput.value = "";
  }
});

audioStopBtn?.addEventListener("click", () => {
  stopAudio();
});

window.addEventListener("resize", () => {
  resize();
  initAudioVizCanvas();
  drawAudioVisualizer();
});
window.addEventListener("beforeunload", () => {
  stopAudio();
  if (audioState.context) {
    audioState.context.close().catch(() => {});
  }
});

(async function init() {
  let datasetName = "shaders.playable.json";
  let resp = await fetch("./shaders.playable.json", { cache: "no-store" });
  if (!resp.ok) {
    datasetName = "shaders.json";
    resp = await fetch("./shaders.json", { cache: "no-store" });
  }

  if (!resp.ok) {
    throw new Error(`Could not load shader dataset (${resp.status})`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) {
    throw new Error(`${datasetName} is not an array`);
  }

  const curatedOnly = true;
  const includeShader = (item) => {
    if (!item) return false;
    if (!curatedOnly) return true;
    return DEEP_DANCE_SHADER_IDS.has(String(item.id));
  };

  if (datasetName === "shaders.playable.json") {
    for (const item of data) {
      if (!item || typeof item.code !== "string") continue;
      if (!includeShader(item)) continue;
      snippets.push(item);
      addPlayable(item.id);
      repairedCodeById.set(item.id, item.code);
    }
    probeCursor = snippets.length;
  } else {
    for (const item of data) {
      if (!includeShader(item)) continue;
      if (!isAnimatedSnippet(item)) continue;
      snippets.push(item);
    }
  }

  if (!snippets.length) {
    throw new Error("No shader snippets found in shaders.json");
  }

  initSpectrumBars();
  initAudioVizCanvas();
  setAudioStatus("Idle");
  updateAudioHud();
  drawAudioVisualizer();

  warmupPlayablePool(64);
  scheduleBackgroundProbe();

  const ok = tryLoadRandom(200);
  if (!ok) {
    throw new Error("Could not compile any shader snippets from dataset");
  }

  requestAnimationFrame(draw);
})().catch((err) => {
  showError(String(err.message || err));
  titleEl.textContent = "Failed to initialize";
  console.error(err);
});
