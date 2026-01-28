# Quick Framework Extraction Guide

Since the artifact requires authentication, here's the fastest way to extract your framework:

## Method 1: Browser Console (Fastest - 2 minutes)

1. **Open the artifact** in your browser (while logged into Claude):
   https://claude.ai/artifacts/315ff54d-1a5a-4a31-94c9-4a2739e31b97

2. **Press F12** to open Developer Tools

3. **Go to Console tab**

4. **Copy ALL the code** from `extract-hierarchical.js` and paste into console

5. **Press Enter**

6. It will download `framework-extraction.json` automatically

7. **Run this command**:
   ```bash
   node process-with-claude.js framework-extraction.json
   ```

8. This will create `formatted-steps.json` with all your steps!

9. **Share the `formatted-steps.json` file** and I'll update seed.js

## Method 2: If Method 1 Doesn't Work

Just describe the structure:
- How many main sections?
- What are the section names?
- How many steps in each section?
- What are the step names?

I can structure it for you!
