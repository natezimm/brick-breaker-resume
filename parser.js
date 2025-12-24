// Lazy-load Mammoth library on first use
let mammothPromise = null;

async function loadMammoth() {
    if (mammothPromise) return mammothPromise;

    mammothPromise = new Promise((resolve, reject) => {
        // Return existing if already loaded
        if (window.mammoth) {
            resolve(window.mammoth);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js';
        script.async = true;
        script.onload = () => resolve(window.mammoth);
        script.onerror = () => reject(new Error('Failed to load Mammoth library'));
        document.head.appendChild(script);
    });

    return mammothPromise;
}

export async function extractTextFromFile(file) {
    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType !== 'docx') {
        console.error("Please upload a .docx file only.");
        return [];
    }

    // Lazy-load Mammoth when needed
    const mammoth = await loadMammoth();

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const result = await mammoth.convertToHtml({ arrayBuffer: reader.result });
            const html = result.value;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const elements = [];
            doc.body.childNodes.forEach(node => {
                if (node.nodeType === 1) {
                    const tag = node.tagName.toLowerCase();
                    const text = node.textContent.trim();

                    const blocks = text.split(/[\n•]/).map(block => block.trim()).filter(block => block.length > 0);
                    blocks.forEach(block => {
                        elements.push({ tag, text: block });
                    });
                }
            });

            resolve(elements);
        };

        reader.readAsArrayBuffer(file);
    });
}