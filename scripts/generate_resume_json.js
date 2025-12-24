const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const resumePath = path.join(__dirname, '../public/assets/Nathan Zimmerman Resume.docx');
const outputPath = path.join(__dirname, '../public/assets/resume.json');

async function convert() {
    console.log(`Reading ${resumePath}...`);
    try {
        const buffer = fs.readFileSync(resumePath);

        console.log('Converting to HTML...');
        const result = await mammoth.convertToHtml({ buffer: buffer });
        const html = result.value;

        console.log('Parsing HTML...');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const elements = [];
        doc.body.childNodes.forEach(node => {
            if (node.nodeType === 1) { // ELEMENT_NODE
                const tag = node.tagName.toLowerCase();
                const text = node.textContent.trim();

                const blocks = text.split(/[\n•]/).map(block => block.trim()).filter(block => block.length > 0);
                blocks.forEach(block => {
                    elements.push({ tag, text: block });
                });
            }
        });

        console.log(`Writing ${elements.length} elements to ${outputPath}...`);
        fs.writeFileSync(outputPath, JSON.stringify(elements, null, 2));
        console.log('Done.');
    } catch (error) {
        console.error('Error processing resume:', error);
        process.exit(1);
    }
}

convert();
