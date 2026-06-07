import importlib.util
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
AI_ENGINE_DIR = ROOT_DIR / "ai-engine"
AI_MAIN_PATH = AI_ENGINE_DIR / "main.py"

sys.path.insert(0, str(AI_ENGINE_DIR))

spec = importlib.util.spec_from_file_location("ai_engine_main", AI_MAIN_PATH)
if spec is None or spec.loader is None:
    raise ImportError(f"Unable to load ai-engine main module from {AI_MAIN_PATH}")

module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

app = module.app
