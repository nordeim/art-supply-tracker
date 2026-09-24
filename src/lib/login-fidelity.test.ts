/**
 * Login + header chrome fidelity — r8 file-content pins.
 *
 * Why a file-content test (the design-tokens pattern): the login screen and
 * the shell header are pure JSX whose parity contract lives in their class
 * strings and copy. The live app's Amplify authenticator renders geometry
 * that was measured DOM-side on 2026-09-17 (both apps at 1920x1080 and
 * 390x844, post-hydration — the live renders DIFFERENT pre-hydration
 * markup, so steady-state measurements are the only ground truth):
 *
 * - Header logo: `h-10 md:h-12 lg:h-14 w-auto max-w-[320px] object-contain`
 *   with the file's INTRINSIC dimensions passed to next/image (an inline
 *   `height:auto` style defeats the classes and rendered the logo 320x81
 *   at every viewport — the r8 bug; live hydrated renders 222x56 desktop /
 *   159x40 mobile, making the header 88px tall, and w-auto must resolve
 *   against the file's true 1068x269 aspect).
 * - Login card (Amplify geometry, all measured): centered in the 1fr grid
 *   column (mx-auto → 46px inset at 1920), zero card padding with the form
 *   carrying it (mt-3 px-8 pt-8 pb-8) plus a 12px card tail (pb-3), the
 *   soft shadow `0 2px 6px rgba(13, 26, 38, 0.15)`, equal-width 50px tabs
 *   at text-base/700, the password eye OUTSIDE the input as a 50px
 *   sibling, the 16px/700 submit, and the content-width 35px #047d95
 *   "Forgot your password?" link (r9: the 51px full-width pin was a
 *   pre-hydration artifact).
 * - Signup: Email + Password + Confirm Password (the live's Cognito form —
 *   "Please confirm your Password" placeholder + a second eye toggle; no
 *   Display-name field).
 * - Forgot: switches the card to the Reset Password view (the live's
 *   Amplify flow: "Reset Password" heading in the dark #0d1a26-on-#120724
 *   quirk at 32px/500, "Enter your email" label, pink "Send code", teal
 *   "Back to Sign In", tabs hidden, form px-8 pt-8 pb-5 with no mt-3)
 *   instead of an inline notice. "Send code" with a valid email then swaps
 *   to the live's CONFIRMATION view (Code * / New Password / Confirm
 *   Password / Submit / Resend Code — r9; no mailer exists, so no code can
 *   ever be valid and Submit answers with the live's invalid-code alert).
 * - Sign-in error: the live's exact Amplify copy "Incorrect username or
 *   password." in the pale-pink alert box (#FCE9E9, warning icon, dismiss
 *   button — r9) at 16px #660000, not a bare paragraph.
 * - The Artist-Opportunities badge card carries no visible shadow (the
 *   live's computed box-shadow parts are all transparent).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const login = readFileSync(join(libDir, "../components/studio/login-screen.tsx"), "utf8");
const shell = readFileSync(join(libDir, "../components/studio/studio-app.tsx"), "utf8");
const auth = readFileSync(join(libDir, "../actions/auth.ts"), "utf8");
const validation = readFileSync(join(libDir, "validation.ts"), "utf8");

describe("header logo (live hydrated classes, no inline style)", () => {
  it("pins the live's responsive logo class set", () => {
    expect(shell).toContain('className="h-10 md:h-12 lg:h-14 w-auto max-w-[320px] object-contain"');
  });

  it("does not defeat the classes with an inline style", () => {
    expect(shell).not.toContain('style={{ height: "auto", width: "auto", maxWidth: "320px" }}');
  });

  it("passes the file's intrinsic dimensions so w-auto keeps the live aspect", () => {
    expect(shell).toMatch(/width=\{1068\}\s*height=\{269\}/);
  });
});

describe("login marketing column (live contiguous spacing)", () => {
  it("renders the h1 at the live's responsive leading (1.25 mobile, 1.0 md+)", () => {
    // Measured on the live DOM: mobile 36px font / 45px line-height (1.25 —
    // the h1 wraps to 2×45=90px); desktop 48px / 48px (leading-none, 2×48=96).
    // A bare leading-none rendered 2×36=72px on mobile and sat the card
    // 18px higher than the live.
    expect(login).toMatch(/<h1[^>]*leading-\[1\.25\][^>]*md:leading-none/);
  });

  it("keeps the marketing stack contiguous (no mt- gaps on h1/description)", () => {
    expect(login).not.toMatch(/<h1[^>]*\bmt-3\b/);
    expect(login).not.toMatch(/text-lg text-\[#DCC7FF\][^>]*\bmt-4\b/);
    expect(login).not.toMatch(/text-sm text-\[#DCC7FF\][^>]*\bmt-4\b/);
  });

  it("does not shadow the Artist-Opportunities badge (live shadow is transparent)", () => {
    expect(login).not.toMatch(/Artist Opportunities[\s\S]{0,200}shadow-lg/);
  });
});

describe("login card chrome (live Amplify geometry)", () => {
  it("centers the card in the grid column and carries the soft shadow", () => {
    expect(login).toContain("mx-auto");
    expect(login).toContain("shadow-[0_2px_6px_rgba(13,26,38,0.15)]");
  });

  it("gives the card zero padding — the form carries it (Amplify)", () => {
    expect(login).toContain("bg-[#120724] shadow-[0_2px_6px_rgba(13,26,38,0.15)]");
    expect(login).not.toContain("bg-[#120724] p-6");
  });

  it("pads the auth form like the live (mt-3 px-8 pt-8 pb-8) with a 12px card tail", () => {
    expect(login).toMatch(/<form[^>]*className="[^"]*mt-3[^"]*px-8[^"]*pt-8[^"]*pb-8[^"]*"/);
    expect(login).toMatch(/pb-3"/);
  });

  it("renders equal-width 50px text-base tabs", () => {
    expect(login).toMatch(/h-\[50px\] flex-1/);
    expect(login).toMatch(/role="tab"[\s\S]{0,400}?text-base font-bold/);
  });

  it("renders the password eye as a 50px sibling OUTSIDE the input", () => {
    expect(login).toMatch(/w-\[50px\]/);
    expect(login).not.toContain("absolute inset-y-0 right-0");
  });

  it("renders the eye icon in the live's dark #0d1a26 (near-invisible quirk)", () => {
    // Measured on the live DOM: the Amplify show-password button computes
    // color rgb(13,26,38) on the #120724 card — the icon is almost invisible
    // at rest. The gray #89949b rendering made the clone's eye stand out.
    expect(login).toMatch(/w-\[50px\][^>]*text-\[#0d1a26\]/);
    expect(login).not.toMatch(/w-\[50px\][^>]*text-\[#89949b\]/);
  });

  it("uses the live's exact input grays and the invisible-typing quirk", () => {
    // Measured on the live DOM: input borders rgb(137,148,159) = #89949f
    // (the clone's #89949b was 4 blue-channel units off), placeholder
    // rgb(156,163,175) = #9ca3af (Tailwind gray-400 at full opacity, not a
    // 70% blend), and TYPED text rgb(13,26,38) = #0d1a26 — effectively
    // invisible on the #120724 card, the live's Amplify-on-dark quirk
    // (pixel-verified by typing into the live's field). The clone keeps its
    // focus ring (documented a11y hardening; the live has none). */
    expect(login).toMatch(/border border-\[#89949f\] bg-transparent px-3 text-sm text-\[#0d1a26\] placeholder:text-\[#9ca3af\]/);
    expect(login).not.toContain("#89949b");
  });

  it("gives the eye the live's input-segment chrome", () => {
    // The live's eye is the right segment of the Amplify input group:
    // 1px #89949b on top/right/bottom (transparent left, shared seam with
    // the input), right corners rounded 4px — measured radius
    // `0px 4px 4px 0px` on the live button.
    expect(login).toMatch(
      /w-\[50px\][^>]*rounded-r-\[4px\] border-y border-r border-\[#89949f\]/,
    );
  });

  it("rounds the password input on the left only (the eye caps the right)", () => {
    // Live password input radius is `4px 0px 0px 4px` — the eye continues
    // the group's border to the right.
    expect(login).toMatch(/rounded-l-\[4px\] border border-\[#89949f\]/);
  });

  it("renders the live's 2px tab-strip top border (gray, turquoise active)", () => {
    // Measured on the live DOM: the active tab carries a 2px #2ec4b6 top
    // border that OVERLAYS the tablist's gray border (pixel-verified:
    // y=465-466 turquoise under Sign In, gray under Create Account, 3px
    // stack with the card's purple border — not 4px stacked). Each tab
    // therefore owns a border-t-2; the list itself carries none.
    expect(login).not.toMatch(/role="tablist"[\s\S]{0,120}?border-t-2/);
    expect(login).toMatch(/justify-center border-t-2 text-base/);
    expect(login).toMatch(/mode === "signin"[\s\S]{0,300}?"border-\[#2ec4b6\]/);
    expect(login).toMatch(/"border-\[#dcdee0\] text-\[#304050\]/);
  });

  it("renders the submit at the live's 16px/700", () => {
    expect(login).toMatch(/h-\[42px\] w-full[^>]*text-base font-bold/);
  });

  it("renders the forgot link at the live's 35px content-width teal block", () => {
    // Measured post-hydration on the live: 182x35 at (643,797), centered —
    // the r8 pin (51px full-width) was a pre-hydration artifact.
    expect(login).not.toContain("h-[51px]");
    expect(login).toMatch(/h-\[35px\][^>]*text-\[#047d95\]/);
  });
});

describe("signup form shape (live Cognito: no display name)", () => {
  it("asks for Confirm Password with the live's placeholder", () => {
    expect(login).toContain("Confirm Password");
    expect(login).toContain("Please confirm your Password");
  });

  it("does not render a Display name field", () => {
    expect(login).not.toContain('htmlFor="displayName"');
    expect(login).not.toContain("Your artist name");
  });
});

describe("reset password view (live Amplify forgot flow)", () => {
  it("switches the card to the Reset Password view on forgot", () => {
    expect(login).toContain("Reset Password");
    expect(login).toContain("Enter your email");
    expect(login).toContain("Send code");
    expect(login).toContain("Back to Sign In");
  });

  it("keeps the live's dark-on-dark heading quirk (#0d1a26 on #120724)", () => {
    expect(login).toContain("text-[#0d1a26]");
  });

  it("pads the reset form like the live (no tabs, px-8 pt-8 pb-5)", () => {
    expect(login).toMatch(/<form[^>]*className="[^"]*px-8[^"]*pt-8[^"]*pb-5[^"]*"/);
  });

  it("transitions to the confirmation view on Send code (no static notice)", () => {
    // The live never shows a support notice — a valid email swaps the card
    // to the Code/New Password confirmation view (r9).
    expect(login).not.toContain("support@artsupplytracker.com");
    expect(login).toContain("Resend Code");
  });
});

describe("sign-in error copy (live Amplify)", () => {
  it("returns the live's exact error text", () => {
    expect(auth).toContain("Incorrect username or password.");
    expect(auth).not.toContain("Incorrect email or password.");
  });

  it("renders the error in the live's #660000 at 16px", () => {
    expect(login).toMatch(/role="alert"[\s\S]{0,600}text-base text-\[#660000\]/);
  });
});

/**
 * r9 error-state fidelity — the live's error chrome, measured post-hydration
 * on 2026-09-17 (every value DOM-verified against the deployed app):
 *
 * - SERVER auth errors (bad credentials, duplicate email, invalid code)
 *   render as the Amplify ALERT BOX: div[role=alert], flex row, items-center,
 *   16px gap, px-4 py-3, bg #FCE9E9 (rgb 252,233,233), full form width, NO
 *   border-radius, content-driven height (58px one line, 72px two — the 34px
 *   dismiss button + 24px v-padding sets the floor). A 24x24 warning icon
 *   (exact Material "error" path, #660000) leads; the text (16px/400 #660000)
 *   sits in a flex:1 wrapper; a 50x34 "Dismiss alert" button (transparent bg,
 *   1px transparent border, radius 4px, fw 700, 16px X icon) closes it and
 *   restores the no-error layout — the centered card re-settles.
 * - CLIENT validation errors stay inline: the signup password-policy stack
 *   (contiguous 24px lines right after the Password field, one per violated
 *   Cognito rule) and "Your passwords must match" after Confirm.
 * - The live's auth forms rely on NATIVE validation (no noValidate; password
 *   inputs carry `required` only — no min/maxLength attributes — so empty and
 *   malformed-email submissions are browser-blocked exactly like the live).
 * - The link buttons are CONTENT-WIDTH 35px centered, not full-width:
 *   Forgot 182px, Back to Sign In 127px, Resend Code 115px (all measured).
 */
describe("Amplify error alert chrome (r9)", () => {
  it("renders server errors in the live's pale-pink alert box", () => {
    expect(login).toMatch(
      /role="alert"[^>]*className="[^"]*flex items-center gap-4[^"]*bg-\[#FCE9E9\][^"]*px-4 py-3/,
    );
  });

  it("carries the live's exact warning-icon path (#660000, 24px)", () => {
    expect(login).toContain(
      'd="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"',
    );
  });

  it("carries the dismiss button with the live's X-icon path", () => {
    expect(login).toContain('aria-label="Dismiss alert"');
    expect(login).toContain(
      'd="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"',
    );
  });

  it("sizes the dismiss button like the live (50x34, transparent, radius 4)", () => {
    expect(login).toMatch(/h-\[34px\][^>]*rounded-\[4px\]/);
  });

  it("wraps the alert text in the flex:1 body like the live", () => {
    expect(login).toMatch(/flex-1[\s\S]{0,120}text-base text-\[#660000\]/);
  });
});

describe("signup password-policy stack (live Cognito rules, r9)", () => {
  it("carries every rule text the live shows, byte-for-byte", () => {
    // The rule texts live in validation.ts (passwordPolicyViolations — the
    // single source rendered by the login screen's policy stack).
    expect(validation).toContain("Password must have at least 8 characters");
    expect(validation).toContain("Password must have upper case letters");
    expect(validation).toContain("Password must have lower case letters");
    expect(validation).toContain("Password must have numbers");
    expect(validation).toContain("Password must have special characters");
  });

  it("stacks the policy lines contiguously after the Password field", () => {
    // The live renders the violated rules as back-to-back 24px lines (no
    // vertical gap — 651/675/699/723 measured) directly after the Password
    // field group, BEFORE the Confirm Password label.
    expect(login).toMatch(
      /id="password"[\s\S]{0,1100}?policyErrors\.map[\s\S]{0,900}?id="confirmPassword"/,
    );
    expect(login).toMatch(
      /policyErrors\.map[\s\S]{0,200}?text-base text-\[#660000\]/,
    );
  });
});

describe("native form validation (live has no noValidate, r9)", () => {
  it("does not suppress the browser's required/email validation", () => {
    expect(login).not.toContain("noValidate");
  });

  it("keeps the password inputs at required-only (no min/maxLength attrs)", () => {
    // The live's password inputs carry NO minLength/maxLength (policy is
    // client-JS + server); browser blocking covers empty fields only.
    expect(login).not.toMatch(/minLength=\{\d+\}/);
    expect(login).not.toMatch(/maxLength=\{128\}/);
  });
});

describe("reset-password confirmation flow (live Amplify, r9)", () => {
  it("renders the confirmation view the live shows after Send code", () => {
    expect(login).toContain("Code *");
    expect(login).toContain("New Password");
    expect(login).toContain("Resend Code");
    expect(login).toContain("Submit");
  });

  it("carries the live's invalid-code alert copy", () => {
    expect(login).toContain("Invalid verification code provided, please try again.");
  });

  it("renders the mismatch copy in the confirmation view too", () => {
    expect(login).toContain("Your passwords must match");
  });

  it("no longer surfaces the static support notice (the live never shows it)", () => {
    expect(login).not.toContain("Password reset is not configured");
    expect(login).not.toContain("support@artsupplytracker.com");
  });
});

describe("link buttons are content-width and centered (live 35px, r9)", () => {
  it("renders Forgot as a 35px content-width centered link", () => {
    expect(login).not.toContain("h-[51px]");
    expect(login).toMatch(/h-\[35px\][^>]*text-\[#047d95\]/);
    expect(login).toMatch(/justify-center[\s\S]{0,300}?Forgot your password\?/);
  });

  it("centers Back to Sign In and Resend Code as content-width links", () => {
    expect(login).toMatch(/justify-center[\s\S]{0,400}?Back to Sign In/);
    expect(login).toMatch(/justify-center[\s\S]{0,400}?Resend Code/);
  });
});

describe("duplicate-email signup copy (live Amplify, r9)", () => {
  it("returns the live's exact Cognito text", () => {
    expect(auth).toContain('"User already exists"');
    expect(auth).not.toContain("An account with this email already exists.");
  });
});

describe("mobile chat drawer (live class parity)", () => {
  it("does not theme the chat drawer's scrollbar (the live's is unstyled)", () => {
    expect(shell).not.toMatch(
      /Community chat[\s\S]{0,400}scrollbar-right/,
    );
  });
});

describe("auth-success scroll reset (r24 — the live's view-swap semantic)", () => {
  // The live's SPA swaps the login view for the dashboard when auth
  // succeeds and the document scroll lands at top; the clone's
  // router.refresh() re-renders in place and the browser otherwise
  // PRESERVES the pre-submit offset. Measured on BOTH engines
  // (WebKit 390x844: pre 201 -> live 0 / clone 201; Chromium with a
  // forced 300px wheel: pre 128 -> live 0 / clone 128) — reachable
  // whenever the mobile login card exceeds the viewport (WebKit
  // metrics: the submit lands at y=851 against the 844 fold; Chromium
  // keeps it at 778, which is why the r23 battery never saw it).
  it("resets the window scroll when auth succeeds", () => {
    expect(login).toMatch(/if \(result\.ok\) \{[\s\S]{0,600}window\.scrollTo\(0, 0\)/);
  });
});
