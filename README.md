<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MeetCraft AI - Enterprise Edition

A secure, AI-powered knowledge generation platform.

## Architecture (Phase 0)

This application uses a **React Frontend** and a **Node.js/Express Backend**.
All AI processing is handled securely on the server via the `AI Orchestrator`.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_VITE_GEMINI_API_KEY_here
   PORT=3001
   ```

3. **Run Locally**
   Start both client and server:
   ```bash
   npm run dev:full
   ```
   
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Features

- **Knowledge Generation**: Textbooks, Slides, and Action Plans.
- **AI Tutor**: Context-aware chat.
- **Assessment**: Auto-generated Quizzes and Flashcards.
- **Security**: Backend-only API key storage.
- **Governance**: Token tracking and usage limits.
