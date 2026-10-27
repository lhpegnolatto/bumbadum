# Performance audit, 27 October 2026

Players reported two symptoms: movement felt laggy, and the browser stuttered. The production server runs on Render's free plan (0.1 CPU, 512 MB), so the server's small budget was the first suspect. This audit measured both ends before changing anything. The browser stutter came from the GPU painting far more pixels than the pixel art needs. That is fixed ([ADR-0031](../adr/0031-scene-renders-at-whole-texels-per-art-pixel.md)). The server turned out to have room to spare. The lag comes from network distance.

## Method

Every claim below comes from a measurement that can fail. No hypothesis was acted on until a probe had tested it, and each probe changed one variable at a time.

| Loop | What it drives | What it reports |
| --- | --- | --- |
| Server load | The production server bundle under a cgroup `CPUQuota=10%`, standing in for Render's 0.1 CPU, with `TRACK_CATALOG=fake`. Headless `@colyseus/sdk` bots join the Lobby, walk at 6 steps a second, and drive Cars along routes found by BFS on the real Map. | Step acknowledgement latency (time from sending a step intent until the room reports it handled), Car update interval, downstream bytes per player, and server CPU, event-loop utilisation, event-loop delay and RSS from a `perf_hooks` preload |
| Client frames | A production build of `apps/web` in headless Chromium (Playwright 1.64), joined to the Lobby. Runs in two profiles: a 1280×720 desktop at a ratio of 1, and a Pixel 7 (412×915 at 2.625). | FPS and frame-time percentiles from `requestAnimationFrame`, how main-thread time splits between script, layout and style (Chrome DevTools Protocol `Performance` metrics), and WebGL draw calls per frame |
| Network | `curl` against the production `/health` endpoint from Brazil, reusing one connection | Round-trip time to the origin in Ohio |

The weak-GPU stand-in is SwiftShader, Chromium's software WebGL renderer. It exaggerates fill-rate costs, so its numbers compare probes with each other. They do not predict a particular device. The same profiles were also run on a desktop NVIDIA GPU.

The host was a 16-core Linux machine with Node 24.12.

## Server: room to spare

The table shows load under a 10 % CPU quota. CPU is a share of one core, so 10 % is the whole budget.

| Load | CPU | Event-loop delay p99 | Step ack p50 / p95 | Downstream per player |
| --- | --- | --- | --- | --- |
| Idle, empty Lobby | 0.6–0.8 % | 5.3 ms | none | none |
| 1 player walking | about 1 % | 6 ms | 27 / 48 ms | 0.1 KiB/s |
| 16 players walking | about 1 % | 6 ms | 26 / 48 ms | 1.5 KiB/s |
| 16 players, 4 driving | 2.6 % | 6 ms | 25 / 47 ms | 3.2 KiB/s |
| 16 players, 9 driving | 2.4 % | 6 ms | 25 / 49 ms | 5.3 KiB/s |

- **The busiest case used about a quarter of the budget.** RSS stayed between 96 and 115 MB.
- **Step acknowledgement adds no delay of its own.** It sits at half the 50 ms patch rate on average, which is the cost of batching state into patches.
- **Cars arrive on schedule.** Their updates reached other players every 50 ms at the median.
- **Joins are the only spike.** The event loop stalled for 60–100 ms while players joined, then settled.

## Network: distance dominates

There were 80 round trips from Brazil to the Ohio origin: p50 161 ms, p95 173 ms, max 465 ms. Connecting to Render's edge took 16 ms, so almost all of the round trip is the distance to the origin.

That is several times the server's whole contribution to step latency. Render has no South American region. Virginia would save an estimated 20–30 ms, so moving region was not worth it. Walking already predicts the local player's steps. Cars do not, so a driver waits a full round trip plus up to one patch before seeing their own input. Client-side Car prediction is the open lever.

## Client: the GPU paints too many pixels

On a real GPU every profile held 60 fps. On SwiftShader, before the change:

| Profile | FPS | Frames over 33 ms | Script share of main thread |
| --- | --- | --- | --- |
| Desktop, ratio 1 | 42.5–43.7 | 38–42 % | 3–4 % |
| Pixel 7, ratio 2.625 | 29.8–33.3 | 81–88 % | 3 % |

Script took 3 % of each frame, so the game loop was not the cost.

The world is drawn at whole physical pixels per art pixel ([ADR-0017](../adr/0017-whole-physical-pixel-scale.md)). On the Pixel 7 that is 6×6 physical pixels per art pixel. The Ambient light filters the whole scene, so the GPU painted all of those pixels twice a frame.

Each probe below changed one thing on the Pixel 7 profile:

| Probe | FPS | Frames over 33 ms | Draw calls per frame | Verdict |
| --- | --- | --- | --- | --- |
| Baseline | 29.8 | 88 % | 10 | none |
| Ambient light removed | 40.5 | 49 % | 9 | The extra full-screen pass costs about a quarter |
| Lamp glow hidden | 33.7 | 78 % | 3 | Draw calls are not the cost |
| Off-screen objects culled | 33.2 | 79 % | 3 | Geometry is not the cost |
| Canvas at a ratio of 1.5 | 60.5 | 0 % | 10 | Pixel count is the cost, but the browser blurs the upscale |
| Ambient light at 1 texel per art pixel | 60.3 | 0 % | 10 | Full speed, sharp art, whole-art-pixel motion |
| Ambient light at 2 texels per art pixel | 60.3 | 0 % | 10 | Full speed, sharp art, half-art-pixel motion |
| Ambient light at 3 texels per art pixel | 58.0 | 4 % | 10 | Nearly full speed |

