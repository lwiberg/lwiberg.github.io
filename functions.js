(() => {
  if (sessionStorage.getItem('homepage-loader-shown') === 'true') {
    document.documentElement.classList.add('site-loader-seen');
  }
})();

document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById('site-loader');
    if (loader) {
      if (document.documentElement.classList.contains('site-loader-seen')) {
        loader.remove();
      } else {
        sessionStorage.setItem('homepage-loader-shown', 'true');
        document.body.classList.add('loader-active');

        const removeLoader = () => {
          document.body.classList.remove('loader-active');
          loader.remove();
        };

        loader.addEventListener('animationend', (event) => {
          if (event.target === loader && event.animationName === 'site-loader-exit') {
            removeLoader();
          }
        });

        setTimeout(() => {
          if (loader.isConnected) removeLoader();
        }, 4500);
      }
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function setupStretchLine(line, resizeTarget, maxScale = Infinity) {
      const text = line.firstElementChild;
      const signature = text.querySelector('.homepage-hero-signature');
      const characters = Array.from(signature
        ? text.textContent.slice(signature.textContent.length)
        : text.textContent);
      text.textContent = '';
      if (signature) text.appendChild(signature);
      text.classList.add('homepage-hero-letters');
      text.setAttribute('aria-hidden', 'true');

      const letters = characters.map(character => {
        const letter = document.createElement('span');
        const glyph = document.createElement('span');
        letter.className = 'homepage-hero-letter';
        glyph.textContent = character;
        letter.appendChild(glyph);
        text.appendChild(letter);
        return letter;
      });

      let activeLetter = null;
      let widths = [];

      const reset = () => {
        activeLetter = null;
        letters.forEach(letter => letter.style.removeProperty('--letter-scale'));
      };

      const measure = () => {
        widths = letters.map(letter => parseFloat(getComputedStyle(letter.firstElementChild).width));
        text.style.setProperty('--line-width', `${widths.reduce((sum, width) => sum + width, 0)}px`);
        letters.forEach((letter, index) => {
          letter.style.setProperty('--letter-width', `${widths[index]}px`);
        });
        reset();
      };

      line.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch' || reducedMotion.matches ||
            line.classList.contains('is-entrance-fade') ||
            line.classList.contains('is-entrance-flourish')) return;
        const letter = event.target.closest('.homepage-hero-letter');
        if (!letter || !text.contains(letter) || !letter.textContent.trim()) {
          if (activeLetter) reset();
          return;
        }
        if (letter === activeLetter) return;

        const index = letters.indexOf(letter);
        const total = widths.reduce((sum, width) => sum + width, 0);
        const selectedWidth = widths[index];
        const remaining = total - selectedWidth;
        if (!selectedWidth || !remaining) return;

        const selectedScale = Math.min(total * 0.45 / selectedWidth, maxScale);
        const otherScale = (total - selectedWidth * selectedScale) / remaining;
        activeLetter = letter;
        letters.forEach(item => {
          item.style.setProperty('--letter-scale', item === letter ? selectedScale : otherScale);
        });
      });
      line.addEventListener('pointerleave', () => {
        if (!line.classList.contains('is-entrance-fade') &&
            !line.classList.contains('is-entrance-flourish')) reset();
      });
      reducedMotion.addEventListener('change', reset);
      new ResizeObserver(measure).observe(resizeTarget);
      measure();
      document.fonts.ready.then(measure);
      return reset;
    }

    const heroName = document.querySelector('.homepage-hero-name');
    if (heroName) {
      const lines = Array.from(heroName.children);
      heroName.setAttribute('aria-label', lines.map(line => line.textContent.trim()).join(' '));
      lines.forEach(line => setupStretchLine(line, heroName));
    }

    document.querySelectorAll('.contact-banner-stretch').forEach(line => {
      line.setAttribute('aria-label', line.textContent.trim());
      setupStretchLine(line, line, 2.2);
    });

    document.querySelectorAll('.section-marker-title').forEach(sectionTitle => {
      sectionTitle.setAttribute('aria-label', sectionTitle.textContent.trim());
      const resetStretch = setupStretchLine(sectionTitle, sectionTitle, 2.5);

      if ('IntersectionObserver' in window) {
        const letters = Array.from(sectionTitle.querySelectorAll('.homepage-hero-letter'));
        const flourishLetter = letters.find(letter => letter.textContent.trim());
        if (flourishLetter) flourishLetter.classList.add('is-flourish-letter');
        const startEntrance = () => {
          resetStretch();
          sectionTitle.classList.add('is-entrance-fade');
        };
        const observer = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return;
          if (!reducedMotion.matches) startEntrance();
          observer.disconnect();
        }, { threshold: 0.1 });
        observer.observe(sectionTitle);
        sectionTitle.addEventListener('animationend', event => {
          if (event.target === sectionTitle.firstElementChild &&
              event.animationName === 'section-marker-entrance') {
            sectionTitle.classList.remove('is-entrance-fade');
            if (flourishLetter) {
              const firstWidth = parseFloat(flourishLetter.style.getPropertyValue('--letter-width'));
              const total = letters.reduce((sum, letter) =>
                sum + parseFloat(letter.style.getPropertyValue('--letter-width')), 0);
              const remaining = total - firstWidth;
              sectionTitle.style.setProperty('--flourish-others-wide', (total - firstWidth * 0.55) / remaining);
              sectionTitle.style.setProperty('--flourish-others-narrow', (total - firstWidth * 1.3) / remaining);
              sectionTitle.classList.add('is-entrance-flourish');
            }
          } else if (event.target === flourishLetter &&
                     event.animationName === 'section-marker-flourish-width') {
            sectionTitle.classList.remove('is-entrance-flourish');
          }
        });
        reducedMotion.addEventListener('change', () => {
          if (!reducedMotion.matches) return;
          resetStretch();
          sectionTitle.classList.remove('is-entrance-fade', 'is-entrance-flourish');
        });
      }
    });

    function createMarqueeBanner(canvasId) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");
      const text = canvas.dataset.text || ""; // get text from data-text attribute
      // Get concave value from data-concave attribute, default to 0
      const concave = Number(canvas.dataset.concave) === 1 ? -1 : 1;

      let offset = 0;
      let previousFrameTime = null;
      let measuredFont = "";
      let characters = [];
      let textWidth = 0;
      let isHovered = false; // Track hover state
      const narrowLayout = window.matchMedia("(max-width: 600px)");
      const rootStyles = getComputedStyle(document.documentElement);
      const inkColor = rootStyles.getPropertyValue("--ink").trim() || "#f1ece2";

      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = Math.min(300, Math.floor(window.innerHeight * 0.5));
      }

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      document.fonts.ready.then(() => {
        requestAnimationFrame(draw);
      });

      function draw(frameTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const fontSize = Math.max(52, Math.min(96, Math.floor(canvas.width * 0.08)));
        const font = `900 ${fontSize}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
        ctx.font = font;
        ctx.fillStyle = inkColor;
        ctx.shadowColor = "#181818";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = isHovered || narrowLayout.matches ? 8 : 4;

        const amplitude = 18;
        // Set frequency so one full sine wave fits the canvas width
        const frequency = 0.3 * (2 * Math.PI) / canvas.width;
        const pixelsPerSecond = 21;

        if (measuredFont !== font) {
          characters = Array.from(text, (char) => ({
            char,
            width: ctx.measureText(char).width
          }));
          textWidth = characters.reduce((width, character) => width + character.width, 0);
          measuredFont = font;
          offset = textWidth > 0 ? offset % textWidth : 0;
        }
        let x = -offset;

        // The lowest part of the sine wave (min value) is at phase π/2
        // We want this to be at the center of the canvas
        // So we offset the phase by π/2 at the center
        const phaseOffset = Math.PI / 2 - frequency * (canvas.width / 2);

        // Draw enough text to fill the canvas plus one extra copy for seamless looping
        while (x < canvas.width + textWidth) {
          characters.forEach(({ char, width: charWidth }) => {
            const px = x;
            // Apply concave multiplier to amplitude
            const py = canvas.height / 2 + 25 + Math.sin(px * frequency + phaseOffset) * amplitude * 5 * concave;

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
          });
        }

        if (previousFrameTime !== null && textWidth > 0) {
          const elapsed = Math.min(frameTime - previousFrameTime, 50);
          offset = (offset + pixelsPerSecond * elapsed / 1000) % textWidth;
        }
        previousFrameTime = frameTime;
  
        requestAnimationFrame(draw);
      }
  
      // Add hover listeners to the canvas to change the shadow color
      canvas.addEventListener("mouseenter", () => {
        isHovered = true;
      });
      canvas.addEventListener("mouseleave", () => {
        isHovered = false;
      });
    }
  
    // Auto-detect and initialize all canvas banners with data-text
    document.querySelectorAll("canvas[data-text]").forEach(canvas => {
      createMarqueeBanner(canvas.id);
    });
  });

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector('.showreel-page')) {
    document.documentElement.classList.add('has-showreel-scroll-snap');
    const showreels = [...document.querySelectorAll('.showreel-entry')];
    let centeringFrame;
    let lastWheelTime = 0;

    const isReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const settleNearestShowreel = () => {
      if (isReducedMotion.matches || document.querySelector('.showreel-frame.is-playing')) return;

      const viewportCenter = innerHeight / 2;
      const nearest = showreels.reduce((best, section) => {
        const frame = section.querySelector('.showreel-frame');
        const rect = frame.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        return !best || distance < best.distance ? { section, frame, distance } : best;
      }, null);

      if (!nearest || nearest.distance > 0.22 * innerHeight) return;
      const destination = scrollY + nearest.frame.getBoundingClientRect().top -
        (innerHeight - nearest.frame.offsetHeight) / 2;
      window.scrollTo({ top: destination, behavior: 'smooth' });
    };

    window.addEventListener('wheel', () => {
      lastWheelTime = performance.now();
      clearTimeout(centeringFrame);
      centeringFrame = setTimeout(() => {
        if (performance.now() - lastWheelTime >= 120) settleNearestShowreel();
      }, 120);
    }, { passive: true });
  }

  document.querySelectorAll('.custom-video-wrapper').forEach((wrapper) => {
    const video = wrapper.querySelector('video');
    const playBtn = wrapper.querySelector('.play-btn');

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
      wrapper.classList.add('is-playing');
      playBtn.style.display = 'none';
      video.controls = true; // Show controls when playing
    });

    if (playBtn.classList.contains('showreel-play-btn')) {
      playBtn.addEventListener('pointermove', event => {
        const rect = playBtn.getBoundingClientRect();
        playBtn.style.setProperty('--showreel-cursor-x', `${event.clientX - rect.left}px`);
        playBtn.style.setProperty('--showreel-cursor-y', `${event.clientY - rect.top}px`);
      });

      playBtn.addEventListener('pointerenter', () => {
        wrapper.classList.add('is-previewing');
      });

      playBtn.addEventListener('pointerleave', () => {
        wrapper.classList.remove('is-previewing');
      });
    }
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
  document.querySelectorAll('.chinesecars-storyboards').forEach((section) => {
    const carousel = section.querySelector('.chinesecars-carousel');
    const previousButton = section.querySelector('.chinesecars-carousel-button.is-previous');
    const nextButton = section.querySelector('.chinesecars-carousel-button.is-next');
    const firstPair = carousel?.querySelector('.chinesecars-storyboard-pair');

    if (!carousel || !previousButton || !nextButton || !firstPair) return;

    let autoAdvanceTimer;
    let hasInteracted = false;

    const getScrollStep = () => {
      const track = carousel.querySelector('.chinesecars-carousel-track');
      const gap = track ? parseFloat(getComputedStyle(track).columnGap) || 0 : 0;
      return firstPair.getBoundingClientRect().width + gap;
    };

    const updateButtons = () => {
      const maximumScroll = carousel.scrollWidth - carousel.clientWidth;
      previousButton.disabled = carousel.scrollLeft <= 1;
      nextButton.disabled = carousel.scrollLeft >= maximumScroll - 1;
    };

    const pauseAutoAdvance = () => {
      if (!autoAdvanceTimer) return;
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = undefined;
    };

    const stopAutoAdvance = () => {
      hasInteracted = true;
      pauseAutoAdvance();
    };

    const move = (direction) => {
      carousel.scrollBy({ left: direction * getScrollStep(), behavior: 'smooth' });
    };

    previousButton.addEventListener('click', () => {
      stopAutoAdvance();
      move(-1);
    });

    nextButton.addEventListener('click', () => {
      stopAutoAdvance();
      move(1);
    });

    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((eventName) => {
      carousel.addEventListener(eventName, stopAutoAdvance, { passive: true });
    });

    carousel.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Pages can slow the auto-advance (e.g. when slides carry their own animation).
    const autoAdvanceInterval = Number(section.dataset.carouselInterval) || 1500;

    const startAutoAdvance = () => {
      if (hasInteracted || autoAdvanceTimer || carousel.scrollWidth <= carousel.clientWidth) return;
      autoAdvanceTimer = setInterval(() => {
        const maximumScroll = carousel.scrollWidth - carousel.clientWidth;
        if (carousel.scrollLeft >= maximumScroll - 1) {
          carousel.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          move(1);
        }
      }, autoAdvanceInterval);
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        startAutoAdvance();
      } else {
        pauseAutoAdvance();
      }
    }, { threshold: 0.2 });

    visibilityObserver.observe(section);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector('.chinesecars-character-carousel');
  if (!carousel) return;

  const stage = carousel.querySelector('.chinesecars-character-stage');
  const slides = Array.from(carousel.querySelectorAll('.chinesecars-character-slide'));
  const caption = carousel.querySelector('.chinesecars-character-caption');
  const previousButton = carousel.querySelector('.chinesecars-character-arrow.is-previous');
  const nextButton = carousel.querySelector('.chinesecars-character-arrow.is-next');

  if (!stage || !caption || !previousButton || !nextButton || slides.length < 2) return;

  let currentIndex = 0;
  let isTransitioning = false;

  const showSlide = (nextIndex, direction = 1) => {
    if (isTransitioning || nextIndex === currentIndex) return;

    isTransitioning = true;
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[nextIndex];
    nextSlide.classList.add('is-entering');
    nextSlide.classList.toggle('is-reverse', direction < 0);
    caption.textContent = nextSlide.dataset.caption;

    void nextSlide.offsetWidth;
    nextSlide.classList.add('is-wiping');

    const finishTransition = () => {
      currentSlide.classList.remove('is-active');
      nextSlide.classList.remove('is-entering', 'is-reverse', 'is-wiping');
      nextSlide.classList.add('is-active');
      currentIndex = nextIndex;
      isTransitioning = false;
    };

    nextSlide.addEventListener('transitionend', finishTransition, { once: true });
    setTimeout(() => {
      if (isTransitioning && nextSlide.classList.contains('is-entering')) finishTransition();
    }, 900);
  };

  const move = (direction) => {
    const nextIndex = (currentIndex + direction + slides.length) % slides.length;
    showSlide(nextIndex, direction);
  };

  previousButton.addEventListener('click', (event) => {
    event.stopPropagation();
    move(-1);
  });

  nextButton.addEventListener('click', (event) => {
    event.stopPropagation();
    move(1);
  });

  stage.addEventListener('click', () => move(1));
});

document.addEventListener("DOMContentLoaded", () => {
  // On touch devices the native controls are hidden by CSS until the video is tapped.
  document.querySelectorAll('video[controls]').forEach((video) => {
    video.addEventListener('click', () => video.classList.add('show-controls'), { once: true });
  });

  document.querySelectorAll('.chinesecars-animation-grid video,  .nokia-process-section video, .nokia-cool-clips video, .sagrada-project .nokia-details-media video').forEach((video) => {
    const startPreview = () => {
      video.controls = true;
      video.play().catch(() => {
        // Browsers can reject playback before the media is ready.
      });
    };

    const stopPreview = () => {
      if (!video.autoplay) video.pause();
      video.controls = false;
    };

    video.controls = false;
    video.addEventListener('mouseenter', startPreview);
    video.addEventListener('mouseleave', stopPreview);
    video.addEventListener('focus', startPreview);
    video.addEventListener('blur', stopPreview);
  });
});

// Pages like the Nokia project contain dozens of looping autoplay videos.
// Letting all of them decode at once exhausts the browser's hardware video
// decoders and can crash the GPU compositor (black screen / flicker), so only
// play the ones that are near the viewport and pause the rest.
document.addEventListener("DOMContentLoaded", () => {
  if (!('IntersectionObserver' in window)) return;

  const videos = Array.from(document.querySelectorAll('video[autoplay][loop]'))
    .filter((video) => !video.closest('.gallery-item'));
  if (videos.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) {
        if (video.paused) {
          video.play().catch(() => {
            // Autoplay may be rejected; nothing to do.
          });
        }
      } else if (!video.paused) {
        video.pause();
      }
    });
  }, { rootMargin: '200px 0px' });

  videos.forEach((video) => observer.observe(video));
});

document.addEventListener('DOMContentLoaded', () => {
  const background = document.querySelector('.homepage-background');
  const video = background?.querySelector('.homepage-background-video');
  const toggle = background?.querySelector('.homepage-background-toggle');
  if (!video || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1200px)');
  let visible = !('IntersectionObserver' in window);
  let userPaused = false;

  const updatePlayback = () => {
    toggle.hidden = reducedMotion.matches;
    video.hidden = reducedMotion.matches;

    if (reducedMotion.matches) {
      video.pause();
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      return;
    }

    if (!visible || document.hidden || userPaused) {
      video.pause();
      return;
    }

    const source = desktop.matches
      ? '/images/homepage-background.mp4'
      : '/images/homepage-background-half.mp4';
    if (video.getAttribute('src') !== source) {
      video.src = source;
    }
    video.play().catch((error) => {
      if (error.name !== 'AbortError') {
        console.warn('Unable to play homepage background video.', error);
      }
    });
  };

  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.textContent = userPaused ? 'Play background' : 'Pause background';
    updatePlayback();
  });
  video.addEventListener('error', () => {
    if (!video.error) return;
    console.warn('Unable to load homepage background video.', video.error);
    video.hidden = true;
    toggle.hidden = true;
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    }, { rootMargin: '200px 0px' });
    observer.observe(background);
  }
  desktop.addEventListener('change', updatePlayback);
  reducedMotion.addEventListener('change', updatePlayback);
  document.addEventListener('visibilitychange', updatePlayback);
  updatePlayback();
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.sagrada-lod-comparison').forEach((comparison) => {
    const range = comparison.querySelector('.sagrada-lod-range');
    if (!range) return;

    const updateComparison = () => {
      comparison.style.setProperty('--position', `${range.value}%`);
      const comparisonLabel = range.dataset.comparisonLabel || 'optimized';
      range.setAttribute('aria-valuetext', `${range.value}% ${comparisonLabel}`);
    };

    range.addEventListener('input', updateComparison);
    range.addEventListener('keydown', (event) => {
      const value = Number(range.value);
      let nextValue;

      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        nextValue = value - 1;
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        nextValue = value + 1;
      } else if (event.key === 'Home') {
        nextValue = 0;
      } else if (event.key === 'End') {
        nextValue = 100;
      } else {
        return;
      }

      event.preventDefault();
      range.value = String(Math.max(0, Math.min(100, nextValue)));
      updateComparison();
    });
    updateComparison();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const showcase = document.querySelector('[data-skill-showcase]');
  if (!showcase) return;

  const skillList = showcase.querySelector('.skill-showcase-list');
  const options = [...showcase.querySelectorAll('[data-skill]')];
  const backgrounds = [...showcase.querySelectorAll('[data-skill-image]')];
  const modelingFrames = [...showcase.querySelectorAll('.skill-showcase-modeling-frame')];
  if (!skillList || !options.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let modelingFrameIndex = 0;
  let modelingTransitionTimer;
  let modelingCleanupTimer;
  let modelingLayer = 1;
  let autoAdvanceTimer;
  let isHovered = false;
  let isFocused = false;
  let isVisible = !('IntersectionObserver' in window);

  const resetModelingSequence = () => {
    modelingFrameIndex = 0;
    modelingLayer = 1;
    modelingFrames.forEach((frame, index) => {
      frame.classList.toggle('is-visible', index === 0);
      frame.style.zIndex = index === 0 ? '1' : '0';
    });
  };

  const stopModelingSequence = () => {
    clearInterval(modelingTransitionTimer);
    clearTimeout(modelingCleanupTimer);
    modelingTransitionTimer = undefined;
    modelingCleanupTimer = undefined;
  };

  const startModelingSequence = () => {
    stopModelingSequence();
    resetModelingSequence();
    if (reducedMotion.matches || modelingFrames.length < 2) return;

    modelingTransitionTimer = setInterval(() => {
      const previousFrame = modelingFrames[modelingFrameIndex];
      modelingFrameIndex = (modelingFrameIndex + 1) % modelingFrames.length;
      const nextFrame = modelingFrames[modelingFrameIndex];

      modelingLayer += 1;
      nextFrame.style.zIndex = String(modelingLayer);
      nextFrame.classList.remove('is-visible');
      requestAnimationFrame(() => {
        nextFrame.classList.add('is-visible');
      });

      modelingCleanupTimer = setTimeout(() => {
        previousFrame.classList.remove('is-visible');
        previousFrame.style.zIndex = '0';
      }, 450);
    }, 500);
  };

  const activateSkill = (skill) => {
    options.forEach((option) => {
      const isActive = option.dataset.skill === skill;
      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-pressed', String(isActive));
    });

    backgrounds.forEach((background) => {
      const isActive = background.dataset.skillImage === skill;
      background.classList.toggle('is-active', isActive);

      if (background instanceof HTMLVideoElement) {
        if (isActive) {
          background.play().catch((error) => {
            console.warn('Unable to play skill background video.', error);
          });
        } else {
          background.pause();
        }
      }
    });

    if (skill === '3d-modeling') {
      startModelingSequence();
    } else {
      stopModelingSequence();
    }
  };

  const updateAutoAdvance = () => {
    if (!isVisible || document.hidden || isHovered || isFocused || reducedMotion.matches || options.length < 2) {
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = undefined;
      return;
    }

    if (autoAdvanceTimer !== undefined) return;
    autoAdvanceTimer = setInterval(() => {
      const currentIndex = options.findIndex((option) => option.classList.contains('is-active'));
      activateSkill(options[(currentIndex + 1) % options.length].dataset.skill);
    }, 2500);
  };

  skillList.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    isHovered = true;
    updateAutoAdvance();
  });
  skillList.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    isHovered = false;
    updateAutoAdvance();
  });
  skillList.addEventListener('focusin', () => {
    isFocused = true;
    updateAutoAdvance();
  });
  skillList.addEventListener('focusout', (event) => {
    if (skillList.contains(event.relatedTarget)) return;
    isFocused = false;
    updateAutoAdvance();
  });

  options.forEach((option) => {
    const activate = () => activateSkill(option.dataset.skill);
    option.addEventListener('pointerenter', activate);
    option.addEventListener('focus', activate);
    option.addEventListener('click', activate);
  });

  startModelingSequence();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      updateAutoAdvance();
    }, { threshold: 0.1 });
    observer.observe(showcase);
  }
  document.addEventListener('visibilitychange', updateAutoAdvance);
  reducedMotion.addEventListener('change', () => {
    if (options.some((option) => option.dataset.skill === '3d-modeling' && option.classList.contains('is-active'))) {
      if (reducedMotion.matches) {
        stopModelingSequence();
        resetModelingSequence();
      } else {
        startModelingSequence();
      }
    }
    updateAutoAdvance();
  });
  updateAutoAdvance();
});

// About page FAQ: fill in today's date wherever [data-today] appears.
document.querySelectorAll('[data-today]').forEach((el) => {
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  el.setAttribute('datetime', now.toISOString().slice(0, 10));
});

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-copy-contact-email]');
  if (!target) return;
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed && target.contains(selection.anchorNode)) return;
  event.preventDefault();

  const email = target.dataset.copyContactEmail;
  const message = document.querySelector('[data-contact-copy-message]');
  let copied = false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(email);
      copied = true;
    } catch (error) {
      console.warn('Unable to copy contact email.', error);
    }
  }

  if (!copied) {
    const input = document.createElement('textarea');
    input.value = email;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    copied = document.execCommand('copy');
    input.remove();
  }

  if (message) {
    clearTimeout(message._hideTimer);
    message.textContent = copied ? 'email copied to clipboard' : 'Unable to copy email';
    message.classList.add('is-visible');
    message._hideTimer = setTimeout(() => message.classList.remove('is-visible'), 2400);
  }
});

["header", "footer"].forEach(function(section) {
  fetch("/" + section + ".html", { cache: "no-store" })
    .then(res => res.text())
    .then(html => {
      const el = document.getElementById(section + "-include");
      if (el) el.innerHTML = html;
      if (section === "header" && el) {
        const normalizePath = path => path.replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/';
        const currentPath = normalizePath(window.location.pathname);
        el.querySelectorAll('.nav-center > .nav-link').forEach(link => {
          if (normalizePath(link.pathname) === currentPath) {
            link.setAttribute('aria-current', 'page');
          }
        });
        initShowreelHeaderHide();
      }
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
