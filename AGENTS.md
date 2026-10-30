<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Image makeovers stream through the server route `src/routes/api/makeover.ts` (multipart in, SSE out); prompts are built server-side from `src/lib/makeover.ts` so the browser never controls the model instruction.
- Cost estimates use a `createServerFn` in `src/lib/cost.functions.ts` that lazy-imports `cost.server.ts`; keeps the AI key and SDK out of the client bundle.
- The uploaded original photo is never sent or altered directly: the client uploads a resized copy (`src/lib/image-prep.ts`) and refinements use the latest result, so "Before" always shows the untouched original.
- No accounts or database: all state lives in the page for the session.
