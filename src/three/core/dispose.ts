import * as THREE from 'three';

function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  material.dispose();
}

/** Releases every geometry, material and texture under a scene graph node. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const renderable = object as Partial<THREE.Mesh>;
    renderable.geometry?.dispose();
    const material = renderable.material;
    if (Array.isArray(material)) material.forEach(disposeMaterial);
    else if (material) disposeMaterial(material);
  });
}
