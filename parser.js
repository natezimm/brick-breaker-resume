export async function extractTextFromFile(file) {
    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType !== 'docx') {
        console.error("Please upload a .docx file only.");
        return [];
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const result = await window.mammoth.convertToHtml({ arrayBuffer: reader.result });
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