#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tts_es.py - Voces en español naturales (calidad tipo ElevenLabs) con motores gratuitos.

Motores:
  qwen        Qwen3-TTS (Apache-2.0). Mejor calidad. Clonación 3-15 s, diseño de voz por descripción. GPU.
  chatterbox  Chatterbox Multilingual V3 (MIT). Clonación + control de emoción. GPU (CPU lento).
  kokoro      Kokoro-82M (Apache-2.0). Ligero, rápido en CPU. Sin clonación.
  edge        Voces neuronales de Microsoft Edge (online, sin clave). Sin GPU.

Ejemplos:
  python tts_es.py -t "Hola, bienvenido." -o hola.mp3
  python tts_es.py -f guion.txt --diseno "voz masculina grave y cálida, española" -o out.mp3 --preset audiolibro
  python tts_es.py --crear-voz victor --desde muestra.m4a
  python tts_es.py -f capitulo1.txt --voz-guardada victor --verificar -o cap1.mp3
  python tts_es.py -f dialogo.txt --reparto reparto.json -o podcast.mp3 --musica fondo.mp3
"""
import argparse
import asyncio
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf

VOCES_DIR = Path(os.environ.get("VOCES_ES_DIR", Path.home() / ".voces-es"))
TMP = Path(tempfile.mkdtemp(prefix="tts_es_"))

DISENO_DEFECTO = {
    "f": ("Voz femenina adulta de unos 35 años, española nativa con acento neutro peninsular, "
          "timbre cálido y cercano, dicción muy clara, ritmo natural y pausado, como una locutora "
          "profesional de audiolibros grabando en estudio."),
    "m": ("Voz masculina adulta de unos 40 años, español nativo con acento neutro peninsular, "
          "timbre grave, cálido y aterciopelado, dicción muy clara, ritmo natural y pausado, como un "
          "locutor profesional de radio grabando en estudio."),
}
MUESTRA_DISENO = ("Hola, me alegra mucho que estés aquí. Durante los próximos minutos voy a acompañarte, "
                  "paso a paso, con calma y con claridad. ¿Empezamos?")

# Preset: (prefiltros, LUFS integrado, true peak, LRA)
PRESETS = {
    "podcast":    ("highpass=f=70,deesser=i=0.3,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=80:makeup=2", -16, -1.5, 11),
    "audiolibro": ("highpass=f=70,deesser=i=0.3,acompressor=threshold=-22dB:ratio=2:attack=10:release=120", -20, -3.0, 9),
    "meditacion": ("highpass=f=60,lowpass=f=12000,deesser=i=0.4,acompressor=threshold=-24dB:ratio=2:attack=15:release=200", -20, -3.0, 7),
    "redes":      ("highpass=f=80,deesser=i=0.3,acompressor=threshold=-18dB:ratio=3:attack=3:release=60:makeup=3", -14, -1.0, 8),
    "ninguno":    (None, None, None, None),
}
EDGE_VOCES = {
    "es-ES-ElviraNeural": "España, mujer (por defecto)", "es-ES-AlvaroNeural": "España, hombre",
    "es-ES-XimenaNeural": "España, mujer joven", "es-MX-DaliaNeural": "México, mujer",
    "es-MX-JorgeNeural": "México, hombre", "es-AR-ElenaNeural": "Argentina, mujer",
    "es-AR-TomasNeural": "Argentina, hombre", "es-CO-SalomeNeural": "Colombia, mujer",
    "es-US-PalomaNeural": "EE. UU., mujer", "es-US-AlonsoNeural": "EE. UU., hombre",
}
KOKORO_VOCES = {"ef_dora": "mujer", "em_alex": "hombre", "em_santa": "hombre (grave)"}
MAX_CHARS = {"qwen": 350, "chatterbox": 280, "kokoro": 500, "edge": 2500}


def log(*m):
    print("•", *m, file=sys.stderr, flush=True)


# ─────────────────────────── Normalización de texto ───────────────────────────
ABREVIATURAS = [
    (r"\bSr\.", "señor"), (r"\bSra\.", "señora"), (r"\bSrta\.", "señorita"),
    (r"\bDr\.", "doctor"), (r"\bDra\.", "doctora"), (r"\bUd\.", "usted"), (r"\bUds\.", "ustedes"),
    (r"\bDña\.", "doña"), (r"\betc\.", "etcétera"), (r"\bp\.\s?ej\.", "por ejemplo"),
    (r"\bpág\.", "página"), (r"\bpágs\.", "páginas"), (r"\bcap\.", "capítulo"),
    (r"\baprox\.", "aproximadamente"), (r"\bvs\.?(?=\s)", "contra"), (r"\bn\.?º", "número"),
    (r"\bEE\.\s?UU\.", "Estados Unidos"), (r"\bh\.(?=\s|$)", "horas"),
]
UNIDADES = [
    (r"(\d)\s?%", r"\1 por ciento"), (r"(\d)\s?€", r"\1 euros"), (r"€\s?(\d[\d.,]*)", r"\1 euros"),
    (r"\$\s?(\d[\d.,]*)", r"\1 dólares"), (r"(\d)\s?\$", r"\1 dólares"),
    (r"(\d)\s?km\b", r"\1 kilómetros"), (r"(\d)\s?kg\b", r"\1 kilos"), (r"(\d)\s?min\b", r"\1 minutos"),
    (r"(\d)\s?cm\b", r"\1 centímetros"), (r"(\d)\s?m\b", r"\1 metros"), (r"(\d)\s?ml\b", r"\1 mililitros"),
]
APOCOPE = (r"\b(veinti)?uno(\s+(?:euros?|dólares?|kilómetros?|kilos?|metros?|centímetros?|años?|días?|"
           r"minutos?|segundos?|horas?|meses?|semanas?|personas?|libros?|capítulos?|pasos?|veces))\b")


def _w(n, **kw):
    from num2words import num2words
    return num2words(int(n), lang="es", **kw)


def _hora(m):
    h, mi = int(m.group(1)), int(m.group(2))
    if h > 24 or mi > 59:
        return m.group(0)
    if mi == 0:
        return f"{_w(h)} en punto"
    extra = {15: "y cuarto", 30: "y media"}.get(mi, f"y {_w(mi)}")
    return f"{_w(h)} {extra}"


def _ordinal(m):
    txt = _w(m.group(1), to="ordinal")
    return re.sub(r"o\b", "a", txt) if m.group(2) == "ª" else txt


def normalizar(texto, diccionario=None):
    t = unicodedata.normalize("NFC", texto)
    t = re.sub(r"https?://\S+|www\.\S+", "", t)                       # URLs fuera
    t = re.sub(r"[*_#>`~|]+", "", t)                                  # markdown
    t = re.sub(r"[\U0001F000-\U0001FAFF☀-➿️]", "", t)  # emojis
    t = re.sub(r"\s*[—–]\s*", ", ", t)                                # rayas → pausa breve
    t = re.sub(r"\s*\(([^)]{1,200})\)", r", \1,", t)                  # paréntesis → incisos
    t = t.replace("...", "…").replace("“", '"').replace("”", '"').replace("«", '"').replace("»", '"')
    t = re.sub(r"\b([A-ZÁÉÍÓÚÑ]{5,})\b", lambda m: m.group(1).lower(), t)  # MAYÚSCULAS largas
    if diccionario:
        for k, v in diccionario.items():
            t = re.sub(rf"(?<!\w){re.escape(k)}(?!\w)", v, t, flags=re.IGNORECASE)
    for pat, rep in ABREVIATURAS:
        t = re.sub(pat, rep, t)
    for pat, rep in UNIDADES:
        t = re.sub(pat, rep, t)
    t = re.sub(r"\b(\d{1,2}):(\d{2})\b", _hora, t)
    t = re.sub(r"\b(\d+)\s?([ºª])", _ordinal, t)
    t = re.sub(r"\b\d{1,3}(?:\.\d{3})+\b", lambda m: m.group(0).replace(".", ""), t)  # 1.000.000
    t = re.sub(r"\b(\d+),(\d+)\b", lambda m: f"{_w(m.group(1))} coma {_w(m.group(2)) if not m.group(2).startswith('0') else ' '.join(_w(c) for c in m.group(2))}", t)
    t = re.sub(r"\b\d+\b", lambda m: _w(m.group(0)), t)
    t = re.sub(APOCOPE, lambda m: ("veintiún" if m.group(1) else "un") + m.group(2), t)
    t = re.sub(r",\s*,", ",", t)
    t = re.sub(r",\s*([.!?…;:])", r"\1", t)
    t = re.sub(r"\s+([,.;:!?…])", r"\1", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t.strip()


def cargar_diccionario(ruta_extra=None):
    d = {}
    for ruta in [VOCES_DIR / "pronunciacion.txt", ruta_extra]:
        if ruta and Path(ruta).exists():
            for linea in Path(ruta).read_text(encoding="utf-8").splitlines():
                if "=" in linea and not linea.strip().startswith("#"):
                    k, v = linea.split("=", 1)
                    d[k.strip()] = v.strip()
    return d


# ───────────────────────────── Segmentación ─────────────────────────────
def trocear(texto, maxc):
    frases = re.split(r"(?<=[.!?…;:])\s+", texto.strip())
    piezas = []
    for f in frases:
        if len(f) <= maxc:
            piezas.append(f)
            continue
        for p in re.split(r"(?<=,)\s+", f):
            while len(p) > maxc:                       # último recurso: cortar por palabras
                corte = p.rfind(" ", 0, maxc)
                corte = corte if corte > 0 else maxc
                piezas.append(p[:corte])
                p = p[corte:].strip()
            if p:
                piezas.append(p)
    chunks, cur = [], ""
    for p in piezas:
        if cur and len(cur) + 1 + len(p) > maxc:
            chunks.append(cur)
            cur = p
        else:
            cur = f"{cur} {p}".strip()
    if cur:
        chunks.append(cur)
    return [c for c in chunks if re.search(r"\w", c)]


def parsear(texto, maxc, reparto_keys, pausa_parrafo, diccionario):
    """Devuelve [('voz', texto, hablante) | ('pausa', segundos, None)]"""
    segs, hablante = [], reparto_keys[0]
    pat_h = re.compile(r"^\s*([A-Za-zÁÉÍÓÚÑáéíóúñ0-9_ ]{1,30}):\s*(.*)$")
    for parrafo in re.split(r"\n\s*\n", texto):
        lineas = parrafo.strip().splitlines()
        if not lineas:
            continue
        for linea in lineas:
            m = pat_h.match(linea)
            if m and m.group(1).strip() in reparto_keys:
                hablante, linea = m.group(1).strip(), m.group(2)
            for trozo in re.split(r"(\[pausa(?::[\d.]+)?\])", linea):
                mp = re.fullmatch(r"\[pausa(?::([\d.]+))?\]", trozo)
                if mp:
                    segs.append(("pausa", float(mp.group(1) or 0.8), None))
                elif trozo.strip():
                    for c in trocear(normalizar(trozo, diccionario), maxc):
                        segs.append(("voz", c, hablante))
        segs.append(("pausa", pausa_parrafo, None))
    while segs and segs[-1][0] == "pausa":
        segs.pop()
    return segs


# ─────────────────────────────── Voces ───────────────────────────────
def resolver_voz(spec):
    spec = dict(spec)
    if spec.get("voz_guardada"):
        d = VOCES_DIR / spec["voz_guardada"]
        if not (d / "ref.wav").exists():
            sys.exit(f"No existe la voz guardada '{spec['voz_guardada']}' en {d}")
        spec["ref"] = str(d / "ref.wav")
        if (d / "ref.txt").exists():
            spec["ref_text"] = (d / "ref.txt").read_text(encoding="utf-8").strip()
    return spec


def guardar_voz(nombre, wav, texto, meta):
    d = VOCES_DIR / nombre
    d.mkdir(parents=True, exist_ok=True)
    shutil.copy(wav, d / "ref.wav")
    (d / "ref.txt").write_text(texto or "", encoding="utf-8")
    (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"Voz guardada en {d}")


def transcribir(ruta, device="cpu", modelo="small"):
    from faster_whisper import WhisperModel
    m = WhisperModel(modelo, device="cuda" if device == "cuda" else "cpu",
                     compute_type="float16" if device == "cuda" else "int8")
    segs, _ = m.transcribe(str(ruta), language="es", beam_size=5)
    return " ".join(s.text.strip() for s in segs).strip()


def crear_voz(nombre, origen, ref_text, device):
    limpio = TMP / "ref_limpia.wav"
    filtros = ("highpass=f=80,lowpass=f=11000,afftdn=nf=-25,"
               "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse,"
               "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse,"
               "loudnorm=I=-20:TP=-2:LRA=11")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(origen), "-t", "15", "-af", filtros,
                    "-ac", "1", "-ar", "24000", str(limpio)], check=True)
    dur = sf.info(str(limpio)).duration
    if dur < 3:
        sys.exit(f"La muestra limpia dura {dur:.1f} s; hacen falta al menos 3 s (ideal 8-15 s).")
    if not ref_text:
        try:
            ref_text = transcribir(limpio, device)
            log(f"Transcripción automática: «{ref_text}»")
        except ImportError:
            log("faster-whisper no instalado: se guarda sin transcripción (clonación algo peor). "
                "Instala faster-whisper o pasa --ref-texto.")
    guardar_voz(nombre, limpio, ref_text, {"origen": str(origen), "duracion_s": round(dur, 2)})


# ─────────────────────────────── Motores ───────────────────────────────
def _seed(seed):
    try:
        import torch
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass
    np.random.seed(seed % (2**32))


class Qwen:
    def __init__(self, a, device, voces):
        import torch
        from qwen_tts import Qwen3TTSModel
        self.a = a
        tam = a.tamano or ("1.7B" if device != "cuda" or a.vram >= 7.5 else "0.6B")
        kw = {"device_map": "cuda:0" if device == "cuda" else device,
              "dtype": torch.bfloat16 if device == "cuda" else torch.float32}
        if device == "cuda":
            try:
                import flash_attn  # noqa: F401
                kw["attn_implementation"] = "flash_attention_2"
            except ImportError:
                pass
        cargar = lambda n: Qwen3TTSModel.from_pretrained(f"Qwen/Qwen3-TTS-12Hz-{n}", **kw)  # noqa: E731

        for k, s in voces.items():  # sin nada → diseño por defecto (los altavoces de serie no son nativos)
            if not (s.get("ref") or s.get("diseno") or s.get("voz")):
                s["diseno"] = DISENO_DEFECTO[a.genero]
        # 1) Diseñar una vez y clonar después → la MISMA voz en todos los fragmentos
        pendientes = {k: s for k, s in voces.items() if s.get("diseno") and not s.get("ref")}
        if pendientes:
            log(f"Diseñando {len(pendientes)} voz(es) con VoiceDesign 1.7B…")
            dm = cargar("1.7B-VoiceDesign")
            for k, s in pendientes.items():
                _seed(a.semilla)
                wavs, sr = dm.generate_voice_design(text=MUESTRA_DISENO, language="Spanish", instruct=s["diseno"])
                ruta = TMP / f"diseno_{k}.wav"
                sf.write(ruta, wavs[0], sr)
                s["ref"], s["ref_text"] = str(ruta), MUESTRA_DISENO
                nombre = s.get("guardar_como") or (a.guardar_voz if len(voces) == 1 else None)
                if nombre:
                    guardar_voz(nombre, ruta, MUESTRA_DISENO, {"origen": "diseño", "descripcion": s["diseno"]})
            del dm
            if device == "cuda":
                torch.cuda.empty_cache()
        self.prompts, self.custom = {}, {}
        if any(s.get("ref") for s in voces.values()):
            log(f"Cargando Qwen3-TTS {tam} Base (clonación)…")
            self.base = cargar(f"{tam}-Base")
            for k, s in voces.items():
                if s.get("ref"):
                    self.prompts[k] = self.base.create_voice_clone_prompt(
                        ref_audio=s["ref"], ref_text=s.get("ref_text") or None,
                        x_vector_only_mode=not bool(s.get("ref_text")))
        if any(not s.get("ref") for s in voces.values()):
            log(f"Cargando Qwen3-TTS {tam} CustomVoice…")
            self.cv = cargar(f"{tam}-CustomVoice")
            for k, s in voces.items():
                if not s.get("ref"):
                    self.custom[k] = (s.get("voz") or "Aiden", s.get("instruccion") or a.instruccion or "")

    def synth(self, t, seed, k):
        _seed(seed)
        if k in self.prompts:
            wavs, sr = self.base.generate_voice_clone(text=t, language="Spanish", voice_clone_prompt=self.prompts[k])
        else:
            spk, ins = self.custom[k]
            wavs, sr = self.cv.generate_custom_voice(text=t, language="Spanish", speaker=spk, instruct=ins)
        return np.asarray(wavs[0], dtype=np.float32).squeeze(), sr


class Chatterbox:
    def __init__(self, a, device, voces):
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        self.a, self.voces = a, voces
        log("Cargando Chatterbox Multilingual…")
        self.m = ChatterboxMultilingualTTS.from_pretrained(device=device)
        for k, s in voces.items():
            if not s.get("ref"):
                log(f"[{k}] Chatterbox sin referencia usa su voz por defecto (acento menos nativo). "
                    "Para español natural pasa --clonar o --voz-guardada.")

    def synth(self, t, seed, k):
        _seed(seed)
        s = self.voces[k]
        kw = {"language_id": "es", "exaggeration": float(s.get("emocion", self.a.emocion)),
              "cfg_weight": float(s.get("cfg", self.a.cfg))}
        if s.get("ref"):
            kw["audio_prompt_path"] = s["ref"]
        wav = self.m.generate(t, **kw)
        return wav.squeeze().detach().cpu().numpy().astype(np.float32), self.m.sr


class Kokoro:
    def __init__(self, a, device, voces):
        from kokoro import KPipeline
        self.a, self.voces = a, voces
        self.p = KPipeline(lang_code="e")

    def synth(self, t, seed, k):
        s = self.voces[k]
        voz = s.get("voz") or ("em_alex" if self.a.genero == "m" else "ef_dora")
        partes = [np.asarray(au, dtype=np.float32).reshape(-1)
                  for _, _, au in self.p(t, voice=voz, speed=float(s.get("velocidad", self.a.velocidad)))
                  if au is not None]
        return (np.concatenate(partes) if partes else np.zeros(0, np.float32)), 24000


class Edge:
    def __init__(self, a, device, voces):
        import edge_tts
        self.edge_tts, self.a, self.voces = edge_tts, a, voces

    def synth(self, t, seed, k):
        s = self.voces[k]
        voz = s.get("voz") or ("es-ES-AlvaroNeural" if self.a.genero == "m" else "es-ES-ElviraNeural")
        rate = f"{int(round((float(s.get('velocidad', self.a.velocidad)) - 1) * 100)):+d}%"
        mp3, wav = TMP / "edge.mp3", TMP / "edge.wav"
        asyncio.run(self.edge_tts.Communicate(t, voz, rate=rate, pitch=s.get("tono", self.a.tono)).save(str(mp3)))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-ac", "1", "-ar", "24000", str(wav)], check=True)
        y, sr = sf.read(str(wav), dtype="float32")
        return y, sr


MOTORES = {"qwen": Qwen, "chatterbox": Chatterbox, "kokoro": Kokoro, "edge": Edge}


def detectar():
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda", torch.cuda.get_device_properties(0).total_memory / 1e9
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps", 0.0
    except ImportError:
        pass
    return "cpu", 0.0


def instalado(mod):
    import importlib.util
    return importlib.util.find_spec(mod) is not None


def elegir_motor(device, vram, quiere_clon):
    if device == "cuda" and vram >= 5.5 and instalado("qwen_tts"):
        return "qwen"
    if device in ("cuda", "mps") and instalado("chatterbox"):
        return "chatterbox"
    if quiere_clon:
        for m, mod in (("qwen", "qwen_tts"), ("chatterbox", "chatterbox")):
            if instalado(mod):
                log(f"Clonación pedida sin GPU: usando {m} en {device} (será lento).")
                return m
    if instalado("kokoro"):
        return "kokoro"
    if instalado("edge_tts"):
        return "edge"
    sys.exit("No hay ningún motor instalado. Mira la sección 'Instalación' de la skill.")


# ─────────────────────────── Verificación (ASR) ───────────────────────────
def _plano(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-zñ0-9 ]+", " ", s).split()


class Verificador:
    def __init__(self, device):
        from faster_whisper import WhisperModel
        self.m = WhisperModel("small", device="cuda" if device == "cuda" else "cpu",
                              compute_type="float16" if device == "cuda" else "int8")

    def puntuar(self, y, sr, texto):
        ruta = TMP / "verif.wav"
        sf.write(ruta, y, sr)
        segs, _ = self.m.transcribe(str(ruta), language="es", beam_size=1)
        oido = " ".join(s.text for s in segs)
        score = difflib.SequenceMatcher(None, _plano(texto), _plano(oido)).ratio()
        cps = len(texto) / max(len(y) / sr, 0.1)                # caracteres/segundo (español ≈ 12-18)
        if cps < 6 or cps > 28:
            score *= 0.6
        return score, oido


# ─────────────────────────────── Audio ───────────────────────────────
def recortar(y, sr, umbral_db=-42, margen=0.04):
    if not len(y):
        return y
    thr = (10 ** (umbral_db / 20)) * max(float(np.max(np.abs(y))), 1e-6)
    idx = np.where(np.abs(y) > thr)[0]
    if not len(idx):
        return y[:0]
    m = int(margen * sr)
    return y[max(idx[0] - m, 0): min(idx[-1] + m, len(y))]


def fundido(y, sr, ms=12):
    n = min(int(sr * ms / 1000), len(y) // 2)
    if n > 0:
        r = np.linspace(0, 1, n, dtype=np.float32)
        y = y.copy()
        y[:n] *= r
        y[-n:] *= r[::-1]
    return y


def remuestrear(y, sr, sr_obj):
    if sr == sr_obj or not len(y):
        return y
    x_old = np.linspace(0, 1, len(y), endpoint=False)
    x_new = np.linspace(0, 1, int(len(y) * sr_obj / sr), endpoint=False)
    return np.interp(x_new, x_old, y).astype(np.float32)


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *map(str, args)], check=True)


def codec(salida):
    ext = Path(salida).suffix.lower()
    return {".mp3": ["-c:a", "libmp3lame", "-b:a", "192k"], ".m4a": ["-c:a", "aac", "-b:a", "192k"],
            ".ogg": ["-c:a", "libopus", "-b:a", "96k"], ".opus": ["-c:a", "libopus", "-b:a", "96k"],
            ".flac": ["-c:a", "flac"]}.get(ext, ["-c:a", "pcm_s24le"])


def loudnorm_2p(entrada, salida, pre, I, TP, LRA, extra_codec):
    base = f"{pre}," if pre else ""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(entrada), "-af",
                        f"{base}loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    try:
        j = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
        ln = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
              f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    except (ValueError, KeyError):
        ln = f"loudnorm=I={I}:TP={TP}:LRA={LRA}"
    ffmpeg("-i", entrada, "-af", f"{base}{ln}", "-ar", "48000", *extra_codec, salida)


def masterizar(crudo, salida, preset, musica=None, musica_db=-24, intro=2.5):
    pre, I, TP, LRA = PRESETS[preset]
    if not musica:
        if I is None:
            ffmpeg("-i", crudo, "-ar", "48000", *codec(salida), salida)
        else:
            loudnorm_2p(crudo, salida, pre, I, TP, LRA, codec(salida))
        return
    voz = TMP / "voz_master.wav"
    if I is None:
        shutil.copy(crudo, voz)
        I, TP, LRA = -16, -1.5, 11
    else:
        loudnorm_2p(crudo, voz, pre, I, TP, LRA, ["-c:a", "pcm_s24le"])
    dur = sf.info(str(voz)).duration + intro + 4
    grafo = (f"[0:a]adelay={int(intro * 1000)}:all=1,apad=pad_dur=4,asplit=2[v][sc];"
             f"[1:a]aloop=loop=-1:size=2147483647,atrim=0:{dur:.2f},volume={musica_db}dB,"
             f"afade=t=in:d=1.5,afade=t=out:st={max(dur - 4, 0):.2f}:d=4[m];"
             f"[m][sc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=700[md];"
             f"[v][md]amix=inputs=2:duration=first:normalize=0[out]")
    mezcla = TMP / "mezcla.wav"
    ffmpeg("-i", voz, "-stream_loop", "-1", "-i", musica, "-filter_complex", grafo, "-map", "[out]",
           "-ar", "48000", "-c:a", "pcm_s24le", mezcla)
    loudnorm_2p(mezcla, salida, None, I, TP, LRA, codec(salida))


# ─────────────────────────────── Principal ───────────────────────────────
def main():
    p = argparse.ArgumentParser(description="Voces en español naturales y gratuitas.")
    g = p.add_argument_group("entrada")
    g.add_argument("-t", "--texto")
    g.add_argument("-f", "--archivo", help="Archivo .txt/.md. Párrafos separados por línea en blanco. Admite [pausa] y [pausa:2].")
    g.add_argument("-o", "--salida", default="salida.mp3", help=".mp3 .wav .m4a .ogg .flac")
    v = p.add_argument_group("voz")
    v.add_argument("-m", "--motor", default="auto", choices=["auto", *MOTORES])
    v.add_argument("--voz", help="Nombre nativo: edge (es-ES-AlvaroNeural…), kokoro (ef_dora…), qwen CustomVoice (Aiden…)")
    v.add_argument("--clonar", dest="ref", help="Audio de referencia (3-15 s, una sola persona, sin música)")
    v.add_argument("--ref-texto", dest="ref_text", help="Transcripción exacta de la referencia (mejora mucho la clonación)")
    v.add_argument("--voz-guardada", help="Voz guardada con --crear-voz o --guardar-voz")
    v.add_argument("--diseno", help="Descripción de la voz en lenguaje natural (solo qwen)")
    v.add_argument("--genero", choices=["f", "m"], default="f", help="Para voces por defecto")
    v.add_argument("--instruccion", default="", help="Tono para qwen CustomVoice, p. ej. 'con entusiasmo'")
    v.add_argument("--guardar-voz", help="Guarda la voz diseñada con este nombre para reutilizarla")
    v.add_argument("--reparto", help="JSON {HABLANTE: {voz_guardada|clonar|ref_texto|diseno|voz|emocion|velocidad}}")
    c = p.add_argument_group("estilo")
    c.add_argument("--velocidad", type=float, default=1.0)
    c.add_argument("--tono", default="+0Hz", help="Solo edge, p. ej. -2Hz")
    c.add_argument("--emocion", type=float, default=0.5, help="Chatterbox 0.25-2 (0.5 neutro, 0.7-0.9 expresivo)")
    c.add_argument("--cfg", type=float, default=0.5, help="Chatterbox 0-1 (0.3 = más pausado)")
    c.add_argument("--pausa-frase", type=float, default=0.28)
    c.add_argument("--pausa-parrafo", type=float, default=0.75)
    c.add_argument("--preset", default="podcast", choices=list(PRESETS))
    c.add_argument("--musica", help="Música de fondo (se atenúa sola cuando hay voz)")
    c.add_argument("--musica-db", type=float, default=-24)
    c.add_argument("--intro", type=float, default=2.5, help="Segundos de música antes de la voz")
    q = p.add_argument_group("calidad")
    q.add_argument("--verificar", action="store_true", help="Transcribe cada fragmento y regenera los fallidos")
    q.add_argument("--umbral", type=float, default=0.85)
    q.add_argument("--reintentos", type=int, default=2)
    q.add_argument("--semilla", type=int, default=42)
    q.add_argument("--tamano", choices=["0.6B", "1.7B"])
    q.add_argument("--diccionario", help="Archivo extra 'palabra = cómo se lee'")
    q.add_argument("--solo-texto", action="store_true", help="Muestra el texto normalizado y sale")
    u = p.add_argument_group("utilidades")
    u.add_argument("--crear-voz", metavar="NOMBRE")
    u.add_argument("--desde", help="Audio de origen para --crear-voz")
    u.add_argument("--listar-voces", action="store_true")
    a = p.parse_args()

    device, a.vram = detectar()
    if a.listar_voces:
        print("Edge:", *(f"  {k:22s} {v}" for k, v in EDGE_VOCES.items()), sep="\n")
        print("Kokoro:", *(f"  {k:22s} {v}" for k, v in KOKORO_VOCES.items()), sep="\n")
        print("Guardadas:", *(f"  {d.name}" for d in sorted(VOCES_DIR.glob("*")) if (d / "ref.wav").exists()), sep="\n")
        return
    if a.crear_voz:
        if not a.desde:
            sys.exit("--crear-voz necesita --desde audio")
        return crear_voz(a.crear_voz, a.desde, a.ref_text, device)

    texto = a.texto or (Path(a.archivo).read_text(encoding="utf-8") if a.archivo else None)
    if not texto:
        sys.exit("Pasa --texto o --archivo")

    if a.reparto:
        voces = json.loads(Path(a.reparto).read_text(encoding="utf-8"))
        for s in voces.values():
            if "clonar" in s:
                s["ref"] = s.pop("clonar")
            if "ref_texto" in s:
                s["ref_text"] = s.pop("ref_texto")
    else:
        voces = {"_": {k: getattr(a, k) for k in ("voz", "ref", "ref_text", "voz_guardada", "diseno") if getattr(a, k)}}
    voces = {k: resolver_voz(s) for k, s in voces.items()}
    quiere_clon = any(s.get("ref") or s.get("diseno") for s in voces.values())
    motor = a.motor if a.motor != "auto" else elegir_motor(device, a.vram, quiere_clon)
    if any(s.get("diseno") for s in voces.values()) and motor != "qwen":
        log("El diseño de voz por descripción solo existe en qwen; se ignora con este motor.")

    dic = cargar_diccionario(a.diccionario)
    segs = parsear(texto, MAX_CHARS[motor], list(voces), a.pausa_parrafo, dic)
    if a.solo_texto:
        for s in segs:
            print(f"[pausa {s[1]}s]" if s[0] == "pausa" else (f"{s[2]}: " if a.reparto else "") + s[1])
        return
    n_voz = sum(1 for s in segs if s[0] == "voz")
    log(f"Motor: {motor} | dispositivo: {device}{f' ({a.vram:.0f} GB)' if a.vram else ''} | fragmentos: {n_voz}")

    eng = MOTORES[motor](a, device, voces)
    ver = None
    if a.verificar:
        try:
            ver = Verificador(device)
        except ImportError:
            log("faster-whisper no instalado: se omite la verificación.")

    SR = None
    partes, informe, i = [], [], 0
    for tipo, val, hab in segs:
        if tipo == "pausa":
            partes.append(("pausa", val))
            continue
        i += 1
        mejor = None
        for intento in range(a.reintentos + 1 if ver else 1):
            y, sr = eng.synth(val, a.semilla + i * 7 + intento * 1009, hab)
            y = recortar(y, sr)
            score, oido = ver.puntuar(y, sr, val) if ver else (1.0, "")
            if mejor is None or score > mejor[0]:
                mejor = (score, y, sr, oido)
            if score >= a.umbral:
                break
            log(f"  [{i}/{n_voz}] fidelidad {score:.2f} < {a.umbral}, regenerando…")
        score, y, sr, oido = mejor
        SR = SR or sr
        partes.append(("voz", fundido(remuestrear(y, sr, SR), SR)))
        informe.append({"n": i, "texto": val, "fidelidad": round(score, 3), "oido": oido})
        log(f"  [{i}/{n_voz}] ok" + (f" ({score:.2f})" if ver else ""))

    audio, prev_voz = [], False
    for tipo, val in partes:
        if tipo == "pausa":
            audio.append(np.zeros(int(SR * val), np.float32))
            prev_voz = False
        else:
            if prev_voz:
                audio.append(np.zeros(int(SR * a.pausa_frase), np.float32))
            audio.append(val)
            prev_voz = True
    audio.insert(0, np.zeros(int(SR * 0.15), np.float32))
    audio.append(np.zeros(int(SR * 0.4), np.float32))
    crudo = TMP / "crudo.wav"
    sf.write(crudo, np.concatenate(audio), SR, subtype="PCM_24")

    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    masterizar(crudo, a.salida, a.preset, a.musica, a.musica_db, a.intro)
    dur = sf.info(str(crudo)).duration
    if ver:
        malos = [r for r in informe if r["fidelidad"] < a.umbral]
        Path(a.salida).with_suffix(".informe.json").write_text(json.dumps(informe, ensure_ascii=False, indent=2), encoding="utf-8")
        if malos:
            log(f"⚠ {len(malos)} fragmento(s) bajo el umbral: " + ", ".join(str(r["n"]) for r in malos) + " (ver .informe.json)")
    log(f"Listo: {a.salida} ({dur // 60:.0f}:{dur % 60:04.1f})")
    shutil.rmtree(TMP, ignore_errors=True)


if __name__ == "__main__":
    main()
