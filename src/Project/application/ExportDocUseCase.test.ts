import { expect, test, describe } from "bun:test";
import { ExportDocUseCase } from "./ExportDocUseCase";
import { DocTreeNode } from "./GetDocTreeUseCase";

describe("ExportDocUseCase", () => {
  const useCase = new ExportDocUseCase();

  const mockTree: DocTreeNode[] = [
    {
      id: 1,
      user_id: "user1",
      project_id: 1,
      title: "Project Scope",
      parent_id: null,
      current_version_id: 1,
      current_content: "This is the scope.",
      children: [
        {
          id: 2,
          user_id: "user1",
          project_id: 1,
          title: "Technical Requirements",
          parent_id: 1,
          current_version_id: 2,
          current_content: "Node.js, Bun.",
          children: []
        }
      ]
    },
    {
      id: 3,
      user_id: "user1",
      project_id: 1,
      title: "Project Budget",
      parent_id: null,
      current_version_id: 3,
      current_content: "1000 USD",
      children: []
    }
  ];

  test("should export documentation to markdown string", async () => {
    const result = await useCase.execute(mockTree);
    
    expect(result).toContain("# Project Scope");
    expect(result).toContain("This is the scope.");
    expect(result).toContain("## Technical Requirements");
    expect(result).toContain("Node.js, Bun.");
    expect(result).toContain("# Project Budget");
    expect(result).toContain("1000 USD");
  });

  test("should sanitize titles", async () => {
    const treeWithBadTitle: DocTreeNode[] = [{
      id: 4,
      user_id: "user1",
      project_id: 1,
      title: "Title #with* bad_chars",
      parent_id: null,
      current_version_id: 4,
      current_content: "content",
      children: []
    }];
    
    const result = await useCase.execute(treeWithBadTitle);
    expect(result).toContain("# Title with badchars");
  });
});
