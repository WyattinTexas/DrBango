#!/bin/bash
# Launch Jeffrey the Ghost chatbot
# This opens Claude Code to handle API key setup and start the server

echo ""
echo "  ☠ Jeffrey the Ghost — Setup & Launch"
echo "  ════════════════════════════════════"
echo ""

cd ~/DrBango/toby

claude -p --model claude-sonnet-4-6 "You are helping Wyatt launch the Jeffrey chatbot at ~/DrBango/toby/.

STEP 1: Go to the Chrome tab that's open at platform.claude.com/settings/keys. Use the claude-in-chrome tools to click '+ Create key', name it 'jeffrey-chatbot', and copy the key.

STEP 2: Save the key to ~/DrBango/toby/.env as ANTHROPIC_API_KEY=<the key>

STEP 3: Add this to ~/.zshrc if not already there:
  export ANTHROPIC_API_KEY='<the key>'

STEP 4: Start the server:
  cd ~/DrBango/toby && ANTHROPIC_API_KEY='<the key>' python3 server.py

Tell Wyatt when Jeffrey is live at http://localhost:5555"
