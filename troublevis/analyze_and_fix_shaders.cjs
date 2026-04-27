const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const ROOT = __dirname;
const SHADERS_PATH = path.join(ROOT, "shaders.json");
const PLAYABLE_PATH = path.join(ROOT, "shaders.playable.json");
const FAILURES_PATH = path.join(ROOT, "shader_failures.json");
const REPORT_PATH = path.join(ROOT, "shader_requirements_report.md");
const EDGE_PATH = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ANALYZE_HEADLESS = process.env.ANALYZE_HEADLESS !== "0";
const ANALYZE_SKIP_ENRICH = process.env.ANALYZE_SKIP_ENRICH === "1";
const ANALYZE_BROWSER_ARGS = process.env.ANALYZE_BROWSER_ARGS
  ? process.env.ANALYZE_BROWSER_ARGS.split(" ").filter(Boolean)
  : [
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--use-angle=swiftshader",
      "--disable-dev-shm-usage",
      "--no-sandbox"
    ];

const SHADER_DURATION_MS = 6000;

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function isAnimatedSnippet(item) {
  if (!item || typeof item.code !== "string") return false;
  const title = String(item.title || "");
  if (/gradient/i.test(title)) return false;
  return /\biTime\b|\bt\b/.test(item.code);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inferRequirements(failure, tweetText) {
  const code = String(failure.code || "");
  const err = String(failure.error || "").toLowerCase();
  const text = String(tweetText || "");
  const hints = [];

  if (/syntax error|unexpected/i.test(err)) {
    hints.push("Likely truncated or malformed GLSL from tweet text; inspect thread/replies for missing lines.");
  }
  if (/undeclared identifier/.test(err)) {
    hints.push("Missing helper identifiers/macros; shader may depend on shorthand definitions not in the wrapper.");
  }
  if (/no matching overloaded function|cannot convert/.test(err)) {
    hints.push("Type mismatch from compact tweet code; usually needs small manual edits (vec/scalar casts, mat constructors). ");
  }
  if (/loop|for/.test(err) || /for\s*\(/.test(code)) {
    hints.push("Loop form may exceed WebGL1 restrictions; may need WebGL2 or constant-bound loop rewrite.");
  }
  if (/\biChannelResolution\b|\biChannelTime\b|\biChannelTime\b/.test(code)) {
    hints.push("Requires Shadertoy channel uniforms (iChannelResolution/iChannelTime), currently not provided.");
  }
  if (/\bmainImage\s*\(/.test(code)) {
    hints.push("Uses mainImage-style entrypoint; should be wrapped or adapted to main().");
  }
  if (/\bmain\s*\(/.test(code) && /gl_fragcolor/.test(err)) {
    hints.push("Likely WebGL2-style frag output mismatch; requires fragColor -> gl_FragColor adaptation.");
  }
  if (/\btexelFetch\b|\btextureLod\b/.test(code)) {
    hints.push("Requires WebGL2 texture functions not available in strict WebGL1 mode.");
  }
  if (/\bdFdx\b|\bdFdy\b|\bfwidth\b/.test(code)) {
    hints.push("Uses derivatives; may require OES_standard_derivatives extension.");
  }
  if (/part\s*2|thread|continued|continued\s+in\s+reply/i.test(text)) {
    hints.push("Tweet text suggests multi-post code; fetch thread continuation.");
  }
  if (!hints.length) {
    hints.push("Needs manual inspection of compile log and source; no dominant pattern detected.");
  }

  return hints;
}

async function compileInHeadlessBrowser(shaders) {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: ANALYZE_HEADLESS,
    args: ANALYZE_BROWSER_ARGS
  });

  const page = await browser.newPage();
  const result = await page.evaluate((inputShaders) => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const gl2 = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: false });
    const gl = gl2 || canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: false });
    const isWebGL2 = !!gl2;
    if (!gl) {
      return { error: "WebGL unavailable in analyzer browser", playable: [], failed: [], context: "none" };
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

    function normalizeSnippet(source, title = "") {
      if (typeof source !== "string") return "";
      let code = source.replace(/\r\n?/g, "\n").trim();
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
#define U ((FC.xy - 0.5 * r) / r.y)
#define fragCoord FC.xy
`
        : "";

  const mainImageCall = invokeMainImage ? "\n  mainImage(o, FC.xy);" : "";

      if (fullMain) {
        return `${versionLine}
precision highp float;
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
${colorCompat}
#define TANH(x) ((exp(2.0*(x)) - 1.0) / (exp(2.0*(x)) + 1.0))

#define FC gl_FragCoord
${compatBlock}
${snippet}
`;
      }

      return `${versionLine}
precision highp float;
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
${colorCompat}
#define TANH(x) ((exp(2.0*(x)) - 1.0) / (exp(2.0*(x)) + 1.0))

#define FC gl_FragCoord
${compatBlock}

void main() {
  vec2 r = iResolution.xy;
  float t = iTime;
  vec4 o = vec4(0.0);
  ${snippet}
  ${mainImageCall}
  if (o.a == 0.0) {
    gl_FragColor = vec4(o.rgb, 1.0);
  } else {
    gl_FragColor = o;
  }
}
`;
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
      return prog;
    }

    function buildProgramWithRepairs(rawSnippet, title = "") {
      const base = normalizeSnippet(rawSnippet, title);
      const noVersion = base.replace(/^\s*#version\s+\d+\s*es\s*/m, "");
      const fixedTexture = noVersion.replace(/\btexture\s*\(/g, "texture2D(");
      const fixedFragColor = fixedTexture
        .replace(/\bout\s+vec4\s+fragColor\s*;/g, "")
        .replace(/\bfragColor\b/g, "gl_FragColor");
      const fixedTanh = fixedFragColor.replace(/\btanh\s*\(/g, "TANH(");
      const hasMainImage = /\bvoid\s+mainImage\s*\(/.test(base);
      const hasMain = /\bvoid\s+main\s*\(/.test(base);

      const attempts = [
        { code: base, options: { compat: false, invokeMainImage: false }, label: "base" },
        { code: base, options: { compat: true, invokeMainImage: false }, label: "compat" },
        { code: fixedTexture, options: { compat: true, invokeMainImage: false }, label: "texture2D" },
        { code: fixedTanh, options: { compat: true, invokeMainImage: false }, label: "tanhCompat" }
      ];

      if (hasMainImage) {
        attempts.push({
          code: fixedTanh,
          options: { compat: true, invokeMainImage: true },
          label: "mainImage"
        });
      }

      if (hasMain) {
        attempts.push({
          code: fixedFragColor,
          options: { compat: true, fullMain: true },
          label: "fullMain"
        });
      }

      const errors = [];
      for (const attempt of attempts) {
        try {
          const prog = buildProgram(attempt.code, attempt.options);
          gl.deleteProgram(prog);
          return { ok: true, code: attempt.code, strategy: attempt.label };
        } catch (err) {
          errors.push(`${attempt.label}: ${String(err.message || err)}`);
        }
      }

      return { ok: false, error: errors.join("\n\n") };
    }

    const playable = [];
    const failed = [];

    for (const item of inputShaders) {
      const res = buildProgramWithRepairs(item.code, item.title);
      if (res.ok) {
        playable.push({
          id: item.id,
          title: item.title,
          url: item.url,
          code: res.code,
          strategy: res.strategy
        });
      } else {
        failed.push({
          id: item.id,
          title: item.title,
          url: item.url,
          code: item.code,
          error: res.error
        });
      }
    }

    return { playable, failed, context: isWebGL2 ? "webgl2" : "webgl1" };
  }, shaders);

  await browser.close();
  return result;
}

async function enrichFailuresWithTweetContext(failures) {
  const enriched = [];
  let idx = 0;

  for (const failure of failures) {
    idx += 1;
    const id = failure.id;
    let tweetText = "";
    let apiError = "";

    try {
      const resp = await fetch(`https://api.fxtwitter.com/XorDev/status/${id}`);
      if (!resp.ok) {
        apiError = `HTTP ${resp.status}`;
      } else {
        const json = await resp.json();
        tweetText = String(json?.tweet?.text || "");
      }
    } catch (err) {
      apiError = String(err.message || err);
    }

    const requirements = inferRequirements(failure, tweetText);
    enriched.push({
      ...failure,
      tweetText,
      apiError,
      requirements
    });

    if (idx % 20 === 0) {
      process.stdout.write(`Enriched ${idx}/${failures.length} failures\n`);
    }

    await sleep(60);
  }

  return enriched;
}

