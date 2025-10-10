import React, { useEffect, useRef } from 'react';

export const FireworksBackground = ({ 
  className = '', 
  population = 8,
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const fireworksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.gravity = 0.05;
        this.friction = 0.98;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life--;
      }

      draw(ctx) {
        const alpha = this.life / this.maxLife;
        const size = (this.life / this.maxLife) * 3 + 1; // Variable size
        
        // Draw glow effect
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main particle
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
      }

      isDead() {
        return this.life <= 0;
      }
    }

    class Firework {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetY = Math.random() * (canvas.offsetHeight * 0.4) + canvas.offsetHeight * 0.1;
        this.speed = Math.random() * 3 + 4;
        this.particles = [];
        this.exploded = false;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.trail = [];
      }

      update() {
        if (!this.exploded) {
          this.y -= this.speed;
          this.trail.push({ x: this.x, y: this.y, life: 10 });
          this.trail = this.trail.filter(t => t.life-- > 0);

          if (this.y <= this.targetY) {
            this.explode();
          }
        } else {
          this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
          });
        }
      }

      explode() {
        this.exploded = true;
        const particleCount = Math.random() * 50 + 40; // More particles
        
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const velocity = Math.random() * 6 + 3; // Higher velocity
          const vx = Math.cos(angle) * velocity;
          const vy = Math.sin(angle) * velocity;
          const life = Math.random() * 80 + 60; // Longer life
          
          this.particles.push(new Particle(this.x, this.y, vx, vy, this.color, life));
        }

        // Add more random scattered particles for density
        for (let i = 0; i < 20; i++) {
          const vx = (Math.random() - 0.5) * 12;
          const vy = (Math.random() - 0.5) * 12;
          const life = Math.random() * 60 + 40;
          
          this.particles.push(new Particle(this.x, this.y, vx, vy, this.color, life));
        }
        
        // Add some streaking particles
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const vx = Math.cos(angle) * (Math.random() * 8 + 4);
          const vy = Math.sin(angle) * (Math.random() * 8 + 4);
          const life = Math.random() * 100 + 80;
          
          this.particles.push(new Particle(this.x, this.y, vx, vy, this.color, life));
        }
      }

      draw(ctx) {
        // Draw trail
        this.trail.forEach((point, index) => {
          const alpha = point.life / 10;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw rocket
        if (!this.exploded) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw particles
        this.particles.forEach(p => p.draw(ctx));
        ctx.globalAlpha = 1;
      }

      isDead() {
        return this.exploded && this.particles.length === 0;
      }
    }

    const createFirework = () => {
      const x = Math.random() * canvas.offsetWidth;
      const y = canvas.offsetHeight;
      fireworksRef.current.push(new Firework(x, y));
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // More transparent for trails
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Create new fireworks based on population - more frequent
      if (Math.random() < population / 50) { // Doubled the frequency
        createFirework();
      }
      
      // Sometimes create multiple fireworks at once for intensity
      if (Math.random() < 0.02) {
        for (let i = 0; i < 3; i++) {
          createFirework();
        }
      }

      // Update and draw fireworks
      fireworksRef.current = fireworksRef.current.filter(firework => {
        firework.update();
        firework.draw(ctx);
        return !firework.isDead();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [population, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent'
      }}
    />
  );
};

// Demo component as requested
const FireworksBackgroundPopulationDemo = () => {
  return (
    <FireworksBackground
      className="absolute inset-0 flex items-center justify-center rounded-xl"
      population={8}
    />
  );
};

export default FireworksBackgroundPopulationDemo;