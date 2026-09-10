document.addEventListener("DOMContentLoaded", () => {
    // Animated intro loader: "Hi, I'm Leila." then cycles through role titles
    const loader = document.getElementById('site-loader');
    if (loader) {
      const greeting = loader.querySelector('.site-loader-greeting');
      const rolesWrap = loader.querySelector('.site-loader-roles');
      const roles = Array.from(loader.querySelectorAll('.site-loader-role'));
      document.body.classList.add('loader-active');

      const showRole = (index) => {
        roles.forEach((el, i) => {
          el.classList.remove('is-current', 'is-prev');
          if (i === index) el.classList.add('is-current');
          else if (i === (index - 1 + roles.length) % roles.length) el.classList.add('is-prev');
        });
      };

      const hideLoader = () => {
        loader.classList.add('is-hidden');
        document.body.classList.remove('loader-active');
        setTimeout(() => loader.remove(), 700);
      };

      requestAnimationFrame(() => greeting.classList.add('is-visible'));

      const roleIntervalMs = 850;
      let currentIndex = 0;
      let roleInterval;

      setTimeout(() => {
        rolesWrap.classList.add('is-visible');
        showRole(currentIndex);
        roleInterval = setInterval(() => {
          currentIndex = (currentIndex + 1) % roles.length;
          showRole(currentIndex);
        }, roleIntervalMs);
      }, 700);

      setTimeout(() => {
        clearInterval(roleInterval);
        hideLoader();
      }, 700 + roles.length * roleIntervalMs + 300);
    }

    function createMarqueeBanner(canvasId) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");
      const text = canvas.dataset.text || ""; // get text from data-text attribute
      // Get concave value from data-concave attribute, default to 0
      const concave = Number(canvas.dataset.concave) === 1 ? -1 : 1;

      let offset = 0;
      let isHovered = false; // Track hover state

      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = Math.min(300, Math.floor(window.innerHeight * 0.5));
      }

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      document.fonts.ready.then(() => {
        requestAnimationFrame(draw);
      });

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const fontSize = Math.max(35, Math.min(60, Math.floor(canvas.width * 0.05)));
        ctx.font = `bold ${fontSize}px 'Orbitron', sans-serif`;
        ctx.fillStyle = "white";
        ctx.shadowColor = isHovered ? "#ffcc00" : "rgb(255, 255, 255)";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;

        const amplitude = 18;
        // Set frequency so one full sine wave fits the canvas width
        const frequency = 0.3 * (2 * Math.PI) / canvas.width;
        const speed = 0.2;

        const textWidth = ctx.measureText(text).width;
        let x = -offset;

        // The lowest part of the sine wave (min value) is at phase π/2
        // We want this to be at the center of the canvas
        // So we offset the phase by π/2 at the center
        const phaseOffset = Math.PI / 2 - frequency * (canvas.width / 2);

        // Draw enough text to fill the canvas plus one extra copy for seamless looping
        while (x < canvas.width + textWidth) {
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = ctx.measureText(char).width;

            const px = x;
            // Apply concave multiplier to amplitude
            const py = canvas.height / 2 + Math.sin(px * frequency + phaseOffset) * amplitude * 5 * concave;

            // Tangent angle (derivative of sine)
            const dx = 1;
            const dy = Math.cos(px * frequency + phaseOffset) * amplitude * frequency * concave;
            const angle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.fillText(char, 0, 0);
            ctx.restore();

            x += charWidth;
          }
        }

        // Increment offset for horizontal movement
        offset += speed;
        if (offset > textWidth) {
          offset -= textWidth; // Use -= to handle any overshoot for perfect smoothness
        }
  
        requestAnimationFrame(draw);
      }
  
      // Add hover listeners to the canvas to change the shadow color
      canvas.addEventListener("mouseenter", () => {
        isHovered = true;
      });
      canvas.addEventListener("mouseleave", () => {
        isHovered = false;
      });
  
      draw();
    }
  
    // Auto-detect and initialize all canvas banners with data-text
    document.querySelectorAll("canvas[data-text]").forEach(canvas => {
      createMarqueeBanner(canvas.id);
    });
  });

