from typing import Dict, Any, List, Optional
from enum import Enum

class STTProvider(str, Enum):
    WEB_SPEECH = "web_speech"
    WHISPER_LOCAL = "whisper_local"
    WHISPER_OPENAI = "whisper_openai"

class TTSProvider(str, Enum):
    WEB_SPEECH = "web_speech"
    ELEVENLABS = "elevenlabs"
    OPENAI = "openai"
    GOOGLE = "google"
    LOCAL = "local"

class VoiceService:
    def __init__(self):
        self.stt_provider = STTProvider.WEB_SPEECH
        self.tts_provider = TTSProvider.WEB_SPEECH
        self.voice_name = "default"
        self.pitch = 1.0
        self.rate = 1.0
        self.vad_sensitivity = 0.5  # 0.0 to 1.0
        self.silence_threshold_ms = 1500

    def get_config(self) -> Dict[str, Any]:
        return {
            "stt_provider": self.stt_provider.value,
            "tts_provider": self.tts_provider.value,
            "voice_name": self.voice_name,
            "pitch": self.pitch,
            "rate": self.rate,
            "vad_sensitivity": self.vad_sensitivity,
            "silence_threshold_ms": self.silence_threshold_ms,
            "available_stt_providers": [p.value for p in STTProvider],
            "available_tts_providers": [p.value for p in TTSProvider]
        }

    def update_config(self, config: Dict[str, Any]):
        if "stt_provider" in config:
            self.stt_provider = STTProvider(config["stt_provider"])
        if "tts_provider" in config:
            self.tts_provider = TTSProvider(config["tts_provider"])
        if "voice_name" in config:
            self.voice_name = config["voice_name"]
        if "pitch" in config:
            self.pitch = float(config["pitch"])
        if "rate" in config:
            self.rate = float(config["rate"])
        if "vad_sensitivity" in config:
            self.vad_sensitivity = float(config["vad_sensitivity"])
        if "silence_threshold_ms" in config:
            self.silence_threshold_ms = int(config["silence_threshold_ms"])

voice_service = VoiceService()
