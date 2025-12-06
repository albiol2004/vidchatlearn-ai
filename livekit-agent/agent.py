import asyncio
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import deepgram, cartesia, openai, silero

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
        system_prompt = system_prompt.replace("{LEVEL_INSTRUCTIONS}", level_instructions)
    else:
        system_prompt = system_prompt.replace("{LEVEL_INSTRUCTIONS}", "")

    return system_prompt


def prewarm(proc: JobProcess):
    """Preload models to reduce first response latency."""
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    """Main entrypoint for the voice agent."""

    # Get room metadata for user preferences
    room_metadata = ctx.room.metadata or "{}"
    try:
        import json
        metadata = json.loads(room_metadata)
    except:
        metadata = {}

    # User preferences with defaults
    target_language = metadata.get("target_language", "en")
    native_language = metadata.get("native_language", "es")
    level = metadata.get("level", "beginner")
    speaking_speed = float(metadata.get("speaking_speed", 1.0))

    logger.info(f"Starting conversation - Language: {target_language}, Level: {level}, Speed: {speaking_speed}")

    # Initialize system prompt
    system_prompt = load_prompt(level)
    system_prompt = system_prompt.replace("{TARGET_LANGUAGE}", target_language.upper())
    system_prompt = system_prompt.replace("{NATIVE_LANGUAGE}", native_language.upper())

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=system_prompt,
    )

    # Configure STT (Deepgram)
    stt = deepgram.STT(
        model="nova-2",
        language=target_language,
    )

    # Configure LLM (DeepSeek via OpenAI-compatible API)
    llm_instance = openai.LLM(
        model="deepseek-chat",
        base_url="https://api.deepseek.com/v1",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
    )

    # Configure TTS (Cartesia)
    # Map languages to Cartesia voice IDs
    voice_map = {
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

    voice_id = voice_map.get(target_language, voice_map["en"])

    tts = cartesia.TTS(
        voice=voice_id,
        speed=speaking_speed,
        model="sonic-2",
    )

    # Wait for participant to connect
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()

    logger.info(f"Participant connected: {participant.identity}")

    # Create voice pipeline agent
    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=stt,
        llm=llm_instance,
        tts=tts,
        chat_ctx=initial_ctx,
        allow_interruptions=True,
        interrupt_speech_duration=0.5,
        min_endpointing_delay=0.5,
    )

    # Event handlers for logging and analytics
    @agent.on("user_speech_committed")
    def on_user_speech(msg: llm.ChatMessage):
        logger.info(f"User said: {msg.content}")

    @agent.on("agent_speech_committed")
    def on_agent_speech(msg: llm.ChatMessage):
        logger.info(f"Agent said: {msg.content}")

    # Start the agent
    agent.start(ctx.room, participant)

    # Initial greeting
    await agent.say(
        f"Hello! I'm your language learning assistant. Let's practice {target_language.upper()} together. "
        "Feel free to start a conversation on any topic, or ask me to help you practice something specific.",
        allow_interruptions=True,
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
