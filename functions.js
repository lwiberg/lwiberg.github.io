document.addEventListener("DOMContentLoaded", () => {
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
        canvas.height = 300;
      }

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      document.fonts.ready.then(() => {
        requestAnimationFrame(draw);
      });

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const fontSize = Math.max(20, Math.min(60, Math.floor(canvas.width * 0.05)));
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

["header", "footer"].forEach(function(section) {
  fetch("/" + section + ".html")
    .then(res => res.text())
    .then(html => {
      const el = document.getElementById(section + "-include");
      if (el) el.innerHTML = html;
    });
});

document.addEventListener("DOMContentLoaded", function() {
  // Inject fullscreen overlay HTML if not already present
  if (!document.getElementById('fullscreenOverlay')) {
    const overlayDiv = document.createElement('div');
    overlayDiv.id = 'fullscreenOverlay';
    overlayDiv.className = 'fullscreen-overlay hidden';
    overlayDiv.innerHTML = `
      <button id="closeFullscreen" class="fullscreen-close" aria-label="Close">&times;</button>
      <button id="prevFullscreen" class="fullscreen-arrow left" aria-label="Previous">&#8592;</button>
      <img id="fullscreenImg" src="" alt="Full Screen Image">
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
  const images = Array.from(document.querySelectorAll('.five-item-collage img, .nine-item-grid img'));
  let currentIndex = 0;

  function showImage(index) {
    currentIndex = (index + images.length) % images.length;
    overlayImg.src = images[currentIndex].src;
    overlay.classList.remove('hidden');
  }

  images.forEach((img, idx) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => showImage(idx));
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.classList.add('hidden');
      overlayImg.src = '';
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
        overlayImg.src = '';
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(currentIndex + 1);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        overlay.classList.add('hidden');
        overlayImg.src = '';
      } else if (e.key === 'ArrowLeft') {
        showImage(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        showImage(currentIndex + 1);
      }
    }
  });
});

