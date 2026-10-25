---
status: superseded by ADR-0020
---

# Generate the avatar catalog and atlases from canonical assets

Avatar appearance choices use stable English kebab-case IDs derived from canonical first-party PNGs under `assets/avatar/`. A deterministic generator validates every idle/walk pair and its 24×24 frame geometry, repairs the known empty lateral trouser and boot frames in generated output, then produces the typed catalog and two runtime atlases. Published IDs are never reused: retired choices leave the editor but remain renderable for stored avatars. This trades a generation step for safe incremental additions, fewer browser requests and stable persisted/network identity.
