我将系统地继续进行这项任务。让我先检查一下工作区状态和 worklog。
Workspace intact — r21 (Session 36) completed at `f49975e`, tree clean. Now the standing prompt for this session targets sessions 35/36/37. Let me set up the task plan and refresh the workspace.
Pull successful — a new commit `7e35361` added `docs/session_37.md` (128 lines). Let me read it plus the root docs in parallel.
`session_37.md` is the raw narration of the completed r21 round — it ends with queued probe dimensions for this round: **scrolled-state captures, short-viewport matrix (the 982px uncapped shell), and the WebKit engine matrix**. Let me read the remaining docs.
The persisted output is nesting. Let me read the docs directly in chunks.
Now CLAUDE.md, README.md, and session docs.
Now README.md and the session docs (35, 36).
Now session_35.md and the PAD R20/R21 sections.
文档审查已完成。我现在已掌握完整上下文：r21 已完成（333 个 vitest，所有门控均已通过），这一轮实际上是使用新排队探测维度的 **r22**：滚动状态捕获、短视口矩阵（未限制外壳的 982px 断点）、WebKit 可行性以及 `scripting:none` 渲染。现在让我检查技能目录并验证代码库。
Structure verified. Now let me run the baseline gates on the pulled tree.
测试退出码为 1 —— 让我看看失败的原因。
The r21-F2 docs-token pin is failing on the freshly pulled tree — the user's new `session_37.md` commit likely re-introduced a stripped token (the exact r21-F2 regression class). Let me see the specifics.
Confirmed — the user's `session_37.md` (the raw r21 narration) carries the literal stripped token. This is a real RED state on the pulled tree, and exactly the regression class the pin guards. Let me locate the occurrences.
Two literal token occurrences in `session_37.md` lines 79/84 — the raw narration quotes the very tokens the r21 remediation stripped. Since TW4 scans committed markdown, the next build recompiles the dead rules. This is **r22-F1** — a genuine RED baseline finding, caught exactly by the r21 pin.

Let me record progress and continue validation: check the DB/dev-server state and measure the regrown CSS via a production build.
r21 工具已存活，但 DB/.env 需要初始化。我来设置环境并运行生产环境构建，以测量重新增长的 CSS。
构建失败 —— 让我看看原因。
Build compiled successfully — the failure is in the post-build copy steps. Let me check.
Build green on retry (first run had a transient copy race). Let me locate and measure the CSS.
**r22-F1 confirmed with hard evidence**: production CSS regrew from 152,062 → **152,474 bytes with 4 `::selection` rules** (r21 record: zero) — the user's `session_37.md` commit recompiled the dead rules exactly per the r21-F2 mechanism. Dev CSS also regrew (188,277 → 188,794, 1 forced-colors + 4 selection). Let me examine the regrown rules precisely.
The selection pair regrew verbatim. Let me check the transparent-outline utility's emission context in production (the forced-colors grep may have missed a spacing variant).
Production CSS carries the regrown dead rules: the transparent-outline utility's forced-colors block + the selection pair — **+412 bytes over the r21 clean record**. The r22-F1 finding is fully confirmed with build evidence.

