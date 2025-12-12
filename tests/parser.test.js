import { extractTextFromFile } from '../parser.js';

describe('extractTextFromFile', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('rejects non-docx files gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await extractTextFromFile(new File(['data'], 'file.txt'));

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('parses docx content into tagged blocks', async () => {
    const html = 'Loose text<p>Heading</p><p>Line one\n•Bullet entry</p>';
    window.mammoth = { convertToHtml: jest.fn().mockResolvedValue({ value: html }) };

    class MockFileReader {
      constructor() {
        this.onload = null;
      }

      readAsArrayBuffer() {
        this.result = new ArrayBuffer(8);
        if (this.onload) {
          this.onload();
        }
      }
    }

    global.FileReader = MockFileReader;

    const elements = await extractTextFromFile(new File(['data'], 'resume.docx'));

    expect(window.mammoth.convertToHtml).toHaveBeenCalled();
    expect(elements).toEqual([
      { tag: 'p', text: 'Heading' },
      { tag: 'p', text: 'Line one' },
      { tag: 'p', text: 'Bullet entry' },
    ]);
  });
});
