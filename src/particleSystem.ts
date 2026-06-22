/**
 * Quiet Garden - Double-Buffered Hand-Drawn Particle & Atmosphere System
 */
import { AppConfig, Particle, Landmark } from './types';

// Retor-imperfect, hand-drawn vector stroke utilities
export function drawSketchyLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  _dx = 0,
  _dy = 0,
  opacityMultiplier = 1.0
) {
  ctx.save();
  ctx.strokeStyle = `rgba(50, 45, 38, ${0.4 * opacityMultiplier})`;
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  const mx = (cx + rx) * 0.5 + (Math.random() - 0.5) * 1.5;
  const my = (cy + ry) * 0.5 + (Math.random() - 0.5) * 1.5;
  ctx.quadraticCurveTo(mx, my, rx, ry);
  ctx.stroke();
  ctx.restore();
}

export function drawSketchyEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
  startAng: number,
  endAng: number,
  fillStyle: string | CanvasGradient | null = null,
  strokeStyle: string | null = null,
  opacityMultiplier = 1.0
) {
  const safeRx = Math.max(0, Math.abs(rx));
  const safeRy = Math.max(0, Math.abs(ry));

  if (fillStyle) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, safeRx, safeRy, rotation, startAng, endAng);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.restore();
  }

  const finalStroke = strokeStyle || `rgba(70, 65, 55, ${0.35 * opacityMultiplier})`;
  ctx.save();
  ctx.strokeStyle = finalStroke;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(cx, cy, safeRx, safeRy, rotation, startAng, endAng);
  ctx.stroke();
  ctx.restore();
}

// ==========================================
// INDIVIDUAL PARTICLE DEFINITIONS
// ==========================================

export class PollenParticle {
  public x: number;
  public y: number;
  public size: number;
  public speed: number;
  public drift: number;
  public phase: number;

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = 2.5 + Math.random() * 4.5;
    this.speed = 0.2 + Math.random() * 0.3;
    this.drift = (Math.random() - 0.5) * 0.15;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(w: number, h: number) {
    this.y -= this.speed;
    this.x += Math.sin(Date.now() * 0.001 + this.phase) * 0.1 + this.drift;
    if (this.y < 0) {
      this.y = h;
      this.x = Math.random() * w;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = 0.35 + Math.sin(Date.now() * 0.002 + this.phase) * 0.20;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 245, 220, ${alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 245, 220, 0.6)';
    ctx.fill();
    ctx.restore();
  }
}

export class FallingPetal {
  public x: number;
  public y: number;
  public w: number;
  public h: number;
  public speedY: number;
  public angle: number;
  public phase: number;
  public fillColor: string;

  constructor(w: number) {
    this.x = Math.random() * w;
    this.y = -10;
    this.w = 9 + Math.random() * 5;
    this.h = 6 + Math.random() * 3;
    this.speedY = 0.3 + Math.random() * 0.3;
    this.angle = Math.random() * Math.PI * 2;
    this.phase = Math.random() * Math.PI * 2;

    const petalPalettes = [
      'rgba(255, 195, 205, 0.65)', // Sakura pink
      'rgba(215, 195, 255, 0.65)', // Lilac
      'rgba(180, 230, 230, 0.65)', // Pale Mint
      'rgba(255, 235, 175, 0.65)'  // Buttercup gold
    ];
    this.fillColor = petalPalettes[Math.floor(Math.random() * petalPalettes.length)];
  }

  update() {
    this.y += this.speedY;
    this.x += Math.sin(Date.now() * 0.002 + this.phase) * 0.4;
    this.angle += 0.01;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.fillColor;
    const petalGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.w);
    petalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    petalGrad.addColorStop(0.4, this.fillColor);
    petalGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    drawSketchyEllipse(ctx, this.x, this.y, this.w, this.h, this.angle, 0, Math.PI * 2, petalGrad, 'rgba(50, 40, 40, 0.25)');
    ctx.restore();
  }
}

export class SketchButterfly {
  public id: number;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life = 1.0;
  public scale: number;
  public angle: number;
  public colorType: string;

  constructor(w: number, h: number, x: number | null = null, y: number | null = null) {
    this.id = Math.random();
    this.x = (x !== null ? x : Math.random()) * w;
    this.y = (y !== null ? y : (0.4 + Math.random() * 0.4)) * h;
    this.vx = (Math.random() - 0.5) * 2.0;
    this.vy = -0.8 - Math.random() * 1.2;
    this.scale = 1.0 + Math.random() * 0.6;
    this.angle = Math.random() * 0.2;
    this.colorType = Math.random() < 0.5 ? 'pink_to_purple' : 'blue_to_cyan';
  }

