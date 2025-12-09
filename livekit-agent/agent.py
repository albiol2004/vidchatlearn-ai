import asyncio
import json
import logging
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io
from livekit.plugins import silero, deepgram, cartesia, openai
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

logger = logging.getLogger("voice-agent")


async def send_transcript(room: rtc.Room, role: str, text: str, is_final: bool = True):
    """Send transcript data to the frontend."""
    if not text.strip():
        return

    data = {
        "type": "transcript",
        "id": str(uuid.uuid4()),
        "role": role,
        "text": text,
        "isFinal": is_final,
    }

    try:
        await room.local_participant.publish_data(
            json.dumps(data).encode("utf-8"),
            reliable=True,
        )
        logger.debug(f"Sent transcript: {role} - {text[:50]}...")
    except Exception as e:
        logger.error(f"Failed to send transcript: {e}")

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

    # First connect to the room
    logger.info("Connecting to room...")
    await ctx.connect()
    logger.info(f"Connected to room: {ctx.room.name}")

    # Wait for a participant to connect
    logger.info("Waiting for participant to connect...")
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant connected: {participant.identity}, metadata: {participant.metadata}")

    # Get user preferences from participant metadata
    metadata = {}
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
            logger.info(f"Parsed participant metadata: {metadata}")
        except Exception as e:
            logger.warning(f"Failed to parse participant metadata: {e}")

    # Fallback to room metadata
    if not metadata:
        room_metadata = ctx.room.metadata or "{}"
        try:
            metadata = json.loads(room_metadata)
            logger.info(f"Using room metadata: {metadata}")
        except:
            pass

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

    # Set up transcript event handlers
    @session.on("user_speech_committed")
    def on_user_speech(msg):
        """Handle finalized user speech."""
        asyncio.create_task(send_transcript(ctx.room, "user", msg.content))

    @session.on("agent_speech_committed")
    def on_agent_speech(msg):
        """Handle finalized agent speech."""
        asyncio.create_task(send_transcript(ctx.room, "assistant", msg.content))

    # Start the session
    await session.start(
        room=ctx.room,
        agent=agent,
    )

    # Initial greeting - explicitly in target language only
    await session.generate_reply(
        instructions=f"Greet the user warmly IN {target_language.upper()} ONLY. Introduce yourself as their language learning assistant. "
        f"Keep it short (1-2 sentences). Do NOT translate or repeat in any other language."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
