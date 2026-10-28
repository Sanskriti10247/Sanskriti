import * as THREE from 'three';
import { palette } from './palette';

const FONT = '"Figtree", system-ui, sans-serif';

/** Creates a crisp canvas-backed texture and hands the 2D context to a draw callback. */
export function canvasTexture(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context) draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  context.beginPath();
  context.roundRect(x, y, w, h, r);
}

interface LabelOptions {
  background?: string;
  color?: string;
  border?: string;
  /** World-space height of the label. */
  height?: number;
}

/** A pill-shaped text label that always faces the camera. */
export function createLabel(
  text: string,
  {
    background = '#ffffff',
    color = palette.ink,
    border = palette.ink,
    height = 0.3,
  }: LabelOptions = {},
): THREE.Sprite {
  const fontSize = 44;
  const measure = document.createElement('canvas').getContext('2d');
  if (measure) measure.font = `700 ${fontSize}px ${FONT}`;
  const textWidth = measure ? measure.measureText(text).width : text.length * fontSize * 0.6;
  const w = Math.ceil(textWidth + 56);
  const h = 76;
  const texture = canvasTexture(w, h, (context) => {
    roundRect(context, 3, 3, w - 6, h - 6, (h - 6) / 2);
    context.fillStyle = background;
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = border;
    context.stroke();
    context.fillStyle = color;
    context.font = `700 ${fontSize}px ${FONT}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, w / 2, h / 2 + 2);
  });
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  sprite.scale.set((height * w) / h, height, 1);
  return sprite;
}

/** A hand-drawn style detection box with a tag, drawn as one camera-facing sprite. */
export function createDetectionBox(
  tag: string,
  width: number,
  height: number,
  color: string = palette.rose,
): THREE.Sprite {
  const px = 160;
  const w = Math.round(width * px);
  const h = Math.round(height * px) + 48;
  const texture = canvasTexture(w, h, (context) => {
    context.strokeStyle = color;
    context.lineWidth = 7;
    context.setLineDash([22, 12]);
    roundRect(context, 6, 46, w - 12, h - 52, 18);
    context.stroke();
    context.setLineDash([]);
    context.font = `700 30px ${FONT}`;
    const tagWidth = context.measureText(tag).width + 26;
    roundRect(context, 6, 4, tagWidth, 40, 12);
    context.fillStyle = color;
    context.fill();
    context.fillStyle = '#ffffff';
    context.textBaseline = 'middle';
    context.fillText(tag, 19, 25);
  });
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  );
  sprite.scale.set(w / px, h / px, 1);
  sprite.renderOrder = 10;
  return sprite;
}

let shadowCanvas: HTMLCanvasElement | null = null;

/** A soft round contact shadow to sit under a toy. */
export function createBlobShadow(size: number, opacity = 0.22): THREE.Mesh {
  if (!shadowCanvas) {
    shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const context = shadowCanvas.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(184, 53, 101, 0.9)');
      gradient.addColorStop(0.45, 'rgba(184, 53, 101, 0.35)');
      gradient.addColorStop(1, 'rgba(184, 53, 101, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }
  }
  const texture = new THREE.CanvasTexture(shadowCanvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
