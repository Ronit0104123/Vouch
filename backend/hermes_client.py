import json
import os
import re
import subprocess

STRUCTURE_PROMPT = """You are the structuring step for Vouch, a portable work-history record for developers.
This output becomes a permanent part of someone's professional record and is shown to future employers,
so it must be accurate and grounded only in what the reviewer actually wrote — never invent or embellish.

Given a manager's free-text comment about a developer, return ONLY one JSON object, nothing else:
{{"ratings":{{"technical":1-5,"ownership":1-5,"collaboration":1-5,"delivery":1-5,
"communication":1-5,"growth":1-5}},"summary":"checklist","integrityConcern":true|false}}

Rules:
- Rate each dimension 1-5 based only on evidence in the comment. If a dimension isn't addressed at all,
  use 3 (neutral) rather than guessing a specific reason.
- "summary" is a short checklist for a busy hiring manager: 2-5 lines, each starting with "- ", each one
  a single concrete point traceable to something the reviewer actually said (strengths and concerns alike).
  Plain text only inside the JSON string — no nested markdown, no headers.
- "integrityConcern" is true only if the comment itself describes dishonesty, policy violation, or similar —
  not merely a negative review.
- Output must be exactly one JSON object: starts with {{, ends with }}, no markdown code fences, no preamble,
  no trailing commentary, no text before or after it.

Manager's comment:
\"\"\"{comment}\"\"\"
"""

# "openai-api" is Hermes Agent's provider id for a plain OpenAI API key (as
# opposed to an OAuth-backed subscription provider) — it resolves the key
# straight from the OPENAI_API_KEY env var, so this runs non-interactively
# with no ~/.hermes login/config needed on a fresh container.
HERMES_PROVIDER = "openai-api"


def _extract_json(text: str) -> dict:
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()
    return json.loads(text)


def structure_review(raw_comment: str) -> dict:
    prompt = STRUCTURE_PROMPT.format(comment=raw_comment)
    model = os.environ.get("HERMES_MODEL", "gpt-5.6-sol")

    result = subprocess.run(
        ["hermes", "-z", prompt, "--provider", HERMES_PROVIDER, "-m", model],
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
