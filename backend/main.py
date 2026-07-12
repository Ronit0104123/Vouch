import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from hermes_client import structure_review
from dodo_client import get_dodo
from convex_client import get_convex

app = FastAPI(title="Vouch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


class StructureReviewRequest(BaseModel):
    rawComment: str


@app.post("/structure-review")
def structure_review_endpoint(body: StructureReviewRequest):
    try:
        return structure_review(body.rawComment)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Hermes structuring failed: {e}")


class SubscribeRequest(BaseModel):
    userId: str
    email: str
    companyName: str


@app.post("/subscribe")
def create_subscription_checkout(body: SubscribeRequest):
    product_id = os.environ["DODO_SUBSCRIPTION_PRODUCT_ID"]
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    try:
        session = get_dodo().checkout_sessions.create(
            product_cart=[{"product_id": product_id, "quantity": 1}],
            customer={"email": body.email, "name": body.companyName},
            return_url=f"{frontend_url}/start-trial?checkout=1",
            metadata={"userId": body.userId},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Dodo checkout failed: {e}")

    return {"checkoutUrl": session.checkout_url}


# Subscription lifecycle events that grant access.
_ACTIVE_SUBSCRIPTION_EVENTS = {"subscription.active", "subscription.renewed"}
# Subscription lifecycle events that revoke access.
_INACTIVE_SUBSCRIPTION_EVENTS = {
    "subscription.cancelled",
    "subscription.expired",
    "subscription.failed",
    "subscription.on_hold",
}


@app.post("/webhook/dodo")
async def dodo_webhook(
    request: Request,
    webhook_id: str = Header(None, alias="webhook-id"),
    webhook_signature: str = Header(None, alias="webhook-signature"),
    webhook_timestamp: str = Header(None, alias="webhook-timestamp"),
):
    payload = await request.body()

    try:
        event = get_dodo().webhooks.unwrap(
            payload.decode(),
            headers={
                "webhook-id": webhook_id,
                "webhook-signature": webhook_signature,
                "webhook-timestamp": webhook_timestamp,
            },
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    if event.type in _ACTIVE_SUBSCRIPTION_EVENTS or event.type in _INACTIVE_SUBSCRIPTION_EVENTS:
        user_id = event.data.metadata.get("userId")
        if user_id:
            status = "active" if event.type in _ACTIVE_SUBSCRIPTION_EVENTS else "cancelled"
            get_convex().action(
                "users:confirmSubscription",
                {
                    "userId": user_id,
                    "status": status,
                    "dodoSubscriptionId": event.data.subscription_id,
                    "secret": os.environ["WEBHOOK_SHARED_SECRET"],
                },
            )

    return {"status": "received"}
