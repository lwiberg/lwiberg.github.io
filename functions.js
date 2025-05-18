document.addEventListener("DOMContentLoaded", () => {
    function createWaveBanner(canvasId) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");
      const text = canvas.dataset.text || ""; // get text from data-text attribute
  
      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = 100;
      }
  
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
  
      const fontSize = 30;
      ctx.font = "bold 30px 'Orbitron', sans-serif";
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgb(255, 255, 255)";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
      
      document.fonts.ready.then(() => {
        draw(); // or start your animation here
      });

      let offset = 0;
  
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let x = -offset;
        const amplitude = 20;
        const frequency = 0.01;
  
        while (x < canvas.width) {
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = ctx.measureText(char).width;
            const y = canvas.height / 2 + Math.sin((x + i * 10) * frequency) * amplitude;
            ctx.fillText(char, x, y);
            x += charWidth;
          }
        }
  
        offset += .25;
        if (offset > ctx.measureText(text).width) {
          offset = 0;
        }
  
        requestAnimationFrame(draw);
      }
  
      draw();
    }
  
    // Auto-detect and initialize all canvas banners with data-text
    document.querySelectorAll("canvas[data-text]").forEach(canvas => {
      createWaveBanner(canvas.id);
    });
  });