---
status: proposed
---

# Expand avatar colours from base sheets and shared palettes

Canonical avatar assets become one base idle/walk pair per style plus two shared palettes, hair colours and fabric colours, each a named ramp of shades. The generator expands every hairstyle into every hair colour and every fabric wearable into every fabric colour, keeping `<style>-<colour>` IDs. Wearables made of other materials (metal, straw, lenses, flowers) keep one canonical pair per colour. A stored avatar wearing a colour that no longer exists takes the nearest surviving colour of the same style, before the layer repair of ADR-0020.

## Considered options

- Committing every recoloured variant as its own canonical PNG: no generator change, but a new colour means regenerating and committing hundreds of files, and nothing guarantees that every style is offered in every colour.
