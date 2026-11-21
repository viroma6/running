"""Renderiza paradas en tramos cortos (navegador nuevo por tramo) y los une.
Evita que las escenas WebGL dejen de dibujarse en secuencias largas."""
import json, math, os, subprocess, sys
S = '/tmp/claude-0/-home-user-running/6fcfd8e2-c517-5a05-aa4c-212573df6a38/scratchpad'
B = ['--browser-executable=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '--gl=angle']
N = 120
tl = {c['id']: c for c in json.load(open('src/timeline.json'))['chapters']}
for cid in sys.argv[1:]:
    if os.path.exists(f'out/parts/{cid}.mp4'): continue
    d = math.ceil(tl[cid]['duration'] * 30)
    files = []
    for a in range(0, d, N):
        b = min(a + N, d) - 1
        f = os.path.abspath(f'out/chunks/{cid}_{a:05d}.mp4')
        if not os.path.exists(f):
            for attempt in range(3):
                r = subprocess.run(['npx', 'remotion', 'render', f'{S}/bundle', f'p-{cid}', f + '.tmp.mp4', f'--frames={a}-{b}', '--codec=h264', '--crf=18', '--muted', '--concurrency=1', '--timeout=180000', '--log=error', *B])
                if r.returncode == 0: os.rename(f + '.tmp.mp4', f); break
        files.append(f)
    open(f'out/chunks/{cid}.txt', 'w').write(''.join(f"file '{x}'\n" for x in files))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'out/chunks/{cid}.txt', '-c', 'copy', f'out/parts/{cid}.mp4'], check=True)
    print(cid, 'done', flush=True)
