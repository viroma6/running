"""Locución Kokoro por capítulo + timeline (frases, callouts) -> public/audio/*.wav, src/timeline.json"""
import sys, json, numpy as np, soundfile as sf
sys.path.insert(0, sys.argv[3])
from kokoro_onnx import Kokoro
from script_data import CHAPTERS
MODELS, OUT = sys.argv[1], sys.argv[2]
VOICE, SPEED, SR = "em_alex", 0.98, 24000
LEAD = {"intro": 0.6}; DEFAULT_LEAD = 3.2; GAP = 0.42; TAIL = 0.6; OUTRO_TAIL = 18.0
k = Kokoro(f"{MODELS}/kokoro.onnx", f"{MODELS}/voices.bin")
def trim(a, th=0.012):
    i = np.where(np.abs(a) > th)[0]; return a[max(i[0]-240, 0): i[-1]+1500]
tl = {"chapters": []}
for cid, phrases in CHAPTERS:
    lead = LEAD.get(cid, DEFAULT_LEAD); parts = [np.zeros(int(lead*SR))]; t = lead; ph = []
    for tts, disp, callout in phrases:
        a, _ = k.create(tts, voice=VOICE, speed=SPEED, lang="es"); a = trim(a.astype(np.float32)); d = len(a)/SR
        ph.append({"text": disp or tts, "start": round(t, 3), "end": round(t+d, 3), "callout": callout})
        parts += [a, np.zeros(int(GAP*SR))]; t += d + GAP
    parts.append(np.zeros(int((OUTRO_TAIL if cid == "outro" else TAIL)*SR)))
    audio = np.concatenate(parts); sf.write(f"{OUT}/public/audio/{cid}.wav", audio, SR)
    tl["chapters"].append({"id": cid, "duration": round(len(audio)/SR, 3), "lead": lead, "phrases": ph})
    print(cid, round(len(audio)/SR, 1), flush=True)
print("TOTAL", round(sum(c["duration"] for c in tl["chapters"]) / 60, 2), "min")
json.dump(tl, open(f"{OUT}/src/timeline.json", "w"), ensure_ascii=False, indent=1)
