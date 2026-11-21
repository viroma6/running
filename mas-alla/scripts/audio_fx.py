"""Sintetiza música de fondo (beat electrónico suave) y SFX -> public/audio"""
import sys, numpy as np, soundfile as sf
OUT = sys.argv[1] + "/public/audio"; SR = 44100; rng = np.random.default_rng(7)
def t(d): return np.arange(int(d*SR))/SR
def lp(x, a):  # one-pole lowpass
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a*(x[i]-acc); y[i] = acc
    return y
def env(n, a, r):
    e = np.ones(n); A = min(int(a*SR), n//2); R = min(int(r*SR), n//2)
    e[:A] = np.linspace(0,1,A); e[-R:] *= np.linspace(1,0,R); return e
note = lambda m: 440*2**((m-69)/12)

# ---------- MÚSICA ----------
BPM, DUR = 112, 56.0; beat = 60/BPM; N = int(DUR*SR); mix = np.zeros(N)
prog = [[57,60,64,67],[53,57,60,64],[48,52,55,60],[55,59,62,65]]  # Am7 Fmaj7 C G7
bar = 4*beat
for b in range(int(DUR/bar)+1):
    ch = prog[b % 4]; s = int(b*bar*SR); n = min(int(bar*SR), N-s)
    if n <= 0: break
    tt = t(bar)[:n]; pad = np.zeros(n)
    for m in ch:
        for det in (-0.08, 0.08):
            f = note(m)*2**(det/12); pad += np.sin(2*np.pi*f*tt) + 0.3*np.sin(2*np.pi*2*f*tt)
    mix[s:s+n] += 0.018*pad*env(n, 0.25, 0.4)
    bass = np.sin(2*np.pi*note(ch[0]-12)*tt)
    for q in range(4):  # bajo en corcheas con sidechain
        qs = int(q*beat*SR); qn = min(int(beat*SR), n-qs)
        if qn>0: mix[s+qs:s+qs+qn] += 0.09*bass[qs:qs+qn]*np.exp(-t(beat)[:qn]*3)
# arpegio pluck
for i in range(int(DUR/(beat/2))):
    ch = prog[int(i*beat/2/bar) % 4]; m = ch[[0,2,1,3,2,1,3,2][i%8]]+12
    s = int(i*beat/2*SR); n = int(0.35*SR)
    if s+n > N: break
    tt = t(0.35); mix[s:s+n] += 0.035*np.sin(2*np.pi*note(m)*tt)*np.exp(-tt*9)
# batería
kick_t = t(0.35); kick = np.sin(2*np.pi*(50+90*np.exp(-kick_t*30))*kick_t)*np.exp(-kick_t*9)
hat = lp(rng.standard_normal(int(0.05*SR)), 0.9); hat -= lp(hat, 0.2); hat *= np.exp(-t(0.05)*80)
clap = rng.standard_normal(int(0.2*SR))*np.exp(-t(0.2)*25); clap -= lp(clap, 0.1)
for i in range(int(DUR/beat)):
    s = int(i*beat*SR)
    if s+len(kick) < N and i >= 4: mix[s:s+len(kick)] += 0.33*kick
    if i % 2 == 1 and i >= 4 and s+len(clap) < N: mix[s:s+len(clap)] += 0.08*clap
    h = s+int(beat/2*SR)
    if h+len(hat) < N: mix[h:h+len(hat)] += 0.05*hat
# sidechain global
sc = np.ones(N)
for i in range(4, int(DUR/beat)):
    s = int(i*beat*SR); n = min(int(0.25*SR), N-s); sc[s:s+n] = 0.55+0.45*np.linspace(0,1,n)**0.6
mix *= sc; mix *= env(N, 1.0, 2.5); mix /= np.max(np.abs(mix))*1.1
sf.write(f"{OUT}/music.wav", np.stack([mix, np.roll(mix, 300)], 1).astype(np.float32), SR)

# ---------- SFX ----------
def save(name, x): sf.write(f"{OUT}/{name}.wav", (x/np.max(np.abs(x))*0.9).astype(np.float32), SR)
# whoosh: ruido filtrado con barrido
d = 0.55; n = int(d*SR); noise = rng.standard_normal(n); cut = np.linspace(0.02, 0.35, n)**1.5
y = np.empty(n); acc = 0
for i in range(n): acc += cut[i]*(noise[i]-acc); y[i] = acc
save("whoosh", y*np.sin(np.linspace(0, np.pi, n))**2)
# pop
tt = t(0.12); save("pop", np.sin(2*np.pi*(900*np.exp(-tt*25)+200)*tt)*np.exp(-tt*35))
# click teclado
tt = t(0.04); c = rng.standard_normal(len(tt))*np.exp(-tt*250); save("click", c - lp(c, 0.3))
# riser
d = 1.4; tt = t(d); f = 200*2**(tt*2.5)
save("riser", (np.sin(2*np.pi*np.cumsum(f)/SR)*0.5 + lp(rng.standard_normal(len(tt)),0.2)) * (tt/d)**2)
# impacto (boom)
tt = t(1.2); save("impact", np.sin(2*np.pi*(40+120*np.exp(-tt*12))*tt)*np.exp(-tt*3.5) + 0.3*lp(rng.standard_normal(len(tt)),0.05)*np.exp(-tt*6))
# ding
tt = t(1.0); save("ding", (np.sin(2*np.pi*1318*tt)+0.5*np.sin(2*np.pi*2637*tt)+0.2*np.sin(2*np.pi*3951*tt))*np.exp(-tt*4))
print("ok")
