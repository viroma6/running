"""Sustituye en out/raw.mp4 las paradas re-renderizadas por separado (out/parts/<id>.mp4)
y genera el vídeo final con el audio normalizado ya existente."""
import json, math, os, subprocess
FPS, FADE = 30, 12
tl = json.load(open('src/timeline.json'))
start, segs, cur = 0, [], 0  # segs: (fuente, desde, hasta) en frames
inputs = ['out/raw.mp4']
for c in tl['chapters']:
    d = math.ceil(c['duration'] * FPS)
    part = f"out/parts/{c['id']}.mp4"
    if os.path.exists(part):
        a, b = start + FADE, start + d - FADE
        segs.append((0, cur, a)); inputs.append(part)
        segs.append((len(inputs) - 1, FADE, d - FADE)); cur = b
    start += d - FADE
total = start + FADE
segs.append((0, cur, total))
fc, labels = [], []
for k, (src, a, b) in enumerate(segs):
    if b <= a: continue
    fc.append(f"[{src}:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{k}]"); labels.append(f"[v{k}]")
fc.append(f"{''.join(labels)}concat=n={len(labels)}:v=1:a=0[v]")
cmd = ['ffmpeg', '-v', 'error', '-y']
for i in inputs: cmd += ['-i', i]
cmd += ['-i', 'out/mas-alla-del-sistema-solar-cap2.mp4', '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', f'{len(inputs)}:a',
        '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', 'out/final.mp4']
print(len(inputs) - 1, 'paradas sustituidas; frames', total)
subprocess.run(cmd, check=True)
