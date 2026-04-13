from endee import Endee, Precision

ENDEE_BASE = "http://localhost:8080/api/v1"
INDEX_NAME = "nexusai"
DIMENSION = 384

client = Endee()
client.set_base_url(ENDEE_BASE)


def ensure_index():
    """Create the index if it doesn't exist."""
    try:
        existing = client.list_indexes()
        names = [idx["name"] for idx in existing]
        if INDEX_NAME in names:
            return {"status": "exists"}
    except Exception:
        pass
    try:
        client.create_index(
            name=INDEX_NAME,
            dimension=DIMENSION,
            space_type="cosine",
            precision=Precision.INT8
        )
        print(f"✅ Index '{INDEX_NAME}' created")
        return {"status": "created"}
    except Exception as e:
        print(f"❌ Index creation failed: {e}")
        return {"status": "error", "message": str(e)}


def get_or_create_index():
    """Always ensure index exists before operations."""
    ensure_index()
    return client.get_index(name=INDEX_NAME)


def upsert_vectors(vectors: list[dict]):
    index = get_or_create_index()
    batch = []
    for v in vectors:
        batch.append({
            "id": v["id"],
            "vector": v["vector"],
            "meta": v.get("metadata", {}),
            "filter": v.get("filter", {})
        })
        if len(batch) == 100:
            index.upsert(batch)
            batch = []
    if batch:
        index.upsert(batch)
    return {"status": "upserted", "count": len(vectors)}


def query_vectors(query_vector: list[float], top_k: int = 5) -> list[dict]:
    index = get_or_create_index()
    results = index.query(
        vector=query_vector,
        top_k=top_k,
        ef=128,
        include_vectors=False
    )
    return [{"id": r["id"], "metadata": r.get("meta", {}), "score": r.get("similarity", 0)} for r in results]


def delete_all_vectors():
    try:
        client.delete_index(name=INDEX_NAME)
    except Exception:
        pass
    ensure_index()
    return {"status": "reset"}