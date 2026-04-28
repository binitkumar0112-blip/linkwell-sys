from datetime import datetime, timezone
from database.firebase import db
from google.cloud.firestore_v1 import Increment

COLLECTION = "problems"


def create_problem(data: dict, user_id: str) -> dict:
    """Insert a new problem document into Firestore and return it with its id."""
    doc_ref = db.collection(COLLECTION).document()

    problem = {
        **data,
        "id": doc_ref.id,
        "user_id": user_id,
        "status": "open",
        "upvote_count": 0,
        "priority_score": 85,
        "is_public": True,
        "amount_needed": data.get("amount_needed", 0),
        "amount_raised": 0,
        "reportedAt": datetime.now(timezone.utc).isoformat(),
    }

    doc_ref.set(problem)
    return problem


def get_all_problems(locality: str | None = None, limit: int = 50) -> list[dict]:
    """Fetch public problems from Firestore, optionally filtered by locality."""
    query = db.collection(COLLECTION).where("is_public", "==", True)

    if locality:
        query = query.where("locality", "==", locality)

    docs = query.order_by("reportedAt", direction="DESCENDING").limit(limit).stream()
    return [doc.to_dict() for doc in docs]


def upvote_problem(problem_id: str) -> dict:
    """Atomically increment the upvote_count for a problem."""
    ref = db.collection(COLLECTION).document(problem_id)
    ref.update({"upvote_count": Increment(1)})
    return ref.get().to_dict()


def update_problem_status(
    problem_id: str, new_status: str, volunteer_id: str | None = None
) -> dict:
    """Update status (and optionally assign volunteer) for a problem."""
    ref = db.collection(COLLECTION).document(problem_id)
    update_data: dict = {"status": new_status}
    if volunteer_id:
        update_data["assigned_volunteer_id"] = volunteer_id
    ref.update(update_data)
    return ref.get().to_dict()
