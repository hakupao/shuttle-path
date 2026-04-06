# 3D Broadcast Camera Perspective -- Implementation Plan

## Overview

Transform the shuttle-path homepage from a flat 2D top-down court view into a 3D broadcast camera perspective with zoom-in/zoom-out cycling driven by scroll. The court currently renders at 480/520px max-width, centered, with a GSAP ScrollTrigger timeline driving shuttle flight through 7 waypoints. The target is a BWF TV-style tilted court with descend-focus-ascend camera cycles per content section.

All changes are confined to a single file: `/Users/bojiangzhang/MyProject/shuttle-path/src/pages/index.astro` (916 lines of template, scoped CSS, and inline script), with minor additions to `/Users/bojiangzhang/MyProject/shuttle-path/src/styles/global.css` for reduced-motion and holographic utility classes.

---

## Part 1: DOM Structure Changes

### 1.1 New Wrapper Hierarchy

The fundamental challenge is isolating 3D transforms to the court while keeping the Nav (fixed, z-50) and Footer outside the perspective context. The current structure is:

```
<body class="bg-court-surround">
  <Nav isHome />              <!-- fixed, z-50 -->
  <main class="flex-1 pt-16">
    <div class="court-outer">  <!-- max-width: 480/520px, centered -->
      <div class="court">      <!-- green bg, 4px white border -->
        ...content rows...
      </div>
      <div class="court-dims"> <!-- size annotations -->
    </div>
  </main>
  <Footer isHome />
</body>
```

The new structure introduces two layers between `<main>` and `.court`:

```
<body class="bg-court-surround">
  <Nav isHome />
  <main class="flex-1 pt-16">
    <div class="scene">                    <!-- NEW: scroll spacer, tall -->
      <div class="camera" id="camera">     <!-- NEW: perspective + pin target -->
        <div class="camera-rig" id="camera-rig">  <!-- NEW: rotateX + scale + translateZ -->
          <div class="court-outer">
            <div class="court" style="transform-style: preserve-3d">
              ...content rows (with translateZ for holographic float)...
            </div>
            <div class="court-dims">
          </div>
        </div>
      </div>
    </div>
  </main>
  <Footer isHome />
</body>
```

**Rationale for each layer:**

- `.scene` -- Provides the extended scroll height. Its physical height determines how much the user can scroll. It will be much taller than the court itself (approximately 5x-6x viewport height) to give enough scroll room for multiple zoom cycles. This element is the ScrollTrigger trigger.

