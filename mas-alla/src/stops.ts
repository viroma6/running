export type Stop = {
  id: string;
  name: string;
  subtitle: string;
  accent: string;
  where: string;
  /** distancia a la Tierra en años luz (para el contador del salto) */
  ly: number;
};

export const STOPS: Stop[] = [
  {id: 'heliosphere', name: 'Heliopausa', subtitle: 'La frontera invisible del Sol', accent: '#7FD1FF', where: 'a 18.000 millones de km', ly: 0.0019},
  {id: 'proxima', name: 'Próxima Centauri', subtitle: 'Nuestra vecina más cercana', accent: '#FF6B4A', where: 'a 4,24 años luz', ly: 4.24},
  {id: 'nebula', name: 'Nebulosas', subtitle: 'Las guarderías de estrellas', accent: '#5EEAD4', where: 'Pilares de la Creación · 6.500 años luz', ly: 6500},
  {id: 'giants', name: 'Betelgeuse', subtitle: 'Las supergigantes rojas', accent: '#FF8A3D', where: 'a unos 550 años luz', ly: 550},
  {id: 'supernova', name: 'Supernova', subtitle: 'Cuando una estrella muere', accent: '#FFD166', where: 'Nebulosa del Cangrejo · 6.500 años luz', ly: 6500},
  {id: 'neutron', name: 'Púlsares', subtitle: 'Las estrellas de neutrones', accent: '#8EC5FF', where: 'Púlsar del Cangrejo · 6.500 años luz', ly: 6500},
  {id: 'blackhole', name: 'Agujeros negros', subtitle: 'Donde ni la luz escapa', accent: '#FFA94D', where: 'Sagitario A* · 26.000 años luz', ly: 26000},
  {id: 'milkyway', name: 'La Vía Láctea', subtitle: 'Nuestra galaxia, vista desde fuera', accent: '#C4B5FD', where: '100.000 años luz de diámetro', ly: 150000},
  {id: 'andromeda', name: 'Andrómeda', subtitle: 'El choque que viene', accent: '#F0ABFC', where: 'a 2,5 millones de años luz', ly: 2.5e6},
  {id: 'universe', name: 'El universo', subtitle: 'Hasta donde alcanza la vista', accent: '#93C5FD', where: '46.500 millones de años luz de radio', ly: 4.65e10},
];
export const stopIndex = (id: string) => STOPS.findIndex((s) => s.id === id);
export const stop = (id: string) => STOPS[stopIndex(id)];

/** Separador de miles con punto (también para 4 cifras, como en prensa) */
export const miles = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Formatea una distancia en años luz de forma legible */
export const fmtLy = (ly: number) => {
  const km = ly * 9.4607e12;
  if (km < 1e11) return `${miles(km < 1e9 ? Math.round(km / 1e6) : Math.round(km / 1e9) * 1000)} M km`;
  if (ly < 100) return `${ly.toLocaleString('es-ES', {maximumFractionDigits: 2})} años luz`;
  if (ly < 1e6) return `${miles(ly)} años luz`;
  if (ly < 1e9) return `${(ly / 1e6).toLocaleString('es-ES', {maximumFractionDigits: 1})} M años luz`;
  return `${miles(ly / 1e6)} M años luz`;
};
