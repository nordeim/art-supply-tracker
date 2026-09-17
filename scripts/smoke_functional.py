#!/usr/bin/env python3
"""Functional smoke suite — the golden paths, browser-verified.

Drives the running app (default http://localhost:3000) through the flows that
constitute the verification contract (README "Testing & Quality"):
sign-in, supply create → list view, away-and-back → category grid (the
post-create navigation regression), project create/edit/delete, chip detail
panels, stock filters, native-confirm deletes, and the import/export surface.

Requirements:
  - dev or production server running (`bun run dev`)
  - the `agent-browser` CLI on PATH (npm i -g agent-browser)
  - the demo account from the seed (`bun run db:seed`)

Usage:
  python3 scripts/smoke_functional.py [--base http://localhost:3000] [--keep]

  --keep    keep the smoke items instead of cleaning them up (debugging)

The suite leaves the studio pristine on success (every created row is deleted
through the real UI with its native confirm). Selectors are snapshot-driven
(accessible names matched by substring) so counts in tile names never break
the run; dev-mode cold compiles are absorbed by retry-based waits.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import time

BASE = "http://localhost:3000"
MARK = "ZZSMOKE"
PASS: list[str] = []
FAIL: list[str] = []


def run(args: list[str], check: bool = True) -> str:
    """Run an agent-browser command (dedicated smoke session), return stdout."""
    proc = subprocess.run(
        ["agent-browser", "--session", "smoke", *args],
        capture_output=True,
        text=True,
        timeout=90,
    )
    if check and proc.returncode != 0:
        raise RuntimeError(
            f"agent-browser {' '.join(args)} failed:\n{proc.stdout}\n{proc.stderr}"
        )
    return proc.stdout.strip()


def ok(name: str) -> None:
    PASS.append(name)
    print(f"  PASS  {name}")


def bad(name: str, detail: str = "") -> None:
    FAIL.append(name)
    print(f"  FAIL  {name}  {detail}")


def check(name: str, condition: bool, detail: str = "") -> None:
    ok(name) if condition else bad(name, detail)


def wait_ready() -> None:
    for _ in range(30):
        try:
            proc = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", BASE],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if proc.stdout.strip() == "200":
                return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError(f"app not reachable at {BASE}")


def snapshot() -> str:
    return run(["snapshot", "-i"])


REF_LINE = re.compile(r'- (?:button|textbox|tab|link|switch)(?: "([^"]*)")?(?: \[.*?\])? \[ref=(e\d+)\]')


def refs() -> dict[str, str]:
    """Map accessible-name → ref from the current interactive snapshot."""
    found: dict[str, str] = {}
    for line in snapshot().splitlines():
        m = REF_LINE.search(line)
        if m and m.group(1) is not None:
            found.setdefault(m.group(1), m.group(2))
    return found


def click_named(needle: str, contains: bool = True) -> bool:
    """Click the first interactive element whose accessible name matches."""
    for name, ref in refs().items():
        if (needle in name) if contains else (name == needle):
            out = run(["click", f"@{ref}"], check=False)
            return "✓" in out
    return False


def eval_js(expr: str) -> str:
    return run(["eval", expr])


def body_text() -> str:
    """document.body.innerText with runs of whitespace collapsed — innerText
    inserts newlines between block elements, so multi-node phrases like
    "1 project in your studio" (count + label in separate elements) would
    otherwise never match."""
    out = run(["eval", "document.body.innerText.replace(/\\s+/g,' ')"])
    return out.strip().strip('"')


def wait_for(expr: str, truthy: str = "true", timeout: float = 12.0) -> bool:
    """Retry a JS expression until its result equals `truthy`."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        out = run(["eval", expr], check=False)
        if out.strip().strip('"') == truthy:
            return True
        time.sleep(0.5)
    return False


def login() -> None:
    run(["open", BASE])
    time.sleep(2)
    body = eval_js("document.body.innerText")
    if "Today in the Studio" in body:
        return  # session already authenticated
    run(["find", "label", "Email", "fill", "demo@artsupplytracker.com"])
    run(["find", "label", "Password", "fill", "StudioDemo2026!"])
    run(["find", "role", "button", "click", "--name", "Sign in"])
    time.sleep(2.5)