Now let me review the named skills (per the task instructions) and enumerate the markdown scan scope in parallel.
1488 committed .md files — all under `skills/` (excluded) or root/docs (~55 files, all documentation, zero under src/public). Skills reviewed: tdd (red-green at seams — my established pattern) and clone-app-pat-pro (computed styles as ground truth, exhaustive state recon — also established). Now let me examine the current `@source` contract and its pin.
当前合约已明确。现在我来启动开发服务器并运行 parity audit，包括新排队的探测维度。
Dev server up. Let me review the r21 battery tooling to adapt it for this round's audit.
The r21 battery is battle-tested. Let me check the Playwright environment, then write the r22 battery with the new probe dimensions.
Playwright resolves globally. Let me check the r21 pixel-diff metric, then write the r22 battery.
The r21 metric is clear. Now let me write the r22 battery — the standard 8-pair capture plus the three new probe dimensions.
Now the short-viewport geometry matrix probe:
Now the scripting:none probe and the WebKit feasibility check:
WebKit isn't downloaded. Let me attempt the install to check this round's feasibility.
WebKit remains blocked on host GTK libraries (same as r20/r21 records) — documented, no action possible. Now the main battery run:
Battery done — scrolled-state geometry matches exactly on both sides (scrollMax=138, headerTop=-138). Now the pixel diff with r21 baselines plus the new scrolled surface:
The standard battery shows two genuinely elevated surfaces: **dashboard-desktop at 3.373%** (10× baseline, a saturated hot band at x=864-1056, y≈288) and **inspiration-desktop at 0.698%** (hot at the content pane's lower area). The other "ELEVATED" verdicts are 0.002-0.004pp rounding noise at baseline. Let me decompose the dashboard hot region.
The dashboard's main band spans y=278-389 (111 rows) — let me make tight crops of both bands and inspect them with the VLM.
The VLM sees the live's Art History card area **empty** while the clone renders a card. Let me inspect the full dashboard pair to understand the scope.
The full-view VLM reverses the crop reading: the **clone's Art History card body is empty** (skeleton block) while the live renders "The Starry Night" content. Let me get ground truth from the DOMs and the code.
The clone's code clearly renders title + paragraph after the gradient block. The VLM reading needs DOM ground truth — let me probe both sides' Art History cards directly.
The clone's card is fully rendered (label, gradient, title, paragraph, footer — all present). The live probe matched the wrong container. Let me re-probe the live's card specifically.
**Root cause located**: the Art History card's gradient block (864,278 352×112 — exactly the hot band y=278-389) renders as **rgba()** on the live but **oklab()** on the clone. Both cards are otherwise byte-identical in geometry. Let me sample the actual pixels to quantify.
Remarkable: the live's gradient div carries the gradient in its computed style but renders **flat card-background** rgb(18,7,36) — the gradient is invisible on the live while the clone renders it. Let me get the div's complete style to find why.
Both computed styles carry gradients (live: rgba stops; clone: oklab stops) — yet the live renders flat. Let me verify with an element-level screenshot of exactly that div on both sides.
**Major clue**: the live's gradient div renders the gradient in an element-level screenshot — rgb(35,20,60) etc., essentially identical to the clone. But the battery's full-page capture showed it flat. The live's full-page capture may have caught a stale compositing state. Let me re-capture the live's full page now and re-sample.
The live's gradient renders correctly in fresh captures — **the battery's live dashboard capture caught a transient unpainted state**. Notably, the battery's dashboard-desktop capture is the only one with no post-sign-in settle (the r21/r22 loop only settles inside the view-click branch). Let me check whether the inspiration elevation shares this cause.
Same pattern in the inspiration band — live flat, clone gradient. But the inspiration capture had a full settle, which challenges the "transient paint" theory. The r21 evidence still exists — let me sample the same coordinates in r21's captures to see if the gradients painted then.
r21's live captures had the gradients painted; r22's are flat — but fresh gotos paint them. The inspiration capture is the puzzle (it had a full settle). Let me capture the live's inspiration view fresh right now.
**Conclusive**: with proper settle the live paints both gradients, and the fresh live samples are **pixel-identical** to the clone's battery captures — (41,26,67) and (40,24,65) exactly. The two "elevations" are a **capture-race artifact** (the live's gradient layers hadn't flushed to the compositor at screenshot time), not an app divergence. The r21 battery's shorter settle happened to win the race; r22's lost it.

This is a methodology finding (r22-M1). Let me add an explicit paint gate to the battery and re-run.
Now wire in the sharp import and apply the gate at the three capture points:
The gate PASSED for the live's dashboard (pixel painted at gate time) yet the final capture is still flat — and the clone's scrolled gate timed out because my coordinates don't account for the 138px scroll offset (the gradient moves to y=140-252 when scrolled; that gate was miscalibrated, harmless). Something is oscillating. Let me take a timed series of screenshots of the live's dashboard and track the gradient pixel.
The picture is inconsistent over time — early probes painted, later ones flat, and the gate passed then the final capture regressed. Something is actively toggling the paint. Let me watch the live's gradient div for class/style mutations over time.
**Breakthrough**: parking the mouse at (4,4) *before* the dashboard mounts → gradient paints and stays painted for 8s (zero DOM mutations). The flat rendering is tied to the pointer resting over the content area at mount time. Let me nail down the exact rule with a controlled three-variant experiment.
All variants paint now — the pointer theory is dead. The live's gradient toggles flat/painted **non-deterministically across time windows** (within one browser process: painted→flat→flat→painted), with zero DOM mutations. The clone always paints, and when the live paints, pixels match the clone exactly.

The ground truth for real users is the original reference image. Let me sample it.
The reference is 1913×1074 — different scale, and my scan hit the chat card. Let me locate the Art History label (lavender text) and sample the gradient well below it.
The pixel scans are hitting the chat column. Let me just ask the VLM to read the reference image directly.
**The reference image confirms it**: the Art History gradient well is **visibly painted** in the real-browser reference. The clone's rendering is correct; the r22 battery's two "elevations" are a headless-compositor artifact — the live's rgba-gradient layer rasterizes non-deterministically under software compositing (per-capture races, zero DOM mutations).

The battery needs a retry-until-painted capture for gradient surfaces. Let me patch it.
Now update the three call sites to use the new capture function:
Line 214 still references the removed function, and the `continue` skips the state-check. Let me fix both.
所有重试都卡在 flat 状态 —— 现在的渐变渲染失败是 *每个启动会话（per-launch-session）持续存在* 的，而且 mobile dashboard 也开始受到影响（9.07%）。一个令人怀疑的区别是：battery 在 sign-in 之前捕获了 login 页面；而我绘制的 probes 从未这样做过。让我直接测试一下“login-capture poison”假设。
两个变体现在都处于 flat 状态 —— 整个 sandbox 的渲染状态已经发生了全局性改变。让我用一个最小化测试来分离出 rasterizer 级的问题：一个具有相同 rgba 渐变的本地 HTML 页面现在能正常绘制吗？
The minimal repro paints fine — the rasterizer is healthy; the flat rendering is specific to the live's layer tree and oscillates across time windows (painted this morning and at 11:10-11:20, flat now). The clone always paints and matches the painted-live exactly.

I have painted-window full-page live captures from the probes (`live-dash-fresh`, `live-inspo-fresh`). Let me diff those against the battery's clone captures for the true parity measurement.
**True parity established**: with the live's gradient in its painted state, dashboard 0.333% and inspiration 0.466% — at/below the r21 baselines. Combined with the battery's other surfaces, the full standard set (including the new scrolled surface at 0.148%) stands at parity; the flat-window captures are documented environment artifacts (r22-M1).

Now the remaining probe dimensions — the short-viewport matrix and the no-JS probe:
The matrix shows docH/scrollMax/mainH **matching at 600/700/844/982** (selector noise aside — the live's first `aside` is a 0-size mobile drawer; the clone's grid is a div, not a section). The @1100 divergence (live 1226 vs clone 1148) is the **accepted residue chat message** becoming geometry-visible once the viewport is tall enough that the clone's 5-message content no longer fills the max-h cap. Let me confirm the remaining rows and run the no-JS probe.
Matrix confirmed: **600/700/844/982 all match exactly** — the uncapped shell's scroll contract holds across the entire short-viewport range. The @1100 delta is the documented residue-message divergence. The no-JS probe shows the expected architectural split (live SPA = empty shell; clone RSC = server-rendered login) — an inherent platform difference, documented.

Now the export envelope probe and smoke suite:
Export envelope byte-identical ✓. Now the 23-check smoke suite:
Export byte-identical ✓, smoke 23/23 ✓. The audit is complete. Let me update the todo list and assemble the remediation plan.
让我阅读 `css-hygiene` pin 的其余部分和 `globals.css`，然后进行风险审计：是否有任何工具类仅存在于 `.md` 文件中。
The plan is validated against the pin structure. One decisive pre-check remains: whether any utility quoted in `.md` files exists ONLY there (the drop risk). Let me audit that programmatically.
The audit confirms: md-only tokens are prose hyphenations that never compile — and the current 152,474-byte CSS contains only session_37.md's 3 dead rules beyond the r21 clean record (any other .md-quoted valid utility would already be in the 152,062 baseline). The decisive proof will be the build diff.

## r22 Remediation Plan (validated against the codebase)

| ID | Finding | Fix |
|---|---|---|
| **r22-F1** (MEDIUM) | `session_37.md` (user commit `7e35361`) quotes the stripped transparent-outline + selection-variant tokens verbatim on 2 lines → TW4's markdown scanning regrew the production CSS 152,062 → 152,474 bytes (1 forced-colors block + 2 selection rules). The r21 docs-token pin is RED on main (the verify-gate fails). | Reword the 2 lines to descriptive references; pin → GREEN; CSS → clean record. |
| **r22-F2** (MEDIUM, systemic) | The F1 class recurs **every round** — raw session narrations naturally quote prior-session tokens; the pin catches it only at the next round's baseline, leaving the CSS regressed on main in between. | Exclude all committed markdown from TW4 content detection (`@source not "../../**/*.md";`) — documentation is not a render surface. Empirical build diff must show exactly the 3 dead rules drop, nothing real. Sources pin updated + a dedicated pin added. |

Confirmed at parity (no action): 9/9 battery surfaces incl. the new scrolled-state surface (0.148%); viewport matrix 600/700/844/982 exact (@1100 = the accepted residue message); export byte-identical; smoke 23/23; WebKit still host-blocked; no-JS split is the documented SPA-vs-RSC architecture.

Now the TDD cycle — **RED first**: extend the css-hygiene pins.
**RED verified** — exactly the 3 expected failures. Now **GREEN**: apply the globals.css directive and reword session_37.md.
Still 3 failures — let me see which.
The comment-stripper in the test ate my comment's `src/**/*.{ts,tsx,css}` text — the `**/` inside it looks like a comment terminator, corrupting the strip. Let me reword the comment to avoid `**` sequences.
**Root cause found**: the test's `stripComments` regex eats the `/**/` sequence **inside the directive's own quoted path** — `../../**/*.md` gets corrupted to `../..*.md` by the naive regex. The utility has a latent bug: it doesn't respect quoted strings. The correct fix is a proper string-aware stripper.
我的 docblock 本身包含 `/**/` 形状的文本和一个零宽空格——让我把它重写整洁，以避免自引用的 strip 混乱。
Only the docs-token pin remains RED — there must be more occurrences in session_37.md than the two I reworded.
剩下的六个匹配项均属于 **viewport-cap token family** —— 这是该 pin 所防护的第三组。我来将它们改写为更具描述性的引用。
**GREEN** — all 8 css-hygiene pins pass, zero stripped tokens remain. Now the full gate suite and the decisive CSS build diff.
Post-fix CSS: **150,821 bytes, 0 forced-colors, 0 selection** — but 1,241 bytes *below* the r21 clean record, and 2 `100vh` matches appeared. The build diff must account for every dropped rule. Let me do a rule-level diff.
The splitter merged everything into @layer blocks. Let me use a simpler common-prefix/suffix diff on the minified text.
The diff shows a real drop to investigate: `--color-ast-bg-primary:#121a5a` vanished from the theme. Let me do a systematic multiset diff of all custom properties and selectors.
The .md exclusion dropped more than the 3 known dead rules — I must account for **every** dropped selector and variable against src consumers. Critical checks: `backdrop-blur`, `bg-ast-yellow`, `h-screen`, `collapse`, `contents`, the shadow variables, `--font-sans`, and the two surviving `100vh` rules.
