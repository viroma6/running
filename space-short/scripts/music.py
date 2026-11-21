"""Música cinematográfica espacial: drone + pads + pulso + campanas -> public/audio/music.wav"""
import sys, numpy as np, soundfile as sf
OUT = sys.argv[1] + "/public/audio"; SR = 44100; DUR = 54.0; N = int(DUR*SR)
rng = np.random.default_rng(3); T = np.arange(N)/SR
note = lambda m: 440*2**((m-69)/12)
L = np.zeros(N); R = np.zeros(N)
# drone grave con batido lento
for m, a in [(38, .10), (45, .06), (50, .04)]:
    f = note(m); L += a*np.sin(2*np.pi*f*T + 0.3*np.sin(2*np.pi*0.07*T)); R += a*np.sin(2*np.pi*f*1.002*T)
# pads por acordes (Dm9 - Bbmaj7 - F - C), 4 s cada uno con crossfade
prog = [[50,53,57,60,64],[46,50,53,57,62],[41,48,53,57,60],[48,52,55,59,62]]
seg = 4.0
for i in range(int(DUR/seg)+1):
    s = int(i*seg*SR); n = int((seg+1.5)*SR); n = min(n, N-s)
    if n <= 0: break
    t = np.arange(n)/SR; e = np.minimum(1, t/1.2)*np.minimum(1, (n/SR - t)/1.5)
    for m in prog[i % 4]:
        f = note(m+12)
        v = sum(np.sin(2*np.pi*f*2**(d/1200)*t + rng.uniform(0, 6)) for d in (-7, 0, 7))
        L[s:s+n] += 0.012*v*e*(1+0.3*np.sin(2*np.pi*0.2*t)); R[s:s+n] += 0.012*v*e*(1+0.3*np.cos(2*np.pi*0.2*t))
# pulso tipo latido (sub kick suave) a 90 BPM desde el segundo 4
beat = 60/90
for k in range(int(4/beat), int((DUR-3)/beat)):
    s = int(k*beat*SR); t = np.arange(int(0.5*SR))/SR
    if s+len(t) > N: break
    kk = np.sin(2*np.pi*(45+60*np.exp(-t*25))*t)*np.exp(-t*7)*0.28
    L[s:s+len(t)] += kk; R[s:s+len(t)] += kk
# campanas/arpegio brillante con eco
bell_notes = [74,77,81,84,81,77,74,72]
for k in range(int(DUR/(beat))):
    if k < 6: continue
    s = int(k*beat*SR); t = np.arange(int(1.6*SR))/SR
    if s+len(t) > N: break
    m = bell_notes[k % 8]; f = note(m)
    b = (np.sin(2*np.pi*f*t) + 0.4*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*6))*np.exp(-t*3.2)*0.03
    for d, g, pan in [(0, 1, 0.5), (0.33, 0.5, 0.2), (0.66, 0.3, 0.8)]:
        o = s+int(d*SR); m2 = min(len(b), N-o)
        if m2>0: L[o:o+m2] += b[:m2]*g*(1-pan)*2; R[o:o+m2] += b[:m2]*g*pan*2
# aire / ruido cósmico
air = np.convolve(rng.standard_normal(N), np.ones(60)/60, mode='same')*0.03
L += air; R += np.roll(air, 2000)
fade = np.minimum(1, T/2.0)*np.minimum(1, (DUR-T)/3.0)
mix = np.stack([L*fade, R*fade], 1); mix /= np.abs(mix).max()*1.1
sf.write(f"{OUT}/music.wav", mix.astype(np.float32), SR); print("ok")
