---
status: accepted
---

# Generate a prunable avatar catalog from canonical assets

Avatar appearance choices use stable English kebab-case IDs derived from canonical first-party PNGs under `assets/avatar/`. A deterministic generator validates every idle/walk pair and its 24×24 frame geometry, repairs the known empty lateral trouser and boot frames in generated output, then produces the typed catalog and two runtime atlases. Choices can be removed from the catalog: a stored or broadcast avatar wearing a choice that no longer exists is repaired layer by layer on the client, losing the choice on an optional layer and taking the default avatar's on a required one, while the server keeps accepting only current IDs. This supersedes ADR-0013.

## Considered options

- Retiring IDs instead of removing them (ADR-0013): keeps old avatars intact, but every retired asset must stay renderable in every animation, and players hold no account whose data a repair would lose.
