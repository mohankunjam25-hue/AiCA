import { describe, it, expect } from 'vitest';
import { executeLocally, executeSuiteInSandbox } from '../apps/worker/src/services/local-runner.service.js';
import { UniversalDriverService } from '../packages/shared/dist/index.js';

describe('Universal AST Driver & Impenetrable Sandbox Evaluation', () => {
  describe('1. Universal AST Signature Detection', () => {
    it('should accurately detect Python class method and parameters', () => {
      const code = `
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        pass
`;
      const detected = UniversalDriverService.detectSignature(code, 'python');
      expect(detected).not.toBeNull();
      expect(detected?.functionName).toBe('invertTree');
      expect(detected?.className).toBe('Solution');
      expect(detected?.isClassMethod).toBe(true);
      expect(detected?.params).toEqual(['root']);
    });

    it('should accurately detect JavaScript function and arrow syntax', () => {
      const code1 = 'function numIslands(grid) { return 0; }';
      const det1 = UniversalDriverService.detectSignature(code1, 'javascript');
      expect(det1?.functionName).toBe('numIslands');
      expect(det1?.params).toEqual(['grid']);

      const code2 = 'var reverseList = (head) => null;';
      const det2 = UniversalDriverService.detectSignature(code2, 'javascript');
      expect(det2?.functionName).toBe('reverseList');
      expect(det2?.params).toEqual(['head']);
    });
  });

  describe('2. Complex Tree Data Structure Execution (TreeNode BFS)', () => {
    it('should deserialize, invert, and serialize Binary Tree in Python', async () => {
      const pyCode = `
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
`;
      const res = await executeLocally({
        language: 'python',
        code: pyCode,
        stdin: '[4,2,7,1,3,6,9]',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('[4,7,2,9,6,3,1]');
    });

    it('should execute Binary Tree in JavaScript using level-order BFS', async () => {
      const jsCode = `
var invertTree = function(root) {
    if (!root) return null;
    const temp = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(temp);
    return root;
};
`;
      const res = await executeLocally({
        language: 'javascript',
        code: jsCode,
        stdin: '[4,2,7,1,3,6,9]',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('[4,7,2,9,6,3,1]');
    });

    it('should execute Binary Tree in C++ with single compilation', async () => {
      const cppCode = `
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* temp = root->left;
        root->left = invertTree(root->right);
        root->right = invertTree(temp);
        return root;
    }
};
`;
      const res = await executeLocally({
        language: 'cpp',
        code: cppCode,
        stdin: '[4,2,7]',
        timeoutMs: 5000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('[4,7,2]');
    });
  });

  describe('3. Singly-Linked List Execution (ListNode Chain)', () => {
    it('should deserialize, reverse, and serialize Linked List in Python', async () => {
      const pyCode = `
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        curr = head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev
`;
      const res = await executeLocally({
        language: 'python',
        code: pyCode,
        stdin: '[1,2,3,4,5]',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('[5,4,3,2,1]');
    });

    it('should deserialize and reverse Linked List in JavaScript', async () => {
      const jsCode = `
function reverseList(head) {
    let prev = null;
    let curr = head;
    while (curr) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}
`;
      const res = await executeLocally({
        language: 'javascript',
        code: jsCode,
        stdin: '[1,2,3]',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('[3,2,1]');
    });

    it('should reverse Linked List in C++', async () => {
      const cppCode = `
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};
`;
      const res = await executeLocally({
        language: 'cpp',
        code: cppCode,
        stdin: '[1,2,3]',
        timeoutMs: 5000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('[3,2,1]');
    });
  });

  describe('4. 2D Matrix & Graph Problem Execution', () => {
    it('should execute 2D Matrix Number of Islands algorithm in Python', async () => {
      const pyCode = `
class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        if not grid:
            return 0
        count = 0
        for r in range(len(grid)):
            for c in range(len(grid[0])):
                if grid[r][c] == "1":
                    count += 1
                    self.dfs(grid, r, c)
        return count

    def dfs(self, grid, r, c):
        if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]) or grid[r][c] != "1":
            return
        grid[r][c] = "0"
        self.dfs(grid, r+1, c)
        self.dfs(grid, r-1, c)
        self.dfs(grid, r, c+1)
        self.dfs(grid, r, c-1)
`;
      const gridInput = '[["1","1","0"],["1","1","0"],["0","0","1"]]';
      const res = await executeLocally({
        language: 'python',
        code: pyCode,
        stdin: gridInput,
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('2');
    });
  });

  describe('5. In-Place Mutation Support', () => {
    it('should serialize mutated first argument when function returns None in Python', async () => {
      const pyCode = `
class Solution:
    def sortColors(self, nums: list[int]) -> None:
        nums.sort()
`;
      const res = await executeLocally({
        language: 'python',
        code: pyCode,
        stdin: '[2,0,2,1,1,0]',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('[0,0,1,1,2,2]');
    });
  });

  describe('6. Impenetrable Security Isolation & Host Defense', () => {
    it('should strip host environment variables, preventing secret leakage', async () => {
      const pyCode = `
import os
val = os.environ.get("SUPER_SECRET_DATABASE_URL", "NOT_FOUND")
print(val)
`;
      process.env.SUPER_SECRET_DATABASE_URL = 'postgres://admin:secretpassword@internal:5432';
      const res = await executeLocally({
        language: 'python',
        code: pyCode,
        stdin: '',
        timeoutMs: 2000
      });

      delete process.env.SUPER_SECRET_DATABASE_URL;
      expect(res.stdout.trim()).toBe('NOT_FOUND');
    });

    it('should evaluate a complete suite of tree test cases with short-circuiting', async () => {
      const pyCode = `
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
`;
      const outcome = await executeSuiteInSandbox({
        language: 'python',
        code: pyCode,
        testCases: [
          { id: 't1', index: 1, isPublic: true, stdin: '[4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]' },
          { id: 't2', index: 2, isPublic: true, stdin: '[2,1,3]', expectedOutput: '[2,3,1]' },
          { id: 't3', index: 3, isPublic: false, stdin: '[]', expectedOutput: '[]' }
        ],
        timeoutMs: 2000
      });

      expect(outcome.verdict).toBe('ACCEPTED');
      expect(outcome.passedCount).toBe(3);
      expect(outcome.totalCount).toBe(3);
    });
  });
});
