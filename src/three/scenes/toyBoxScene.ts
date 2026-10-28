import * as THREE from 'three';
import {
  addSoftLights,
  between,
  candyMaterial,
  createBlobShadow,
  createBody,
  seededRandom,
  stepWorld,
  syncBody,
  toyColors,
  toyGeometry,
  toyKinds,
  visibleSize,
  type Body,
  type SceneFactory,
  type WorldOptions,
} from '../core';

interface Toy {
  body: Body;
  outer: THREE.Group;
  inner: THREE.Mesh;
  shadow: THREE.Mesh;
}

const MAX_THROW_SPEED = 13;

/**
 * Hero toy box: a pile of soft candy toys with simple physics.
 * Grab one to drag it, let go to throw it, or tap empty space to poke the pile.
 * Toys occasionally hop on their own so the pile never looks frozen.
 */
export const toyBoxScene: SceneFactory = ({ scene, camera, compact, report, setCursor }) => {
  camera.fov = 30;
  camera.position.set(0, 1, 11.5);
  camera.lookAt(0, 0, 0);
  addSoftLights(scene, 1.05);

  const random = seededRandom(11);
  const count = compact ? 10 : 14;
  const world: WorldOptions = {
    gravity: 14,
    restitution: 0.42,
    bounds: { left: -3, right: 3, floor: -2.2, ceiling: 12 },
  };

  const toys: Toy[] = [];
  for (let i = 0; i < count; i += 1) {
    const kind = toyKinds[i % toyKinds.length];
    const radius = between(0.4, 0.6, random);
    const inner = new THREE.Mesh(
      toyGeometry(kind, radius),
      candyMaterial(toyColors[i % toyColors.length]),
    );
    inner.rotation.set(between(-0.35, 0.35, random), between(-0.5, 0.5, random), 0);
    inner.userData.toyIndex = i;
    const outer = new THREE.Group();
    outer.position.z = between(-0.2, 0.2, random);
    outer.add(inner);
    const shadow = createBlobShadow(radius * 2.6, 0.28);
    scene.add(outer, shadow);
    toys.push({ body: createBody(0, 0, radius), outer, inner, shadow });
  }
  const meshes = toys.map((toy) => toy.inner);

  let tosses = 0;
  const publish = () =>
    report(tosses === 0 ? 'nothing tossed yet' : `${tosses} toss${tosses === 1 ? '' : 'es'}`);

  const dropIn = () => {
    const { left, right } = world.bounds;
    toys.forEach(({ body }, index) => {
      body.position.set(between(left + 0.6, right - 0.6), 3.4 + index * 0.75);
      body.velocity.set(between(-0.6, 0.6), 0);
      body.spin = between(-2, 2);
      body.angle = between(-0.5, 0.5);
      body.held = false;
    });
  };
  dropIn();
  publish();
  // On first load the pile is already sitting in the box; "tidy up" drops it in again.
  let settled = false;

  // ---- Input ---------------------------------------------------------------
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const grabTarget = new THREE.Vector2();
  const grabOffset = new THREE.Vector2();
  let held: Toy | null = null;
  let lastInteraction = 0;
  let clock = 0;

  const toyUnder = (raycaster: THREE.Raycaster): Toy | null => {
    const [first] = raycaster.intersectObjects(meshes, false);
    return first ? toys[first.object.userData.toyIndex as number] : null;
  };

  const poke = (x: number, y: number) => {
    for (const { body } of toys) {
      const dx = body.position.x - x;
      const dy = body.position.y - y;
      const distance = Math.hypot(dx, dy);
      if (distance > 1.8) continue;
      const strength = (1.8 - distance) * 4.5;
      body.velocity.x += (dx / (distance || 1)) * strength;
      body.velocity.y += Math.abs(dy / (distance || 1)) * strength + 3;
      body.spin += between(-4, 4);
    }
  };

  return {
    onPointer({ type, raycaster, pointerType }) {
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      lastInteraction = clock;

      if (type === 'down') {
        const toy = toyUnder(raycaster);
        if (toy) {
          held = toy;
          toy.body.held = true;
          grabOffset.set(toy.body.position.x - hit.x, toy.body.position.y - hit.y);
          grabTarget.set(hit.x, hit.y).add(grabOffset);
          setCursor('grabbing');
        } else {
          poke(hit.x, hit.y);
        }
        return;
      }

      if (type === 'move') {
        if (held) grabTarget.set(hit.x, hit.y).add(grabOffset);
        else if (pointerType === 'mouse') setCursor(toyUnder(raycaster) ? 'grab' : '');
        return;
      }

      if (held) {
        const { body } = held;
        body.held = false;
        if (body.velocity.length() > MAX_THROW_SPEED) body.velocity.setLength(MAX_THROW_SPEED);
        body.spin += body.velocity.x * -0.8;
        if (body.velocity.length() > 2.5) {
          tosses += 1;
          publish();
        }
        held = null;
        setCursor(pointerType === 'mouse' ? 'grab' : '');
      }
    },

    update({ delta, pointer }) {
      clock += delta;
      if (held) {
        const { body } = held;
        body.velocity
          .set(grabTarget.x - body.position.x, grabTarget.y - body.position.y)
          .multiplyScalar(16);
      }

      // Every so often, if nobody is playing, one toy hops.
      if (!held && clock - lastInteraction > 3.5) {
        lastInteraction = clock - 1.2;
        const resting = toys.filter(
          ({ body }) => body.position.y - body.radius < world.bounds.floor + 0.05,
        );
        const toy = resting[Math.floor(Math.random() * resting.length)];
        if (toy) {
          toy.body.velocity.set(between(-1.4, 1.4), between(5, 6.5));
          toy.body.spin = between(-5, 5);
        }
      }

      stepWorld(
        toys.map((toy) => toy.body),
        world,
        delta,
      );

      const { floor } = world.bounds;
      for (const toy of toys) {
        syncBody(toy.body, toy.outer, toy.inner);
        const height = Math.max(0, toy.body.position.y - toy.body.radius - floor);
        const fade = Math.max(0, 1 - height / 3.2);
        toy.shadow.position.set(toy.body.position.x, floor + 0.01, toy.outer.position.z);
        toy.shadow.scale.setScalar(0.45 + fade * 0.55);
        (toy.shadow.material as THREE.MeshBasicMaterial).opacity = 0.3 * fade;
      }

      scene.rotation.y = pointer.x * 0.06;
    },

    resize(width, height) {
      const view = visibleSize(camera.fov, width / height, camera.position.z);
      const halfWidth = Math.min(view.width / 2 - 0.25, 3.6);
      world.bounds.left = -halfWidth;
      world.bounds.right = halfWidth;
      world.bounds.floor = -view.height * 0.36;
      if (!settled) {
        settled = true;
        const bodies = toys.map((toy) => toy.body);
        for (let i = 0; i < 240; i += 1) stepWorld(bodies, world, 1 / 60);
      }
    },

    reset() {
      dropIn();
      tosses = 0;
      publish();
    },
  };
};
