import { palette } from '@/three/core';
import { GAME } from './config';
import type { Car } from './entities/car';
import type { Collectibles } from './entities/collectibles';
import type { Track } from './world/track';

/** Draws a small top-down map of the island, road, pickups and car. */
export function drawMinimap(
  canvas: HTMLCanvasElement,
  track: Track,
  pickups: Collectibles,
  car: Car,
) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = canvas.clientWidth;
  if (canvas.width !== Math.round(size * dpr)) {
    canvas.width = canvas.height = Math.round(size * dpr);
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  const centre = size / 2;
  const scale = (size / 2 - 4) / GAME.islandRadius;
  const map = (x: number, z: number): [number, number] => [centre + x * scale, centre + z * scale];

  context.clearRect(0, 0, size, size);
  context.fillStyle = palette.blush;
  context.strokeStyle = palette.ink;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(centre, centre, GAME.islandRadius * scale, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = '#ffffff';
  context.lineWidth = GAME.roadWidth * scale;
  context.lineJoin = 'round';
  context.beginPath();
  track.samples.forEach(({ point }, i) => {
    const [x, y] = map(point.x, point.z);
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  context.stroke();

  const dot = (x: number, z: number, color: string, radius: number) => {
    const [px, py] = map(x, z);
    context.fillStyle = color;
    context.beginPath();
    context.arc(px, py, radius, 0, Math.PI * 2);
    context.fill();
  };
  for (const heart of pickups.hearts) {
    if (heart.active) dot(heart.group.position.x, heart.group.position.z, palette.rose, 2.6);
  }
  if (pickups.star.active)
    dot(pickups.star.group.position.x, pickups.star.group.position.z, '#e0a800', 3.6);

  const [cx, cy] = map(car.position.x, car.position.z);
  context.save();
  context.translate(cx, cy);
  context.rotate(-car.heading + Math.PI);
  context.fillStyle = palette.ink;
  context.beginPath();
  context.moveTo(0, -6);
  context.lineTo(4.5, 5);
  context.lineTo(-4.5, 5);
  context.closePath();
  context.fill();
  context.restore();
}
