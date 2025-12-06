import asyncio
import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io
from livekit.plugins import silero, deepgram, cartesia, openai
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

logger = logging.getLogger("voice-agent")

# Load prompts
PROMPTS_DIR = Path(__file__).parent / "prompts"


def load_prompt(level: str = "beginner") -> str:
    """Load system prompt based on user's language level."""
    system_prompt = (PROMPTS_DIR / "system.txt").read_text()
    level_file = PROMPTS_DIR / "levels" / f"{level}.txt"

    if level_file.exists():
        level_instructions = level_file.read_text()
        system_prompt = system_prompt.replace(
            "{LEVEL_INSTRUCTIONS}", level_instructions
        )
    else:
        system_prompt = system_prompt.replace("{LEVEL_INSTRUCTIONS}", "")

    return system_prompt


# Voice map for Cartesia voices by language
VOICE_MAP = {
    "en": "a0e99841-438c-4a64-b679-ae501e7d6091",  # British Lady
    "es": "846d6cb0-2301-48b6-9571-6d4fd3ffea35",  # Spanish Speaker
    "fr": "a8a1eb38-5f15-4c1d-8722-7ac0f329727d",  # French Speaker
    "de": "b9de4a89-2257-424b-94c2-db18ba68c81a",  # German Speaker
    "it": "ee7ea9f8-c0c1-498c-9f62-5b7b56a9ab60",  # Italian Speaker
    "pt": "700d1ee3-a641-4018-ba6e-899dcadc9e2b",  # Portuguese Speaker
    "ja": "2b568345-1d48-4047-b25f-7baccf842eb0",  # Japanese Speaker
    "ko": "663afeec-d082-4ab5-92cc-1c7a9b8718c3",  # Korean Speaker
    "zh": "d4d4b115-57a0-48ea-9a1a-9898966c2966",  # Chinese Speaker
}


class LanguageTutor(Agent):
    """Language learning assistant agent."""

    def __init__(
        self,
        target_language: str = "en",
        native_language: str = "es",
        level: str = "beginner",
    ) -> None:
        # Load and configure system prompt
        system_prompt = load_prompt(level)
        system_prompt = system_prompt.replace("{TARGET_LANGUAGE}", target_language.upper())
        system_prompt = system_prompt.replace("{NATIVE_LANGUAGE}", native_language.upper())

        super().__init__(instructions=system_prompt)

        self.target_language = target_language
        self.native_language = native_language
        self.level = level


server = AgentServer()


@server.rtc_session()
async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the voice agent."""

    # Get room metadata for user preferences
    room_metadata = ctx.room.metadata or "{}"
    try:
        metadata = json.loads(room_metadata)
    except:
        metadata = {}

    # User preferences with defaults
    target_language = metadata.get("target_language", "en")
    native_language = metadata.get("native_language", "es")
    level = metadata.get("level", "beginner")
    speaking_speed = float(metadata.get("speaking_speed", 1.0))

    logger.info(
        f"Starting conversation - Language: {target_language}, Level: {level}, Speed: {speaking_speed}"
    )

    # Get voice ID for the target language
    voice_id = VOICE_MAP.get(target_language, VOICE_MAP["en"])

    # Create the agent session with STT-LLM-TTS pipeline
    session = AgentSession(
        stt=deepgram.STT(
            model="nova-2",
            language=target_language,
        ),
        llm=openai.LLM(
            model="deepseek-chat",
            base_url="https://api.deepseek.com/v1",
            api_key=os.getenv("DEEPSEEK_API_KEY"),
        ),
        tts=cartesia.TTS(
            voice=voice_id,
            speed=speaking_speed,
            model="sonic-3",
        ),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    # Create the language tutor agent
    agent = LanguageTutor(
        target_language=target_language,
        native_language=native_language,
        level=level,
    )

    # Start the session
    await session.start(
        room=ctx.room,
        agent=agent,
    )

    # Initial greeting
    await session.generate_reply(
        instructions=f"Greet the user warmly and introduce yourself as their {target_language.upper()} language learning assistant. "
        "Let them know they can start a conversation on any topic or ask for help practicing something specific."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
