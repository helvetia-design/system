#!/usr/bin/env python3
"""Reads a downloaded Playwright HTML report (from ds-ci-report) and approves screenshot diffs.

  review.py list <reportDir>                 failing screenshots grouped by component (JSON)
  review.py approve <reportDir> <testId>...  copy CI `actual` PNGs over the repo baselines
"""
import base64, io, json, re, shutil, sys, zipfile
from pathlib import Path

CORE = Path(__file__).resolve().parents[3] / "packages" / "core"
DESKTOP = "🖼️-Visual-💻-Desktop-Chrome"  # SSR compares against the desktop visual baseline


def sanitize(name):  # Playwright's sanitizeForFilePath
    return re.sub(r"[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+", "-", name)


def failures(report_dir):
    html = (report_dir / "index.html").read_text()
    blob = re.search(r"data:application/zip;base64,([A-Za-z0-9+/=]+)", html).group(1)
    z = zipfile.ZipFile(io.BytesIO(base64.b64decode(blob)))
    for name in z.namelist():
        if name == "report.json":
            continue
        file = json.loads(z.read(name))
        test_file = CORE / file["fileName"]
        for t in file["tests"]:
            if t["outcome"] != "unexpected":
                continue
            res = t["results"][-1]
            ssr = "SSR" in t["projectName"]
            ratio = re.search(r"ratio ([\d.]+)", "".join(e.get("message", "") for e in res.get("errors", [])))
            for a in res["attachments"]:
                if not a["name"].endswith("-expected.png"):
                    continue
                arg = a["name"][: -len("-expected.png")]
                actual = next(x for x in res["attachments"] if x["name"] == f"{arg}-actual.png")
                diff = next((x for x in res["attachments"] if x["name"] == f"{arg}-diff.png"), None)
                if ssr:
                    baseline = test_file.parent / f"{arg}-{DESKTOP}-linux.png"
                else:
                    baseline = test_file.parent / f"{test_file.name}-snapshots" / f"{arg}-{sanitize(t['projectName'])}-linux.png"
                yield {
                    "component": file["fileName"].split("/")[-3],
                    "testId": t["testId"],
                    "test": " › ".join(t["path"] + [t["title"]]),
                    "project": t["projectName"],
                    "ssr": ssr,
                    "ratio": ratio and float(ratio.group(1)),
                    "expected": str(report_dir / a["path"]),
                    "actual": str(report_dir / actual["path"]),
                    "diff": diff and str(report_dir / diff["path"]),
                    "baseline": str(baseline.relative_to(CORE.parents[1])),
                }


def cmd_list(report_dir):
    items = list(failures(report_dir))
    approvable = {i["baseline"] for i in items if not i["ssr"]}
    groups = {}
    for i in items:
        # SSR-only diff: the client render matches, so approving would break the desktop test
        i["approvable"] = not i["ssr"]
        i["resolvedByDesktop"] = i["ssr"] and i["baseline"] in approvable
        groups.setdefault(i["component"], []).append(i)
    print(json.dumps(dict(sorted(groups.items())), indent=1, ensure_ascii=False))


def cmd_approve(report_dir, test_ids):
    root = CORE.parents[1]
    for i in failures(report_dir):
        if i["testId"] not in test_ids:
            continue
        label = f"{i['baseline']}"
        baseline = root / i["baseline"]
        if i["ssr"]:
            print(f"SKIP ssr (fix or approve the desktop snapshot): {label}")
        elif not baseline.exists():
            print(f"SKIP baseline missing: {label}")
        elif baseline.read_bytes() == Path(i["actual"]).read_bytes():
            print(f"ALREADY approved: {label}")
        elif baseline.read_bytes() != Path(i["expected"]).read_bytes():
            print(f"SKIP stale (baseline changed since this run): {label}")
        else:
            shutil.copyfile(i["actual"], baseline)
            print(f"APPROVED {label}")


if __name__ == "__main__":
    cmd, report = sys.argv[1], Path(sys.argv[2]).resolve()
    cmd_list(report) if cmd == "list" else cmd_approve(report, set(sys.argv[3:]))
