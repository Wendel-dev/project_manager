import { expect, test, describe } from "bun:test";
import { ParseDocumentUseCase } from "./ParseDocumentUseCase";

describe("ParseDocumentUseCase", () => {
  const useCase = new ParseDocumentUseCase();

  test("should select Markdown parser for .md", async () => {
    const content = "# Test Project";
    const result = await useCase.execute(content, "md");
    expect(result.name).toBe("Test Project");
  });

  test("should select Text parser for .txt", async () => {
    const content = "# Text Project";
    const result = await useCase.execute(content, "txt");
    expect(result.name).toBe("Text Project");
  });

  test("should throw for unsupported type", async () => {
    expect(useCase.execute("content", "xyz")).rejects.toThrow("Unsupported file type");
  });
});
