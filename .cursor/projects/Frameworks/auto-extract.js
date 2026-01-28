// Automated extraction script using Puppeteer
// This will open the artifact and extract the framework structure

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_URL = 'https://claude.ai/artifacts/315ff54d-1a5a-4a31-94c9-4a2739e31b97';

async function extractFramework() {
    console.log('🚀 Starting automated framework extraction...\n');
    
    // Try to use existing Chrome profile if available
    const userDataDir = process.env.CHROME_USER_DATA || undefined;
    
    const browser = await puppeteer.launch({
        headless: false, // Show browser so you can log in if needed
        defaultViewport: { width: 1920, height: 1080 },
        userDataDir: userDataDir,
        args: userDataDir ? [] : ['--disable-blink-features=AutomationControlled']
    });

    try {
        const page = await browser.newPage();
        
        console.log('📖 Navigating to artifact...');
        console.log('⏳ If you see a login page, please log in manually...\n');
        
        await page.goto(ARTIFACT_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Check if we're on a login/verification page
        const pageContent = await page.content();
        if (pageContent.includes('Verifying you are human') || pageContent.includes('login')) {
            console.log('⚠️  Detected login/verification page.');
            console.log('⏳ Waiting 30 seconds for you to complete login/verification...');
            console.log('   (The browser window is open - please complete any login steps)\n');
            await page.waitForTimeout(30000);
            
            // Try navigating again
            await page.goto(ARTIFACT_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        }
        
        // Wait for content to load
        await page.waitForTimeout(5000);
        
        // Wait for actual content (not just Cloudflare)
        try {
            await page.waitForSelector('body', { timeout: 10000 });
            const bodyText = await page.evaluate(() => document.body.innerText);
            if (bodyText.includes('Verifying you are human') || bodyText.length < 100) {
                console.log('⚠️  Still on verification page. Waiting additional 20 seconds...');
                await page.waitForTimeout(20000);
            }
        } catch (e) {
            console.log('⏳ Waiting for page to load...');
            await page.waitForTimeout(5000);
        }
        
        console.log('🔍 Extracting framework structure...\n');
        
        // Inject extraction script
        const extractionResult = await page.evaluate(() => {
            // Comprehensive extraction function
            function extractAllContent() {
                const results = {
                    headings: [],
                    lists: [],
                    paragraphs: [],
                    structured: [],
                    fullText: document.body.innerText,
                    html: document.body.innerHTML.substring(0, 50000) // First 50k chars
                };
                
                // Extract headings with hierarchy
                document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                    results.headings.push({
                        level: parseInt(heading.tagName.charAt(1)),
                        text: heading.textContent.trim(),
                        id: heading.id,
                        className: heading.className
                    });
                });
                
                // Extract all lists
                document.querySelectorAll('ul, ol').forEach(list => {
                    const items = Array.from(list.querySelectorAll('li')).map(li => ({
                        text: li.textContent.trim(),
                        html: li.innerHTML,
                        children: Array.from(li.querySelectorAll('ul li, ol li')).map(child => ({
                            text: child.textContent.trim()
                        }))
                    }));
                    results.lists.push({
                        type: list.tagName.toLowerCase(),
                        items: items
                    });
                });
                
                // Extract paragraphs
                document.querySelectorAll('p').forEach(p => {
                    const text = p.textContent.trim();
                    if (text.length > 20) {
                        results.paragraphs.push(text);
                    }
                });
                
                // Try to find structured content (steps, sections, etc.)
                const stepPatterns = [
                    /^\d+[\.\)]\s*(.+)/,
                    /^Step\s+\d+[:\-]\s*(.+)/i,
                    /^\d+\.\s*(.+)/,
                    /^[•\-\*]\s*(.+)/,
                    /^[A-Z][a-z]+\s+\d+[:\-]\s*(.+)/i
                ];
                
                const allText = document.body.innerText.split('\n');
                allText.forEach((line, index) => {
                    const trimmed = line.trim();
                    if (trimmed.length < 5 || trimmed.length > 500) return;
                    
                    for (const pattern of stepPatterns) {
                        const match = trimmed.match(pattern);
                        if (match) {
                            results.structured.push({
                                index: index,
                                text: trimmed,
                                extracted: match[1] || trimmed,
                                context: allText.slice(Math.max(0, index - 2), index + 3).join(' | ')
                            });
                            break;
                        }
                    }
                });
                
                // Also look for specific class names or IDs that might indicate steps
                document.querySelectorAll('[class*="step"], [class*="item"], [id*="step"], [data-step]').forEach(el => {
                    results.structured.push({
                        type: 'element',
                        text: el.textContent.trim(),
                        className: el.className,
                        id: el.id
                    });
                });
                
                return results;
            }
            
            return extractAllContent();
        });
        
        // Save raw extraction
        const outputFile = 'framework-extraction.json';
        fs.writeFileSync(outputFile, JSON.stringify(extractionResult, null, 2));
        console.log(`✅ Raw extraction saved to ${outputFile}\n`);
        
        // Now process with Claude API
        console.log('🤖 Processing with Claude API...\n');
        
        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
        
        const prompt = `You are helping to extract and structure an onboarding framework from extracted web content.

I have extracted content from a Claude artifact that contains a multi-level onboarding framework. Please:

1. Analyze ALL the extracted data (headings, lists, paragraphs, structured content)
2. Identify every step in the framework, including sub-steps and nested items
3. Extract clear titles and descriptions for each step
4. Determine appropriate categories (preparation, training, documentation, integration, review, or other)
5. Assign logical step_order numbers
6. Handle hierarchical/nested structures appropriately

Here's the extracted data:
${JSON.stringify(extractionResult, null, 2)}

Return ONLY a valid JSON array in this exact format (no markdown, no code blocks, just the array):
[
  {
    "title": "Step title",
    "description": "Step description or what needs to be done",
    "category": "preparation",
    "step_order": 1
  }
]

Categories must be one of: preparation, training, documentation, integration, review, other
Make sure to extract ALL steps, including nested/sub-steps.`;

        const message = await client.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 8192,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const responseText = message.content[0].text;
        
        // Extract JSON from response
        let jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            // Try to find JSON in code blocks
            jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
            if (jsonMatch) {
                jsonMatch = [jsonMatch[0], jsonMatch[1]];
            }
        }
        
        if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const steps = JSON.parse(jsonStr);
            
            console.log(`✅ Successfully extracted ${steps.length} steps!\n`);
            console.log('📋 Framework Steps:\n');
            
            steps.forEach((step, idx) => {
                console.log(`${idx + 1}. ${step.title} [${step.category}]`);
                if (step.description) {
                    console.log(`   ${step.description.substring(0, 100)}${step.description.length > 100 ? '...' : ''}`);
                }
                console.log();
            });
            
            // Save formatted steps
            const formattedFile = 'formatted-steps.json';
            fs.writeFileSync(formattedFile, JSON.stringify(steps, null, 2));
            console.log(`💾 Formatted steps saved to ${formattedFile}\n`);
            
            // Update seed.js
            await updateSeedFile(steps);
            
            console.log('✅ Done! Framework extracted and seed.js updated.');
            console.log('\nNext steps:');
            console.log('  1. Review formatted-steps.json');
            console.log('  2. Run: npm run seed');
            console.log('  3. Run: npm start');
            
        } else {
            console.error('❌ Could not parse JSON from Claude response');
            console.log('Response:', responseText.substring(0, 500));
            fs.writeFileSync('claude-response.txt', responseText);
            console.log('\nFull response saved to claude-response.txt');
        }
        
    } catch (error) {
        console.error('❌ Error during extraction:', error.message);
        console.error(error.stack);
    } finally {
        console.log('\n⏳ Keeping browser open for 5 seconds for review...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await browser.close();
    }
}

