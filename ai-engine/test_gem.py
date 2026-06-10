import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

# Load workspace environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

if not api_key:
    print("Error: GEMINI_API_KEY environment variable is not set.")
    exit(1)

print(f"Testing Gemini API with model: {model}")
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
payload = {
    "contents": [{"parts": [{"text": "Say hello"}]}],
    "generationConfig": {"temperature": 0.2}
}

try:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        print("Success! Gemini response:")
        print(text)
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} {e.reason}")
    try:
        print(e.read().decode("utf-8"))
    except Exception:
        pass
except Exception as e:
    print(f"Failed: {e}")