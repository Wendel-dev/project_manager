import { expect, test, describe } from "bun:test";
import { MarkdownParser } from "./MarkdownParser";

describe("MarkdownParser", () => {
  const parser = new MarkdownParser();

  test("should parse a basic project structure", async () => {
    const md = `
# My Project
## Development
### Task 1
This is a description
- [ ] Subtask 1
- [x] Subtask 2
@targetDate 2023-12-31

### Task 2
Another task
    `;
    const result = await parser.parse(md);

    expect(result.name).toBe("My Project");
    expect(result.tasks.length).toBe(2);
    expect(result.tasks[0].title).toBe("Task 1");
    expect(result.tasks[0].area).toBe("Development");
    expect(result.tasks[0].description).toContain("This is a description");
    expect(result.tasks[0].targetDate).toBe("2023-12-31");
    expect(result.tasks[0].checklists).toContain("[ ] Subtask 1");
    expect(result.tasks[0].checklists).toContain("[x] Subtask 2");
  });

  test("should handle missing H1", async () => {
    const md = `
## Area
### Task
    `;
    const result = await parser.parse(md);
    expect(result.name).toBe("Nova Fase");
    expect(result.tasks[0].title).toBe("Task");
  });
});
