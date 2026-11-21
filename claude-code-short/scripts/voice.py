"""Genera la locución (Kokoro TTS) por escena + timings de subtítulos -> src/timeline.json"""
import sys, json, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

MODELS, OUT = sys.argv[1], sys.argv[2]
VOICE, SPEED, SR = "em_alex", 1.12, 24000
k = Kokoro(f"{MODELS}/kokoro.onnx", f"{MODELS}/voices.bin")

# (texto para TTS con fonética, texto mostrado en pantalla)
SCENES = {
 "hook": [("¿Sigues usando Clod Cod como un simple chat?", "¿Sigues usando Claude Code como un simple chat?"),
          ("Estás desperdiciando su verdadero poder.", "Estás desperdiciando su verdadero poder."),
          ("Cinco trucos que usan sus propios creadores.", "5 trucos que usan sus propios creadores.")],
 "tip1": [("Truco uno.", "Truco 1."),
          ("Pulsa shift tab y activa el modo plan.", "Pulsa Shift+Tab y activa el modo plan."),
          ("Clod diseña la estrategia antes de tocar una sola línea.", "Claude diseña la estrategia antes de tocar una sola línea.")],
 "tip2": [("Truco dos.", "Truco 2."),
          ("Dale una forma de verificar su trabajo: tests, comandos o el navegador.", "Dale una forma de verificar su trabajo: tests, comandos o el navegador."),
          ("Ánthropic dice que es el truco con más impacto.", "Anthropic dice que es el truco con más impacto.")],
 "tip3": [("Truco tres.", "Truco 3."),
          ("Cuando le corrijas, termina con: actualiza tu Clod punto eme de.", "Cuando le corrijas, termina con: actualiza tu CLAUDE.md"),
          ("Así nunca repite el mismo error.", "Así nunca repite el mismo error.")],
 "tip4": [("Truco cuatro.", "Truco 4."),
          ("Usa barra clir entre tareas, y barra compact cuando la conversación crezca.", "Usa /clear entre tareas y /compact cuando la conversación crezca."),
          ("Contexto limpio, respuestas brillantes.", "Contexto limpio, respuestas brillantes.")],
 "tip5": [("Truco cinco.", "Truco 5."),
          ("Lanza varias sesiones en paralelo con clod, guion guion worktri.", "Lanza varias sesiones en paralelo con claude --worktree"),
          ("Tres agentes programando a la vez.", "3 agentes programando a la vez.")],
 "cta":  [("Guarda este vídeo para no olvidarlo,", "Guarda este vídeo para no olvidarlo"),
          ("y sígueme para más trucos de inteligencia artificial.", "y sígueme para más trucos de IA.")],
}
GAP, LEAD, TAIL = 0.16, 0.08, 0.35

def trim(a, th=0.012):
    idx = np.where(np.abs(a) > th)[0]
    return a[max(idx[0]-240,0): idx[-1]+1200] if len(idx) else a

timeline = {"fps": 30, "scenes": []}
for name, phrases in SCENES.items():
    parts, words, t = [np.zeros(int(LEAD*SR))], [], LEAD
    for i, (tts, disp) in enumerate(phrases):
        a, _ = k.create(tts, voice=VOICE, speed=SPEED, lang="es")
        a = trim(a.astype(np.float32)); d = len(a)/SR
        ws = disp.split(); w = np.array([len(re.sub(r"[^\wáéíóúñ+/.-]", "", x)) + 2.5 for x in ws], float)
        cum = np.concatenate([[0], np.cumsum(w)]) / w.sum() * (d - 0.1)
        for j, x in enumerate(ws):
            words.append({"text": x, "start": round(t + cum[j], 3), "end": round(t + cum[j+1], 3), "phrase": i})
        parts += [a, np.zeros(int(GAP*SR))]; t += d + GAP
    parts.append(np.zeros(int(TAIL*SR))); audio = np.concatenate(parts)
    sf.write(f"{OUT}/public/audio/{name}.wav", audio, SR)
    timeline["scenes"].append({"id": name, "duration": round(len(audio)/SR, 3), "words": words})
    print(name, round(len(audio)/SR, 2))
print("TOTAL", round(sum(s["duration"] for s in timeline["scenes"]), 2))
json.dump(timeline, open(f"{OUT}/src/timeline.json", "w"), ensure_ascii=False, indent=1)