The fix renders the filtered scene into its own texture at a whole number of texels per art pixel, scaled up to the screen with nearest sampling. Screenshots enlarged at native resolution showed art as sharp as before. The first version also rounded the camera to whole texels; the [follow-up below](#follow-up-the-walking-player-stuttered) explains why that changed.

Where no bottleneck was measured, the rule stays conservative: motion steps half an art pixel at most. The desktop at a ratio of 1 is the one exception, because it was measured to stall and its art pixel is only 2 physical pixels.

| Profile | Before | After |
| --- | --- | --- |
| Desktop, ratio 1 | 42.5–43.7 fps, 38–42 % long frames | 60.0–60.2 fps, 0 % |
| Pixel 7, ratio 2.625 | 29.8–33.3 fps, 81–88 % long frames | 60.2 fps, 0 % |

### Follow-up: the walking player stuttered

After the first version shipped, a player on a desktop at 100 % and on notebooks at 125–150 % reported that their own character flickered and looked smeared while walking or driving. Other players walking past looked normal. The difference pointed at the camera, which only moves with the local player.

The new loop held an arrow key in headless Chromium and measured how far the floor moved between consecutive frames, by matching a band of floor rows. The camera follows the walking player at about 1.6 art pixels a frame. With the first version it rounded to whole texels, which on that desktop are whole art pixels, so the world jumped in uneven steps.

The first two metrics tried were dropped because they did not tell the versions apart: the avatar's outline (it also caught the nickname's dark background), and the face's position (the walk cycle moves it in both versions). The floor's steps did:

| Version, desktop 1366×768 at ratio 1 | Floor steps per frame | Unevenness (sd / mean) |
| --- | --- | --- |
| Before the audit | 3 and 4 px | 0.12 |
| First version (camera on whole texels) | 2 and 4 px | 0.31 |
| Final (the scene's texture slides by whole pixels) | 3 and 4 px | 0.12 |

On the Pixel 7 profile the final version steps 9 and 10 physical pixels, with an unevenness of 0.05.

The final version ([ADR-0032](../adr/0032-scene-texture-slides-with-the-camera.md)) keeps the camera on whole physical pixels. The scene's texture starts on the world's texel grid at or just before the viewport's corner and slides with the camera, so the art stays on its texels while the scroll stays smooth.

At 125 % and 150 % neither version changed the scroll. An art pixel there is 3 physical pixels, which no texel split divides, so the scene keeps the screen's resolution. The final build scrolls evenly there: steps of 4 and 5 px at 1.25 (unevenness 0.08), mostly 5 and 6 px at 1.5 (0.15). What the player saw on those notebooks is not explained by these measurements.

Moving the scene into its own texture first brought the stutter back down but lost the speed again: 29.8 fps on the phone profile. One probe at a time located the cost:

| Probe, Pixel 7 profile | FPS |
| --- | --- |
| Scene texture drawn with a sprite | 34.8 |
| Without the Ambient light | 37.0 |
| Without rendering the scene into the texture | 34.4 |
| Without drawing the texture to the screen | 60.4 |

A full-screen sprite goes through PixiJS's batch shader, which chooses among many textures for every pixel. Drawing the texture as an unbatched mesh, with a single-texture shader, brought both profiles back to 60 fps. The full-screen floor was batched before the audit too, so the same cost may account for part of the original slowdown; that was not measured.

### Still open: high ratios on weak GPUs

A 1280×720 desktop at a ratio of 2 renders a 2560×1440 canvas. On SwiftShader it reached:

- 10.0 fps originally
- 15.5–17.2 fps with the conservative rule, in the first version
- 20.8 fps with texels of 4 physical pixels, in the first version
- 19.0–19.3 fps in the final version

The remaining cost is output at full resolution: the canvas itself, the additive Lamp glow, and the nicknames. Scene resolution does not reach any of that. SwiftShader does not represent a Mac's GPU, so this stays a watch item. Weak integrated GPUs at 200 % are the case to check if players report it.

## Validation of the change

- **Camera tests.** `cameraOn` gained table-driven cases for the scene resolution at each ratio, and for where the scene's texture lands relative to the world. All expected values were worked out by hand, and every test was written failing first.
- **Measurement loops.** The FPS and floor-step loops were re-run on the final build (above).
- **`pnpm check`** is green across the workspace.
- **E2E.** `pnpm test:e2e` passes everywhere the change could reach, with two notes:
  - One spec relied on slow frames to stay under the dance change rate. That was confirmed by relaxing the rate, and the spec now paces itself to the rate.
  - Six phone layout specs (`room.mobile`, `wardrobe-settings.mobile`) were already failing on `main` before the change, with identical results.
- **Review.** For each change, a standards review and a spec review of the diff ran independently, and their findings were fixed before commit. On the first version they found an inverted comment, loosened assertions, unclear units and an incomplete cost statement in the ADR. On the follow-up they found:
  - an ADR rewritten in place instead of superseded;
  - a scene texture that kept its old size when the pixel ratio changed without changing its pixel count;
  - wrong coordinates in a test comment;
  - a claim in this report that had not been measured.