document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById('mainVideo');
  const playBtn = document.getElementById('playBtn');

  if (!video || !playBtn) {
    return;
  }

  // Initially hide controls, show play button
  video.controls = false;
  playBtn.style.display = '';

  playBtn.addEventListener('click', () => {
    video.play();
  });

  video.addEventListener('play', () => {
    playBtn.style.display = 'none';
    video.controls = true; // Show controls when playing
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".gallery-item").forEach((item) => {
    const video = item.querySelector("video");
    if (!video) {
      return;
    }

    const startPreview = () => {
      video.play().catch(() => {
        // Browsers can reject playback when the interaction is not eligible.
      });
    };

    const stopPreview = () => {
      video.pause();
      video.currentTime = 0;
    };

    item.addEventListener("mouseenter", startPreview);
    item.addEventListener("mouseleave", stopPreview);
    item.addEventListener("focus", startPreview);
    item.addEventListener("blur", stopPreview);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const showreelVideo = document.getElementById('showreelVideo');
  if (showreelVideo) {
    const showControls = () => { showreelVideo.controls = true; };
    const hideControls = () => { showreelVideo.controls = false; };
    showreelVideo.addEventListener('mouseenter', showControls);
    showreelVideo.addEventListener('mouseleave', hideControls);
    showreelVideo.addEventListener('click', showControls);

    const glow = document.getElementById('showreelGlow');
    if (glow && window.CanvasRenderingContext2D) {
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 16;
      sampleCanvas.height = 9;
      const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
      let current = { r: 255, g: 255, b: 255 };
      const damping = 0.05; // lower = smoother/slower color change
      let rafId = null;

      const sampleColor = () => {
        try {
          ctx.drawImage(showreelVideo, 0, 0, sampleCanvas.width, sampleCanvas.height);
          const data = ctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
          let r = 0, g = 0, b = 0;
          const pixelCount = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }
          r = r / pixelCount;
          g = g / pixelCount;
          b = b / pixelCount;

          current.r += (r - current.r) * damping;
          current.g += (g - current.g) * damping;
          current.b += (b - current.b) * damping;

          const rr = Math.round(current.r);
          const gg = Math.round(current.g);
          const bb = Math.round(current.b);
          glow.style.background = `radial-gradient(closest-side, rgba(${rr}, ${gg}, ${bb}, 0.45), rgba(${rr}, ${gg}, ${bb}, 0) 70%)`;
        } catch (e) {
          // ignore cross-origin/decoding errors
        }
        rafId = requestAnimationFrame(sampleColor);
      };

      showreelVideo.addEventListener('loadeddata', () => {
        if (!rafId) rafId = requestAnimationFrame(sampleColor);
      });
      if (showreelVideo.readyState >= 2) {
        rafId = requestAnimationFrame(sampleColor);
      }
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const stage = document.querySelector('.cube-stage');
  const cube = document.querySelector('.cube');
  if (!stage || !cube) return;

  let rotationY = -20; // current resting rotation, degrees
  const rotationX = 0; // locked to the vertical axis only - never reveals top/bottom
  const idleSpeed = -0.45; // deg per frame, idle auto-spin speed (negative = spins the other way)
  let velocity = idleSpeed;
  let isDragging = false;
  let lastPointerX = 0;
  let dragVelocity = 0;

  const applyTransform = () => {
    cube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
  };

  const tick = () => {
    if (!isDragging) {
      rotationY += velocity;
      // ease back toward the gentle idle auto-spin speed
      velocity += (idleSpeed - velocity) * 0.02;
    }
    applyTransform();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const onPointerDown = (e) => {
    isDragging = true;
    cube.classList.add('is-dragging');
    lastPointerX = e.clientX;
    dragVelocity = 0;
    stage.setPointerCapture && e.pointerId != null && stage.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPointerX;
    lastPointerX = e.clientX;
    rotationY += dx * 0.4;
    dragVelocity = dx * 0.4;
    applyTransform();
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    cube.classList.remove('is-dragging');
    // carry over drag momentum into the idle spin speed, then ease back to normal
    velocity = dragVelocity;
  };

  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // scrolling past the cube gives it a temporary speed boost, always spinning
  // the same (clockwise) direction regardless of scroll direction
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    if (isDragging) return;
    velocity += Math.abs(delta) * 0.015 * Math.sign(idleSpeed);
    velocity = idleSpeed < 0
      ? Math.max(-1.5, velocity)
      : Math.min(1.5, velocity);
  }, { passive: true });
});

["header", "footer"].forEach(function(section) {
  fetch("/" + section + ".html")
    .then(res => res.text())
    .then(html => {
      const el = document.getElementById(section + "-include");
      if (el) el.innerHTML = html;
      if (section === "header") initShowreelHeaderHide();
    });
});

// Hide the fixed header while the showreel video is on screen, so it plays
// without anything blocking it. Only active in landscape (wider than tall)
// viewports; on portrait/mobile the header always stays visible.
function initShowreelHeaderHide() {
  const header = document.querySelector('.site-header');
  const showreelSection = document.querySelector('.showreel-simple');
  if (!header || !showreelSection) return;

  const isLandscape = () => window.innerWidth > window.innerHeight;

  const update = () => {
    if (!isLandscape()) {
      header.classList.remove('site-header--hidden');
      return;
    }
    const rect = showreelSection.getBoundingClientRect();
    const intersecting = rect.top < window.innerHeight && rect.bottom > 0;
    header.classList.toggle('site-header--hidden', intersecting);
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

document.addEventListener("DOMContentLoaded", function() {
  // Inject fullscreen overlay HTML if not already present
  if (!document.getElementById('fullscreenOverlay')) {
    const overlayDiv = document.createElement('div');
    overlayDiv.id = 'fullscreenOverlay';
    overlayDiv.className = 'fullscreen-overlay hidden';
    overlayDiv.innerHTML = `
      <button id="closeFullscreen" class="fullscreen-close" aria-label="Close">&times;</button>
      <button id="prevFullscreen" class="fullscreen-arrow left" aria-label="Previous">&#8592;</button>
      <img id="fullscreenImg" src="" alt="Full Screen Image" style="display:none;">
      <video id="fullscreenVideo" controls style="display:none;max-width:100%;max-height:100%;background:#000;"></video>
      <button id="nextFullscreen" class="fullscreen-arrow right" aria-label="Next">&#8594;</button>
    `;
    document.body.appendChild(overlayDiv);
  }

  // Fullscreen overlay for five-item-collage and nine-item-grid
  const overlay = document.getElementById('fullscreenOverlay');
  const overlayImg = document.getElementById('fullscreenImg');
  const closeBtn = document.getElementById('closeFullscreen');
  const prevBtn = document.getElementById('prevFullscreen');
  const nextBtn = document.getElementById('nextFullscreen');

  // Support both five-item-collage and nine-item-grid
  const mediaElements = Array.from(document.querySelectorAll(
    '.five-item-collage img, .nine-item-grid img, .five-item-collage video, .nine-item-grid video, .video-row video'
  ));
  let currentIndex = 0;

  function showMedia(index) {
    currentIndex = (index + mediaElements.length) % mediaElements.length;
    const el = mediaElements[currentIndex];
    const src = el.tagName === 'VIDEO' ? el.currentSrc || el.src : el.src;

    overlayImg.style.display = 'none';
    fullscreenVideo.style.display = 'none';

    if (el.tagName === 'IMG' && src.endsWith('.webp')) {
      overlayImg.src = src;
      overlayImg.style.display = '';
    } else if (el.tagName === 'VIDEO' || src.endsWith('.mp4')) {
      fullscreenVideo.src = src;
      fullscreenVideo.style.display = '';
      fullscreenVideo.currentTime = 0;
      fullscreenVideo.play();
    } else {
      overlayImg.src = src;
      overlayImg.style.display = '';
    }
    overlay.classList.remove('hidden');
  }

  mediaElements.forEach((el, idx) => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => showMedia(idx));
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.classList.add('hidden');
      overlayImg.src = '';
      fullscreenVideo.pause();
      fullscreenVideo.src = '';
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
        overlayImg.src = '';
        fullscreenVideo.pause();
        fullscreenVideo.src = '';
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showMedia(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showMedia(currentIndex + 1);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        overlay.classList.add('hidden');
        overlayImg.src = '';
        fullscreenVideo.pause();
        fullscreenVideo.src = '';
      } else if (e.key === 'ArrowLeft') {
        showMedia(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        showMedia(currentIndex + 1);
      }
    }
  });
});
