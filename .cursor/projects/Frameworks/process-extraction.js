// Node.js script to process the extracted framework JSON
// Run: node process-extraction.js framework-extraction.json

const fs = require('fs');
const path = require('path');

const jsonFile = process.argv[2] || 'framework-extraction.json';

if (!fs.existsSync(jsonFile)) {
    console.error(`❌ File not found: ${jsonFile}`);
    console.log('\nUsage: node process-extraction.js <extracted-json-file>');
    process.exit(1);
}

console.log(`📖 Reading ${jsonFile}...\n`);

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

// Process hierarchical content into steps
function processHierarchicalContent(content) {
    const steps = [];
    let currentStep = null;
    let stepOrder = 1;
    
    content.forEach((item, index) => {
        const text = item.text.trim();
        
        // Skip very short or very long items
        if (text.length < 5 || text.length > 500) return;
        
        // Detect step markers
        const stepMatch = text.match(/^(\d+)[\.\)]\s*(.+)/);
        const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(item.type);
        const isListItem = item.type === 'li';
        
        // If we find a new step
        if (stepMatch || (isHeading && text.length < 100) || (isListItem && item.level <= 2)) {
            // Save previous step if exists
            if (currentStep) {
                steps.push(currentStep);
            }
            
            // Create new step
            const stepTitle = stepMatch ? stepMatch[2] : text;
            currentStep = {
                title: stepTitle.substring(0, 200),
                description: '',
                category: 'other',
                step_order: stepOrder++
            };
            
            // Try to determine category from text
            const titleLower = stepTitle.toLowerCase();
            if (titleLower.match(/prep|before|setup|initial/i)) {
                currentStep.category = 'preparation';
            } else if (titleLower.match(/train|learn|teach|course/i)) {
                currentStep.category = 'training';
            } else if (titleLower.match(/doc|paper|form|contract/i)) {
                currentStep.category = 'documentation';
            } else if (titleLower.match(/team|intro|meet|integrate|social/i)) {
                currentStep.category = 'integration';
            } else if (titleLower.match(/review|check|evaluate|assess/i)) {
                currentStep.category = 'review';
            }
        } else if (currentStep && text.length > 20) {
            // Add as description to current step
            if (currentStep.description) {
                currentStep.description += ' ' + text;
            } else {
                currentStep.description = text;
            }
        }
    });
    
    // Add last step
    if (currentStep) {
        steps.push(currentStep);
    }
    
    return steps;
}

// Process the data
console.log('🔄 Processing hierarchical structure...\n');

let steps = [];

// Method 1: Use hierarchical content
if (data.hierarchicalContent && data.hierarchicalContent.length > 0) {
    steps = processHierarchicalContent(data.hierarchicalContent);
    console.log(`✅ Extracted ${steps.length} steps from hierarchical content`);
}

// Method 2: Use numbered steps pattern
if (steps.length === 0 && data.patterns && data.patterns.numberedSteps) {
    steps = data.patterns.numberedSteps.map((step, idx) => ({
        title: step.text.substring(0, 200).split('\n')[0],
        description: step.text.substring(200, 500) || '',
        category: 'other',
        step_order: idx + 1
    }));
    console.log(`✅ Extracted ${steps.length} steps from numbered steps pattern`);
}

// Method 3: Use headings
if (steps.length === 0 && data.patterns && data.patterns.headings) {
    steps = data.patterns.headings
        .filter(h => h.text.length > 5 && h.text.length < 200)
        .map((heading, idx) => ({
            title: heading.text,
            description: heading.nextSibling || '',
            category: 'other',
            step_order: idx + 1
        }));
    console.log(`✅ Extracted ${steps.length} steps from headings pattern`);
}

// Display results
console.log('\n📋 Extracted Steps:\n');
steps.forEach((step, idx) => {
    console.log(`${idx + 1}. ${step.title}`);
    if (step.description) {
        console.log(`   ${step.description.substring(0, 100)}...`);
    }
    console.log(`   Category: ${step.category}\n`);
});

// Generate seed.js format
const seedFormat = steps.map(step => ({
    title: step.title,
    description: step.description || '',
    category: step.category,
    step_order: step.step_order
}));

// Save to file
const outputFile = 'extracted-steps.json';
fs.writeFileSync(outputFile, JSON.stringify(seedFormat, null, 2));
console.log(`\n💾 Saved to ${outputFile}`);
console.log('\n📝 Copy this into seed.js defaultSteps array:\n');
console.log(JSON.stringify(seedFormat, null, 2));