def main() -> int:
    global BASE
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default=BASE)
    parser.add_argument("--keep", action="store_true")
    args = parser.parse_args()
    BASE = args.base

    wait_ready()
    print(f"Smoke suite against {BASE}")

    # 1. Login gate ----------------------------------------------------------
    login()
    body = eval_js("document.body.innerText")
    check("sign-in renders the studio", "Today in the Studio" in body)

    # 2. Supply create → post-create list view --------------------------------
    check("supplies tile navigates", click_named("SUPPLIES"))
    time.sleep(1)
    check("add-supply opens the modal", click_named("+ Add Supply"))
    if not wait_for("document.querySelector('#supply-name') ? 'true' : 'false'"):
        bad("supply modal opens with fields")
        return finish()
    ok("supply modal opens with fields")
    run(["find", "label", "Supply Name", "fill", f"{MARK} Supply"])
    run(["find", "label", "Quantity", "fill", "2"])
    run(
        [
            "eval",
            "Array.from(document.querySelectorAll('button[type=submit]'))"
            ".find(b=>b.textContent.includes('Add Supply'))?.click()",
        ]
    )
    if wait_for(
        "Array.from(document.querySelectorAll('main button'))"
        f".some(b=>b.textContent.includes('{MARK}')) && "
        "Array.from(document.querySelectorAll('main button'))"
        ".some(b=>b.textContent.trim()==='Low Stock') ? 'true' : 'false'"
    ):
        ok("post-create view is the supply list")
    else:
        bad("post-create view is the supply list", "expected chip list with filter tabs")

    # 3. Away-and-back → category grid (post-create navigation regression) -----
    click_named("STUDIO TOOLS My Studio")
    time.sleep(1)
    click_named("SUPPLIES")
    if wait_for(
        "Array.from(document.querySelectorAll('main button'))"
        ".some(b=>b.textContent.includes('6 types')) ? 'true' : 'false'",
        timeout=8,
    ):
        ok("supplies re-entry shows the category grid")
    else:
        bad("supplies re-entry shows the category grid", "expected category tiles")

    # 4. Stock filters (via Paint → All Paint list) ----------------------------
    click_named("Paint")  # category tile (name contains count + types)
    if not wait_for(
        "Array.from(document.querySelectorAll('main button'))"
        ".some(b=>b.textContent.includes('All Paint')) ? 'true' : 'false'",
        timeout=8,
    ):
        bad("stock filters", "Paint type tiles did not open")
    else:
        click_named("All Paint")
        if wait_for(
            "Array.from(document.querySelectorAll('main button'))"
            ".some(b=>b.textContent.trim()==='Low Stock') ? 'true' : 'false'",
            timeout=8,
        ):
            click_named("Low Stock", contains=False)
            check(
                "Low Stock filter empty state",
                wait_for(
                    "document.body.innerText.includes('No supplies match this filter.')"
                    " ? 'true' : 'false'"
                ),
            )
            click_named("Out of Stock", contains=False)
            check(
                "Out of Stock filter empty state",
                wait_for(
                    "document.body.innerText.includes('No supplies match this filter.')"
                    " ? 'true' : 'false'"
                ),
            )
            click_named("All", contains=False)
        else:
            bad("stock filters", "All Paint list did not open")

    # 5. Supply chip → detail panel → delete (native confirm) ------------------
    run(["eval", "window.confirm = () => true"])
    run(
        [
            "eval",
            "Array.from(document.querySelectorAll('main button[aria-expanded]'))"
            f".find(b=>b.textContent.includes('{MARK}'))?.click()",
        ]
    )
    check(
        "supply detail panel opens",
        wait_for("document.body.innerText.includes('Edit Supply') ? 'true' : 'false'"),
    )
    run(
        [
            "eval",
            "Array.from(document.querySelectorAll('main section button'))"
            ".find(b=>b.textContent.trim()==='Delete')?.click()",
        ]
    )
    supply_deleted = wait_for(
        f"!document.body.innerText.includes('{MARK}') ? 'true' : 'false'",
        timeout=8,
    )
    if not supply_deleted:
        # Retry once — the first click can land while the panel is still
        # settling (dev-mode latency between render and handlers).
        run(
            [
                "eval",
                "Array.from(document.querySelectorAll('main section button'))"
                ".find(b=>b.textContent.trim()==='Delete')?.click()",
            ]
        )
        supply_deleted = wait_for(
            f"!document.body.innerText.includes('{MARK}') ? 'true' : 'false'",
            timeout=8,
        )
    if not supply_deleted:
        print("      [debug] body excerpt:", body_text()[:400])
    check("supply deleted with native confirm", supply_deleted)

    # 6. Project create → chip panel → delete ---------------------------------
    click_named("PROJECTS")
    time.sleep(1)
    click_named("+ New Project")
    if wait_for("document.querySelector('#project-status') ? 'true' : 'false'"):
        status = eval_js("document.querySelector('#project-status')?.value || 'x'")
        check(
            "project modal defaults to planned",
            status.strip().strip('"').endswith("planned"),
        )
        run(["find", "label", "Project Title", "fill", f"{MARK} Project"])
        run(
            [
                "eval",
                "Array.from(document.querySelectorAll('button[type=submit]'))"
                ".find(b=>b.textContent.includes('Create Project'))?.click()",
            ]
        )
        check(
            "project created (tiles update)",
            wait_for(
                "document.body.innerText.replace(/\\s+/g,' ')"
                ".includes('1 project in your studio')"
                " ? 'true' : 'false'",
                timeout=12,
            ),
        )
    else:
        bad("project modal opens")

    click_named("All Projects")
    run(
        [
            "eval",
            "Array.from(document.querySelectorAll('main button[aria-expanded]'))"
            f".find(b=>b.textContent.includes('{MARK}'))?.click()",
        ]
    )
    check(
        "project detail panel opens",
        wait_for("document.body.innerText.includes('Edit Project') ? 'true' : 'false'"),
    )

    # 6b. Recent Projects rail → sticky focus flow (live focusRequest) -------
    click_named("STUDIO TOOLS My Studio")
    time.sleep(1)
    run(
        [
            "eval",
            "Array.from(document.querySelectorAll('aside button'))"
            f".find(b=>b.textContent.includes('{MARK}'))?.click()",
        ]
    )
    check(
        "recent-project rail opens list + detail panel",
        wait_for(
            "!document.body.innerText.includes('Bodies of work')"
            " && document.body.innerText.includes('Edit Project') ? 'true' : 'false'"
        ),
    )
    # The focus is sticky on the live app: away-and-back re-opens the
    # "All Projects" list with the focused project's panel.
    click_named("STUDIO TOOLS My Studio")
    time.sleep(1)
    click_named("PROJECTS")
    check(
        "sticky focus re-opens list + panel after away-and-back",
        wait_for(
            "!document.body.innerText.includes('Bodies of work')"
            " && document.body.innerText.includes('Edit Project') ? 'true' : 'false'"
        ),
    )

    if not args.keep:
        run(
            [
                "eval",
                "Array.from(document.querySelectorAll('main section button'))"
                ".find(b=>b.textContent.trim()==='Delete')?.click()",
            ]
        )
        check(
            "project deleted with native confirm",
            wait_for(
                f"!document.body.innerText.includes('{MARK}') ? 'true' : 'false'",
                timeout=10,
            ),
        )

    # 7. Inspiration rail + dashboard spotlight navigation ---------------------
    click_named("STUDIO TOOLS My Studio")
    time.sleep(1)
    # The dashboard's Studio Spotlight card navigates to the inspiration
    # Feed (no panel — the live's hardcoded section matches no entry).
    run(
        [
            "eval",
            "Array.from(document.querySelectorAll('main section'))"
            ".find(s=>s.querySelector('h2')?.textContent?.trim()==='Kevin Lewis')"
            "?.click()",
        ]
    )
    check(
        "dashboard spotlight card navigates to the Feed",
        wait_for("document.body.innerText.includes('Inspire Me') ? 'true' : 'false'"),
    )

    # The TODAY IN ART HISTORY rail button expands the art-history panel.
    click_named("STUDIO TOOLS My Studio")
    time.sleep(1)
    run(
        [
            "eval",
            "Array.from(document.querySelectorAll('aside button'))"
            ".find(b=>b.textContent.includes('Today in Art History'))?.click()",
        ]
    )
    check(
        "art-history rail expands its detail panel",
        wait_for("document.body.innerText.includes('Rijksmuseum') ? 'true' : 'false'"),
    )

    # The PARTNERS rail button expands the partner panel; a plain INSPO
    # stat-tile click afterwards travels without a section (no panel).
    click_named("STUDIO TOOLS My Studio")
    time.sleep(1)
    run(
        [
            "eval",
            "Array.from(document.querySelectorAll('aside button'))"
            ".find(b=>b.textContent.includes('Partners'))?.click()",
        ]
    )
    check(
        "partners rail expands its detail panel",
        wait_for("document.body.innerText.includes('Product demos') ? 'true' : 'false'"),
    )
    # A plain INSPO stat-tile re-click while the Feed is open keeps the
    # current panel (the live's section state is per-navigation; a plain
    # navigation carries no section, so the expanded panel is untouched).
    click_named("INSPO")
    check(
        "plain INSPO re-click keeps the open panel (live behavior)",
        wait_for(
            "document.body.innerText.includes('Inspire Me')"
            " && document.body.innerText.includes('Product demos')"
            " ? 'true' : 'false'"
        ),
    )

    # 8. Import/export surface present in every view ---------------------------
    for view, tile in (
        ("dashboard", "STUDIO TOOLS My Studio"),
        ("projects", "PROJECTS"),
        ("supplies", "SUPPLIES"),
    ):
        click_named(tile)
        time.sleep(1)
        body = eval_js("document.body.innerText")
        check(
            f"import/export links on {view}",
            "Import JSON" in body and "Export Data" in body,
        )

    return finish()


def finish() -> int:
    print(f"\n{len(PASS)} passed, {len(FAIL)} failed")
    if FAIL:
        print("Failures:")
        for name in FAIL:
            print(f"  - {name}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
