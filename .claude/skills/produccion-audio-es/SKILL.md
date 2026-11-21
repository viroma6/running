---
name: produccion-audio-es
description: Produce audiolibros, meditaciones guiadas, podcasts y locuciones para TikTok/Reels en español listos para publicar o vender (capítulos M4B, metadatos, subtítulos, vídeo vertical).
---

# Producción de audio largo en español

Usa esta skill para proyectos de audio terminados: audiolibros, meditaciones guiadas, cursos en audio, podcasts con varias voces y locuciones para vídeos cortos.

La voz la genera la skill **voces-espanol** (`~/.voces-es/tts_es.py`). Si el script no existe, carga primero esa skill y prepara el entorno.

## 1. Estructura del proyecto

```
proyecto/
  guion/01_intro.txt, 02_capitulo.txt …   # un archivo por capítulo/pista
  reparto.json                            # solo si hay varias voces
  pronunciacion.txt                       # palabras propias del proyecto
  musica/fondo.mp3                        # opcional, con licencia comercial
  audio/                                  # salida
  entrega/                                # archivos finales
```

## 2. Escribir el guion para el oído

- Frases de 8-25 palabras, una idea por frase. Párrafos de 2-5 frases.
- Tablas y viñetas → frases conectadas ("Primero…, después…, y por último…").
- Siglas y anglicismos → `pronunciacion.txt`.
- Meditaciones: silencios con `[pausa:3]`, `[pausa:8]`. Respiraciones: "Inspira… [pausa:4] y suelta el aire… [pausa:6]".
- Diálogos: `NOMBRE: texto` por línea, nombres iguales a las claves de `reparto.json`. Muletillas ligeras ("bueno", "claro") con moderación.
- Vídeo corto: gancho en los primeros 2 s, frases de menos de 12 palabras.

## 3. Fijar la voz una sola vez

1. Genera 2-3 muestras de una frase con `--diseno` distintos y que el usuario elija.
2. Guárdala con `--guardar-voz NOMBRE` (o `--crear-voz` si es una voz real con permiso).
3. Usa siempre `--voz-guardada NOMBRE` en todo el proyecto.

## 4. Generar por capítulos

```bash
PY=~/.voces-es/venv/bin/python; T=~/.voces-es/tts_es.py
for f in guion/*.txt; do
  n=$(basename "$f" .txt)
  $PY $T -f "$f" --voz-guardada narradora --preset audiolibro --verificar \
    --diccionario pronunciacion.txt -o "audio/$n.wav"
done
```

| Destino | Preset | Entrega |
|---|---|---|
| Audiolibro / curso | `audiolibro` | `.m4b` con capítulos + `.mp3` por capítulo |
| Meditación | `meditacion` + `--musica` `--musica-db -26` `--pausa-frase 0.5` | `.mp3` 192k |
| Podcast | `podcast` + `--reparto` | `.mp3` 192k |
| TikTok / Reels | `redes` | `.m4a` o `.mp4` |

Revisa cada `audio/NN.informe.json`; reescribe y regenera las frases con fidelidad baja. No entregues fragmentos marcados sin avisar.

## 5. Empaquetar

**MP3 con metadatos y portada:**
```bash
ffmpeg -i audio/01_intro.wav -i portada.jpg -map 0:a -map 1:v -c:a libmp3lame -b:a 192k -c:v mjpeg \
  -id3v2_version 3 -metadata title="Introducción" -metadata artist="AUTOR" -metadata album="TÍTULO" \
  -metadata track=1 -metadata language=spa -disposition:v attached_pic entrega/01_intro.mp3
```

**Audiolibro M4B con capítulos:**
```python
import subprocess, pathlib
wavs = sorted(pathlib.Path("audio").glob("*.wav"))
meta, t = [";FFMETADATA1", "title=TÍTULO", "artist=AUTOR", "genre=Audiobook"], 0
with open("lista.txt", "w") as l:
    for w in wavs:
        d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(w)]))
        meta += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={int(t*1000)}", f"END={int((t+d)*1000)}", f"title={w.stem.split('_',1)[-1].replace('_',' ').capitalize()}"]
        t += d
        l.write(f"file '{w.resolve()}'\n")
pathlib.Path("capitulos.txt").write_text("\n".join(meta), encoding="utf-8")
```
```bash
ffmpeg -f concat -safe 0 -i lista.txt -i capitulos.txt -i portada.jpg -map 0:a -map 2:v -map_metadata 1 \
  -c:a aac -b:a 96k -c:v mjpeg -disposition:v attached_pic entrega/audiolibro.m4b
```

**Subtítulos SRT para redes:**
```python
from faster_whisper import WhisperModel
m = WhisperModel("small", compute_type="int8")
segs, _ = m.transcribe("audio/video.m4a", language="es", word_timestamps=True)
ws = [w for s in segs for w in s.words]
ts = lambda x: f"{int(x//3600):02}:{int(x%3600//60):02}:{int(x%60):02},{int(x%1*1000):03}"
out, i = [], 0
for n in range(0, len(ws), 3):
    g = ws[n:n+3]; i += 1
    out.append(f"{i}\n{ts(g[0].start)} --> {ts(g[-1].end)}\n{''.join(w.word for w in g).strip()}\n")
open("entrega/video.srt", "w", encoding="utf-8").write("\n".join(out))
```
Corrige en el SRT las palabras mal transcritas comparándolas con el guion.

**Vídeo vertical 1080×1920 con onda y subtítulos:**
```bash
ffmpeg -loop 1 -i fondo.jpg -i audio/video.m4a -filter_complex \
 "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg];\
  [1:a]showwaves=s=1080x300:mode=cline:colors=white@0.8[w];\
  [bg][w]overlay=0:1450,subtitles=entrega/video.srt:force_style='FontName=Montserrat,FontSize=16,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=3,Alignment=2,MarginV=180'[v]" \
 -map "[v]" -map 1:a -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest entrega/video.mp4
```

## 6. Control de calidad

- Sonoridad: `ffmpeg -i ARCHIVO -af ebur128 -f null - 2>&1 | grep -A1 Integrated` → LUFS del preset (±1).
- Sin fragmentos marcados en los `.informe.json`.
- Escuchar inicio, mitad y final de cada capítulo.
- Licencias: motor local (qwen/chatterbox/kokoro) y música con licencia comercial si se vende. Nunca `edge` para algo que se venda.
- Voz clonada → confirmar permiso de su dueño.

## 7. Entrega

Entrega los archivos de `entrega/` con una línea: duración total, voz, preset y fragmentos a revisar.
