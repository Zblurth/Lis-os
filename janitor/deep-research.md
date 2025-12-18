---
description: Perform a deep, iterative research loop with self-critique before answering.
---
# Deep Research Protocol

This workflow forces the agent to enter a "Deep Think" loop, prioritizing thoroughness over speed.

1.  **Phase 1: Context & Initial Scan**
    - Read the user's request and ANY relevant local files to establish a baseline.
    - Perform a broad `search_web` to understand the landscape of the topic.

2.  **Phase 2: Gap Analysis (Self-Critique)**
    - *Action*: Create a new artifact file named `research_plan.md` in the brain directory.
    - *Content*: Analyze the initial findings. Ask yourself: "What is missing? What is ambiguous? What counter-arguments exist?" List the specific "Unknowns" that need to be investigated.

3.  **Phase 3: Deep Dive (The Loop)**
    - *Instruction*: You must not proceed until you have addressed the gaps.
    - For **EACH** "Unknown" identified in Phase 2:
        - Perform specific, targeted web searches (`search_web`).
        - Read full content of promising sources (`read_url_content`).
        - If a source contradicts previous findings, search again to resolve the conflict.

4.  **Phase 4: Synthesis**
    - Consolidate all verified information.
    - *Self-Check*: Does this fully answer the prompt with high confidence? If not, perform one final search round.

5.  **Phase 5: Final Report**
    - Write a comprehensive Markdown report (Artifact) or a detailed response.
    - Structure:
        - **Executive Summary**: The direct answer.
        - **Deep Dive**: The core research with technical details.
        - **Sources**: Links to verified sources.
