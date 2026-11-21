import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';

const cache = new Map<string, Promise<THREE.Texture>>();
const load = (name: string) => {
  if (!cache.has(name)) {
    cache.set(
      name,
      new Promise((res, rej) =>
        new THREE.TextureLoader().load(
          staticFile(`tex/${name}`),
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 8;
            res(t);
          },
          undefined,
          rej,
        ),
      ),
    );
  }
  return cache.get(name)!;
};

export type Textures = Record<string, THREE.Texture>;

/** Precarga texturas (fuera del ThreeCanvas) y bloquea el render hasta tenerlas */
export const useTextures = (names: string[]): Textures | null => {
  const key = names.join('|');
  const [tex, setTex] = useState<Textures | null>(null);
  const [handle] = useState(() => delayRender(`texturas ${key}`));
  useEffect(() => {
    Promise.all(names.map(load))
      .then((ts) => {
        setTex(Object.fromEntries(names.map((n, i) => [n, ts[i]])));
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, handle]);
  return tex;
};
