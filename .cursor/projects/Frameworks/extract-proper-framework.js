// Extract the proper Diagnexia onboarding framework from the conversation
const fs = require('fs');

// Based on the conversation, here's the actual 12-step framework
const frameworkSteps = [
    {
        title: "BDM Discovery & Qualification",
        description: "Business Development Manager engages client, scouts market landscape, owns revenue. Integration team notified via Chat Space immediately after first call.",
        category: "preparation",
        step_order: 1
    },
    {
        title: "Technical Scoping Call",
        description: "Integration team joins follow-up scoping call for technical sales piece. Integration requirements identified and documented.",
        category: "preparation",
        step_order: 2
    },
    {
        title: "Contract Signing",
        description: "Contract finalized and signed. BDM hands off to Customer Service team. Dedicated Chat Space created for client.",
        category: "documentation",
        step_order: 3
    },
    {
        title: "Handover & Setup",
        description: "CS receives notification in Chat Space that contract is signed. Review Client Handover document from BDM. Create/join dedicated client Chat Space. Assign Implementation Lead. Review tier classification (Strategic/Standard/Low-Touch).",
        category: "preparation",
        step_order: 4
    },
    {
        title: "Welcome Call",
        description: "Schedule Welcome Call with customer. Introduce yourself and role, explain onboarding journey, set expectations on timeline, confirm key contacts, explain homework requirements. Send Welcome Pack email with SNOMED Code Template, IHC & Special Stains Template, Reporting Proforma Request, Manifest Templates, Shipping Instructions, Portal User Access Form, Portal Manual.",
        category: "training",
        step_order: 5
    },
    {
        title: "Homework Collection",
        description: "Collect SNOMED Code Template, IHC & Special Stains Template, Reporting Proforma, Manifest Templates, Shipping Instructions, Portal User Access Form. Validate and hand off to Automation Team (SNOMED list), Integration Team (integration requirements), Path Management (reporting specs), Case Control (routing rules), Lab Ops (logistics). Set chase schedule if not received.",
        category: "documentation",
        step_order: 6
    },
    {
        title: "Questionnaire Workshop",
        description: "Comprehensive information gathering session. Map SNOMED codes, understand integration needs, establish clear communication channels with customer. Document all requirements. Post-workshop handoffs to specialized teams.",
        category: "integration",
        step_order: 7
    },
    {
        title: "Internal Design & Build",
        description: "Coordinate with SMEs (Subject Matter Experts). Synthesize feasibility feedback. Create Draft Service Design document. Monitor build progress across all teams (Automation, Integration, Path Management, Case Control, Lab Ops).",
        category: "integration",
        step_order: 8
    },
    {
        title: "Design Playback",
        description: "Present proposed workflow to customer. Walk through entire service design. Secure customer validation and sign-off. Establish concrete go-live timeline.",
        category: "review",
        step_order: 9
    },
    {
        title: "Training & Pilot",
        description: "Portal training for customer users. Dry-run test cases. Validate design with real-world performance insights. Monitor pilot cases closely.",
        category: "training",
        step_order: 10
    },
    {
        title: "Go-Live & Hypercare",
        description: "Day 1 actions and monitoring. Daily stand-ups for rapid issue resolution. Intensive monitoring during initial implementation period. Daily monitoring checklist.",
        category: "integration",
        step_order: 11
    },
    {
        title: "BAU & Health Checks",
        description: "Day 30/60/90 health check scoring with weighted criteria. Escalation triggers (Day 30 → SX Lead, Day 60 → Mike, Day 90 → Jenny). Regular review cadence. Transition to business as usual operations.",
        category: "review",
        step_order: 12
    }
];

console.log('📋 Diagnexia Onboarding Framework - 12 Steps\n');
frameworkSteps.forEach((step, idx) => {
    console.log(`${step.step_order}. ${step.title} [${step.category}]`);
    console.log(`   ${step.description.substring(0, 120)}...`);
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
    fs.writeFileSync(seedFile + '.backup2', seedContent);
    fs.writeFileSync(seedFile, newContent);
    
    console.log('✅ seed.js updated with proper framework (backup saved as seed.js.backup2)');
    console.log('\n🎉 Framework is ready!');
    console.log('\nNext steps:');
    console.log('  1. Review formatted-steps.json');
    console.log('  2. Run: npm run seed');
    console.log('  3. Run: npm start');
    console.log('  4. Open: http://localhost:3000');
} else {
    console.log('⚠️  Could not find defaultSteps in seed.js');
}
