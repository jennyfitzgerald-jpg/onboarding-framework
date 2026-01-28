// Advanced Browser Console Script to Extract Hierarchical Framework Steps
// Run this in your browser console while viewing the Claude artifact
// This handles nested/multi-level structures

(function() {
    console.log('🔍 Extracting hierarchical framework structure...\n');
    
    // Function to extract text content preserving hierarchy
    function extractHierarchicalContent(element = document.body, level = 0, path = []) {
        const results = [];
        const indent = '  '.repeat(level);
        
        // Get all meaningful elements
        const children = Array.from(element.children);
        
        for (const child of children) {
            const tagName = child.tagName.toLowerCase();
            const text = child.textContent.trim();
            const id = child.id || '';
            const className = child.className || '';
            
            // Skip script and style tags
            if (tagName === 'script' || tagName === 'style') continue;
            
            // Check if this looks like a step/heading/item
            const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);
            const isList = ['ul', 'ol'].includes(tagName);
            const isListItem = tagName === 'li';
            const hasStepMarker = text.match(/^\d+[\.\)]|^[•\-\*]|step|framework|onboard/i);
            
            if (isHeading || isListItem || hasStepMarker || (text.length > 10 && text.length < 200)) {
                const currentPath = [...path, text.substring(0, 50)];
                
                // Extract the main content
                if (text && text.length > 0) {
                    results.push({
                        level: level,
                        type: tagName,
                        text: text,
                        path: currentPath.slice(0, -1), // Parent path
                        id: id,
                        className: className
                    });
                }
                
                // Recursively process children
                if (child.children.length > 0) {
                    const childResults = extractHierarchicalContent(child, level + 1, currentPath);
                    results.push(...childResults);
                }
            } else if (child.children.length > 0) {
                // Continue recursion even if this element doesn't match
                const childResults = extractHierarchicalContent(child, level, path);
                results.push(...childResults);
            }
        }
        
        return results;
    }
    
    // Extract all content
    const allContent = extractHierarchicalContent();
    
    // Also try to get the raw HTML structure
    const htmlStructure = document.body.innerHTML;
    
    // Try to find specific patterns
    const patterns = {
        numberedSteps: [],
        bulletPoints: [],
        headings: [],
        sections: []
    };
    
    // Look for numbered lists
    document.querySelectorAll('ol li, [data-step], .step').forEach((el, idx) => {
        patterns.numberedSteps.push({
            number: idx + 1,
            text: el.textContent.trim(),
            html: el.innerHTML
        });
    });
    
    // Look for headings
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        patterns.headings.push({
            level: parseInt(heading.tagName.charAt(1)),
            text: heading.textContent.trim(),
            nextSibling: heading.nextElementSibling?.textContent.trim().substring(0, 100)
        });
    });
    
    // Look for sections/divs with specific classes
    document.querySelectorAll('[class*="step"], [class*="section"], [class*="item"], [id*="step"]').forEach(el => {
        patterns.sections.push({
            className: el.className,
            id: el.id,
            text: el.textContent.trim().substring(0, 200),
            children: Array.from(el.children).map(c => c.textContent.trim().substring(0, 100))
        });
    });
    
    // Compile results
    const result = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        hierarchicalContent: allContent,
        patterns: patterns,
        fullText: document.body.innerText,
        htmlPreview: htmlStructure.substring(0, 5000) // First 5000 chars
    };
    
    // Display results
    console.log('✅ Extraction complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Total elements extracted: ${allContent.length}`);
    console.log(`   - Numbered steps found: ${patterns.numberedSteps.length}`);
    console.log(`   - Headings found: ${patterns.headings.length}`);
    console.log(`   - Sections found: ${patterns.sections.length}\n`);
    
    console.log('📋 Hierarchical Structure:\n');
    allContent.slice(0, 50).forEach(item => { // Show first 50
        console.log('  '.repeat(item.level) + `[${item.type}] ${item.text.substring(0, 80)}`);
    });
    
    if (allContent.length > 50) {
        console.log(`\n... and ${allContent.length - 50} more items\n`);
    }
    
    // Try to copy to clipboard
    const json = JSON.stringify(result, null, 2);
    
    // Create a downloadable version
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'framework-extraction.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('\n💾 JSON file downloaded! (framework-extraction.json)');
    console.log('📋 Full JSON data:\n');
    console.log(json);
    
    // Also try clipboard
    navigator.clipboard.writeText(json).then(() => {
        console.log('\n✅ Also copied to clipboard!');
    }).catch(() => {
        console.log('\n⚠️ Could not copy to clipboard, but file was downloaded.');
    });
    
    return result;
})();
