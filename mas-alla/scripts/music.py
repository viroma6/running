"""Banda sonora ambiental cinematográfica de larga duración -> public/audio/music.wav (mono-friendly estéreo)"""
import sys, json, numpy as np, soundfile as sf
OUT = sys.argv[1]; SR = 32000
tl = json.load(open(f"{OUT}/src/timeline.json")); DUR = sum(c["duration"] for c in tl["chapters"]) + 2
N = int(DUR*SR); T = np.arange(N)/SR; rng = np.random.default_rng(23)
note = lambda m: 440*2**((m-69)/12)
L = np.zeros(N, np.float32); R = np.zeros(N, np.float32)
for m, a in [(33, .09), (40, .05)]:
    f = note(m); L += (a*np.sin(2*np.pi*f*T + 0.4*np.sin(2*np.pi*0.05*T))).astype(np.float32); R += (a*np.sin(2*np.pi*f*1.0015*T)).astype(np.float32)
prog = [[45,48,52,55,59],[41,45,48,52,55],[43,47,50,55,57],[40,43,47,50,55],[38,45,48,52,57],[44,47,52,55,59]]
seg = 8.0
for i in range(int(DUR/seg)+1):
    s = int(i*seg*SR); n = min(int((seg+3)*SR), N-s)
    if n <= 0: break
    t = np.arange(n)/SR; e = np.minimum(1, t/2.5)*np.minimum(1, (n/SR-t)/3)
    for m in prog[i % len(prog)]:
        f = note(m+12)
        v = sum(np.sin(2*np.pi*f*2**(d/1200)*t + rng.uniform(0, 6)) for d in (-6, 0, 6))
        L[s:s+n] += (0.010*v*e*(1+0.3*np.sin(2*np.pi*0.11*t))).astype(np.float32)
        R[s:s+n] += (0.010*v*e*(1+0.3*np.cos(2*np.pi*0.11*t))).astype(np.float32)
# campanas dispersas
bells = [74,76,79,81,84,79,76,72]
t_b = 3.0
while t_b < DUR-4:
    s = int(t_b*SR); t = np.arange(int(2.5*SR))/SR; f = note(bells[rng.integers(0, 8)])
    b = ((np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*5))*np.exp(-t*2.2)*0.022).astype(np.float32)
    for d, g, pan in [(0, 1, rng.uniform(.2,.8)), (0.45, .45, .3), (0.9, .25, .7)]:
        o = s+int(d*SR); m2 = min(len(b), N-o)
        if m2 > 0: L[o:o+m2] += b[:m2]*g*(1-pan)*2; R[o:o+m2] += b[:m2]*g*pan*2
    t_b += rng.choice([1.5, 3.0, 4.5, 6.0])
air = np.convolve(rng.standard_normal(N).astype(np.float32), np.ones(80, np.float32)/80, mode='same')*0.025
L += air; R += np.roll(air, 3000)
fade = (np.minimum(1, T/3.0)*np.minimum(1, (DUR-T)/4.0)).astype(np.float32)
mix = np.stack([L*fade, R*fade], 1); mix /= np.abs(mix).max()*1.12
sf.write(f"{OUT}/public/audio/music.wav", mix, SR); print("ok", round(DUR, 1))