  update(handX: number | null, handY: number | null, handVx: number, handVy: number, windX: number) {
    this.x += this.vx + windX * 0.45;
    this.y += this.vy;
    this.vy -= 0.02;
    this.vx += Math.sin(Date.now() * 0.007 + this.id) * 0.10;

    if (handX !== null && handY !== null) {
      const dx = handX - this.x;
      const dy = handY - this.y;
      const dist = Math.hypot(dx, dy);
      const handSpeed = Math.hypot(handVx, handVy);

      if (handSpeed > 4 && dist < 160) {
        const force = (1 - dist / 160) * 0.22;
        this.vx -= (dx / dist) * force * handSpeed;
        this.vy -= (dy / dist) * force * handSpeed;
      } else if (dist < 250) {
        const attractForce = (1 - dist / 250) * 0.04;
        this.vx += (dx / dist) * attractForce;
        this.vy += (dy / dist) * attractForce;
      }
    }
    this.life -= 0.0055;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const l = Math.max(0, Math.min(1.0, this.life));
    const flap = Math.sin(Date.now() * 0.005 + this.id) * 0.50;
    const s = this.scale * l;

    ctx.save();
    ctx.shadowBlur = 10 * l;
    ctx.shadowColor = this.colorType === 'pink_to_purple' ? `rgba(155, 89, 182, ${0.8 * l})` : `rgba(26, 188, 156, ${0.8 * l})`;

    const gradL = ctx.createLinearGradient(this.x, this.y, this.x - 14 * s, this.y);
    const gradR = ctx.createLinearGradient(this.x, this.y, this.x + 14 * s, this.y);

    gradL.addColorStop(0, `rgba(255, 140, 180, ${0.75 * l})`);
    gradL.addColorStop(1, `rgba(155, 89, 182, ${0.35 * l})`);

    gradR.addColorStop(0, `rgba(255, 140, 180, ${0.75 * l})`);
    gradR.addColorStop(1, `rgba(155, 89, 182, ${0.35 * l})`);

    const rotL = this.angle - flap;
    drawSketchyEllipse(ctx, this.x - 4 * s, this.y - 3 * s, 10 * s, 6 * s, rotL - 0.2, 0, Math.PI * 2, gradL, `rgba(46, 43, 38, ${0.25 * l})`, l);
    drawSketchyEllipse(ctx, this.x - 3 * s, this.y + 3 * s, 7 * s, 4 * s, rotL + 0.4, 0, Math.PI * 2, gradL, `rgba(46, 43, 38, ${0.15 * l})`, l);

    const rotR = this.angle + flap;
    drawSketchyEllipse(ctx, this.x + 4 * s, this.y - 3 * s, 10 * s, 6 * s, rotR + 0.2, 0, Math.PI * 2, gradR, `rgba(46, 43, 38, ${0.25 * l})`, l);
    drawSketchyEllipse(ctx, this.x + 3 * s, this.y + 3 * s, 7 * s, 4 * s, rotR - 0.4, 0, Math.PI * 2, gradR, `rgba(46, 43, 38, ${0.15 * l})`, l);

    drawSketchyLine(ctx, this.x, this.y - 2, this.x - 5 * s, this.y - 12 * s, 0, 0, l);
    drawSketchyLine(ctx, this.x, this.y - 2, this.x + 5 * s, this.y - 12 * s, 0, 0, l);
    ctx.restore();
  }
}

export class GrimaceStar {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life = 1.0;
  public scale: number;
  public color: string;
  public angle: number;
  public rotSpeed: number;

