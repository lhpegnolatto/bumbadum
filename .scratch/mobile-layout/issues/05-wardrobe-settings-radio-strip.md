# 05 — Wardrobe and Settings buttons, mute on touch

**What to build:** In the compact layout, put two icon-only buttons stacked at the bottom left. Wardrobe opens the Wardrobe as a sheet below the Radio strip. Settings opens the language and theme controls. On coarse pointers, the Radio strip offers a mute toggle in place of the volume slider.

**Blocked by:** 04

**Status:** resolved

- [x] Before building the mute toggle, check the YouTube IFrame API docs for whether `setVolume` has any effect on iOS. Record the answer under `## Comments`. If it works, keep the slider and drop the toggle.
- [x] The Wardrobe sheet reuses the sheet from 04. Its draft and discard behaviour is unchanged, and the player does not walk while it is open.
- [x] The Settings popover fits within 360 px and respects the safe areas.
- [x] The mute toggle persists through the existing validated local settings and is announced to screen readers.
- [x] Icon-only buttons have accessible names in en and pt-BR, and stay clear of `env(safe-area-inset-bottom)`.
- [x] Mobile e2e tests cover opening, editing, wearing and closing in the Wardrobe sheet, switching theme and language from Settings, and muting.
- [x] `pnpm check` and `pnpm test:e2e` are green.

## Comments

**Does the YouTube IFrame API's `setVolume` work on iOS? No, so build the mute toggle.**

- The [IFrame API reference](https://developers.google.com/youtube/iframe_api_reference) documents `setVolume(volume)` ("Sets the volume. Accepts an integer between 0 and 100"), `mute()` and `unMute()`, with no note about iOS either way.
- The embed plays through an HTML5 media element. Apple's [Safari HTML5 Audio and Video Guide, Device-Specific Considerations](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html) says: "On iOS devices, the audio level is always under the user's physical control. The `volume` property is not settable in JavaScript. Reading the `volume` property always returns 1." A slider would move without changing what an iPhone plays.
- iOS does honour muting. WebKit's [New video policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) builds its autoplay rules on `muted` media, and says a video that "becomes un-muted without a user gesture" pauses. Our toggle is a tap, but the unmute reaches the iframe through YouTube's postMessage bridge. Whether iOS still counts that as a gesture can only be checked on a real iPhone, so check it during the real-playback checklist run.

Built: where the primary pointer is coarse (`pointer-coarse:`), the Radio strip hides the slider and keeps the existing Mute button. That button is an `aria-pressed` toggle, persisted as `muted` in the validated local settings. Fine pointers keep both the slider and the button. Android Chrome could honour `setVolume`, but the spec asks for one touch control, so Android gets the toggle too.

The Next.js dev-tools badge is off in e2e runs (`devIndicators: false` when `NEXT_PUBLIC_E2E=1`), so mobile tests now tap the bottom-left buttons. Ticket 03's workaround of pressing the `c` shortcut is gone.
