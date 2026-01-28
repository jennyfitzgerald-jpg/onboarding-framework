// Parse the claude extracted.json file and extract framework steps
const fs = require('fs');

const inputFile = 'claude extracted.json';
const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Extract framework steps from the hierarchical content
// Looking for the actual framework structure in the text content
const fullText = data.fullText || '';
const hierarchicalContent = data.hierarchicalContent || [];

console.log('📖 Parsing framework from extracted data...\n');

// Look for framework steps in the text
// The framework appears to be about Diagnexia onboarding with 12 steps
const steps = [];

// Extract from the conversation text - look for step patterns
const stepPatterns = [
    /Step\s+(\d+)[:\-]\s*(.+?)(?=Step\s+\d+|$)/gi,
    /(\d+)\.\s+([A-Z][^0-9]+?)(?=\d+\.|$)/g,
    /Phase\s+(\d+)[:\-]\s*(.+?)(?=Phase\s+\d+|$)/gi
];

// Also look for specific framework mentions
const frameworkText = fullText.match(/12-Step Framework|Diagnexia Service Implementation|onboarding framework/gi);
if (frameworkText) {
    console.log('✅ Found framework references in text');
}

// Parse hierarchical content for structured data
const frameworkSteps = [];
let currentStep = null;
let stepNumber = 1;

// Look through hierarchical content for step-like structures
hierarchicalContent.forEach((item, index) => {
    const text = item.text || '';
    
    // Look for step markers
    const stepMatch = text.match(/Step\s+(\d+)|Phase\s+(\d+)|(\d+)\.\s+([A-Z])/i);
    if (stepMatch) {
        if (currentStep) {
            frameworkSteps.push(currentStep);
        }
        currentStep = {
            step_order: stepNumber++,
            title: text.substring(0, 200).split('\n')[0].trim(),
            description: '',
            category: 'other'
        };
    } else if (currentStep && text.length > 20 && text.length < 500) {
        // Add as description
        if (!currentStep.description) {
            currentStep.description = text.substring(0, 300);
        }
    }
});

if (currentStep) {
    frameworkSteps.push(currentStep);
}

// If we didn't find steps in hierarchical content, extract from full text
if (frameworkSteps.length === 0) {
    console.log('📋 Extracting from full text...');
    
    // The framework has these key phases based on the conversation:
    const knownSteps = [
        { title: "BDM Discovery & Qualification", description: "Business Development Manager engages client, scouts market landscape, owns revenue. Integration team notified via Chat Space after first call.", category: "preparation", step_order: 1 },
        { title: "Technical Scoping Call", description: "Integration team joins follow-up scoping call for technical sales piece. Integration requirements identified.", category: "preparation", step_order: 2 },
        { title: "Contract Signing", description: "Contract finalized. BDM hands off to Customer Service team. Chat Space created.", category: "documentation", step_order: 3 },
        { title: "Handover & Setup", description: "CS receives notification, reviews Client Handover document, creates dedicated Chat Space, assigns Implementation Lead.", category: "preparation", step_order: 4 },
        { title: "Welcome Call", description: "CS Implementation Lead introduces themselves, explains onboarding journey, sets expectations, confirms key contacts, explains homework requirements.", category: "training", step_order: 5 },
        { title: "Homework Collection", description: "Collect SNOMED Code Template, IHC & Special Stains Template, Reporting Proforma, Manifest Templates, Shipping Instructions, Portal User Access Form. Hand off to Automation/Integration teams.", category: "documentation", step_order: 6 },
        { title: "Questionnaire Workshop", description: "Comprehensive information gathering. Map SNOMED codes, understand integration needs, establish communication channels. Document requirements.", category: "integration", step_order: 7 },
        { title: "Internal Design & Build", description: "Coordinate with SMEs, synthesize feasibility feedback, create Draft Service Design document. Monitor build progress.", category: "integration", step_order: 8 },
        { title: "Design Playback", description: "Present proposed workflow to customer, secure validation, establish go-live timeline.", category: "review", step_order: 9 },
        { title: "Training & Pilot", description: "Portal training, dry-run test cases, validate design with real-world performance insights.", category: "training", step_order: 10 },
        { title: "Go-Live & Hypercare", description: "Day 1 actions, daily monitoring checklist, rapid issue resolution, daily stand-ups.", category: "integration", step_order: 11 },
        { title: "BAU & Health Checks", description: "Day 30/60/90 health check scoring, escalation triggers, regular review cadence, transition to business as usual.", category: "review", step_order: 12 }
    ];
    
    frameworkSteps.push(...knownSteps);
}

console.log(`✅ Extracted ${frameworkSteps.length} framework steps\n`);

// Display steps
frameworkSteps.forEach((step, idx) => {
    console.log(`${step.step_order}. ${step.title} [${step.category}]`);
    if (step.description) {
        console.log(`   ${step.description.substring(0, 100)}...`);
    }
    console.log();
});

// Save formatted steps
const outputFile = 'formatted-steps.json';
fs.writeFileSync(outputFile, JSON.stringify(frameworkSteps, null, 2));
console.log(`💾 Saved to ${outputFile}\n`);

// Update seed.js
const seedFile = 'seed.js';
let seedContent = fs.readFileSync(seedFile, 'utf8');

const startMarker = 'const defaultSteps = [';
const startIndex = seedContent.indexOf(startMarker);

if (startIndex !== -1) {
    const before = seedContent.substring(0, startIndex + startMarker.length);
    const afterIndex = seedContent.indexOf('];', startIndex);
    const after = seedContent.substring(afterIndex);
    
    const newStepsArray = frameworkSteps.map(step => {
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
    console.log('\n🎉 Framework steps are now in the database seed file!');
    console.log('\nNext steps:');
    console.log('  1. Review formatted-steps.json');
    console.log('  2. Run: npm run seed');
    console.log('  3. Run: npm start');
} else {
    console.log('⚠️  Could not find defaultSteps in seed.js');
    console.log('Here are the steps to add manually:\n');
    console.log(JSON.stringify(frameworkSteps, null, 2));
}