  constructor(w: number, h: number, x: number, y: number) {
    this.x = x * w;
    this.y = y * h;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.scale = 0.6 + Math.random() * 0.7;
    this.color = `hsl(${40 + Math.random() * 20}, 100%, 75%)`;
    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.08;
    this.vx *= 0.98;
    this.angle += this.rotSpeed;
    this.life -= 0.018;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const l = Math.max(0, this.life);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = l;
    ctx.shadowBlur = 8 * l;
    ctx.shadowColor = this.color;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 12 * this.scale,
                 Math.sin((18 + i * 72) * Math.PI / 180) * 12 * this.scale);
      ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 5 * this.scale,
                 Math.sin((54 + i * 72) * Math.PI / 180) * 5 * this.scale);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export class SporeParticle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public size: number;
  public life = 1.0;
  public color: string;
  public phase: number;

  constructor(x: number, y: number, color: string | null = null) {
    this.x = x + (Math.random() - 0.5) * 45;
    this.y = y - 8;
    this.vx = (Math.random() - 0.5) * 0.7;
    this.vy = -0.3 - Math.random() * 0.45;
    this.size = 3.5 + Math.random() * 4.5;
    this.life = 1.0;
    this.color = color || `hsla(${35 + Math.random() * 25}, 90%, 80%, 0.85)`;
    this.phase = Math.random() * Math.PI * 2;
  }

  update() {
    this.x += this.vx + Math.sin(Date.now() * 0.006 + this.phase) * 0.15;
    this.y += this.vy;
    this.life -= 0.0045;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const l = Math.max(0, Math.min(1.0, this.life));
    ctx.save();
    ctx.shadowBlur = 15 * l;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * l, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export class GardenFlower {
  public id: number;
  public x: number;
  public y: number;
  public growth = 0;
  public life = 1.0;
  public angle: number;
  public rotationV: number;
  public scale: number;
  public baseHue: number;
  public sat: number;
  public light: number;
  public secHue: number;
  public secSat: number;
  public secLight: number;
  public numPetals: number;

  constructor(w: number, h: number, x: number | null = null, y: number | null = null) {
    this.id = Math.random();
    this.x = (x !== null ? x : Math.random()) * w;
    this.y = (y !== null ? y : 0.72) * h;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationV = (Math.random() - 0.5) * 0.01;
    this.scale = 0.8 + Math.random() * 0.7;

    const palettes = [
      { baseHue: 345, sat: 90, light: 84, secHue: 355, secSat: 90, secLight: 86 }, // Sakura Pink
      { baseHue: 270, sat: 85, light: 85, secHue: 285, secSat: 80, secLight: 87 }, // Lavender
      { baseHue: 205, sat: 90, light: 83, secHue: 195, secSat: 85, secLight: 86 }  // Blue
    ];
    const p = palettes[Math.floor(Math.random() * palettes.length)];
    this.baseHue = p.baseHue;
    this.sat = p.sat;
    this.light = p.light;
    this.secHue = p.secHue;
    this.secSat = p.secSat;
    this.secLight = p.secLight;
    this.numPetals = 5 + Math.floor(Math.random() * 2);
  }

  update(mushroomSpores: SporeParticle[], colorShift: number, glowShiftVal: number) {
    this.angle += this.rotationV;
    this.y -= 0.1;
    if (this.growth < 1.0) {
      this.growth += 0.045;
    } else {
      this.life -= 0.0045;
    }

    const g = Math.max(0, Math.min(1.0, this.growth));
    const l = Math.max(0, Math.min(1.0, this.life));
    const s = this.scale * g * l;

    if (mushroomSpores.length < 150 && Math.random() < 0.12 * s) {
      const hue = Math.floor((this.baseHue + (colorShift + glowShiftVal) * 360 + 360) % 360);
      const sporeColor = `hsla(${hue}, ${this.sat}%, ${this.light}%, 0.82)`;
      mushroomSpores.push(new SporeParticle(this.x, this.y - 5 * s, sporeColor));
    }
  }

  draw(ctx: CanvasRenderingContext2D, isNightMode: boolean, colorShift: number, glowShiftVal: number) {
    const g = Math.max(0, Math.min(1.0, this.growth));
    const l = Math.max(0, Math.min(1.0, this.life));
    const s = this.scale * g * l;
    const outerRadius = 13 * s;
    const innerRadius = outerRadius * 0.58;
    const centerRadius = 3.5 * s;

    const pistilColor = isNightMode ? '#ffca28' : '#e6b26c';

    // Stem
    ctx.save();
    const stemLength = 65 * this.scale * l;
    const currentStemLength = stemLength * g;
    const stemEndY = this.y + stemLength;
    const currentStemTopY = stemEndY - currentStemLength;
    const stemControlX = this.x + Math.sin(Date.now() * 0.003 + this.id) * 6 * s;

    ctx.strokeStyle = `rgba(50, 75, 40, ${0.45 * l})`;
    ctx.lineWidth = 3.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x, currentStemTopY);
    ctx.quadraticCurveTo(stemControlX, currentStemTopY + currentStemLength * 0.45, this.x, stemEndY);
    ctx.stroke();

    ctx.strokeStyle = `rgba(105, 195, 115, ${l})`;
    ctx.lineWidth = 1.4 * s;
    ctx.stroke();

    // Growing leaves
    const leafLeftX = (this.x + stemControlX)/2 - 10 * s;
    const leafLeftY = currentStemTopY + 24 * s;
    const leafRightX = (this.x + stemControlX)/2 + 10 * s;
    const leafRightY = currentStemTopY + 36 * s;

    drawSketchyEllipse(ctx, leafLeftX, leafLeftY, 8 * s, 4 * s, -Math.PI / 6, 0, Math.PI * 2, `rgba(135, 215, 140, ${l})`, `rgba(50, 75, 40, ${0.3 * l})`, l);
    drawSketchyEllipse(ctx, leafRightX, leafRightY, 8 * s, 4 * s, Math.PI / 6, 0, Math.PI * 2, `rgba(105, 195, 115, ${l})`, `rgba(50, 75, 40, ${0.3 * l})`, l);
    ctx.restore();

    // Petals
    const hue = Math.floor((this.baseHue + (colorShift + glowShiftVal) * 360 + 360) % 360);
    const petalColor = `hsla(${hue}, ${this.sat}%, ${this.light}%, ${l})`;

    const innerHue = Math.floor((this.secHue + (colorShift + glowShiftVal) * 360 + 360) % 360);
    const innerPetalColor = `hsla(${innerHue}, ${this.secSat}%, ${this.secLight}%, ${l})`;

    ctx.save();
    ctx.shadowBlur = 10 * l;
    ctx.shadowColor = petalColor;
    for (let pi = 0; pi < this.numPetals; pi++) {
      const rot = (pi * Math.PI * 2 / this.numPetals) + this.angle;
      const opx = this.x + Math.sin(rot) * (outerRadius * 0.65);
      const opy = this.y - Math.cos(rot) * (outerRadius * 0.65);
      drawSketchyEllipse(ctx, opx, opy, outerRadius * 0.6, outerRadius * 0.4, rot, 0, Math.PI * 2, petalColor, `rgba(46,43,38,${0.35*l})`, l);
    }
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 8 * l;
    ctx.shadowColor = innerPetalColor;
    const innerOffset = Math.PI / this.numPetals;
    for (let pi = 0; pi < this.numPetals; pi++) {
      const rot = (pi * Math.PI * 2 / this.numPetals) + this.angle + innerOffset;
      const ipx = this.x + Math.sin(rot) * (innerRadius * 0.65);
      const ipy = this.y - Math.cos(rot) * (innerRadius * 0.65);
      drawSketchyEllipse(ctx, ipx, ipy, innerRadius * 0.55, innerRadius * 0.35, rot, 0, Math.PI * 2, innerPetalColor, `rgba(46,43,38,${0.25*l})`, l);
    }
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 6 * l;
    ctx.shadowColor = pistilColor;
    drawSketchyEllipse(ctx, this.x, this.y, centerRadius, centerRadius, 0, 0, Math.PI * 2, pistilColor, `rgba(46,43,38,${0.4*l})`, l);
    ctx.restore();
  }
}

export class RainSplash {
  public x: number;
  public y: number;
  public radius = 2;
  public larger: boolean;
  public maxRadius: number;
  public life = 1.0;

