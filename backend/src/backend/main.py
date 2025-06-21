import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from typing import Optional, Set

app = FastAPI()

app.add_middleware(
    CORSMiddleware,  # type: ignore
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
    persons: List[str]
    worlds: List[str]
    objects: List[str]
    actions: List[str]
    natures: List[str]
    randoms: List[str]


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
        themes: List[str],
        birth_years: List[int],
        already_played_cards: Optional[List[ArticulateCard]] = None,
        count: int = 10,
        prompt: str = "Your system prompt here"
) -> List[ArticulateCard]:
    """
    Generate `count` unique ArticulateCard objects matching the given themes and birth years,
    excluding any cards in `already_played_cards`. Continues requesting until enough unique cards are obtained.
    """
    if already_played_cards is None:
        already_played_cards = []

    # Track seen values to enforce uniqueness
    seen_persons: Set[str] = {card.person for card in already_played_cards}
    seen_worlds: Set[str] = {card.world for card in already_played_cards}
    seen_objects: Set[str] = {card.object for card in already_played_cards}
    seen_actions: Set[str] = {card.action for card in already_played_cards}
    seen_natures: Set[str] = {card.nature for card in already_played_cards}
    seen_randoms: Set[str] = {card.random for card in already_played_cards}

    unique_persons: Set[str] = set()
    unique_worlds: Set[str] = set()
    unique_objects: Set[str] = set()
    unique_actions: Set[str] = set()
    unique_natures: Set[str] = set()
    unique_randoms: Set[str] = set()

    retry_attempts = 0

    already_played_string = (f"Already played cards: Persons: {seen_persons}, Worlds: {seen_worlds}, "
                             f"Objects: {seen_objects}, Actions: {seen_actions},"
                             f" Natures: {seen_natures}, Randoms: {seen_randoms}")

    # Continue fetching until we have the desired number of unique cards
    while (
            len(unique_persons) < count
            or len(unique_worlds) < count
            or len(unique_objects) < count
            or len(unique_actions) < count
            or len(unique_natures) < count
            or len(unique_randoms) < count
    ):
        response = await client.responses.parse(
            model="gpt-4o",
            input=[  # type: ignore
                {"role": "system", "content": prompt},
                {"role": "system", "content": already_played_string},
                {"role": "user", "content":
                    f"Generate {count} values for each category with the themes: {themes} "
                    f"for players born in {birth_years}. "
                    f"Exclude any cards matching already played values."
                 }
            ],
            text_format=ArticulateCardsList,
        )

        new_cards: ArticulateCardsList = response.output_parsed
        print(new_cards)

        for card in new_cards.persons:
            if card not in seen_persons:
                unique_persons.add(card)
                seen_persons.add(card)

        for card in new_cards.worlds:
            if card not in seen_worlds:
                unique_worlds.add(card)
                seen_worlds.add(card)

        for card in new_cards.objects:
            if card not in seen_objects:
                unique_objects.add(card)
                seen_objects.add(card)

        for card in new_cards.actions:
            if card not in seen_actions:
                unique_actions.add(card)
                seen_actions.add(card)

        for card in new_cards.natures:
            if card not in seen_natures:
                unique_natures.add(card)
                seen_natures.add(card)

        for card in new_cards.randoms:
            if card not in seen_randoms:
                unique_randoms.add(card)
                seen_randoms.add(card)

        retry_attempts += 1
        print(f"Attempt {retry_attempts}: ")
        if retry_attempts > 10:
            raise ValueError("Too many attempts to generate unique cards. Please check the input parameters.")

    result_cards = []

    for _ in range(count):
        # Create a card with unique values
        card = ArticulateCard(
            person=unique_persons.pop() if unique_persons else "",
            world=unique_worlds.pop() if unique_worlds else "",
            object=unique_objects.pop() if unique_objects else "",
            action=unique_actions.pop() if unique_actions else "",
            nature=unique_natures.pop() if unique_natures else "",
            random=unique_randoms.pop() if unique_randoms else ""
        )

        result_cards.append(card)

    return result_cards

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
