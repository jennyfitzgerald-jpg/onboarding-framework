# Simple Extraction Instructions

## Step 1: Enable Pasting

1. Open the artifact: https://claude.ai/artifacts/315ff54d-1a5a-4a31-94c9-4a2739e31b97
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Type exactly: `allow pasting`
5. Press **Enter**

## Step 2: Extract the Framework

### Option A: One-Line Script (Easiest)

1. Copy the ENTIRE line from `extract-simple.js` (it's all one line)
2. Paste it into the console
3. Press Enter
4. It will download `framework-simple.json`

### Option B: Multi-Line Script (More Detailed)

1. After typing "allow pasting", copy the contents of `extract-hierarchical.js`
2. Paste into console
3. Press Enter
4. It will download `framework-extraction.json`

## Step 3: Process the Data

Once you have the JSON file, run:

```bash
node process-with-claude.js framework-simple.json
```

Or if you used the hierarchical version:

```bash
node process-with-claude.js framework-extraction.json
```

This will create `formatted-steps.json` with all your framework steps ready for the database!

## That's It!

Share the `formatted-steps.json` file and I'll update seed.js automatically.