  constructor(x: number, y: number, larger = false) {
    this.x = x;
    this.y = y;
    this.larger = larger;
    this.maxRadius = (larger ? 22 : 14) + Math.random() * 8;
  }

  update() {
    this.radius += this.larger ? 0.7 : 0.45;
    this.life -= this.larger ? 0.02 : 0.025;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const l = Math.max(0, Math.min(1.0, this.life));
    drawSketchyEllipse(ctx, this.x, this.y, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2, null, `rgba(120, 140, 160, ${0.35 * l})`, l);
  }
}

export class SoothingRaindrop {
  public x: number;
  public y: number;
  public vy: number;
  public gravity = 0.16;
  public life = 1.0;
  public tilt: number;

  constructor(w: number, h: number, x: number, y: number) {
    this.x = x * w + (Math.random() - 0.5) * 30;
    this.y = y * h;
    this.vy = 4 + Math.random() * 2;
    this.tilt = (Math.random() - 0.5) * 0.18;
  }

  update(h: number, windX: number, splashesList: RainSplash[], puddleOpacity: number, w: number) {
    this.vy += this.gravity;
    this.y += this.vy;
    this.x += this.tilt + windX * 0.8;

    if (this.y >= h - 20) {
      this.life = 0;
      const inPuddle = (puddleOpacity > 0.1 && Math.abs(this.x - w/2) < 100);
      splashesList.push(new RainSplash(this.x, h - 20, inPuddle));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = `rgba(100, 135, 160, 0.55)`;
    ctx.lineWidth = 2.2;
    drawSketchyLine(ctx, this.x, this.y, this.x + this.tilt * 2, this.y + 22, 0, 0);
    ctx.restore();
  }
}

export class PinchedDroplet {
  public x: number;
  public y: number;
  public vy = 0.5;
  public gravity = 0.18;
  public life = 1.0;
  public scale: number;

  constructor(w: number, h: number, x: number, y: number) {
    this.x = x * w;
    this.y = y * h;
    this.scale = 1.0 + Math.random() * 0.5;
  }

