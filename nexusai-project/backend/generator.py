import os
from groq import AsyncGroq

GROQ_MODEL = "llama-3.1-8b-instant"

def get_client() -> AsyncGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in environment")
    return AsyncGroq(api_key=api_key)

def build_context(matches: list[dict]) -> str:
    parts = []
    for m in matches:
        text = m.get("metadata", {}).get("text", "")
        if text:
            parts.append(text)
    return "\n\n---\n\n".join(parts)

async def answer_question(question: str, matches: list[dict]) -> str:
    context = build_context(matches)
    client = get_client()
    prompt = f"""You are a helpful study assistant. Answer the student's question using ONLY the context below.
If the answer is not in the context, say "I couldn't find that in your notes."

Context:
{context}

Question: {question}

Answer:"""
    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()

async def generate_flashcards(matches: list[dict]) -> list[dict]:
    context = build_context(matches)
    client = get_client()
    prompt = f"""You are a study assistant. Create exactly 8 flashcards from the content below.
Return ONLY a JSON array with objects having "front" and "back" keys. No extra text, no markdown.

Content:
{context}

JSON array:"""
    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1200,
        temperature=0.4,
    )
    import json, re
    text = response.choices[0].message.content.strip()
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)

async def generate_quiz(matches: list[dict]) -> list[dict]:
    context = build_context(matches)
    client = get_client()
    prompt = f"""You are a study assistant. Create exactly 5 multiple-choice questions from the content below.
Return ONLY a JSON array. Each object must have:
- "question": string
- "options": array of 4 strings labeled A, B, C, D
- "answer": string (the correct option letter, e.g. "A")
- "explanation": string (brief explanation)

No extra text, no markdown.

Content:
{context}

JSON array:"""
    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.4,
    )
    import json, re
    text = response.choices[0].message.content.strip()
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)

async def generate_summary(matches: list[dict]) -> str:
    context = build_context(matches)
    client = get_client()
    prompt = f"""You are a study assistant. Write a clear, well-structured summary of the content below.
Use markdown with headers (##) and bullet points where appropriate.
Keep it concise but comprehensive. Include key concepts, definitions, and important points.

Content:
{context}

Summary:"""
    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()