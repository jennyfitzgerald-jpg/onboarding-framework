# How to Extract Your Multi-Level Framework Steps

Since your framework has multiple levels/nested structure, here's the complete process:

## Step 1: Install Dependencies

```bash
npm install
```

This installs the Claude API SDK and other dependencies.

## Step 2: Extract the Framework Structure

1. **Open the artifact** in your browser:
   https://claude.ai/artifacts/315ff54d-1a5a-4a31-94c9-4a2739e31b97

2. **Open Developer Tools** (Press F12)

3. **Go to the Console tab**

4. **Copy the entire contents** of `extract-hierarchical.js` and paste it into the console

5. **Press Enter**

6. The script will:
   - Extract the hierarchical structure (all levels)
   - Download a JSON file (`framework-extraction.json`) automatically
   - Display the structure in the console

## Step 3: Process with Claude API (Recommended)

Once you have `framework-extraction.json`:

```bash
node process-with-claude.js
```

This uses the Claude API to:
- Intelligently parse the hierarchical structure
- Extract all steps and sub-steps
- Categorize them appropriately
- Format them for the database

The output will be saved to `formatted-steps.json` and displayed in the console.

## Step 4: Alternative - Manual Processing

If you prefer not to use the API:

```bash
node process-extraction.js framework-extraction.json
```

This will create `extracted-steps.json` with formatted steps.

## Step 5: Update the Database

Once you have the formatted steps, I can help you:
1. Update `seed.js` with your exact framework
2. Run `npm run seed` to populate the database
3. Start the server with `npm start`

## What the Scripts Do

### extract-hierarchical.js (Browser)
- ✅ Handles nested/multi-level structures
- ✅ Preserves hierarchy and relationships
- ✅ Extracts numbered steps, headings, and list items
- ✅ Identifies parent-child relationships
- ✅ Exports everything to JSON

### process-with-claude.js (Node.js + API)
- ✅ Uses Claude API to intelligently parse the data
- ✅ Handles complex hierarchical structures
- ✅ Automatically categorizes steps
- ✅ Formats for database insertion

### process-extraction.js (Node.js - No API)
- ✅ Converts hierarchical data into flat step structure
- ✅ Identifies categories automatically
- ✅ Formats for database insertion
- ✅ Generates seed.js compatible format

## Need Help?

If you run into issues:
1. Share the console output/errors
2. Share the `framework-extraction.json` file
3. Or describe the structure (e.g., "3 main sections, each with 4-5 sub-steps")
4. I can create a custom extraction based on your description

## Security Note

Your API key is stored in `.env` which is gitignored. Never commit this file to version control.
