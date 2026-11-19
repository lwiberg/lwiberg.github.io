/* Warped wireframe background. Positions are [x, y] from the top-left, in
   viewport fractions. Colors are normalized RGB values. */
const wireframeConfig = {
  gridDensity: 7.0,
  lineThickness: 0.75, // Approximate screen pixels at DPR 1.
  vortexPosition: [0.64, 0.51],
  vortexDepth: 0.85,
  distortionIntensity: 1.0,
  animationSpeed: 0.12,
  blueLight: { position: [0.68, 0.39], intensity: 1.25 },
  greenLight: { position: [0.10, 0.43], intensity: 1.15 },
  brightness: 1.0,
  backgroundColor: [24 / 255, 24 / 255, 24 / 255], // #181818
  maxPixelRatio: 1.25,
  framesPerSecond: 30
};

const wireframeVertexShader = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const wireframeFragmentShader = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_density;
uniform float u_lineThickness;
uniform vec2 u_vortex;
uniform float u_depth;
uniform float u_distortion;
uniform vec2 u_bluePosition;
uniform float u_blueIntensity;
uniform vec2 u_greenPosition;
uniform float u_greenIntensity;
uniform float u_brightness;
uniform vec3 u_background;

const vec3 NEUTRAL = vec3(126.0, 127.0, 131.0) / 255.0;
const vec3 BLUE = vec3(48.0, 102.0, 190.0) / 255.0;
const vec3 GREEN = vec3(165.0, 240.0, 158.0) / 255.0;
const vec3 HIGHLIGHT = vec3(241.0, 236.0, 226.0) / 255.0;

vec2 viewportPoint(vec2 position, float aspect) {
  return vec2((position.x - 0.5) * aspect, 0.5 - position.y);
}

