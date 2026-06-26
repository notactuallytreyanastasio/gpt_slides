#!/usr/bin/env python3
"""Validate Markdown Slides deck files for common format issues."""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None


THEMES = {"studio", "paper", "midnight"}
ASPECT_RATIOS = {"16:9", "4:3", "1:1"}
LAYOUTS = {"auto", "title", "statement", "bullets", "split", "image", "code"}
ALIGNS = {"start", "center", "end"}


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: validate_deck.py path/to/deck.md", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 2

    text = path.read_text(encoding="utf-8")
    errors, warnings = validate(text)

    for message in errors:
        print(f"error: {message}")
    for message in warnings:
        print(f"warning: {message}")

    if errors:
        return 1

    print(f"ok: {path} looks like a Markdown Slides deck")
    return 0


def validate(text: str) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")

    frontmatter, body = split_frontmatter(normalized, errors)
    if frontmatter is not None:
        validate_frontmatter(frontmatter, errors, warnings)

    slides = split_slides(body)
    if not slides:
        errors.append("deck must contain at least one non-empty slide")
        return errors, warnings

    for index, slide in enumerate(slides, start=1):
        validate_slide(index, slide, errors, warnings)

    return errors, warnings


def split_frontmatter(text: str, errors: list[str]) -> tuple[str | None, str]:
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        errors.append("deck must start with YAML frontmatter delimited by ---")
        return None, text

    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            return "\n".join(lines[1:index]), "\n".join(lines[index + 1 :])

    errors.append("frontmatter is missing a closing --- delimiter")
    return None, ""


def validate_frontmatter(
    source: str, errors: list[str], warnings: list[str]
) -> None:
    metadata = parse_yaml(source, "frontmatter", errors)
    if not isinstance(metadata, dict):
        return

    title = metadata.get("title")
    if not isinstance(title, str) or not title.strip():
        errors.append("frontmatter.title must be a non-empty string")

    theme = metadata.get("theme", "studio")
    if theme not in THEMES:
        errors.append(f"frontmatter.theme must be one of: {', '.join(sorted(THEMES))}")

    aspect_ratio = metadata.get("aspectRatio", "16:9")
    if aspect_ratio not in ASPECT_RATIOS:
        errors.append(
            "frontmatter.aspectRatio must be one of: "
            + ", ".join(sorted(ASPECT_RATIOS))
        )

    unknown = set(metadata) - {"title", "description", "theme", "aspectRatio", "author"}
    if unknown:
        warnings.append(f"unknown frontmatter fields: {', '.join(sorted(unknown))}")


def split_slides(body: str) -> list[str]:
    slides: list[str] = []
    current: list[str] = []
    for line in body.split("\n"):
        if line.strip() == "---":
            slide = "\n".join(current).strip()
            if slide:
                slides.append(slide)
            current = []
        else:
            current.append(line)

    final = "\n".join(current).strip()
    if final:
        slides.append(final)

    return slides


def validate_slide(
    index: int, slide: str, errors: list[str], warnings: list[str]
) -> None:
    directive_match = re.match(r"\s*<!--\s*\n?([\s\S]*?)\n?\s*-->\s*", slide)
    content = slide
    if directive_match:
        directive = parse_yaml(directive_match.group(1), f"slide {index} directive", errors)
        content = slide[directive_match.end() :].strip()
        if isinstance(directive, dict):
            validate_directive(index, directive, errors, warnings)

    if not content:
        errors.append(f"slide {index} has no visible markdown content")

    if len(re.findall(r":::\s*notes", slide)) != len(re.findall(r"\n:::\s*(?:\n|$)", slide)):
        warnings.append(f"slide {index} may have an unbalanced notes block")

    word_count = len(re.findall(r"\b[\w'-]+\b", strip_code(content)))
    if word_count > 95:
        warnings.append(f"slide {index} is dense ({word_count} words)")


def validate_directive(
    index: int, directive: dict, errors: list[str], warnings: list[str]
) -> None:
    layout = directive.get("layout", "auto")
    if layout not in LAYOUTS:
        errors.append(f"slide {index} layout must be one of: {', '.join(sorted(LAYOUTS))}")

    align = directive.get("align", "start")
    if align not in ALIGNS:
        errors.append(f"slide {index} align must be one of: {', '.join(sorted(ALIGNS))}")

    unknown = set(directive) - {"id", "title", "layout", "background", "accent", "align"}
    if unknown:
        warnings.append(f"slide {index} has unknown directive fields: {', '.join(sorted(unknown))}")


def parse_yaml(source: str, label: str, errors: list[str]):
    if yaml is None:
        return fallback_parse_yaml(source, label, errors)

    try:
        parsed = yaml.safe_load(source.strip() or "{}")
    except Exception as exc:  # pragma: no cover - depends on PyYAML messages.
        errors.append(f"{label} YAML could not be parsed: {exc}")
        return None

    if parsed is None:
        return {}
    if not isinstance(parsed, dict):
        errors.append(f"{label} YAML must be a mapping")
        return None
    return parsed


def fallback_parse_yaml(source: str, label: str, errors: list[str]) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for line in source.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in stripped:
            errors.append(f"{label} contains unsupported YAML line: {line}")
            continue
        key, value = stripped.split(":", 1)
        parsed[key.strip()] = value.strip().strip("\"'")
    return parsed


def strip_code(markdown: str) -> str:
    return re.sub(r"```[\s\S]*?```", " ", markdown)


if __name__ == "__main__":
    raise SystemExit(main())
