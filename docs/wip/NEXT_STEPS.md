# Next steps (paused 2026-10-13 ~00:40 CDT; due today 5:30 PM CDT)

Live now: https://esa-telemetry-dbs.vercel.app (hub, research, 3 mood boards, 3 design systems,
3 candidate versions, final /telemetry, /decisions). Everything committed up to `ba6a7b8` + docs is deployed.

1. **Final independent verification of /telemetry** (paused partway). Its 2 uncommitted edits to
   src/app/telemetry/{figures,site}.tsx are still in the working tree, with a copy in
   `docs/wip/final-verifier-partial.patch`. Resume the verifier, or start a fresh one with the brief in
   the session scratchpad (`verify-final`). Still to run: WebKit + Firefox, the full tour, performance (LCP/CLS),
   the recruiter/peer tests, then fixes.
2. Add a DESIGN_LOG entry "The 9 design requirements: what we did, why, evidence" for the final site
   (the builder's text is ready in the session; update it with the verifier's numbers). It renders on /decisions.
3. Final matrix pass on / and /telemetry; commit; deploy from a clean worktree (`git worktree add --detach`).
4. Optional (the user, at a computer): Vercel → Account Settings → Authentication → connect GitHub, then
   `vercel git connect` so pushes auto-deploy.
5. Submit in Google Classroom: the Vercel URL + https://github.com/hewittw/esa-telemetry-dbs
