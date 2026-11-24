"""Gera as imagens e os dados do site a partir de fontes reais.

Uso (na raiz do site):
    py -3 scripts/prepare-assets.py <pasta-das-capturas> <csv-da-sessao-rx>

- Recorta as capturas do painel ECOTAM/CANIDÉ e exporta em WebP para public/media/.
- Lê uma sessão gravada pelo receptor (RX) e grava src/data/session.json SEM latitude,
  longitude ou altitude GPS: coordenadas são dados sensíveis e não vão para o site.
"""
import csv
import json
import sys
from datetime import datetime
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
shots = Path(sys.argv[1])
session_csv = Path(sys.argv[2])

CROPS = {
    "painel-visao-geral": ("dashboard.png", (0, 0, 1440, 1450)),
    "painel-plano-de-voo": ("dashboard.png", (289, 632, 1029, 1445)),
    "painel-atmosfera": ("dashboard.png", (256, 1496, 1440, 2330)),
    "painel-qualidade": ("qualidade.png", (0, 0, 1440, 1050)),
    "painel-historico": ("historico.png", (0, 0, 1440, 1300)),
}

media = ROOT / "public" / "media"
media.mkdir(parents=True, exist_ok=True)
for name, (src, box) in CROPS.items():
    img = Image.open(shots / src).convert("RGB").crop(box)
    img.save(media / f"{name}.webp", "WEBP", quality=84, method=6)
    print(name, img.size)

# Sessão real do RX: série ambiental + disponibilidade de GPS, sem posição.
rows = list(csv.DictReader(session_csv.open(encoding="utf-8")))


def num(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


t0 = datetime.fromisoformat(rows[0]["time_iso"])
samples = []
prev_t = None
prev_seq = None
gaps = []
for r in rows:
    t = datetime.fromisoformat(r["time_iso"])
    secs = (t - t0).total_seconds()
    seq = num(r["sequence"])
    if prev_t is not None and secs - prev_t > 2.5:
        gaps.append({"from": prev_t, "to": secs, "seconds": round(secs - prev_t)})
    prev_t = secs
    prev_seq = seq
    fix = r.get("gps_fix") in ("True", "true", "1")
    samples.append([
        round(secs),
        round(num(r["temperature_c"]), 2) if num(r["temperature_c"]) is not None else None,
        round(num(r["pressure_pa"]) / 100, 2) if num(r["pressure_pa"]) is not None else None,
        round(num(r["humidity_pct"]), 1) if num(r["humidity_pct"]) is not None else None,
        int(num(r["satellites"])) if num(r["satellites"]) is not None else None,
        1 if fix else 0,
    ])

out = {
    "description": "Sessão gravada pelo receptor RX (protocolo V3). Latitude, longitude e altitude GPS removidas.",
    "start": t0.isoformat(),
    "durationSeconds": samples[-1][0],
    "fields": ["t", "temperature_c", "pressure_hpa", "humidity_pct", "satellites", "gps_fix"],
    "samples": samples,
    "gaps": gaps,
    "totals": {
        "samples": len(samples),
        "withFix": sum(s[5] for s in samples),
        "gaps": len(gaps),
        "maxSatellites": max((s[4] or 0) for s in samples),
    },
}
dest = ROOT / "src" / "data" / "session.json"
dest.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
print("session", out["totals"], "duração", out["durationSeconds"], "s", dest.stat().st_size, "bytes")
