Continuing from the previous session. The worklog shows r23 was completed and pushed at commit `93448c3`. Now the user's latest request references `docs/session_39.md` and `docs/session_40.md` — a new iteration round. Let me start by refreshing the workspace.
Tree is clean at `93448c3`. Now pulling to get the latest from the remote (the user references `session_40.md` which doesn't exist locally yet):
Pulled `93448c3..7e5d750` — one new commit adding `docs/session_40.md`. Let me review the new state:
`session_40.md` is the narration record of the previous round (r23) — committed by the user after our push. It ends with queued next-step probes: **WebKit engine matrix, slow-network first-paint captures, and the gradient compositor race study**. This new round is session_41 / r24. Let me set up the task plan:
Now re-reviewing the core docs for the current state (post-r23):
AGENTS.md is aligned with r23. Now let me verify the other core docs and session_39:
README aligned. Now checking PAD revisions and session_39:
所有文档均已与 r23 对齐。现在正在设置环境并运行 baseline gates 以验证代码库状态：
**1 test failed** — the same recurring regression class may have struck again: the user's `session_40.md` narration commit may carry the stripped tokens. Let me identify it:
**The exact recurring regression class, caught by the pin exactly as designed**: the user's `session_40.md` narration commit quotes the stripped token(s) — main is RED again. Let me locate the offending lines:
`session_40.md` line 13 quotes the literal transparent-outline token (the raw narration identified the r22 offender by quoting it — the exact documented recurrence mechanism). The r22 markdown exclusion should still protect the compiled CSS. Verifying with a build:
**CSS verified safe**: 150,821 bytes, content hash `de83a4a2` (byte-identical to the r23 record), 0 forced-colors, 0 selection rules. The r22 markdown exclusion is protecting the compiled CSS — but the docs-token pin (the defense-in-depth canary) is RED: `session_40.md` line 13 carries the literal token. This is the **third occurrence of the exact documented recurrence class** (session_37 → session_38 → session_40).

Marking progress and continuing validation:
**GTK 3 libraries are now present** — the sandbox changed since r23! WebKit may be launchable now. Attempting the queued WebKit engine matrix:
WebKit needs GTK4 + 8 more system libs, and there's no sudo. Let me try extracting user-space `.deb` packages (no root needed) to build the missing lib set:
All deps resolve. Now installing WebKit with the local lib path active, then testing launch:
Missing list shrank 9 → 3. The gstreamer/GLESv2 libs may have landed in non-standard paths. Checking:
WebKit 2359 is downloaded. The two gstreamer libs live in different packages. Fetching them:
`libbacktrace` is bundled in the webkit package itself. Testing an actual Playwright WebKit launch with the local lib path:
Down to ONE lib. `libGLESv2.so.2` exists in my path but still fails — checking why:
**Both minibrowsers resolve 100% of deps** with the full lib path — the validator is just conservative. Retrying launch with validation skipped:
Validation passed but `pw_run.sh` rewrites LD_LIBRARY_PATH. Inspecting the launcher script:
The outer `minibrowser-wpe/MiniBrowser` wrapper likely resets LD_LIBRARY_PATH. Checking and testing the inner binary directly:
The inner binary runs fine. The outer `MiniBrowser` is a 284-byte script — checking if it clobbers the env:
The wrapper **overwrites** LD_LIBRARY_PATH. Patching it (local cache only, not the repo) to preserve inherited paths:
浏览器现在可以启动了，但在 `newPage` 时崩溃。正在捕获 `browser-process` 的日志：
Browser runs standalone fine. The failure is in the inspector-pipe handshake. Enabling protocol logging:
No EGL vendor stack at all (no Mesa) — WebKit's headless compositor needs GL. Assembling a software-GL stack (Mesa/llvmpipe):
Mesa llvmpipe stack complete. Retrying launch with the full GL environment:
The headless display backend is built in. Driving the inspector-pipe manually to expose the real error:
The browser stays alive with stdin open — my protocol message format was just wrong. Checking Playwright's actual wire format:
Playwright uses fds 3/4 for the pipe — my manual probe was moot. Let me test view creation directly (the actual suspected crash point):
**Found it**: `Could not create EGL display: no supported platform available` — the crash point. Testing EGL init directly to fix the vendor setup:
Writing the minimal standard Khronos header (it's a tiny stable typedef file):
探测在 `device` 平台上挂起了。让我对平台进行选择性测试（仅限 surfaceless —— 这是 headless 所需要的）：
Simplifying — ditching the headers entirely, declaring everything inline:
All platforms rejected — the mesa vendor isn't loading. Checking why:
No strace. Checking the glvnd binary's env var names directly:
glvnd 需要双下划线形式：`__EGL_VENDOR_LIBRARY_DIRS`。正在重试：
No DRM devices at all — EGL is a dead end in this sandbox. One remaining angle: the GTK build under a virtual X server with software GLX:
**Xvfb is installed** — the sandbox changed. New plan: run the GTK WebKit build (headed) under Xvfb with software GL. Patching the GTK wrapper:
Xvfb with `-ac` works, but background processes die between tool calls — so everything must run in single commands. Testing GTK WebKit:
**WebKit runs under Xvfb!** (exit 124 = full run, only a benign dbus warning). Now the Playwright-driven launch:
**WebKit engine matrix UNLOCKED** — Safari 26.6 drives via Playwright under Xvfb. This unlocks the top queued probe dimension. Let me review the r23 battery to adapt it:
现在正在调整 WebKit 的电池。首先检查开发服务器状态：
Both sides are up. Now writing the r24 WebKit battery (the queued probe, adapted from the r23 methodology):
修复末尾的 diff 逻辑（我的重构破坏了 side-prefix 约定）：
The skip-validation env must be set in the Node process itself, not just the browser env. Fixing:
WebKit needs the GIO TLS module for HTTPS (glib-networking). Fetching it:
**Two precise blockers**: missing `libproxy.so.1` and the fatal missing `org.gnome.system.proxy` gsettings schema. Fetching the schema package and compiling:
桌面端双方均已完成，在 WebKit 上实现了**字节级相等的几何结构**（998/154/998 两侧）。克隆移动端登录超时——正在调试：
依然停留在登录页，且带有一个神秘的空警告。正在检查源码中的警告元素上下文：
我在读取的内容中发现了两行可疑代码——正在验证实际字节：
**LINE 121 IS GENUINELY CORRUPTED on disk** — yet typecheck/build passed earlier. Checking when this happened:
Clean tree + corruption in HEAD — yet gates passed. Hexdumping the actual bytes:
**误报**——八进制转储（octal dump）证明该文件是完整的：`const [mode, setMode]` 是正确的。我的显示层在读取过程中过滤掉了 `[m`（ANSI 转义头）。因此代码中没有损坏——该警告是真实的诊断信息：登录表单渲染了一个**空错误消息**。正在检查失败状态下的截图像素：
No alert box painted — the empty [role=alert] is something else. Dumping its actual HTML:
The `[role=alert]` was Next.js's hidden route announcer — red herring. **The real issue: the click never submitted the form** (zero POST requests). Probing what's at the button's coordinates:
**The Sign In button sits at y=850 — BELOW the 844px fold** on the clone's mobile login under WebKit. Playwright's click auto-scrolls, yet nothing submits. Comparing against the live's layout under the identical context:
**完美对齐** —— 两侧均渲染出完全一致的移动端登录几何结构 (btnY 851, formH 353, docH 1045)，并且只要先将按钮滚动到可视区域内，两者都能正常提交。之前的电池故障属于 WebKit 脚本鲁棒性问题，而非对齐差异。正在修复该电池：
找到了原因：battery 的移动端流程**立即填充**（未等待 settle/hydration），而桌面端流程则先 settle 了 1.2 秒。在（较慢的）WebKit 上，在 React hydration 完成之前进行填充会导致受控输入重置 → 空提交 → 原生验证拦截 → 无请求。而实际站点（原生 Amplify）没有 hydration。现在添加 settle：
Battery complete — determinism 0.000% both sides, desktop geometry byte-equal. But **mobile dashboard shows 27.279%** — far out of family. Analyzing the hot-pixel regions:
Hot bands span the whole page — a scroll-offset signature. Probing scrollY at capture time on both sides:
**Real parity finding confirmed**: the LIVE resets scroll to 0 on the login→dashboard view swap; the CLONE persists scrollY=201 through `router.refresh()`. On Chromium this was unreachable (tighter text metrics keep the button in view), but WebKit's taller login card exposes it. Verifying the divergence is engine-independent (Chromium with forced scroll):
**Divergence confirmed on Chromium too** (live: 128→0; clone: 128→128, with byte-identical login cards). This is a real, engine-independent parity gap — **r24's key finding**. Checking the repo's test patterns to pin it TDD-style:
已确认仓库的模式（file-content pins）。在编写修复程序之前，让我获取当天的 Chromium 对以进行跨引擎对称性检查。复制电池并指向新的证据目录：
**Chromium: all 9 surfaces exactly at the documented r23 baselines** — no regression. Now the cross-engine symmetry analysis:
**Perfect symmetry** — WebKit shifts both sides identically (Δ ≤ 0.04% per surface). The elevated WebKit paired diffs are engine-amplified rasterization noise, not clone divergence. The one real finding is the scroll offset. Now the TDD cycle — writing the RED pin:
RED confirmed. Implementing the fix:
The pin's 200-char window is too narrow for the explanatory comment. Widening:
GREEN — 44/44. Now adding the E2E behavioral spec. Checking the suite structure:
Adding the E2E pin — but first checking the rate limiter budget (the suite is a pinned contract):
The limiter allows exactly 5/min; the suite currently uses 4. To stay safely inside the contract, I'll fold the scroll assertions into the existing round-trip spec (no extra sign-in):
两个问题：缺失 `DEMO_PASSWORD` 导入，以及在我编辑代码后，由开发服务器重新编译引起的连锁超时。正在修复导入：
Setup 现在也超时了——dev server 可能因我的修改而处于异常状态。正在手动检查 sign-in round-trip：
**Fix verified manually**: preScroll 128 → postScroll 0 on Chromium. The E2E failures were post-edit recompile latency. Re-running now that the rebuild settled:
**All 5 auth specs green** including the scroll pin. Re-running the full WebKit battery to confirm mobile parity is restored:
Mobile dropped 27.3% → 7.6% but still above family. Analyzing the remaining hot bands:
The earlier probe showed **docH 1700 (live) vs 1688 (clone)** on WebKit mobile — a real 12px layout difference (Chromium matches at 1563/1563). Locating the taller block:
**Found it**: the content SECTION is 1558 (live) vs 1546 (clone) — 12px. Also notable: the chat scroll container differs (651 vs 573). Dumping card-level heights to pinpoint:
**Pinpointed**: the Partner Spotlight card — live h=308 vs clone h=296, exactly 12px (one text line), while every other card matches byte-exactly. Inspecting the card's text layout:
The live's "Partner Spotlight" label row wraps to 2 lines under WebKit; the clone's stays 1. Measuring the exact widths to determine if it's a knife-edge wrap or real geometry divergence:
The live's label content is 1.58px wider (178.28 vs 176.70) — a knife-edge wrap that flips only under WebKit rasterization. Verifying the Chromium state of that row to complete the evidence:
**Chromium evidence complete**: live and clone are identical to 0.01px (178.58/178.58, both 245px cards, 1-line). The WebKit wrap is a **live-side engine-unstable knife-edge** — the live's own content flips its badge wrap under WebKit rasterization while the clone stays put. The clone cannot match both engines' flip states without breaking reference parity → **accepted divergence, now with measured evidence** (same class as the documented fractional text-row rounding).

WebKit matrix is complete. Now the remaining queued probes — slow-network first-paint:
**慢网络：一致性 (PARITY)** — 首次绘制 0.149%，稳定 0.232%（精确基准），仪表盘 0.548%。现在进行梯度合成器竞态研究 (r22-M1)：
**Gradient race: STABLE** — 16 fresh-navigation captures, zero variance on both sides, no flat-window artifact (r22-M1 does not reproduce). All three queued probe dimensions complete. Running the full gates to assemble the remediation plan:
335 tests (new pin included), 1 failure = the F1 RED pin. Assembling and executing the remediation plan:

**r24 Remediation Plan** (validated against the codebase):
| ID | Finding | Fix | Status |
|---|---|---|---|
| **F1 (HIGH)** | main is RED: `session_40.md:13` quotes the literal transparent-outline token (3rd occurrence: sessions 37→38→40) — verify-gate broken | Reword to descriptive reference | now |
| **F2 (HIGH)** | Auth-success scroll divergence (live resets to top; clone preserved offset — measured both engines) | `window.scrollTo(0,0)` + pin + E2E | ✅ done (TDD) |
| **F3 (MEDIUM)** | Docs: 334→335 tests, README r24 row, PAD R24 revision + §10 updates (incl. WebKit now MEASURED — update the "unmeasurable" acceptance), session_41.md | Full docs pass | next |
| **F4 (LOW)** | Document the WebKit probe capability + the two WebKit-exposed accepted divergences | merged into F3 | — |

**Confirmed at parity (no action)**: Chromium 9/9 at baselines, WebKit 8/9 fresh family + 1 documented knife-edge, slow-network, gradient race, symmetry ≤0.04%, geometry byte-equal on both engines.

Executing F1:
F1 GREEN. Full suite check:
**335/335 GREEN.** Now F3 — docs alignment. Starting with AGENTS.md:
Making the docs edits — AGENTS.md first (test count + new pin in the inventory):
Now the README r24 status row and Verification row update:
Now the PAD — R24 revision, §7.1 counts, §10 rows:
Adding the scroll-contract quirk to AGENTS.md (so nobody "cleans up" the scrollTo later):
Now writing the session_41.md record:
Now the screenshots. Per the r19 lesson (clean dev-server restart before captures), restarting the server first:
All 9 references re-shot with verified geometry. Proving visual inertness vs the r23 references:
**0.000% — visually inert.** Running the complete final gate suite:
**All gates green**: 335/335 vitest, E2E 25/25, smoke 23/23, CSS 150,821 B (same hash, 0/0 hygiene), screenshots inert. Verifying the change set and `.env.example`:
One screenshot changed (login-desktop) — verifying it's the known dev-badge region only:
All 9 screenshots content-identical (the PNG byte diff is encoder metadata only). Updating the worklog, then committing:
Both commits in, tree clean. Now the push — re-reading the wrapper skill first:
Dry-run clean — fast-forward `7e5d750..53c03f4` confirmed. Real push:
**r24 is complete and pushed to main** (`53c03f4`, verified on the remote via an independent HTTPS check).

**What this round delivered:**

1. **The WebKit engine matrix — unlocked and measured** (queued since r20): the sandbox gained GTK4 + Xvfb, and Playwright WebKit now runs via a user-space GTK4/Mesa/TLS stack. Full 9-surface paired battery: fresh baselines, 0.000% determinism both sides, byte-equal geometry, and cross-engine shifts symmetric to ≤0.04%.

2. **A real parity fix (TDD)**: the WebKit mobile flow exposed that the live resets scroll to top on sign-in while the clone preserved the offset — reachable on every real phone. Fixed with an explicit scroll-to-top, pinned by a unit test and an E2E assertion. Chromium re-verified at all documented baselines afterward.

3. **The last two queued probes closed**: slow-network first-paint at parity; the gradient-race study found zero artifacts in 16 captures.

4. **Verify-gate restored**: the third docs-token occurrence (session_40's narration) reworded; docs fully aligned; 335/335 vitest, 25/25 E2E, 23/23 smoke, CSS clean at 150,821 bytes.

**Suggested next:** watch the CI verify-gate on `53c03f4`. Future candidates live at the end of session_41.md — a WebKit pass over the login error/reset views, a Firefox opinion on the new mobile flows, or a host with real GPU for an unpatched-wrapper WebKit run.
