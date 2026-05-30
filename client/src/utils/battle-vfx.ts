/**
 * Battle VFX System — lightweight particle effects using PixiJS Graphics.
 * Creates slash, magic burst, heal sparkle, and hit impact effects.
 */

import { Container, Graphics } from 'pixi.js';

interface Particle {
  graphic: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  scaleDecay: number;
  alphaDecay: number;
  rotation: number;
  rotationSpeed: number;
}

export class BattleVFX {
  private container: Container;
  private particles: Particle[] = [];

  constructor(parentContainer: Container) {
    this.container = new Container();
    parentContainer.addChild(this.container);
  }

  /** Call every frame to update particles */
  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.container.removeChild(p.graphic);
        p.graphic.destroy();
        this.particles.splice(i, 1);
        continue;
      }

      const progress = 1 - p.life / p.maxLife;

      // Move
      p.graphic.x += p.vx * dt;
      p.graphic.y += p.vy * dt;

      // Gravity for some effects
      p.vy += 100 * dt;

      // Fade and shrink
      p.graphic.alpha = Math.max(0, 1 - progress * p.alphaDecay);
      const scale = Math.max(0.1, 1 - progress * p.scaleDecay);
      p.graphic.scale.set(scale);

      // Rotate
      p.graphic.rotation += p.rotationSpeed * dt;
    }
  }

  /** Melee slash effect — arc of white/yellow lines */
  slashEffect(x: number, y: number, facingRight: boolean): void {
    const dir = facingRight ? 1 : -1;
    for (let i = 0; i < 5; i++) {
      const g = new Graphics();
      const angle = (-30 + i * 15) * (Math.PI / 180);
      const len = 20 + Math.random() * 15;

      g.lineStyle(2 + Math.random() * 2, 0xffffcc, 0.9);
      g.moveTo(0, 0);
      g.lineTo(Math.cos(angle) * len * dir, Math.sin(angle) * len);

      g.position.set(x + dir * 10, y - 20);
      this.container.addChild(g);

      this.particles.push({
        graphic: g,
        vx: dir * (80 + Math.random() * 40),
        vy: -20 + Math.random() * 40,
        life: 0.3 + Math.random() * 0.1,
        maxLife: 0.4,
        scaleDecay: 1.5,
        alphaDecay: 2.0,
        rotation: 0,
        rotationSpeed: dir * (2 + Math.random() * 3),
      });
    }

    // Spark particles
    for (let i = 0; i < 4; i++) {
      const g = new Graphics();
      g.beginFill(0xffdd44);
      g.drawCircle(0, 0, 2 + Math.random() * 2);
      g.endFill();
      g.position.set(x + dir * 15, y - 15);
      this.container.addChild(g);

      this.particles.push({
        graphic: g,
        vx: dir * (60 + Math.random() * 80),
        vy: -80 + Math.random() * 60,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        scaleDecay: 1.0,
        alphaDecay: 1.8,
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  /** Magic burst — expanding ring + scattered particles */
  magicBurstEffect(x: number, y: number): void {
    // Expanding ring
    const ring = new Graphics();
    ring.lineStyle(3, 0x6688ff, 0.8);
    ring.drawCircle(0, 0, 8);
    ring.position.set(x, y - 20);
    this.container.addChild(ring);

    this.particles.push({
      graphic: ring,
      vx: 0,
      vy: 0,
      life: 0.5,
      maxLife: 0.5,
      scaleDecay: -3.0, // negative = grow
      alphaDecay: 2.5,
      rotation: 0,
      rotationSpeed: 0,
    });

    // Magic sparkles
    for (let i = 0; i < 8; i++) {
      const g = new Graphics();
      const color = [0x4488ff, 0x88aaff, 0xaaccff, 0x6666ff][i % 4];
      g.beginFill(color);
      const size = 3 + Math.random() * 2;
      g.moveTo(0, -size);
      g.lineTo(size * 0.6, 0);
      g.lineTo(0, size);
      g.lineTo(-size * 0.6, 0);
      g.closePath();
      g.endFill();
      g.position.set(x, y - 20);
      this.container.addChild(g);

      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 60 + Math.random() * 40;

      this.particles.push({
        graphic: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        scaleDecay: 1.2,
        alphaDecay: 1.5,
        rotation: 0,
        rotationSpeed: 3 + Math.random() * 4,
      });
    }
  }

  /** Heal sparkle — green/white particles floating up */
  healEffect(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const g = new Graphics();
      const color = [0x44ff88, 0x88ffaa, 0xaaffcc, 0xffffff][i % 4];
      g.beginFill(color);
      g.drawCircle(0, 0, 2 + Math.random() * 3);
      g.endFill();
      g.position.set(x + (Math.random() - 0.5) * 30, y - 10);
      this.container.addChild(g);

      this.particles.push({
        graphic: g,
        vx: (Math.random() - 0.5) * 30,
        vy: -60 - Math.random() * 40,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        scaleDecay: 0.5,
        alphaDecay: 1.2,
        rotation: 0,
        rotationSpeed: 0,
      });
    }

    // Plus sign
    const plus = new Graphics();
    plus.lineStyle(2, 0x44ff88, 0.9);
    plus.moveTo(-6, 0);
    plus.lineTo(6, 0);
    plus.moveTo(0, -6);
    plus.lineTo(0, 6);
    plus.position.set(x, y - 30);
    this.container.addChild(plus);

    this.particles.push({
      graphic: plus,
      vx: 0,
      vy: -40,
      life: 0.7,
      maxLife: 0.7,
      scaleDecay: -0.5,
      alphaDecay: 1.8,
      rotation: 0,
      rotationSpeed: 0,
    });
  }

  /** Hit impact — flash + small debris */
  hitImpactEffect(x: number, y: number, isCrit: boolean): void {
    // Flash
    const flash = new Graphics();
    flash.beginFill(isCrit ? 0xff4444 : 0xffffff, 0.8);
    flash.drawCircle(0, 0, isCrit ? 12 : 8);
    flash.endFill();
    flash.position.set(x, y - 15);
    this.container.addChild(flash);

    this.particles.push({
      graphic: flash,
      vx: 0,
      vy: 0,
      life: 0.15,
      maxLife: 0.15,
      scaleDecay: -2.0,
      alphaDecay: 6.0,
      rotation: 0,
      rotationSpeed: 0,
    });

    // Debris
    const count = isCrit ? 6 : 3;
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      g.beginFill(isCrit ? 0xff6644 : 0xffcc44);
      g.drawRect(-2, -2, 4, 3);
      g.endFill();
      g.position.set(x, y - 15);
      this.container.addChild(g);

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 60;

      this.particles.push({
        graphic: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        scaleDecay: 0.8,
        alphaDecay: 1.5,
        rotation: 0,
        rotationSpeed: 5 + Math.random() * 10,
      });
    }
  }

  /** Skill cast — magic circle under character */
  skillCastEffect(x: number, y: number): void {
    // Magic circle (ellipse to simulate perspective)
    const circle = new Graphics();
    circle.lineStyle(2, 0xaa66ff, 0.7);
    circle.drawEllipse(0, 0, 25, 10);
    circle.lineStyle(1, 0xcc88ff, 0.5);
    circle.drawEllipse(0, 0, 18, 7);
    circle.position.set(x, y);
    this.container.addChild(circle);

    this.particles.push({
      graphic: circle,
      vx: 0,
      vy: 0,
      life: 1.2,
      maxLife: 1.2,
      scaleDecay: -0.3,
      alphaDecay: 1.0,
      rotation: 0,
      rotationSpeed: 2.0,
    });

    // Rising energy particles
    for (let i = 0; i < 6; i++) {
      const g = new Graphics();
      g.beginFill([0xaa66ff, 0xcc88ff, 0xff88cc][i % 3]);
      g.drawCircle(0, 0, 2 + Math.random() * 2);
      g.endFill();
      g.position.set(x + (Math.random() - 0.5) * 30, y);
      this.container.addChild(g);

      this.particles.push({
        graphic: g,
        vx: (Math.random() - 0.5) * 20,
        vy: -80 - Math.random() * 40,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        scaleDecay: 0.5,
        alphaDecay: 1.0,
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  destroy(): void {
    for (const p of this.particles) {
      p.graphic.destroy();
    }
    this.particles = [];
    this.container.destroy({ children: true });
  }
}
