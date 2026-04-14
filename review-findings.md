# Color Picker Performance Review Findings

This review focuses on why wheel rendering is slow and what optimizations are most likely to reduce total render time.  
No code changes were applied.

## Highest-Impact Opportunities

1. **Per-pixel trig/math in the inner loop is the main bottleneck**
   - `drawHorizontalLine()` recomputes `sqrt`, `atan2`, and HSL conversion for every pixel of every line.
   - For a 256x256 wheel, that is tens of thousands of expensive math calls per saturation level.
   - Recommendation:
     - Precompute static per-pixel geometry once (inside-circle mask, hue, luminance), then reuse it for all saturation draws.
     - Keep render path to mostly array reads/writes + lightweight color conversion.
   - Expected impact: **very high**.

2. **Work is split into many tiny `setTimeout(..., 0)` tasks**
   - `draw()` schedules `drawCircle` repeatedly with `setTimeout`, adding event-loop overhead and reducing throughput.
   - Recommendation:
     - Use chunked rendering in `requestAnimationFrame` (process many lines/pixels per frame), or
     - Render whole buffer in one pass when progress UI is not needed.
   - Expected impact: **high**.

3. **Progress bar redraws too frequently**
   - `drawProgress()` is called from `drawHorizontalLine()`, so progress is repainted very often during generation.
   - This causes repeated canvas work while the expensive pixel loop is already running.
   - Recommendation:
     - Throttle progress updates (for example every N lines or every ~16ms).
     - Or disable progress painting during hot path and show only major milestones.
   - Expected impact: **high** during initial wheel generation.

## Medium-Impact Opportunities

4. **Full-canvas redraw on every mouse move**
   - `drawMousePip()` calls `me.draw()` on every `mousemove`, which can re-`putImageData` before drawing crosshairs.
   - This is an interaction bottleneck rather than initial generation, but it still hurts perceived performance.
   - Recommendation:
     - Avoid full redraw per move (overlay layer, XOR-like strategy, or only redraw changed overlay).
   - Expected impact: **medium-high** for responsiveness.

5. **ImageData copying overhead**
   - `getImageData` / `putImageData` / storing many `ImageData` objects can be costly.
   - Caching one `ImageData` per saturation can also increase memory pressure.
   - Recommendation:
     - Store raw typed arrays (or compressed intermediates) and construct `ImageData` only when needed.
     - Consider reducing cache cardinality (e.g., coarser steps + interpolation) if acceptable.
   - Expected impact: **medium**.

6. **Potential cache key instability with float saturation keys**
   - Cache uses keys like `'d' + this.saturation`; floating-point representations can be inconsistent in some code paths.
   - Recommendation:
     - Normalize saturation to integer bucket (`0..100`) before cache access.
   - Expected impact: **medium** (prevents accidental cache misses).

## Lower-Impact / Cleanup Optimizations

7. **Avoid repeated constant math in inner loops**
   - There are repeated divides and conversions (`/128`, degree conversion) in very hot loops.
   - Recommendation:
     - Hoist invariants and use precomputed constants (e.g., `invRadius`, `radToHue` factor).
   - Expected impact: **low-medium** (good after major fixes).

8. **Implicit globals may hurt engine optimization**
   - Several variables (`dist`, `angle`, `h`, `l`, `rgb`, etc.) are assigned without `var/let/const`, creating global writes.
   - This can cause de-optimizations and unpredictable performance behavior.
   - Recommendation:
     - Make all hot-path variables local and consistently scoped.
   - Expected impact: **low-medium** plus correctness/safety improvement.

## Suggested Optimization Order

1. Precompute geometry tables used by all saturations.
2. Replace timeout-per-step rendering with chunked `requestAnimationFrame` (or one-pass render when possible).
3. Throttle progress drawing aggressively.
4. Fix `mousemove` overlay strategy to avoid full-canvas redraw each event.
5. Normalize cache keys and clean up variable scoping.

## Notes

- Current architecture (caching per saturation) is directionally good; the heavy cost is how each cache image is generated.
- Biggest wins will come from reducing hot-loop math and event-loop churn, not from micro-tuning single expressions.
