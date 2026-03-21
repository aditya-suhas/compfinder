# CompFinder

A local, offline-first tracker for competitions, fellowships, and programs — built as a single HTML file with no backend, no build step, and no dependencies.

![Screenshot](https://i.imgur.com/placeholder.png)

## Features

- **Track anything** — competitions, programs, fellowships, research opportunities
- **Deadline urgency** — color-coded (red/amber/green) with a 30-day alert banner
- **Year timeline strip** — visual overview of all deadlines across 12 months
- **Filter & search** — by type (Competition/Program/Fellowship/Other), category, and free text
- **Status tracking** — Contemplating → Committed → Doing → Done / Skipped
- **Prep checklists** — per-entry task lists with a "What's Active" focus panel
- **AI Import** — generate a prompt for any LLM (Claude, ChatGPT, Gemini) to research competitions and return importable JSON
- **Export / Import** — full JSON backup with merge or replace mode and per-entry validation
- **Filter persistence** — your active filters are remembered across sessions
- 16 pre-loaded entries for Indian students (olympiad tracks, global essay competitions, science fairs, research programs)

## Usage

### Option 1 — Open directly in browser
Download `index.html` and open it in any modern browser. That's it.

### Option 2 — macOS launcher
Download `CompFinder.command`, edit the path inside to match where you saved `index.html`, then double-click to open.

```bash
# Edit CompFinder.command and change this line:
open "/path/to/your/index.html"

# Then make it executable:
chmod +x CompFinder.command
```

## Data & Privacy

All data lives in your browser's `localStorage` — nothing is sent anywhere. Use **Export** regularly to save a `.json` backup file.

## AI Import

1. Click **⚡ AI Import**
2. Type a list of competitions you want to add
3. Click **Copy Prompt** — a detailed prompt is copied to clipboard
4. Paste into Claude, ChatGPT, or Gemini — it will research deadlines, eligibility, and descriptions
5. Paste the JSON output back into the **Paste AI output** box and click **Import**

The prompt instructs the AI to use the correct JSON schema, match your categories, and handle multi-stage pipelines (e.g. IOQM → RMO → IMO).

## Import Format

```json
{
  "entries": [
    {
      "name": "Competition Name",
      "pipeline": "Stage1 → Stage2 → Stage3",
      "type": "Competition",
      "category": "Math",
      "deadline": "2026-09-01",
      "deadlineLabel": "Sep 1",
      "eligibility": "Grade 9–12, India",
      "notes": "Description here.",
      "status": "Contemplating",
      "priority": "High"
    }
  ],
  "categories": ["Math", "CS/CP", "Physics"]
}
```

A bare array (`[{...}]`) also works. Import supports **merge** (add new, keep existing) or **replace** (overwrite all).

## Tech

Single HTML file — inline CSS and vanilla JS. No frameworks, no build step, no CDN dependencies for functionality. Google Fonts loaded for aesthetics (degrades gracefully offline).
