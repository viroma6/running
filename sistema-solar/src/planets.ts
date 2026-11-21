export type Body = {
  id: string;
  name: string;
  subtitle: string;
  tex: string;
  accent: string;
  atmosphere?: string;
  tilt: number; // rad
  spin: number; // rad por frame
  ring?: {inner: number; outer: number; color: string; opacity: number};
  emissive?: boolean;
  distance: string;
  orbit: number; // índice de órbita (0 = Sol)
};

export const BODIES: Body[] = [
  {id: 'sun', name: 'El Sol', subtitle: 'La estrella que lo mueve todo', tex: 'sun.jpg', accent: '#FFB347', tilt: 0.12, spin: 0.0016, emissive: true, distance: 'Nuestra estrella', orbit: 0},
  {id: 'mercury', name: 'Mercurio', subtitle: 'El mensajero abrasado', tex: 'mercury.jpg', accent: '#C9B8A6', tilt: 0.02, spin: 0.0022, distance: 'a 58 millones de km del Sol', orbit: 1},
  {id: 'venus', name: 'Venus', subtitle: 'El infierno con nubes', tex: 'venus.jpg', accent: '#F5C97A', atmosphere: '#ffd59a', tilt: 0.05, spin: -0.0012, distance: 'a 108 millones de km del Sol', orbit: 2},
  {id: 'earth', name: 'La Tierra', subtitle: 'El punto azul pálido', tex: 'earth.jpg', accent: '#5CB8FF', atmosphere: '#6cc6ff', tilt: 0.41, spin: 0.0035, distance: 'a 150 millones de km del Sol', orbit: 3},
  {id: 'mars', name: 'Marte', subtitle: 'El planeta rojo', tex: 'mars.jpg', accent: '#FF7A50', atmosphere: '#ff9d7a', tilt: 0.44, spin: 0.0035, distance: 'a 228 millones de km del Sol', orbit: 4},
  {id: 'jupiter', name: 'Júpiter', subtitle: 'El rey de los planetas', tex: 'jupiter.jpg', accent: '#E8B98A', atmosphere: '#f3d2ad', tilt: 0.05, spin: 0.006, distance: 'a 778 millones de km del Sol', orbit: 5},
  {id: 'saturn', name: 'Saturno', subtitle: 'El señor de los anillos', tex: 'saturn.jpg', accent: '#F2D9A0', atmosphere: '#f6e2b5', tilt: 0.47, spin: 0.0055, ring: {inner: 1.25, outer: 2.3, color: '#e8d3a5', opacity: 0.9}, distance: 'a 1.430 millones de km del Sol', orbit: 6},
  {id: 'uranus', name: 'Urano', subtitle: 'El gigante tumbado', tex: 'uranus.jpg', accent: '#8FE3E8', atmosphere: '#a7f0f5', tilt: 1.71, spin: 0.004, ring: {inner: 1.6, outer: 1.75, color: '#b9e6ea', opacity: 0.35}, distance: 'a 2.870 millones de km del Sol', orbit: 7},
  {id: 'neptune', name: 'Neptuno', subtitle: 'El planeta de las matemáticas', tex: 'neptune.jpg', accent: '#5B8CFF', atmosphere: '#7da2ff', tilt: 0.49, spin: 0.0045, distance: 'a 4.500 millones de km del Sol', orbit: 8},
  {id: 'beyond', name: 'Más allá', subtitle: 'Plutón y los confines', tex: 'pluto.jpg', accent: '#D9C2A8', tilt: 0.3, spin: 0.002, distance: 'a 5.900 millones de km del Sol', orbit: 9},
];
export const body = (id: string) => BODIES.find((b) => b.id === id)!;
