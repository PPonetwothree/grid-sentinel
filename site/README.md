# Grid Sentinel — interactive concept site

Static HTML/CSS/JS. No build step, no dependencies (only Google Fonts).
Open this `site/` folder in Antigravity and serve it with any static server.

```
python -m http.server 5178 --directory site
```

## Pages

| File | What it is |
|---|---|
| `index.html` | Overview: problem, thesis, five layers, decision path, 02:47 incident, terms |
| `simulation.html` | Live substation simulator: 8 scenarios, rules → fusion → dispatcher → operator, real ECDSA-signed evidence (WebCrypto). `#intruder` auto-runs the worked incident |
| `fleet.html` | Robot-sharing model: M/D/1 queue + 30-day Monte Carlo, live map, coordinated-attack test, three-mode comparison |
| `engineering.html` | Animated sensors, system architecture, sensor-node and edge-box circuits (block/component toggle), BOM, AI pipeline, accuracy-trap calculator, safety/EMI/cyber |
| `economics.html` | Unit economics with omitted costs, margin vs sites per fleet, customer ROI, TAM/SAM/SOM |
| `team.html` | TRL ladder, funding stages A–C, talent matrix by stage, open questions, kill criteria |

## Shared files

- `assets/gs.css` — design tokens (light + dark), layout, evidence-label tags (`.tag.v/.a/.t/.p/.i`)
- `assets/gs.js` — injects header/nav/stage bar/footer, theme toggle, tooltip, `GS.lineChart`

To add a page: copy the `<head>` of any page, include `assets/gs.css` and `assets/gs.js`, and add it to `PAGES` in `gs.js`.

## Honesty rules baked in

Every number carries a label: **Verified**, **Assumption**, **Target**, **Proposed** or **Illustrative**,
matching the investor briefing. Circuits are a proposed reference design (not built, not EMI-tested).
BOM prices are planning estimates, not quotes. Keep these labels when you edit.
