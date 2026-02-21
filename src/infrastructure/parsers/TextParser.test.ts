import { expect, test, describe } from "bun:test";
import { TextParser } from "./TextParser";

describe("TextParser", () => {
  const parser = new TextParser();

  test("should parse a basic text project structure", async () => {
    const text = `
# My Text Project
## Planning
### Project Setup
Initialize bun project
- [ ] Install deps
- [x] Configure tsconfig
@targetDate 2024-01-15
    `;
    const result = await parser.parse(text);

    expect(result.name).toBe("My Text Project");
    expect(result.tasks[0].title).toBe("Project Setup");
    expect(result.tasks[0].area).toBe("Planning");
    expect(result.tasks[0].targetDate).toBe("2024-01-15");
    expect(result.tasks[0].checklists).toContain("Install deps");
  });
});
