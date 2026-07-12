import os

from dodopayments import DodoPayments

_client: DodoPayments | None = None


def get_dodo() -> DodoPayments:
    global _client
    if _client is None:
        _client = DodoPayments(
            bearer_token=os.environ["DODO_PAYMENTS_API_KEY"],
            webhook_key=os.environ.get("DODO_PAYMENTS_WEBHOOK_SECRET"),
            environment=os.environ.get("DODO_ENVIRONMENT", "test_mode"),
        )
    return _client
