import os

from convex import ConvexClient

_client: ConvexClient | None = None


def get_convex() -> ConvexClient:
    global _client
    if _client is None:
        url = os.environ["CONVEX_URL"]
        _client = ConvexClient(url)
    return _client
