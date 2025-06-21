import uuid
from pathlib import Path

from fastapi import FastAPI, Query

app = FastAPI()

from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import List, Annotated

from datetime import datetime

client = AsyncOpenAI()
SESSIONS = {}


# Openai thing seems to now allow just putting list[T] in the type hint
class ArticulateCardsList(BaseModel):
    cards: List['ArticulateCard']


class ArticulateCard(BaseModel):
    person: str
    world: str
    object: str
    action: str
    nature: str


current_file = Path(__file__).resolve()
prompt_path = current_file.parent.parent / "prompt.md"

with open(prompt_path, "r") as file:
    prompt = file.read().strip()


async def create_messages(
        themes: list[str],
        birth_years: list[int],
        already_played_cards: list[ArticulateCard] = None,
        count: int = 10) -> list[ArticulateCard]:
    if already_played_cards is None:
        already_played_cards = []

    response = await client.responses.parse(
        model="gpt-4o",
        input=[  # type: ignore  # IDK why it's complaining about this
            {
                "role": "system",
                "content": prompt
            },
            {
                "role": "user",
                "content":
                    f"Generate {count} articulate cards with the themes: {themes} "
                    f"for players born in {birth_years}. "
                    f"Each card should be unique and not include any previously played cards: {already_played_cards}.",
            }
        ],
        text_format=ArticulateCardsList,
    )

    return response.output_parsed.cards


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}


class Session(BaseModel):
    session_id: str
    created_at: datetime
    themes: list[str]
    birth_years: list[int]
    already_played_cards: list[ArticulateCard] = []


@app.post("/sessions")
async def create_session(
        themes: list[str],
        birth_years: list[int]
) -> Session:
    session = Session(
        session_id=str(uuid.uuid4()),
        created_at=datetime.now(),
        themes=themes,
        birth_years=birth_years,
    )

    SESSIONS[session.session_id] = session

    return session


@app.get("/sessions/{session_id}/cards")
async def get_cards(
        session_id: str,
        count: int = 10
) -> list[ArticulateCard]:
    if session_id not in SESSIONS:
        raise ValueError("Session not found")

    session = SESSIONS[session_id]

    cards = await create_messages(session.themes, session.birth_years, session.already_played_cards, count)
    session.already_played_cards.extend(cards)

    return cards