- `.camera` (#camera) -- Receives `perspective: 1200px` and `perspective-origin: 50% 40%`. This element is pinned by ScrollTrigger (`pin: true`) so it stays fixed in the viewport while the user scrolls through `.scene`. The perspective value stays static.

- `.camera-rig` (#camera-rig) -- The element GSAP animates. It receives `rotateX()`, `scale()`, and `translateY()` to simulate camera angle changes and zoom. This is the "virtual camera gimbal." By separating perspective (on parent) from transform (on child), we get correct 3D projection.

- `.court` gets `transform-style: preserve-3d` so children (content rows) can use `translateZ` to float above the court surface.

### 1.2 Content Row Changes

Each content row needs a wrapper for holographic text floating:

```html
<!-- Before -->
<div class="court-row court-row-lessons">
  <div class="court-pad">
    <h2>...</h2>
    ...
  </div>
</div>

<!-- After -->
<div class="court-row court-row-lessons" style="transform-style: preserve-3d">
  <div class="court-content-float" id="content-lessons">
    <div class="court-pad">
      <h2>...</h2>
      ...
    </div>
  </div>
</div>
```

The `.court-content-float` element will receive `translateZ(30px)` (or similar) via GSAP to lift text above the court surface during focus states, plus holographic text-shadow styling.

Content rows that are `<a>` tags (`.court-row-lessons`, `.court-row-knowledge`, and category links) keep their tag -- the float wrapper goes inside them.

### 1.3 Scroll Spacer Approach

The `.scene` element needs to be tall enough for the full scroll journey. Current court height is approximately 900-1100px (varies by content). The new scroll distance needs approximately 500vh (5 viewport heights) to accommodate:

- Hero focus (hold ~80vh)
- Hero-to-Lessons transition (~60vh)  
- Lessons focus (hold ~80vh)
- Lessons-to-Knowledge transition (~60vh)
- Knowledge focus (hold ~80vh)
- Knowledge-to-Categories transition (~60vh)
- Categories focus (hold ~80vh)
- Exit animation (~40vh)

This is accomplished by setting `.scene { height: 540vh }` (tunable). ScrollTrigger pins `.camera` inside `.scene`, so the court stays viewport-fixed while the user scrolls through 540vh of empty space.

---

## Part 2: CSS 3D Transform Architecture

### 2.1 Perspective Setup

```css
.scene {
  position: relative;
  height: 540vh;  /* tunable scroll distance */
}

.camera {
  position: relative;
  width: 100%;
  height: 100vh;
  perspective: 1200px;
  perspective-origin: 50% 40%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-rig {
  transform-style: preserve-3d;
  will-change: transform;
  /* Initial state set by GSAP: rotateX(30deg) scale(0.6) */
}
```

**Why `perspective: 1200px`?** At 1200px, a `rotateX(30deg)` gives noticeable but not extreme trapezoidal distortion. The near edge (bottom of court) appears roughly 1.3x wider than the far edge (top). This matches BWF broadcast proportions. Values lower than 800px create fish-eye distortion; values above 2000px flatten the 3D effect too much.

**Why `perspective-origin: 50% 40%`?** Placing the vanishing point slightly above center (40%) means the "camera" looks slightly downward, matching a broadcast camera mounted above and behind one end of the court.

### 2.2 Court Sizing for 3D

The current `max-width: 480/520px` is too narrow for the zoomed-out panoramic view and too small for the zoomed-in focus state. The court needs to be sized so that:

- **Zoomed out** (scale ~0.45-0.55): the entire court, including perspective distortion, fits within the viewport with margins
- **Zoomed in** (scale ~1.3-1.8): one content section fills the viewport width

The solution: increase `.court-outer` max-width to `90vw` (capped at ~700px on desktop), and let the camera-rig `scale` handle all zoom levels.

```css
.court-outer {
  max-width: min(90vw, 700px);  /* wider base for 3D */
  margin: 0 auto;
  padding: 0;  /* remove padding, the camera handles framing */
}

@media (min-width: 768px) {
  .court-outer {
    max-width: min(85vw, 750px);
  }
}
```

The camera-rig scale values:
- **Panoramic/zoomed-out**: `scale(0.5)` -- court appears small, full panorama visible
- **Focused/zoomed-in**: `scale(1.5)` on mobile, `scale(1.3)` on desktop -- one section fills viewport

### 2.3 The rotateX + Scale Interaction

When `rotateX(30deg)` is applied:
- The court foreshortens vertically (appears shorter top-to-bottom)
- The near edge (bottom) stretches wider than the far edge (top)
- Content at the top appears to recede

When zooming in (increasing scale), the rotateX should also change:
- **Zoomed in (focus)**: `rotateX(45deg)` -- more overhead, content is more readable since text is less foreshortened
- **Zoomed out (panorama)**: `rotateX(22deg)` -- more dramatic angle, shows depth

This creates the "dramatic camera swoop" effect: as the camera descends to focus, the angle steepens; as it pulls back, the angle flattens to show more court depth.

### 2.4 Holographic Text Floating

Content rows that are in "focus" state get their `.court-content-float` children lifted:

```css
.court-content-float {
  transform-style: preserve-3d;
  will-change: transform, opacity;
  /* GSAP controls translateZ */
}

/* Holographic glow -- applied via class toggle or inline by GSAP */
.holo-active {
  text-shadow:
    0 0 10px rgba(200, 220, 255, 0.3),
    0 0 30px rgba(180, 210, 255, 0.15),
    0 0 60px rgba(160, 200, 255, 0.08);
}

/* Ground shadow for floating text -- pseudo-element projected onto court surface */
.court-content-float::after {
  content: '';
  position: absolute;
  inset: 5% 10%;
  bottom: -8px;
  background: rgba(0, 0, 0, 0.15);
  filter: blur(12px);
  transform: translateZ(-1px);  /* push shadow below text */
  opacity: 0;  /* GSAP controls this */
  pointer-events: none;
}
```

The `translateZ` value for floating text should be modest: 20-40px. Too high and text separates visually from the court; too low and the effect is invisible. The perspective value of 1200px means `translateZ(30px)` creates about a 2.5% size increase and a visible "lift" parallax when the camera moves.

### 2.5 preserve-3d Chain

For `translateZ` on content to work, the entire chain from `.camera-rig` down to `.court-content-float` must have `transform-style: preserve-3d`:

```
.camera-rig        { transform-style: preserve-3d }
  .court-outer     { transform-style: preserve-3d }  
    .court         { transform-style: preserve-3d }
      .court-row   { transform-style: preserve-3d }
        .court-content-float { translateZ(30px) }
```

**Critical issue**: `overflow: hidden` on `.court` breaks `preserve-3d` in all browsers. The court currently has `overflow: hidden` (line 413 of index.astro). This MUST be removed. The overflow was there to contain the radial gradient vignette and noise texture pseudo-element. Solutions:
- Clip the vignette and noise to court bounds using `clip-path: inset(0)` on those specific overlay elements instead
- Or use `overflow: clip` (which does NOT create a new stacking context and does NOT break preserve-3d in modern browsers -- but verify Safari support)
- Safest: remove overflow:hidden from .court entirely and constrain child elements individually

### 2.6 Court Border and Lines in Perspective

The 4px white border and court lines will naturally distort in perspective (near edge thicker, far edge thinner). This actually enhances the 3D illusion and requires no special handling. The lines are positioned with percentages (7.5% for singles lines) which will scale correctly.

One consideration: the `.court-line-h` elements use `margin-left/right: 7.5%` which will still work correctly since percentages are relative to the parent, not the viewport.

---

## Part 3: GSAP Timeline Restructure

### 3.1 New Timeline Architecture

Replace the current 7-waypoint uniform timeline with a **segmented scroll-mapped timeline** that has distinct "focus" and "transition" phases.

The timeline is divided into **segments** with explicit scroll proportions:

```
Segment           Scroll %    Duration    Camera State
──────────────────────────────────────────────────────
hero-focus        0% - 12%    ~65vh       Zoomed in on Hero, rotateX(45deg), scale(1.4)
hero-to-lessons   12% - 22%   ~55vh       Pull back to panorama, rotateX(22deg), scale(0.5), shuttle flies
lessons-focus     22% - 37%   ~80vh       Zoom into Lessons, rotateX(45deg), scale(1.4), translateY shifts
lessons-to-know   37% - 47%   ~55vh       Pull back to panorama, shuttle flies across net
knowledge-focus   47% - 62%   ~80vh       Zoom into Knowledge
know-to-cats      62% - 72%   ~55vh       Pull back to panorama, shuttle flies
cats-focus        72% - 87%   ~80vh       Zoom into Categories
exit              87% - 100%  ~70vh       Shuttle exits, camera settles to default panorama
```

### 3.2 Camera-Rig Animation Properties Per Segment

Each segment animates these properties on `#camera-rig`:

| Property | Focus State | Panorama State |
|----------|-------------|----------------|
| `rotateX` | 45-50deg | 20-25deg |
| `scale` | 1.3-1.5 (responsive) | 0.45-0.55 |
| `translateY` | shifts to center target section in viewport | 0 (court centered) |

The `translateY` is critical: when zoomed in at scale 1.4 and the target is `.court-row-knowledge` (which is below the net line), the camera-rig must translate upward so that section is centered in the viewport. The translateY value is computed relative to each section's position within the court.

GSAP example for one zoom-in segment:

```js
// Transition: panorama -> focus on Lessons
tl.to(cameraRig, {
  rotateX: 48,
  scale: isMobile ? 1.5 : 1.3,
  y: -lessonsOffsetFromCenter,  // negative = shift court up to center lessons
  duration: focusDuration,
  ease: 'power2.inOut',
}, segmentStart);
```

### 3.3 Shuttle Flight Integration

The shuttle continues to fly between sections during "transition" segments (when the camera is in panorama mode). During "focus" segments, the shuttle is either:
- Hovering near the focused section (subtle drift animation)
- Or dimmed/blurred (content takes priority)

The shuttle animation from the current implementation (position, scale, rotation, glow, shadow) is preserved but compressed into the transition segments only.

### 3.4 Content Visibility Management

During each segment:

**Focus segment (e.g., lessons-focus):**
- Target section: `opacity: 1`, `filter: blur(0)`, `.court-content-float` gets `translateZ: 30px`
- Holographic glow active (text-shadow applied)
- Other sections: `opacity: 0.15`, `filter: blur(6px)`, `translateZ: 0`
- Shuttle: dimmed, small scale

**Transition segment (e.g., lessons-to-knowledge):**
- All sections: `opacity: 0.4`, `filter: blur(2px)`, `translateZ: 0`
- Shuttle: bright, flying, large scale
- Camera-rig animating back to panorama then forward to next focus

### 3.5 ScrollTrigger Configuration

```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.scene',         // the tall scroll spacer
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.5,                // keep existing smoothing
    pin: '#camera',            // pin the camera viewport
    pinSpacing: false,         // .scene already has the height
    invalidateOnRefresh: true, // recalc on resize
    anticipatePin: 1,          // smooth pin start
  },
});
```

**Important**: Using `pin: '#camera'` with `trigger: '.scene'` means ScrollTrigger pins the camera element in place while the user scrolls through the scene's full height. The `pinSpacing: false` is needed because the scene already accounts for the scroll distance.

### 3.6 translateY Calculation for Focus Targeting

When zoomed in, each focus segment needs to center a specific court section in the viewport. The translateY offset depends on where that section sits relative to the court's center:

```js
function getSectionOffset(section, courtEl) {
  const courtCenter = courtEl.offsetHeight / 2;
  const sectionCenter = section.offsetTop + section.offsetHeight / 2;
  return (sectionCenter - courtCenter) * currentScale;
}
```

For the Hero section (near the top of the court), translateY will be a positive value (shift court down). For Knowledge (below the net), translateY will be negative (shift court up).

These offsets must be recalculated on window resize (`invalidateOnRefresh: true` handles re-triggering, but the waypoint values themselves need a refresh callback).

---

## Part 4: Scroll Distance Management

### 4.1 The Approach: Explicit Scene Height + Pin

This is the cleanest approach. Instead of relying on the court's natural height for scroll distance, we:

1. Set `.scene` to a fixed height in `vh` units (e.g., `540vh`)
2. Pin the camera inside it
3. The GSAP timeline maps 0-100% of scroll progress to all animations

This completely decouples scroll distance from court DOM height, which is essential because the court's visual size is now controlled by `scale()` on the camera-rig.

### 4.2 Responsive Scene Height

Mobile users scroll faster per viewport height, so the scene should be slightly shorter on mobile to maintain comfortable pacing:

```css
.scene {
  height: 480vh;
}

@media (min-width: 768px) {
  .scene {
    height: 540vh;
  }
}
```

### 4.3 Reduced-Motion Scene

For `prefers-reduced-motion`, the scene height reverts to auto (no pinning, no 3D):

```css
@media (prefers-reduced-motion: reduce) {
  .scene {
    height: auto !important;
  }
  .camera {
    perspective: none !important;
    height: auto !important;
  }
  .camera-rig {
    transform: none !important;
  }
}
```

---

## Part 5: Performance Strategy

### 5.1 GPU-Only Properties

Every animated property must be GPU-compositable:
- `transform` (rotateX, scale, translateY, translateZ) -- YES
- `opacity` -- YES
- `filter: blur()` -- Partially GPU (uses GPU for compositing but rasterizes each frame)

`filter: blur()` is the primary risk. The current implementation uses it on content sections. For the 3D version, blur values should be reduced (max 4px on mobile, 6px on desktop), and sections that are fully behind the camera view should be set to `visibility: hidden` instead of blurred.

### 5.2 will-change Budget

Apply `will-change` only to elements that are actively animating:

```css
#camera-rig { will-change: transform; }
#shuttle { will-change: transform, opacity; }
.court-content-float { will-change: transform, opacity; }
```

Do NOT add `will-change` to the vignette, spotlight, or court background, as these are static during most of the animation.

### 5.3 Content Section Optimization

When a section is far from focus (e.g., hero during categories-focus), set it to `visibility: hidden` rather than `opacity: 0` + `blur`. This removes it from the rendering pipeline entirely. GSAP can handle this with a simple callback:

```js
// In each focus segment, hide distant sections
tl.set(distantSections, { visibility: 'hidden' }, segmentStart);
tl.set(distantSections, { visibility: 'visible' }, segmentEnd);
```

### 5.4 Framerate Monitor (Development Only)

Add a development-only FPS counter using `requestAnimationFrame` to validate 60fps during tuning. Remove before production.

### 5.5 Progressive Degradation Ladder

If framerate issues are detected (via a short benchmark on page load):

1. **Level 0 (full)**: All effects active
2. **Level 1**: Remove holographic ground shadows (the `::after` pseudo-elements)
3. **Level 2**: Reduce blur to 2px maximum
4. **Level 3**: Remove blur entirely, use opacity-only transitions
5. **Level 4**: Disable 3D perspective, fall back to current 2D implementation

This can be implemented as a class on `<body>` (e.g., `body.perf-level-2`) with CSS overrides.

### 5.6 Mobile-Specific Considerations

- Reduce `perspective` to `1000px` on mobile (less computation for perspective projection)
- Cap `scale` zoom-in at `1.5` on mobile, `1.3` on desktop (less area to render when zoomed)
- Use `translateZ(20px)` for holographic float on mobile vs `30px` on desktop
- The court's `box-shadow` (5 layers for light spillover) should be simplified to 2 layers during 3D animation (box-shadow is CPU-rendered and expensive in perspective contexts)

---

## Part 6: Holographic Text Implementation

### 6.1 Text Glow Effect

Applied to `.court-content-float` elements during focus state:

```css
.holo-glow {
  text-shadow:
    0 0 8px rgba(210, 230, 255, 0.35),
    0 0 25px rgba(190, 215, 255, 0.18),
    0 0 50px rgba(170, 200, 255, 0.08);
}

.holo-glow h1, .holo-glow h2, .holo-glow h3 {
  text-shadow:
    0 0 12px rgba(220, 235, 255, 0.45),
    0 0 35px rgba(200, 220, 255, 0.22);
}
```

Headings get slightly stronger glow. The blue tint (210-230 hue in RGB) gives a cool "stadium scoreboard" feel without being overtly sci-fi.

### 6.2 Ground Shadow Projection

Each `.court-content-float` gets a pseudo-element that simulates a shadow cast onto the court surface:

```css
.court-content-float::after {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 0;
  height: 60%;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, transparent 70%);
  transform: translateZ(-1px) scaleY(0.3);
  filter: blur(15px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
```

GSAP animates `opacity` of this pseudo via the parent's CSS custom property or direct targeting.

### 6.3 Readability Safeguards

- Minimum text opacity during focus: 1.0 (never dim focused text)
- Maximum blur on focused text: 0 (always sharp)
- Text-shadow colors kept to white/blue pastel range (never saturated colors that reduce contrast)
- On small screens, reduce text-shadow spread to avoid bleeding between lines of text

---

## Part 7: Interaction and Accessibility

### 7.1 Pointer Events During 3D Transforms

`transform-style: preserve-3d` and `perspective` can cause hit-testing issues. The solution:

- Content rows that are `<a>` tags must remain clickable during focus state
- During panorama/transition state when content is small and blurred, add `pointer-events: none` to prevent accidental clicks on illegible text
- GSAP toggles `pointer-events` as part of each segment:
  ```js
  tl.set(section, { pointerEvents: 'auto' }, focusStart);
  tl.set(section, { pointerEvents: 'none' }, focusEnd);
  ```

### 7.2 prefers-reduced-motion

Complete bypass of 3D effects:

```js
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Skip all 3D setup
  // Court renders flat, same as current 2D but without scroll animation
  return;
}
```

This is already partially implemented (shuttle is hidden). The check must be extended to skip the entire GSAP timeline build.

### 7.3 Keyboard Navigation

Tab order must follow DOM order regardless of 3D transforms. Since we are not reordering DOM elements, this works naturally. However, during panorama state when sections have `pointer-events: none`, we should NOT set `tabindex="-1"` -- keyboard users should still be able to tab to links.

---

## Part 8: Step-by-Step Implementation Order

### Phase 1: Structural Foundation (Estimated: 2-3 hours)

**Step 1.1**: Add `.scene`, `.camera`, and `.camera-rig` wrapper elements to the index.astro template (lines 41-210). Move `.court-outer` inside the new hierarchy.

**Step 1.2**: Add `.court-content-float` wrapper divs inside each content row (hero, lessons, knowledge, cats, footer).

**Step 1.3**: Add new CSS rules for `.scene`, `.camera`, `.camera-rig` in the `<style>` block. Set up perspective, preserve-3d chain.

**Step 1.4**: Remove `overflow: hidden` from `.court`. Replace with targeted containment on `.court-vignette` and `.court::before` (noise texture).

**Step 1.5**: Update `.court-outer` max-width from `480/520px` to `min(90vw, 700px)` / `min(85vw, 750px)`.

**Step 1.6**: Verify the page still renders correctly with zero animation (just the structural changes + static perspective).

### Phase 2: Camera Animation Core (Estimated: 3-4 hours)

**Step 2.1**: Rewrite the GSAP script block. Replace the `initShuttleAnimation` IIFE with a new `init3DAnimation` function.

**Step 2.2**: Implement the ScrollTrigger configuration with `.scene` as trigger and `#camera` as pin target.

**Step 2.3**: Build the first zoom cycle: hero-focus -> panorama. Animate `#camera-rig` properties (rotateX, scale, translateY). Verify the camera movement feels correct.

**Step 2.4**: Add remaining zoom cycles (lessons-focus, knowledge-focus, cats-focus) with transition segments between them.

**Step 2.5**: Tune translateY offsets per section so focused content is centered in viewport.

**Step 2.6**: Add exit animation segment (shuttle fadeout, camera settles).

### Phase 3: Shuttle Flight in 3D (Estimated: 1-2 hours)

**Step 3.1**: Adapt shuttle positioning. The shuttle is `position: absolute` within `.court`. Its `top` and `left` values still work, but it needs to participate in the 3D space: `transform-style: preserve-3d` on its parent, and the shuttle itself gets `translateZ(15px)` to float slightly above the court (above content when in flight, below when content is focused).

**Step 3.2**: Compress shuttle flight waypoints into the transition segments only. During focus segments, shuttle is dimmed and stationary.

**Step 3.3**: Adjust shuttle scale/glow/shadow values for 3D context (current values were tuned for flat view).

### Phase 4: Holographic Text (Estimated: 1-2 hours)

**Step 4.1**: Add `.holo-glow` CSS class with text-shadow definitions.

**Step 4.2**: Add ground shadow pseudo-elements to `.court-content-float`.

**Step 4.3**: Wire GSAP to toggle holographic effects per focus segment: fade in glow + raise translateZ when focusing, fade out + lower when transitioning.

**Step 4.4**: Tune glow intensity for readability. Test on both dark (court green) and light backgrounds.

### Phase 5: Polish and Performance (Estimated: 2-3 hours)

**Step 5.1**: Add `prefers-reduced-motion` complete bypass (CSS + JS).

**Step 5.2**: Add pointer-events management per segment.

**Step 5.3**: Profile on mobile Safari and Chrome (real devices if possible). Identify any frame drops.

**Step 5.4**: Apply performance mitigations: reduce box-shadow layers during animation, cap blur values, add visibility toggling for off-screen sections.

**Step 5.5**: Tune scroll pacing (scene height, segment proportions) for comfortable reading pace.

**Step 5.6**: Test all interactive elements (links to /knowledge/, /lessons/, category filters) remain functional during focus states.

### Phase 6: Responsive Fine-Tuning (Estimated: 1-2 hours)

**Step 6.1**: Test at 375px, 414px, 768px, 1024px, 1440px widths.

**Step 6.2**: Adjust scale values per breakpoint if needed (media query or JS `matchMedia`).

**Step 6.3**: Verify court-dims annotations (6.10m, 13.40m, NET) still position correctly.

**Step 6.4**: Test landscape orientation on mobile (court may need different perspective values).

---

## Part 9: Risks and Mitigations

### Risk 1: overflow:hidden removal breaks court appearance

The court uses `overflow: hidden` to contain the noise texture pseudo-element, vignette, and potentially the glow box-shadow inner rendering. Removing it may cause visual bleeding.

**Mitigation**: Apply `clip-path: inset(0)` or explicit sizing to `.court-vignette` and `.court::before`. Test thoroughly after removal. If issues persist, use `overflow: clip` which does not establish a new stacking context (supported in Chrome 90+, Safari 16+, Firefox 81+).

### Risk 2: preserve-3d chain performance on mobile

A deep `preserve-3d` chain (5 levels) forces the GPU to composite many layers in 3D space. On low-end mobile devices, this could cause frame drops.

**Mitigation**: Flatten the chain where possible. The `.court-outer` level does not need its own transforms, so it may not need `preserve-3d`. Test if setting `transform-style: flat` on `.court-outer` and only using preserve-3d on `.court` still allows `.court-content-float` translateZ to work. (It should, as long as the direct parent has preserve-3d.)

### Risk 3: ScrollTrigger pin jank on iOS Safari

iOS Safari has known issues with `position: fixed` (which ScrollTrigger pin uses internally). The pin can jitter during fast scrolling.

**Mitigation**: Use `anticipatePin: 1` in ScrollTrigger config (already planned). If issues persist, consider using `position: sticky` via ScrollTrigger's `pinType: 'transform'` option. Also test with `-webkit-overflow-scrolling: touch` removed (this is no longer needed in modern iOS).

### Risk 4: Foreshortened text illegibility

When `rotateX(45deg)` is applied, text near the far edge (top of court) is vertically compressed by ~30%. This makes small text hard to read.

**Mitigation**: This is addressed by the zoom-in behavior -- during focus state, the target section is scaled up enough that foreshortening is compensated. Additionally, the `rotateX` during focus (45-50deg) is more overhead, which reduces the foreshortening gradient across a single section. Fine-tune rotateX and scale together.

### Risk 5: Click targets misaligned due to 3D transforms

CSS 3D transforms affect hit testing. A link that visually appears at position (x, y) may have its click target at a different position due to perspective projection.

**Mitigation**: Modern browsers (Chrome, Firefox, Safari) correctly handle hit-testing through CSS 3D transforms. This should work correctly. However, test explicitly by clicking links at various zoom levels. If issues arise, the nuclear option is to overlay invisible full-size click targets at the original DOM positions.

### Risk 6: Court border/lines look wrong in perspective

The 4px white border on `.court` renders in screen space, not 3D space. With perspective, the near edge border appears the same thickness as the far edge border (since border is not a 3D-transformed element but a box decoration).

**Mitigation**: This is actually acceptable -- CSS borders are part of the box model and DO get perspectively distorted along with the element. Test to verify. If the border looks inconsistent, convert the border to pseudo-elements with explicit positioning, or use an outline-based approach.

### Risk 7: Vignette (6-light radial gradient) looks wrong in 3D

The vignette is positioned with percentage-based gradient stops, which are relative to the element, not the viewport. In 3D perspective, the vignette will distort along with the court. The lights at the "far" end of the court will appear compressed and the lights at the "near" end will appear stretched.

**Mitigation**: This is actually desirable -- it enhances the 3D illusion by making the "far" lights appear more distant. No action needed unless it looks visually broken. If it does, the vignette can be rebuilt with individual positioned `<div>` elements that each have their own radial gradient, giving more control.

---

## Part 10: GSAP Timeline Pseudocode

```js
function init3DAnimation() {
  // Bail on reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const scene = document.querySelector('.scene');
  const camera = document.getElementById('camera');
  const rig = document.getElementById('camera-rig');
  const courtEl = document.querySelector('.court');
  const shuttle = document.getElementById('shuttle');
  if (!scene || !camera || !rig || !courtEl || !shuttle) return;

  // Import GSAP
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);

  // Gather section references
  const sections = {
    hero: courtEl.querySelector('.court-row-hero'),
    lessons: courtEl.querySelector('.court-row-lessons'),
    knowledge: courtEl.querySelector('.court-row-knowledge'),
    cats: courtEl.querySelector('.court-row-cats'),
    footer: courtEl.querySelector('.court-row-footer'),
  };

  const contentFloats = {
    hero: document.getElementById('content-hero'),
    lessons: document.getElementById('content-lessons'),
    knowledge: document.getElementById('content-knowledge'),
    cats: document.getElementById('content-cats'),
  };

  const isMobile = window.innerWidth < 768;
  const focusScale = isMobile ? 1.5 : 1.3;
  const panoramaScale = isMobile ? 0.5 : 0.45;
  const focusRotateX = 48;
  const panoramaRotateX = 22;
  const holoZ = isMobile ? 20 : 30;

  // Compute Y offsets for centering each section
  function getCenterY(section) {
    const courtH = courtEl.offsetHeight;
    const sectionMid = section.offsetTop + section.offsetHeight / 2;
    return -(sectionMid - courtH / 2);
  }

  // Set initial state
  gsap.set(rig, {
    rotateX: panoramaRotateX,
    scale: panoramaScale,
    y: 0,
    transformOrigin: '50% 50%',
  });

  // Build main timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      pin: camera,
      pinSpacing: false,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  // --- Segment helper ---
  function addFocusSegment(label, targetSection, targetFloat, duration, position) {
    // Camera zooms in
    tl.to(rig, {
      rotateX: focusRotateX,
      scale: focusScale,
      y: getCenterY(targetSection),
      duration: duration * 0.4,  // first 40% of segment = zoom in
      ease: 'power2.inOut',
    }, position);

    // Hold focus (remaining 60%)
    // (no camera animation, just maintaining position)

    // Content float rises
    tl.to(targetFloat, {
      z: holoZ,
      opacity: 1,
      duration: duration * 0.3,
      ease: 'power2.out',
    }, position);

    // Other sections dim
    Object.entries(contentFloats).forEach(([key, el]) => {
      if (el !== targetFloat) {
        tl.to(el, {
          z: 0,
          opacity: 0.15,
          duration: duration * 0.3,
          ease: 'power2.out',
        }, position);
      }
    });

    // Shuttle dims during focus
    tl.to(shuttle, {
      opacity: 0.3,
      scale: 0.6,
      duration: duration * 0.3,
      ease: 'power2.out',
    }, position);
  }

  function addTransitionSegment(fromWaypoint, toWaypoint, duration, position) {
    // Camera pulls back to panorama
    tl.to(rig, {
      rotateX: panoramaRotateX,
      scale: panoramaScale,
      y: 0,
      duration: duration * 0.5,
      ease: 'power2.inOut',
    }, position);

    // Shuttle flies
    tl.to(shuttle, {
      top: toWaypoint.y,
      left: toWaypoint.x + '%',
      opacity: 1,
      scale: 1.3,
      duration: duration,
      ease: 'power2.inOut',
    }, position);

    // All content at mid-opacity
    Object.values(contentFloats).forEach(el => {
      tl.to(el, {
        z: 0,
        opacity: 0.4,
        duration: duration * 0.4,
        ease: 'power2.inOut',
      }, position);
    });
  }

  // --- Build segments ---
  let pos = 0;

  // 1. Hero focus (starts zoomed in)
  addFocusSegment('hero', sections.hero, contentFloats.hero, 3, pos);
  pos += 3;

  // 2. Hero -> Lessons transition
  addTransitionSegment(
    { y: centerY(sections.hero), x: 48 },
    { y: centerY(sections.lessons), x: 56 },
    2.5, pos
  );
  pos += 2.5;

  // 3. Lessons focus
  addFocusSegment('lessons', sections.lessons, contentFloats.lessons, 3.5, pos);
  pos += 3.5;

  // 4. Lessons -> Knowledge transition
  addTransitionSegment(
    { y: centerY(sections.lessons), x: 56 },
    { y: centerY(sections.knowledge), x: 43 },
    2.5, pos
  );
  pos += 2.5;

  // 5. Knowledge focus
  addFocusSegment('knowledge', sections.knowledge, contentFloats.knowledge, 3.5, pos);
  pos += 3.5;

  // 6. Knowledge -> Cats transition
  addTransitionSegment(
    { y: centerY(sections.knowledge), x: 43 },
    { y: centerY(sections.cats), x: 55 },
    2.5, pos
  );
  pos += 2.5;

  // 7. Categories focus
  addFocusSegment('cats', sections.cats, contentFloats.cats, 3.5, pos);
  pos += 3.5;

  // 8. Exit
  tl.to(rig, {
    rotateX: panoramaRotateX,
    scale: panoramaScale,
    y: 0,
    duration: 2,
    ease: 'power2.inOut',
  }, pos);
  tl.to(shuttle, {
    opacity: 0,
    scale: 0.4,
    duration: 1.5,
    ease: 'power2.in',
  }, pos);
}
```

This is pseudocode illustrating the architecture. The real implementation will need:
- Precise timing tuning based on visual testing
- Spotlight and vignette integration (carried forward from current implementation)
- Entry animation (CSS keyframe) preserved for shuttle
- Edge cases (window resize, orientation change)

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/pages/index.astro` | Template: add scene/camera/camera-rig wrappers, add content-float divs. CSS: new rules for scene/camera/camera-rig/holo, modify court-outer width, remove overflow:hidden from court, add preserve-3d chain. Script: complete rewrite of GSAP animation. |
| `src/styles/global.css` | Add `@media (prefers-reduced-motion)` rules for 3D fallback, optionally add `.holo-glow` utility class |

No new files need to be created. The entire implementation lives within the existing single-page component pattern.
