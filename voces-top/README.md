# Voces top

Voces de narrador para vídeos del universo, en castellano de España. Se han diseñado con Qwen3-TTS (son voces originales, no clonadas de nadie) y se usan con la skill `voces-espanol`.

| Voz | Estilo | Demo |
|---|---|---|
| `cosmos_epico` | Épico de documental: bajo muy profundo, algo rasgado, pausas antes de cada revelación | [demo.mp3](cosmos_epico/demo.mp3) |
| `cosmos_shorts` | Shorts: barítono cálido y cercano, ritmo rápido, punto inquietante | [demo.mp3](cosmos_shorts/demo.mp3) |

Cada carpeta contiene `ref.wav` (la referencia de clonación, de unos 12 s), `ref.txt` (su transcripción exacta) y `meta.json` (la descripción con la que se diseñó).

## Uso

```bash
cp -r voces-top/* ~/.voces-es/          # una vez por sesión
~/.voces-es/venv/bin/python ~/.voces-es/tts_es.py -m qwen -f guion.txt \
  --voz-guardada cosmos_epico --preset redes --verificar -o video.mp3
```
