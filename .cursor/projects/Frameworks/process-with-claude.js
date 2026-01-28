// Script to process framework data using Claude API
// This helps structure and format the framework steps

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.CLAUDE_API_KEY || process.argv[2];

if (!API_KEY) {
    console.error('❌ Claude API key required!');
    console.log('\nUsage:');
    console.log('  1. Create a .env file with: CLAUDE_API_KEY=your-key');
    console.log('  2. Or pass as argument: node process-with-claude.js YOUR_API_KEY');
    process.exit(1);
}

async function processFrameworkWithClaude(frameworkData) {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: API_KEY });

    const prompt = `You are helping to structure an onboarding framework. 

I have extracted framework data that may be messy or hierarchical. Please:
1. Identify all the steps in the framework
2. Extract the title and description for each step
3. Determine the appropriate category (preparation, training, documentation, integration, review, or other)
4. Assign a logical step_order
5. Format as JSON array

Here's the extracted data:
${JSON.stringify(frameworkData, null, 2)}

Return ONLY a valid JSON array in this exact format:
[
  {
    "title": "Step title",
    "description": "Step description",
    "category": "preparation",
    "step_order": 1
  }
]

Categories should be one of: preparation, training, documentation, integration, review, other`;

    try {
        console.log('🤖 Processing with Claude API...\n');
        
        // Try different model names
        const models = [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-sonnet-20240620',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229'
        ];
        
        let message;
        let lastError;
        
        for (const model of models) {
            try {
                console.log(`Trying model: ${model}...`);
                message = await client.messages.create({
                    model: model,
                    max_tokens: 4096,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                });
                console.log(`✅ Success with model: ${model}`);
                break;
            } catch (error) {
                lastError = error;
                console.log(`❌ Failed with ${model}: ${error.message}`);
                continue;
            }
        }
        
        if (!message) {
            throw lastError || new Error('All models failed');
        }

        const responseText = message.content[0].text;
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const steps = JSON.parse(jsonMatch[0]);
            return steps;
        } else {
            throw new Error('No JSON array found in response');
        }
    } catch (error) {
        console.error('❌ Error calling Claude API:', error.message);
        throw error;
    }
}

// Main execution
async function main() {
    const inputFile = process.argv[3] || 'framework-extraction.json';
    
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ File not found: ${inputFile}`);
        console.log('\nFirst, extract the framework using extract-hierarchical.js in your browser.');
        process.exit(1);
    }

    console.log(`📖 Reading ${inputFile}...\n`);
    const frameworkData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    try {
        const steps = await processFrameworkWithClaude(frameworkData);
        
        console.log(`✅ Processed ${steps.length} steps!\n`);
        console.log('📋 Steps:\n');
        steps.forEach((step, idx) => {
            console.log(`${idx + 1}. ${step.title} [${step.category}]`);
            if (step.description) {
                console.log(`   ${step.description.substring(0, 80)}...`);
            }
            console.log();
        });

        // Save formatted steps
        const outputFile = 'formatted-steps.json';
        fs.writeFileSync(outputFile, JSON.stringify(steps, null, 2));
        console.log(`💾 Saved to ${outputFile}\n`);

        // Generate seed.js format
        console.log('📝 Ready to update seed.js! Here are the steps:\n');
        console.log(JSON.stringify(steps, null, 2));

    } catch (error) {
        console.error('\n❌ Processing failed:', error.message);
        process.exit(1);
    }
}

main();