mat2 rotation(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float lightField(vec2 p, vec2 center, vec2 scale) {
  vec2 d = (p - center) / scale;
  return exp(-dot(d, d) * 2.0);
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec2 center = viewportPoint(u_vortex, aspect);
  float t = u_time;
  center += vec2(0.018 * sin(t * 0.37), 0.012 * sin(t * 0.29));

  vec2 d = p - center;
  // An elliptical, slightly sheared pinch keeps the funnel asymmetric.
  vec2 funnel = vec2(d.x + 0.24 * d.y, d.y * 1.18);
  float radius = length(funnel);
  float influence = exp(-radius * radius * 2.0);
  float twist = u_distortion * (1.45 * influence + 0.10 * sin(t * 0.35 + d.x * 2.0));
  vec2 warped = rotation(twist) * funnel;
  warped *= 1.0 + u_depth / (radius + 0.16);
  warped += u_distortion * vec2(
    0.12 * sin(p.y * 3.2 + p.x * 1.5 + t * 0.35),
    0.11 * sin(p.x * 2.6 - p.y * 1.4 - t * 0.28)
  );
  warped += vec2(t * 0.012, -t * 0.008);
  warped = rotation(-0.26) * warped;

  vec2 grid = warped * u_density;
  vec2 cell = abs(fract(grid + 0.5) - 0.5);
#ifdef GL_OES_standard_derivatives
  vec2 pixelWidth = max(fwidth(grid), vec2(0.0001));
#else
  vec2 pixelWidth = vec2(u_density * (1.0 + u_depth / (radius + 0.16)) / u_resolution.y);
#endif
  vec2 lines = 1.0 - smoothstep(pixelWidth * u_lineThickness * 0.45,
                                 pixelWidth * (u_lineThickness * 0.45 + 1.0), cell);
  float line = max(lines.x, lines.y);
  float intersection = lines.x * lines.y;
  // The compressed cells recede into the dark instead of aliasing at the pinch.
  float depthFade = smoothstep(0.045, 0.25, radius);
  float densityFade = 1.0 - smoothstep(0.22, 0.75, max(pixelWidth.x, pixelWidth.y));
  float visibility = depthFade * densityFade;

  vec2 blueCenter = viewportPoint(u_bluePosition, aspect);
  vec2 greenCenter = viewportPoint(u_greenPosition, aspect);
  float blue = lightField(p, blueCenter, vec2(0.50, 0.60)) * u_blueIntensity;
  float green = lightField(p, greenCenter, vec2(0.58, 0.50)) * u_greenIntensity;
  blue *= 0.96 + 0.04 * sin(t * 0.5);
  green *= 0.96 + 0.04 * sin(t * 0.43 + 1.0);

  float nearEdge = smoothstep(0.10, 0.85, radius);
  vec3 lineColor = mix(NEUTRAL * 0.58, HIGHLIGHT * 0.82, nearEdge);
  lineColor = mix(lineColor, BLUE * 1.25, clamp(blue * 1.25, 0.0, 1.0));
  lineColor = mix(lineColor, GREEN * 0.85, clamp(green * 1.15, 0.0, 1.0));
  lineColor += HIGHLIGHT * intersection * 0.10;

  vec3 color = u_background;
  color += (BLUE * blue * 0.10 + GREEN * green * 0.055) * visibility;
  color += lineColor * line * visibility * u_brightness;
  gl_FragColor = vec4(color, 1.0);
}
`;

(() => {
  const canvas = document.querySelector('.wireframe-background');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false
  });
  if (!gl) {
    console.warn('Wireframe background: WebGL is unavailable; using the static background.');
    return;
  }

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let program;
  let buffer;
  let uniforms;
  let frameRequest = null;
  let lastFrame = 0;
  let elapsed = 0;
  let contextLost = false;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to create shader.');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compilation failed: ' + message);
    }
    return shader;
  }

  function initialize() {
    gl.getExtension('OES_standard_derivatives');
    const vertex = compileShader(gl.VERTEX_SHADER, wireframeVertexShader);
    const fragment = compileShader(gl.FRAGMENT_SHADER, wireframeFragmentShader);
    program = gl.createProgram();
    if (!program) throw new Error('Unable to create shader program.');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Shader linking failed: ' + gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);
    buffer = gl.createBuffer();
    if (!buffer) throw new Error('Unable to create vertex buffer.');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    uniforms = {};
    for (const name of ['resolution', 'time', 'density', 'lineThickness', 'vortex', 'depth',
      'distortion', 'bluePosition', 'blueIntensity', 'greenPosition', 'greenIntensity',
      'brightness', 'background']) {
      uniforms[name] = gl.getUniformLocation(program, 'u_' + name);
    }
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, wireframeConfig.maxPixelRatio);
    const width = Math.max(1, Math.round(window.innerWidth * ratio));
    const height = Math.max(1, Math.round(window.innerHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    if (!contextLost) gl.viewport(0, 0, width, height);
    if (!contextLost && !document.hidden) draw();
  }

  function draw() {
    const c = wireframeConfig;
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, elapsed * c.animationSpeed);
    gl.uniform1f(uniforms.density, c.gridDensity);
    gl.uniform1f(uniforms.lineThickness, c.lineThickness * canvas.height / Math.max(1, window.innerHeight));
    gl.uniform2fv(uniforms.vortex, c.vortexPosition);
    gl.uniform1f(uniforms.depth, c.vortexDepth);
    gl.uniform1f(uniforms.distortion, c.distortionIntensity);
    gl.uniform2fv(uniforms.bluePosition, c.blueLight.position);
    gl.uniform1f(uniforms.blueIntensity, c.blueLight.intensity);
    gl.uniform2fv(uniforms.greenPosition, c.greenLight.position);
    gl.uniform1f(uniforms.greenIntensity, c.greenLight.intensity);
    gl.uniform1f(uniforms.brightness, c.brightness);
    gl.uniform3fv(uniforms.background, c.backgroundColor);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function tick(now) {
    frameRequest = null;
    if (document.hidden || motionPreference.matches || contextLost) return;
    if (!lastFrame || now - lastFrame >= 1000 / wireframeConfig.framesPerSecond - 1) {
      if (lastFrame) elapsed += (now - lastFrame) / 1000;
      lastFrame = now;
      draw();
    }
    frameRequest = requestAnimationFrame(tick);
  }

  function updatePlayback() {
    if (frameRequest !== null) cancelAnimationFrame(frameRequest);
    frameRequest = null;
    lastFrame = 0;
    if (!contextLost && !document.hidden) {
      draw();
      if (!motionPreference.matches) frameRequest = requestAnimationFrame(tick);
    }
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    canvas.style.display = 'none';
    updatePlayback();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    try {
      initialize();
      resize();
      canvas.style.display = '';
      updatePlayback();
    } catch (error) {
      contextLost = true;
      console.error('Wireframe background could not be restored:', error);
    }
  });
  document.addEventListener('visibilitychange', updatePlayback);
  if (motionPreference.addEventListener) {
    motionPreference.addEventListener('change', updatePlayback);
  } else {
    motionPreference.addListener(updatePlayback);
  }
  window.addEventListener('resize', resize);

  try {
    initialize();
    resize();
    updatePlayback();
  } catch (error) {
    contextLost = true;
    canvas.style.display = 'none';
    console.error('Wireframe background could not start:', error);
  }
})();
