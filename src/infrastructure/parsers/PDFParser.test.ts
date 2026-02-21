import { expect, test, describe, mock } from "bun:test";
import { PDFParser } from "./PDFParser";

// Mock pdf-parse
mock.module("pdf-parse", () => {
  return {
    PDFParse: async (buffer: Buffer) => {
      return {
        text: `
# PDF Project
### Task PDF
Description in PDF
@targetDate 2025-05-05
      `
      };
    }
  };
});

describe("PDFParser", () => {
  const parser = new PDFParser();

  test("should parse mocked PDF content", async () => {
    const result = await parser.parse(Buffer.from("dummy pdf content"));
    expect(result.name).toBe("PDF Project");
    expect(result.tasks[0].title).toBe("Task PDF");
    expect(result.tasks[0].targetDate).toBe("2025-05-05");
  });
});