function buildMarkdownReport(stats, enrichedFailures) {
  const lines = [];
  lines.push("# Shader Compile + Requirement Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total input shaders: ${stats.total}`);
  lines.push(`- Animated non-gradient considered: ${stats.considered}`);
  lines.push(`- Analyzer GL context: ${stats.context || "unknown"}`);
  lines.push(`- Playable after automated repairs: ${stats.playable}`);
  lines.push(`- Still failing: ${stats.failed}`);
  lines.push(`- Auto-play duration: ${SHADER_DURATION_MS}ms (player default)`);
  lines.push("");

  const topHints = new Map();
  for (const f of enrichedFailures) {
    for (const r of f.requirements) {
      topHints.set(r, (topHints.get(r) || 0) + 1);
    }
  }

  lines.push("## Most Common Missing Requirements");
  lines.push("");
  const sorted = [...topHints.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  for (const [hint, count] of sorted) {
    lines.push(`- ${count}x ${hint}`);
  }
  lines.push("");

  lines.push("## First 30 Failing Shaders");
  lines.push("");
  for (const f of enrichedFailures.slice(0, 30)) {
    lines.push(`- ${f.title} (${f.id})`);
    lines.push(`  - URL: ${f.url}`);
    lines.push(`  - Compile error: ${String(f.error || "").split("\n")[0]}`);
    if (f.apiError) {
      lines.push(`  - Tweet fetch: ${f.apiError}`);
    }
    if (f.requirements && f.requirements.length) {
      lines.push(`  - Needed: ${f.requirements.join(" | ")}`);
    }
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  if (!fs.existsSync(SHADERS_PATH)) {
    throw new Error("shaders.json not found.");
  }
  if (!fs.existsSync(EDGE_PATH)) {
    throw new Error(`Edge not found at: ${EDGE_PATH}`);
  }

  const all = loadJson(SHADERS_PATH);
  const considered = all.filter(isAnimatedSnippet);

  process.stdout.write(`Total shaders: ${all.length}\n`);
  process.stdout.write(`Considered animated non-gradient: ${considered.length}\n`);
  process.stdout.write(`Compiling in ${ANALYZE_HEADLESS ? "headless" : "headful"} Edge...\n`);

  const compileResult = await compileInHeadlessBrowser(considered);
  if (compileResult.error) {
    throw new Error(compileResult.error);
  }

  const playable = compileResult.playable;
  const failed = compileResult.failed;
  const contextMode = compileResult.context || "unknown";

  process.stdout.write(`Context: ${contextMode}\n`);
  process.stdout.write(`Playable: ${playable.length}\n`);
  process.stdout.write(`Failed: ${failed.length}\n`);
  let enrichedFailures;
  if (ANALYZE_SKIP_ENRICH) {
    process.stdout.write("Skipping tweet context enrichment (ANALYZE_SKIP_ENRICH=1).\n");
    enrichedFailures = failed.map((f) => ({
      ...f,
      tweetText: "",
      apiError: "skipped",
      requirements: inferRequirements(f, "")
    }));
  } else {
    process.stdout.write("Fetching tweet context for failures...\n");
    enrichedFailures = await enrichFailuresWithTweetContext(failed);
  }

  const stats = {
    total: all.length,
    considered: considered.length,
    playable: playable.length,
    failed: failed.length,
    context: contextMode
  };

  saveJson(PLAYABLE_PATH, playable);
  saveJson(FAILURES_PATH, { stats, failures: enrichedFailures });
  fs.writeFileSync(REPORT_PATH, buildMarkdownReport(stats, enrichedFailures), "utf8");

  process.stdout.write(`Wrote ${PLAYABLE_PATH}\n`);
  process.stdout.write(`Wrote ${FAILURES_PATH}\n`);
  process.stdout.write(`Wrote ${REPORT_PATH}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
