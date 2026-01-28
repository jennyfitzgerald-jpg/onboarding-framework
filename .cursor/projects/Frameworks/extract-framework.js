// Browser Console Script to Extract Framework Steps
// Run this in your browser console while viewing the Claude artifact

(function() {
    console.log('Extracting framework steps...');
    
    // Try to find the framework content in various possible structures
    const extractors = [
        // Method 1: Look for common framework structures
        () => {
            const content = document.body.innerText || document.body.textContent;
            const lines = content.split('\n').filter(line => line.trim());
            return lines;
        },
        
        // Method 2: Look for list items
        () => {
            const items = Array.from(document.querySelectorAll('li, .step, [data-step]'));
            return items.map(item => item.textContent.trim());
        },
        
        // Method 3: Look for headings and following content
        () => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            const steps = [];
            headings.forEach(heading => {
                const text = heading.textContent.trim();
                if (text && (text.match(/step|framework|onboard/i) || text.match(/^\d+\./))) {
                    steps.push(text);
                    // Get following paragraph
                    let next = heading.nextElementSibling;
                    if (next && next.tagName === 'P') {
                        steps.push('  ' + next.textContent.trim());
                    }
                }
            });
            return steps;
        },
        
        // Method 4: Look for markdown-like structures
        () => {
            const pre = document.querySelector('pre, code');
            if (pre) {
                return pre.textContent.split('\n').filter(line => line.trim());
            }
            return [];
        }
    ];
    
    let extractedData = [];
    
    for (const extractor of extractors) {
        try {
            const data = extractor();
            if (data && data.length > 0) {
                extractedData = data;
                break;
            }
        } catch (e) {
            console.error('Extractor error:', e);
        }
    }
    
    // Format and display
    console.log('\n=== EXTRACTED FRAMEWORK STEPS ===\n');
    console.log(JSON.stringify(extractedData, null, 2));
    
    // Also try to copy to clipboard
    const json = JSON.stringify(extractedData, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        console.log('\n✅ Data copied to clipboard!');
        console.log('Paste it here or save it to a file.');
    }).catch(() => {
        console.log('\n⚠️ Could not copy to clipboard. Please copy the JSON above manually.');
    });
    
    return extractedData;
})();
