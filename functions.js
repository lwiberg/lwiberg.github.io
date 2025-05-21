document.addEventListener("DOMContentLoaded", () => {
    function createMarqueeBanner(canvasId) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");
      const text = canvas.dataset.text || ""; // get text from data-text attribute
  
      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = 200;
      }
  
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
  
      document.fonts.ready.then(() => {
        requestAnimationFrame(draw);
      });
  
      let offset = 0;
  
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const fontSize = Math.max(20, Math.min(60, Math.floor(canvas.width * 0.05)));
        ctx.font = `bold ${fontSize}px 'Orbitron', sans-serif`;
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgb(255, 255, 255)";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;

        const amplitude = 18;
        const frequency = 0.002;
        const speed = 0.5;

        const textWidth = ctx.measureText(text).width;
        let x = -offset;

        // Draw enough text to fill the canvas plus one extra copy for seamless looping
        while (x < canvas.width + textWidth) {
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = ctx.measureText(char).width;

            // Use only px for the sine phase, not offset, for seamless looping
            const px = x;
            const py = canvas.height / 2 + Math.sin(px * frequency) * amplitude *5;

            // Tangent angle (derivative of sine)
            const dx = 1;
            const dy = Math.cos(px * frequency) * amplitude * frequency;
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

  video.addEventListener('pause', () => {
    playBtn.style.display = '';
    video.controls = false; // Hide controls when paused
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