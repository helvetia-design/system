# Upstream

`upstream/` is a byte-identical copy of `skills/draw-icons` from
https://github.com/ronykax/skills, licensed Apache-2.0 (`LICENSE`, `NOTICE` here are the repo's own).

- Commit: `4b64f8f38b381441d3cb3eb437efebcffff52f80` (2026-11-25)
- Vendored: 2026-11-26

## Update

```bash
SHA=$(gh api repos/ronykax/skills/commits/HEAD --jq .sha)
D=.claude/skills/ds-draw-icons
rm -rf $D/upstream
for p in $(gh api "repos/ronykax/skills/git/trees/$SHA?recursive=1" --jq '.tree[] | select(.type=="blob") | .path' | grep -E '^(skills/draw-icons/|LICENSE$|NOTICE$)'); do
  case $p in skills/draw-icons/*) out=$D/upstream/${p#skills/draw-icons/};; *) out=$D/$p;; esac
  mkdir -p "$(dirname "$out")"
  gh api -H "Accept: application/vnd.github.raw" "repos/ronykax/skills/contents/$p?ref=$SHA" > "$out"
done
```

Then update the SHA and dates above, `git diff` the result, reinstall
(`npm install --prefix $D/upstream/scripts`), and check that `SKILL.md`'s overrides still fit
(CLI flags, build output shape that `scripts/flatten.mjs` parses). Never patch `upstream/` by hand.
