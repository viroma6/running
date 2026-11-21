import {BODIES} from '../planets';
import {C, mono} from '../theme';

/** Barra de ruta superior: Sol → Más allá, con la parada actual resaltada */
export const Journey: React.FC<{current: number; accent: string; opacity?: number}> = ({current, accent, opacity = 1}) => (
  <div style={{position: 'absolute', top: 54, right: 120, display: 'flex', alignItems: 'center', gap: 10, opacity}}>
    {BODIES.map((b, i) => (
      <div key={b.id} style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <div
          style={{
            width: i === current ? 16 : 10,
            height: i === current ? 16 : 10,
            borderRadius: 99,
            background: i < current ? `${accent}99` : i === current ? accent : 'rgba(255,255,255,0.22)',
            boxShadow: i === current ? `0 0 16px ${accent}` : 'none',
          }}
        />
        {i < BODIES.length - 1 && <div style={{width: 26, height: 2, background: i < current ? `${accent}66` : 'rgba(255,255,255,0.12)'}} />}
      </div>
    ))}
    <div style={{fontFamily: mono, fontSize: 22, color: C.dim, marginLeft: 14}}>
      {String(current + 1).padStart(2, '0')}/{BODIES.length}
    </div>
  </div>
);
