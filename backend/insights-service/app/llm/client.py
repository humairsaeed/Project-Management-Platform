"""
LLM Client - OpenAI GPT-4 Integration

Provides async interface for AI analysis.
"""

import os
from typing import Any

from openai import AsyncOpenAI

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4-turbo")


class LLMClient:
    """
    Async OpenAI client for generating insights.

    Usage:
        client = LLMClient()
        result = await client.analyze(prompt, response_schema)
    """

    def __init__(self):
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        self.model = OPENAI_MODEL

    async def analyze(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 2000,
    ) -> str:
        """
        Generate analysis using GPT-4.

        Args:
            prompt: User prompt with context
            system_prompt: Optional system message
            temperature: Sampling temperature (lower = more deterministic)
            max_tokens: Maximum response tokens

        Returns:
            Generated text response
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content

    async def analyze_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 2000,
    ) -> dict[str, Any]:
        """
        Generate structured JSON analysis.

        Args:
            prompt: User prompt requesting JSON output
            system_prompt: Optional system message
            temperature: Sampling temperature
            max_tokens: Maximum response tokens

        Returns:
            Parsed JSON response as dict
        """
        import json

        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        return json.loads(content)