async function updateSeedFile(steps) {
    const seedFile = path.join(__dirname, 'seed.js');
    let seedContent = fs.readFileSync(seedFile, 'utf8');
    
    // Find the defaultSteps array
    const startMarker = 'const defaultSteps = [';
    const endMarker = '];';
    
    const startIndex = seedContent.indexOf(startMarker);
    if (startIndex === -1) {
        console.log('⚠️ Could not find defaultSteps in seed.js, creating new format...');
        return;
    }
    
    const before = seedContent.substring(0, startIndex + startMarker.length);
    const afterIndex = seedContent.indexOf(endMarker, startIndex);
    const after = seedContent.substring(afterIndex);
    
    // Generate new steps array
    const newStepsArray = steps.map(step => {
        return `    {
        title: ${JSON.stringify(step.title)},
        description: ${JSON.stringify(step.description || '')},
        category: ${JSON.stringify(step.category)},
        step_order: ${step.step_order}
    }`;
    }).join(',\n');
    
    const newContent = before + '\n' + newStepsArray + '\n' + after;
    
    // Backup original
    fs.writeFileSync(seedFile + '.backup', seedContent);
    fs.writeFileSync(seedFile, newContent);
    
    console.log('✅ seed.js updated (backup saved as seed.js.backup)');
}

// Run extraction
extractFramework().catch(console.error);
