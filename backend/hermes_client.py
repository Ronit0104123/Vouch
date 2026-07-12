import json
import re
import subprocess

STRUCTURE_PROMPT = """You are a structured review extractor. Given a manager's free-text comment about a
developer, return ONLY valid JSON:
{{"ratings":{{"technical":1-5,"ownership":1-5,"collaboration":1-5,"delivery":1-5,
"communication":1-5,"growth":1-5}},"summary":"one professional sentence",
"integrityConcern":true|false}}
No preamble, no markdown.

Manager's comment:
\"\"\"{comment}\"\"\"
"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()
    return json.loads(text)


def structure_review(raw_comment: str) -> dict:
    prompt = STRUCTURE_PROMPT.format(comment=raw_comment)
    result = subprocess.run(
        ["hermes", "-z", prompt],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"hermes oneshot failed: {result.stderr.strip()}")

    data = _extract_json(result.stdout)

    ratings = data["ratings"]
    for key in ("technical", "ownership", "collaboration", "delivery", "communication", "growth"):
        ratings[key] = max(1, min(5, int(ratings[key])))

    return {
        "ratings": ratings,
        "summary": str(data["summary"]),
        "integrityConcern": bool(data["integrityConcern"]),
    }
