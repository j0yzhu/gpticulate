import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware, # type: ignore
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import List, Annotated

from datetime import datetime

client = AsyncOpenAI()
SESSIONS = {}


# Openai thing seems to now allow just putting list[T] in the type hint
class ArticulateCardsList(BaseModel):
    person: List[str]
    world: List[str]
    object: List[str]
    action: List[str]
    nature: List[str]
    random: List[str]


class ArticulateCard(BaseModel):
    person: str
    world: str
    object: str
    action: str
    nature: str
    random: str


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
                    f"Each card should be unique and not include any of the values from these cards: {already_played_cards}.",
            }
        ],
        text_format=ArticulateCardsList,
    )

    cards: ArticulateCardsList = response.output_parsed

    # Remove all duplicate cards
    seen_person = set(card.person for card in already_played_cards)
    seen_world = set(card.world for card in already_played_cards)
    seen_object = set(card.object for card in already_played_cards)
    seen_action = set(card.action for card in already_played_cards)
    seen_nature = set(card.nature for card in already_played_cards)
    seen_random = set(card.random for card in already_played_cards)

    unique_persons = set(cards.person) - seen_person
    unique_worlds = set(cards.world) - seen_world
    unique_objects = set(cards.object) - seen_object
    unique_actions = set(cards.action) - seen_action
    unique_natures = set(cards.nature) - seen_nature
    unique_randoms = set(cards.random) - seen_random

    # Create unique cards from the unique values

    count = min(
        len(unique_persons),
        len(unique_worlds),
        len(unique_objects),
        len(unique_actions),
        len(unique_natures),
        len(unique_randoms),
    )

    unique_cards = []
    for _ in range(count):
        if not unique_persons or not unique_worlds or not unique_objects or not unique_actions or not unique_natures:
            break  # Not enough unique values to create more cards

        card = ArticulateCard(
            person=unique_persons.pop(),
            world=unique_worlds.pop(),
            object=unique_objects.pop(),
            action=unique_actions.pop(),
            nature=unique_natures.pop(),
            random= unique_randoms.pop(),
        )
        unique_cards.append(card)

    return unique_cards


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}


class Session(BaseModel):
    id: str
    created_at: datetime
    themes: list[str]
    birth_years: list[int]
    already_played_cards: list[ArticulateCard] = []

@app.get("/sessions/{session_id}")
async def get_session(session_id: str) -> Session:
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")

    return SESSIONS[session_id]


class SessionInput(BaseModel):
    themes: list[str]
    birth_years: list[int]

@app.post("/sessions")
async def create_session(input: SessionInput) -> Session:
    session = Session(
        id=str(uuid.uuid4()),
        created_at=datetime.now(),
        themes=input.themes,
        birth_years=input.birth_years,
    )
    SESSIONS[session.id] = session
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