  update(h: number, windX: number, splashesList: RainSplash[]) {
    this.vy += this.gravity;
    this.y += this.vy;
    this.x += windX * 0.8;

    if (this.y >= h - 15) {
      this.life = 0;
      splashesList.push(new RainSplash(this.x, h - 15));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const l = Math.max(0, Math.min(1.0, this.life));
    const w = 11 * this.scale * l;
    const h = 16 * this.scale * l;

    ctx.save();
    const grad = ctx.createLinearGradient(this.x, this.y - h/2, this.x, this.y + h/2);
    grad.addColorStop(0, `rgba(174, 198, 207, ${0.1 * l})`);
    grad.addColorStop(1, `rgba(135, 175, 190, ${0.7 * l})`);

    ctx.beginPath();
    ctx.moveTo(this.x, this.y - h / 2);
    ctx.bezierCurveTo(this.x - w / 2, this.y + h * 0.1, this.x - w / 2, this.y + h / 2, this.x, this.y + h / 2);
    ctx.bezierCurveTo(this.x + w / 2, this.y + h / 2, this.x + w / 2, this.y + h * 0.1, this.x, this.y - h / 2);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = `rgba(50, 45, 38, ${0.4 * l})`;
    ctx.lineWidth = 1.0;
    for (let pass = 0; pass < 2; pass++) {
      const j = (Math.random() - 0.5) * 1.0;
      ctx.beginPath();
      ctx.moveTo(this.x + j, this.y - h/2);
      ctx.bezierCurveTo(this.x - w / 2 + j, this.y + h * 0.1, this.x - w / 2, this.y + h / 2, this.x, this.y + h / 2 + j);
      ctx.bezierCurveTo(this.x + w / 2, this.y + h / 2, this.x + w / 2 - j, this.y + h * 0.1, this.x + j, this.y - h / 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class CuteMushroom {
  public x: number;
  public y: number;
  public scale = 0.15;
  public life = 1.0;
  public floatPhase: number;
  public capColor: string;
  public secCapColor: string;
  public stemColor: string;
  public dotColor: string;
  public isDecaying = false;
  private decayStartTime: number | null = null;
  public birthday: number;
  public hasPlayedAppears = false;

  constructor(w: number, h: number, x: number, y: number) {
    this.x = x * w;
    this.y = (0.76 + Math.random() * 0.12) * h;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.birthday = Date.now();

    const mushroomColors = [
      { cap: '#f5f5f0', secondaryCap: '#e4e4d6', stem: '#fafaf5', dotColor: 'rgba(255, 255, 255, 0.90)' }, // Off-white
      { cap: '#faf2c7', secondaryCap: '#efdd8e', stem: '#fefdf3', dotColor: 'rgba(255, 255, 235, 0.92)' }, // Light yellow
      { cap: '#d3b58f', secondaryCap: '#bca17c', stem: '#faf6ee', dotColor: 'rgba(255, 248, 232, 0.88)' }, // Light brown
      { cap: '#faf6eb', secondaryCap: '#e2dac2', stem: '#fefcf8', dotColor: 'rgba(255, 255, 255, 0.95)' }  // Cream
    ];
    const mc = mushroomColors[Math.floor(Math.random() * mushroomColors.length)];
    this.capColor = mc.cap;
    this.secCapColor = mc.secondaryCap;
    this.stemColor = mc.stem;
    this.dotColor = mc.dotColor;
  }

  getAge() {
    return (Date.now() - this.birthday) / 1000;
  }

  update(sporesList: SporeParticle[]) {
    if (!this.isDecaying) {
      if (this.scale < 1.4) {
        this.scale += 0.045;
      }
      if (sporesList.length < 150 && Math.random() < 0.35 * (this.scale / 1.4)) {
        sporesList.push(new SporeParticle(this.x, this.y - 12 * this.scale, this.capColor));
      }
    } else {
      if (!this.decayStartTime) {
        this.decayStartTime = Date.now();
      }
      const elapsed = Date.now() - this.decayStartTime;
      this.life = Math.max(0, 1.0 - elapsed / 2000);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    playAppearsChime: () => void,
    playSporePop: () => void
  ) {
    const l = Math.max(0, Math.min(1.0, this.life));
    if (l <= 0) return;
    const s = this.scale * l;

    if (!this.hasPlayedAppears) {
      playAppearsChime();
      this.hasPlayedAppears = true;
    }

    const floatY = Math.sin((Date.now() / 1500) * Math.PI * 2 + this.floatPhase) * 5 * s;
    const drawY = this.y + floatY;

    const cw = 55 * s;
    const ch = 34 * s;
    const sw = 16 * s;
    const sh = 34 * s;

    ctx.save();
    ctx.fillStyle = this.stemColor;
    ctx.beginPath();
    ctx.moveTo(this.x - sw / 2, drawY);
    ctx.lineTo(this.x + sw / 2, drawY);
    ctx.lineTo(this.x + sw / 2, drawY + sh);
    ctx.lineTo(this.x - sw / 2, drawY + sh);
    ctx.closePath();
    ctx.fill();

    drawSketchyEllipse(ctx, this.x, drawY + sh/2, sw/2, sh/2, 0, Math.PI, Math.PI*2, null, `rgba(46, 43, 38, ${0.25 * l})`, l);
    drawSketchyLine(ctx, this.x - sw / 2, drawY, this.x - sw / 2, drawY + sh, 0, 0, l);
    drawSketchyLine(ctx, this.x + sw / 2, drawY, this.x + sw / 2, drawY + sh, 0, 0, l);

    ctx.save();
    ctx.shadowBlur = 15 * l;
    ctx.shadowColor = this.capColor;

    const fillCapGrad = ctx.createLinearGradient(this.x, drawY - ch, this.x, drawY + 2);
    fillCapGrad.addColorStop(0, this.capColor);
    fillCapGrad.addColorStop(1, this.secCapColor);

    ctx.fillStyle = fillCapGrad;
    ctx.beginPath();
    ctx.arc(this.x, drawY + 2, cw / 2, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(46,43,38,${0.45 * l})`;
    ctx.lineWidth = 1.2;
    for (let p = 0; p < 2; p++) {
      const jpY = (Math.random() - 0.5) * 1.5;
      ctx.beginPath();
      ctx.arc(this.x, drawY + 2 + jpY, (cw / 2) + p * 0.5, Math.PI, 0, false);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // Spots on the mushroom cap
    const dotSpecs = [
      [-0.2, -0.6, 4.0],
      [0.2, -0.5, 3.2],
      [-0.35, -0.2, 3.5],
      [0.3, -0.2, 4.2],
      [0, -0.8, 2.5]
    ];
    for (const [dx, dy, dr] of dotSpecs) {
      const spotX = this.x + (dx * cw/2);
      const spotY = drawY + 2 + (dy * ch/2);
      const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, dr * s);
      spotGrad.addColorStop(0, '#ffffff');
      spotGrad.addColorStop(0.5, 'rgba(255, 235, 240, 0.92)');
      spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.save();
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(spotX, spotY, dr * s * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const age = this.getAge();
    if (age > 1.5) {
      const sx = this.x - cw * 0.15;
      const sy = this.y + 1 - ch * 0.45;
      const sr = 6 * s;

      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = '#ff527b';
      ctx.fill();
      ctx.strokeStyle = 'rgba(46, 43, 38, 0.75)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(46, 43, 38, 0.85)';
      ctx.lineWidth = 1.2 * s;
      for (let theta = 0; theta < Math.PI * 3.5; theta += 0.1) {
        const r = (sr * 0.15) + (sr * 0.2 * theta);
        const px = sx + r * Math.cos(theta);
        const py = sy + r * Math.sin(theta);
        if (theta === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const hx = sx + 7 * s;
      const hy = sy + 1 * s;
      ctx.beginPath();
      ctx.arc(hx, hy, 3 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe045';
      ctx.fill();
      ctx.strokeStyle = 'rgba(46, 43, 38, 0.75)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      const antennaeAngle = (age >= 1.5 && age <= 1.62) ? -0.3 : 0.22;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 4 * s * Math.cos(antennaeAngle), hy - 4 * s * Math.sin(antennaeAngle));
      ctx.stroke();

      if (Math.random() < 0.01) {
        playSporePop();
      }
    }
    ctx.restore();
  }
}

// Dandelion Farewell seed model
export interface BlowingSeed {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  life: number;
}


// ==========================================
// CORE PARTICLE SYSTEM CONTROLLER
// ==========================================

export class ParticleSystem {
  public pollens: PollenParticle[] = [];
  public petals: FallingPetal[] = [];
  public butterflies: SketchButterfly[] = [];
  public grimaceStars: GrimaceStar[] = [];
  public flowers: GardenFlower[] = [];
  public raindrops: SoothingRaindrop[] = [];
  public splashes: RainSplash[] = [];
  public droplets: PinchedDroplet[] = [];
  public mushroomSpores: SporeParticle[] = [];
  public mushrooms: CuteMushroom[] = [];
  public blowingSeeds: BlowingSeed[] = [];

  // Wind state
  private windX = 0;
  private lastPetalFallTime = Date.now();
  private nextPetalFallDelay = 8000;

  // Offscreen Canvas for butter-smooth rendering
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private trailCanvas: HTMLCanvasElement | null = null;
  private trailCtx: CanvasRenderingContext2D | null = null;

  constructor(private config: AppConfig) {}

  public getSporesCount() {
    return this.mushroomSpores.length;
  }

  public init(w: number, h: number) {
    this.pollens = [];
    for (let i = 0; i < 15; i++) {
      this.pollens.push(new PollenParticle(w, h));
    }
  }

  public setWind(wx: number) {
    this.windX = wx;
  }

  public handleFallingPetals(w: number, steps: number) {
    const now = Date.now();
    if (now - this.lastPetalFallTime > this.nextPetalFallDelay) {
      this.petals.push(new FallingPetal(w));
      this.lastPetalFallTime = now;
      
      const stepsFactor = 1.0 + (steps / 1000) * 0.1;
      const bloomFactor = Math.min(3.0, stepsFactor);
      this.nextPetalFallDelay = ((this.config.timers.petalMin + Math.random() * this.config.timers.petalRange) * 1000) / bloomFactor;
    }
  }

  public spawnButterfly(w: number, h: number, x: number | null = null, y: number | null = null) {
    if (this.butterflies.length < this.config.caps.butterflies) {
      this.butterflies.push(new SketchButterfly(w, h, x, y));
    }
  }

  public spawnFlower(w: number, h: number, x: number, y: number) {
    if (this.flowers.length < this.config.caps.flowers) {
      this.flowers.push(new GardenFlower(w, h, x, y));
    }
  }

  public spawnRain(w: number, h: number, x: number, y: number) {
    if (this.raindrops.length < this.config.caps.raindrops) {
      this.raindrops.push(new SoothingRaindrop(w, h, x, y));
    }
  }

  public spawnDroplet(w: number, h: number, x: number, y: number) {
    if (this.droplets.length < this.config.caps.droplets) {
      this.droplets.push(new PinchedDroplet(w, h, x, y));
    }
  }

  public spawnMushroom(w: number, h: number, x: number, y: number): CuteMushroom | null {
    if (this.mushrooms.length < this.config.caps.mushrooms) {
      const mushroom = new CuteMushroom(w, h, x, y);
      this.mushrooms.push(mushroom);
      return mushroom;
    }
    return null;
  }

  public spawnGrimaceStars(w: number, h: number, x: number, y: number) {
    const count = 15 + Math.floor(Math.random() * 10);
    for (let s = 0; s < count; s++) {
      if (this.grimaceStars.length < this.config.caps.grimaceStars) {
        this.grimaceStars.push(new GrimaceStar(w, h, x, y));
      }
    }
  }

  public triggerDandelionDispersal(dandelionX: number, dandelionY: number) {
    this.blowingSeeds = [];
    const seedCount = 110;
    for (let i = 0; i < seedCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 4.5;
      this.blowingSeeds.push({
        x: dandelionX,
        y: dandelionY,
        vx: Math.cos(theta) * speed + (Math.random() - 0.2) * 1.5,
        vy: Math.sin(theta) * speed - 0.8,
        phase: Math.random() * Math.PI * 2,
        life: 1.0
      });
    }
  }

  /**
   * Main mathematical update ticks for all particles in the sanctuary
   */
  public update(
    w: number,
    h: number,
    enabledSettings: { flowers: boolean; butterflies: boolean; rain: boolean; stars: boolean },
    handCanvasX: number | null,
    handCanvasY: number | null,
    handVx: number,
    handVy: number,
    colorShift: number,
    glowShiftVal: number,
    puddleOpacity: number
  ) {
    // 1. Pollens (always active)
    for (const p of this.pollens) p.update(w, h);

    // 2. Falling Petals
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      p.update();
      if (p.y > h) {
        this.petals.splice(i, 1);
      }
    }

    // 3. Butterfies
    if (enabledSettings.butterflies) {
      for (let i = this.butterflies.length - 1; i >= 0; i--) {
        const b = this.butterflies[i];
        b.update(handCanvasX, handCanvasY, handVx, handVy, this.windX);
        if (b.life <= 0) {
          this.butterflies.splice(i, 1);
        }
      }
    } else {
      this.butterflies = [];
    }

    // 4. Flowers
    if (enabledSettings.flowers) {
      for (let i = this.flowers.length - 1; i >= 0; i--) {
        const f = this.flowers[i];
        f.update(this.mushroomSpores, colorShift, glowShiftVal);
        if (f.life <= 0) {
          this.flowers.splice(i, 1);
        }
      }
    } else {
      this.flowers = [];
    }

    // 5. Raindrops
    if (enabledSettings.rain) {
      for (let i = this.raindrops.length - 1; i >= 0; i--) {
        const r = this.raindrops[i];
        r.update(h, this.windX, this.splashes, puddleOpacity, w);
        if (r.life <= 0) {
          this.raindrops.splice(i, 1);
        }
      }
    } else {
      this.raindrops = [];
    }

    // 6. Splashes
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      sp.update();
      if (sp.life <= 0 || sp.radius > sp.maxRadius) {
        this.splashes.splice(i, 1);
      }
    }

    // 7. Droplets
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.update(h, this.windX, this.splashes);
      if (d.life <= 0) {
        this.droplets.splice(i, 1);
      }
    }

    // 8. Spores
    for (let i = this.mushroomSpores.length - 1; i >= 0; i--) {
      const sp = this.mushroomSpores[i];
      sp.update();
      if (sp.life <= 0) {
        this.mushroomSpores.splice(i, 1);
      }
    }

    // 9. Mushrooms
    for (let i = this.mushrooms.length - 1; i >= 0; i--) {
      const mu = this.mushrooms[i];
      mu.update(this.mushroomSpores);
      if (mu.life <= 0) {
        this.mushrooms.splice(i, 1);
      }
    }

    // 10. Stars
    if (enabledSettings.stars) {
      for (let i = this.grimaceStars.length - 1; i >= 0; i--) {
        const st = this.grimaceStars[i];
        st.update();
        if (st.life <= 0) {
          this.grimaceStars.splice(i, 1);
        }
      }
    } else {
      this.grimaceStars = [];
    }

    // 11. Blowing Seeds
    for (let i = this.blowingSeeds.length - 1; i >= 0; i--) {
      const s = this.blowingSeeds[i];
      s.vx *= 0.982;
      s.vy *= 0.982;
      s.x += s.vx;
      s.y += s.vy;
      s.vy -= 0.006;
      s.vx += Math.sin(Date.now() * 0.005 + s.phase) * 0.08;
      s.life -= this.config.particles.blowingSeedLifeDecay;

      if (s.life <= 0) {
        this.blowingSeeds.splice(i, 1);
      }
    }
  }

  /**
   * Render all particles securely to the offscreen back-buffer,
   * then blit onto the visible main application canvas.
   */
  public draw(
    mainCtx: CanvasRenderingContext2D,
    w: number,
    h: number,
    isNightMode: boolean,
    colorShift: number,
    glowShiftVal: number,
    puddleOpacity: number,
    sunlightActive: boolean,
    sunlightTimer: number,
    dandelionActive: boolean,
    dandelionX: number,
    dandelionY: number,
    farewellOverlayActive: boolean,
    farewellOverlayStart: number,
    farewellPhraseChosen: string,
    playAppearsChime: () => void,
    playSporePop: () => void,
    mood: string = ''
  ) {
    // Instantiate offscreen canvas on the fly if needed
    if (!this.offscreenCanvas || this.offscreenCanvas.width !== w || this.offscreenCanvas.height !== h) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = w;
      this.offscreenCanvas.height = h;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    if (!this.trailCanvas || this.trailCanvas.width !== w || this.trailCanvas.height !== h) {
      this.trailCanvas = document.createElement('canvas');
      this.trailCanvas.width = w;
      this.trailCanvas.height = h;
      this.trailCtx = this.trailCanvas.getContext('2d');
    }

    const octx = this.offscreenCtx;
    if (!octx) return;

    // Clear buffer
    octx.clearRect(0, 0, w, h);

    // Fade the trail canvas slowly with destination-out to prevent color residue
    const tctx = this.trailCtx;
    if (tctx) {
      tctx.save();
      tctx.globalCompositeOperation = 'destination-out';
      tctx.fillStyle = 'rgba(0, 0, 0, 0.22)'; // Soft flowing trails rate
      tctx.fillRect(0, 0, w, h);
      tctx.restore();
    }

    // 1. Soft Ambient Backdrops
    this.drawGlobalAtmosphere(octx, w, h, isNightMode, mood);
    this.drawSoftVignette(octx, w, h, isNightMode);

    // 2. Sunlight overlays
    if (sunlightActive) {
      const elapsed = Date.now() - sunlightTimer;
      if (elapsed < 3000) {
        const yellowOpacity = 0.04 * (1 - elapsed / 3000);
        octx.save();
        octx.fillStyle = `rgba(255, 240, 200, ${yellowOpacity})`;
        octx.fillRect(0, 0, w, h);
        octx.restore();
      }
    }

    // 3. Puddles
    if (puddleOpacity > 0) {
      drawSketchyEllipse(octx, w/2, h - 20, 100, 20, 0, 0, Math.PI * 2, `rgba(180, 200, 210, ${puddleOpacity})`, `rgba(100, 120, 130, ${puddleOpacity * 1.5})`);
    }

    // 4. Draw static vegetation / mushrooms
    for (const mu of this.mushrooms) {
      mu.draw(octx, playAppearsChime, playSporePop);
    }
    for (const f of this.flowers) {
      f.draw(octx, isNightMode, colorShift, glowShiftVal);
    }

    // Draw active weather-droplets, insects and spores on Trail Layer
    if (tctx) {
      // Draw glowing items with lighter blending
      tctx.save();
      tctx.globalCompositeOperation = 'lighter';
      for (const b of this.butterflies) b.draw(tctx);
      for (const sp of this.mushroomSpores) sp.draw(tctx);
      for (const st of this.grimaceStars) st.draw(tctx);
      for (const p of this.pollens) p.draw(tctx);
      tctx.restore();

      // Draw normal sliding/flowing items with source-over
      tctx.save();
      for (const r of this.raindrops) r.draw(tctx);
      for (const sp of this.splashes) sp.draw(tctx);
      for (const d of this.droplets) d.draw(tctx);
      for (const fl of this.petals) fl.draw(tctx);
      tctx.restore();

      // Blit trail layer onto main buffer
      octx.save();
      octx.drawImage(this.trailCanvas, 0, 0);
      octx.restore();
    } else {
      // Fallback if no trail context is ready
      for (const r of this.raindrops) r.draw(octx);
      for (const sp of this.splashes) sp.draw(octx);
      for (const d of this.droplets) d.draw(octx);
      for (const b of this.butterflies) b.draw(octx);
      for (const sp of this.mushroomSpores) sp.draw(octx);
      for (const p of this.pollens) p.draw(octx);
      for (const fl of this.petals) fl.draw(octx);
      for (const st of this.grimaceStars) st.draw(octx);
    }

    // 7. Dandelion base globe
    if (dandelionActive) {
      this.drawDandelion(octx, dandelionX, dandelionY);
    }

    // 8. Blowing fluffy seeds
    this.drawBlowingSeeds(tctx || octx);

    // 9. Farewell final caption overlay
    if (farewellOverlayActive) {
      this.drawFarewellOverlay(octx, w, h, farewellOverlayStart, farewellPhraseChosen);
    }

    // Blit buffer to visible context
    mainCtx.drawImage(this.offscreenCanvas, 0, 0);
  }

  private drawSoftVignette(ctx: CanvasRenderingContext2D, w: number, h: number, isNight: boolean) {
    const diag = Math.hypot(w, h);
    const grad = ctx.createRadialGradient(w/2, h/2, diag * 0.45, w/2, h/2, diag * 0.85);
    if (isNight) {
      grad.addColorStop(0, 'rgba(30, 24, 48, 0)');
      grad.addColorStop(1, 'rgba(20, 15, 30, 0.45)');
    } else {
      grad.addColorStop(0, 'rgba(80, 60, 40, 0)');
      grad.addColorStop(1, 'rgba(65, 45, 30, 0.24)');
    }
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  private drawGlobalAtmosphere(ctx: CanvasRenderingContext2D, w: number, h: number, isNight: boolean, mood: string = '') {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (isNight) {
      grad.addColorStop(0, 'rgba(24, 18, 42, 0.38)');
      grad.addColorStop(0.5, 'rgba(48, 32, 64, 0.24)');
      grad.addColorStop(1, 'rgba(85, 48, 32, 0.18)');
    } else {
      grad.addColorStop(0, 'rgba(58, 44, 70, 0.16)');
      grad.addColorStop(0.4, 'rgba(115, 75, 90, 0.10)');
      grad.addColorStop(1, 'rgba(125, 90, 55, 0.15)');
    }
    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 🌿 Mood shifting filter layer: warm (amber/gold) vs cool (blue/lavender/purple)
    ctx.save();
    if (mood === '😌' || mood === '😊' || mood === 'warm') {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.055)'; // soft amber tint
      ctx.globalCompositeOperation = 'color-burn';
      ctx.fillRect(0, 0, w, h);
    } else if (mood === '😔' || mood === '😡' || mood === '😴' || mood === 'cool') {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.06)'; // soft indigo/blue tint
      ctx.globalCompositeOperation = 'color-burn';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  private drawDandelion(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 110, 80, 0.7)';
    ctx.lineWidth = 2.5;
    drawSketchyLine(ctx, x, y + 15, x, y + 100);

    const r = 60;
    ctx.strokeStyle = 'rgba(240, 235, 220, 0.45)';
    ctx.lineWidth = 1.0;

    const numLines = 48;
    for (let i = 0; i < numLines; i++) {
      const angle = (i * Math.PI * 2) / numLines;
      const rx = x + Math.cos(angle) * r;
      const ry = y + Math.sin(angle) * r;
      drawSketchyLine(ctx, x, y, rx, ry, 0, 0, 0.95);

      ctx.save();
      ctx.beginPath();
      ctx.arc(rx, ry, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 253, 248, 0.32)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();
      ctx.restore();
    }

    const innerR = r * 0.58;
    const numInnerLines = 28;
    for (let i = 0; i < numInnerLines; i++) {
      const angle = (i * Math.PI * 2) / numInnerLines + 0.17;
      const rx = x + Math.cos(angle) * innerR;
      const ry = y + Math.sin(angle) * innerR;
      drawSketchyLine(ctx, x, y, rx, ry, 0, 0, 0.85);

      ctx.save();
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 253, 248, 0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(165, 155, 125, 0.9)';
    ctx.fill();
    ctx.restore();
  }

  private drawBlowingSeeds(ctx: CanvasRenderingContext2D) {
    for (const s of this.blowingSeeds) {
      const l = Math.max(0, Math.min(1.0, s.life));
      ctx.save();

      const targetRadius = 24;
      ctx.beginPath();
      ctx.arc(s.x, s.y, targetRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 254, 248, ${0.30 * l})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(s.x, s.y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.92 * l})`;
      ctx.fill();

      ctx.strokeStyle = `rgba(165, 155, 135, ${0.43 * l})`;
      ctx.lineWidth = 1.0;
      const ribCount = 12;
      for (let ribIdx = 0; ribIdx < ribCount; ribIdx++) {
        const rAngle = (ribIdx * Math.PI * 2 / ribCount) + s.phase;
        const sx = s.x + Math.cos(rAngle) * targetRadius;
        const sy = s.y + Math.sin(rAngle) * targetRadius;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.72 * l})`;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawFarewellOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    start: number,
    phrase: string
  ) {
    const elapsed = Date.now() - start;
    let alpha = 0;
    if (elapsed < 1000) {
      alpha = 0.3 * (elapsed / 1000);
    } else if (elapsed < 3000) {
      alpha = 0.3;
    } else {
      alpha = 0.3 * (1 - (elapsed - 3000) / 1000);
    }

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, w, h);

    // Correct mirrored end text
    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 3.33})`;
    ctx.font = 'italic 20px Playfair Display, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(phrase, w / 2, h / 2);
    ctx.restore();
  }
}
