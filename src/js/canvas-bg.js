/**
 * Hotwire Interactive - Brutalist Square Spark Matrix
 * Flat solid pixel particles rising with zero gradients or blurs
 */

export function initCanvasBackground(canvasId = 'cyber-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.setAttribute('aria-hidden', 'true');

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const sparks = [];
  const sparkCount = Math.min(Math.floor((width * height) / 20000), 45);
  const mouse = { x: null, y: null, radius: 140 };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Flat brutalist solid colors (No gradients)
  const COLORS = ['#FF5D1B', '#FF5D1B', '#FFAA00', '#FFFFFF', '#FF6E2D'];

  class BrutalSpark {
    constructor(initial = false) {
      this.reset(initial);
    }

    reset(initial = false) {
      this.x = Math.floor(Math.random() * (width / 4)) * 4;
      this.y = initial ? Math.floor(Math.random() * height) : height + 10;
      this.size = Math.random() > 0.8 ? 3 : 2;
      this.vy = -(Math.random() * 0.9 + 0.4);
      this.vx = (Math.random() - 0.5) * 0.3;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha = Math.random() * 0.4 + 0.3;
    }

    update() {
      this.y += this.vy;
      this.x += this.vx;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 1.5;
          this.y -= Math.sin(angle) * force * 1.5;
        }
      }

      if (this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      // Sharp brutalist square pixel
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
    }
  }

  for (let i = 0; i < sparkCount; i++) {
    sparks.push(new BrutalSpark(true));
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < sparks.length; i++) {
      sparks[i].update();
      sparks[i].draw();
    }

    ctx.globalAlpha = 1.0;
    animationFrameId = requestAnimationFrame(animate);
  }

  if (prefersReducedMotion) {
    ctx.clearRect(0, 0, width, height);
    sparks.forEach((spark) => spark.draw());
  } else {
    animate();
  }

  function handleResize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function handleMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function handleMouseLeave() {
    mouse.x = null;
    mouse.y = null;
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseleave', handleMouseLeave);
  };
}
