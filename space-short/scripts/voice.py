"""Genera la locución (Kokoro TTS) por escena + timings de subtítulos -> src/timeline.json"""
import sys, json, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

MODELS, OUT = sys.argv[1], sys.argv[2]
VOICE, SPEED, SR = "em_alex", 1.0, 24000
k = Kokoro(f"{MODELS}/kokoro.onnx", f"{MODELS}/voices.bin")

# (texto para TTS con fonética, texto mostrado en pantalla)
SCENES = {
 "hook": [("Si el Sol desapareciera ahora mismo,", "Si el Sol desapareciera ahora mismo,"),
          ("no te enterarías hasta dentro de ocho minutos.", "no te enterarías hasta dentro de 8 minutos."),
          ("Y eso no es lo más loco del universo.", "Y eso no es lo más loco del universo.")],
 "f1":   [("En Venus, un día dura más que un año entero.", "En Venus, un día dura más que un año entero."),
          ("Tarda doscientos cuarenta y tres días en girar sobre sí mismo,", "Tarda 243 días en girar sobre sí mismo,"),
          ("pero solo doscientos veinticinco en dar la vuelta al Sol.", "pero solo 225 en dar la vuelta al Sol.")],
 "f2":   [("Dentro del Sol cabrían un millón trescientas mil Tierras.", "Dentro del Sol cabrían 1.300.000 Tierras."),
          ("Y aun así, es una estrella del montón.", "Y aun así, es una estrella del montón.")],
 "f3":   [("Una cucharadita de estrella de neutrones", "Una cucharadita de estrella de neutrones"),
          ("pesaría unos mil millones de toneladas.", "pesaría unos 1.000 millones de toneladas."),
          ("Lo mismo que diez mil portaaviones.", "Lo mismo que 10.000 portaaviones.")],
 "f4":   [("Las huellas de los astronautas en la Luna", "Las huellas de los astronautas en la Luna"),
          ("pueden durar millones de años.", "pueden durar millones de años."),
          ("Allí no hay viento ni lluvia que las borre.", "Allí no hay viento ni lluvia que las borre.")],
 "cta":  [("¿Cuál te ha volado la cabeza?", "¿Cuál te ha volado la cabeza?"),
          ("Te leo en comentarios,", "Te leo en comentarios"),
          ("y sígueme para más secretos del universo.", "y sígueme para más secretos del universo.")],
}
GAP, LEAD, TAIL = 0.22, 0.08, 0.35

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
