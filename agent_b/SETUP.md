# Setup Instructions

## Environment Configuration

1. Create a `.env` file in the project root with the following content:

```bash
# Copy from .env.example and fill in your actual values
GEMINI_API_KEY=your_actual_gemini_api_key_here
GITHUB_USER=your_actual_github_username
GITHUB_TOKEN=your_actual_github_token_here
```

2. Replace the placeholder values with your actual:
   - **GEMINI_API_KEY**: Get from [Google AI Studio](https://aistudio.google.com/)
   - **GITHUB_USER**: Your GitHub username
   - **GITHUB_TOKEN**: Create a [Personal Access Token](https://github.com/settings/tokens) with `repo` permissions

## Installation

```bash
pip install -r requirements.txt
```

## Running

```bash
python main.py
```

## Configuration Options

- `REMOTE_ONLY`: Whether to only work with GitHub (default: true)
- `MAX_RETRIES`: Number of retries for API calls (default: 3)
- `REQUEST_TIMEOUT`: Timeout for HTTP requests in seconds (default: 30)
- `MAX_PROMPT_LENGTH`: Maximum prompt length to avoid token limits (default: 4000)
- `MAX_CODE_LENGTH`: Maximum code length per module (default: 2000)

