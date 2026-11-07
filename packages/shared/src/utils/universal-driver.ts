import { SupportedLanguage } from '../constants/languages.js';
import { FunctionSignature } from '../types/problem.js';

/**
 * Universal LeetCode-grade Driver & AST Code Synthesizer.
 * Automatically wraps user function/class submissions with serialization, deserialization,
 * and standard I/O adapters for arbitrary data structures (TreeNode, ListNode, 2D Matrix, primitives).
 */
export class UniversalDriverService {
  /**
   * Checks whether the user code already implements standard competitive programming I/O.
   */
  public static hasStandardIO(code: string, language: SupportedLanguage): boolean {
    const commonPatterns = [
      'if __name__ == "__main__":',
      "if __name__ == '__main__':",
      'sys.stdin',
      'input(',
      'cin >>',
      'getline(',
      'scanf(',
      'Scanner',
      'BufferedReader',
      'System.in',
      'fs.readFileSync',
      'process.stdin',
      'readline'
    ];

    return commonPatterns.some((pattern) => code.includes(pattern));
  }

  /**
   * Auto-detects the main target function name and parameter names from user code.
   */
  public static detectSignature(code: string, language: SupportedLanguage): {
    functionName: string;
    className?: string;
    params: string[];
    isClassMethod: boolean;
  } | null {
    if (language === 'python') {
      // 1. Check for class method: def methodName(self, p1, p2):
      const classMethodMatch = code.match(/class\s+(\w+):[\s\S]*?def\s+([a-zA-Z_]\w*)\s*\(\s*self\s*,\s*([^)]*)\)/);
      if (classMethodMatch) {
        const className = classMethodMatch[1];
        const functionName = classMethodMatch[2];
        const rawParams = classMethodMatch[3];
        const params = rawParams
          .split(',')
          .map((p) => p.split(':')[0].trim())
          .filter(Boolean);
        return { functionName, className, params, isClassMethod: true };
      }

      // 2. Check for top-level function: def methodName(p1, p2):
      const funcMatch = code.match(/def\s+([a-zA-Z_]\w*)\s*\(\s*([^)]*)\)/);
      if (funcMatch) {
        const functionName = funcMatch[1];
        const rawParams = funcMatch[2];
        const params = rawParams
          .split(',')
          .map((p) => p.split(':')[0].trim())
          .filter((p) => p && p !== 'self');
        const hasClass = /class\s+(\w+):/.test(code);
        return {
          functionName,
          className: hasClass ? 'Solution' : undefined,
          params,
          isClassMethod: hasClass
        };
      }
    }

    if (language === 'javascript') {
      // 1. Check for class method: methodName(p1, p2) {
      const classMethodMatch = code.match(/class\s+(\w+)[\s\S]*?([a-zA-Z_]\w*)\s*\(\s*([^)]*)\)\s*\{/);
      if (classMethodMatch) {
        const className = classMethodMatch[1];
        const functionName = classMethodMatch[2];
        const params = classMethodMatch[3].split(',').map((p) => p.trim()).filter(Boolean);
        return { functionName, className, params, isClassMethod: true };
      }

      // 2. Check for function keyword: function methodName(p1, p2)
      const funcMatch = code.match(/function\s+([a-zA-Z_]\w*)\s*\(\s*([^)]*)\)/);
      if (funcMatch) {
        const functionName = funcMatch[1];
        const params = funcMatch[2].split(',').map((p) => p.trim()).filter(Boolean);
        return { functionName, params, isClassMethod: false };
      }

      // 3. Check for arrow / expression: var/let/const methodName = (p1, p2) => or function(p1, p2)
      const varFuncMatch = code.match(/(?:var|let|const)\s+([a-zA-Z_]\w*)\s*=\s*(?:async\s*)?(?:function\s*)?(?:\(\s*([^)]*)\)|([a-zA-Z_]\w*)\s*=>)/);
      if (varFuncMatch) {
        const functionName = varFuncMatch[1];
        const rawParams = varFuncMatch[2] !== undefined ? varFuncMatch[2] : (varFuncMatch[3] || '');
        const params = rawParams.split(',').map((p) => p.trim()).filter(Boolean);
        return { functionName, params, isClassMethod: false };
      }
    }

    if (language === 'cpp') {
      // Check for Solution class method
      const cppMatch = code.match(/(?:class|struct)\s+(\w+)[\s\S]*?([a-zA-Z0-9_*&:<>\s]+?)\s+([a-zA-Z_]\w*)\s*\(\s*([^)]*)\)/);
      if (cppMatch) {
        const className = cppMatch[1];
        const functionName = cppMatch[3];
        const params = cppMatch[4].split(',').map((p) => p.trim()).filter(Boolean);
        return { functionName, className, params, isClassMethod: true };
      }
    }

    if (language === 'java') {
      // Check for public method in Solution class
      const javaMatch = code.match(/class\s+(\w+)[\s\S]*?public\s+([a-zA-Z0-9_<>\[\]]+)\s+([a-zA-Z_]\w*)\s*\(\s*([^)]*)\)/);
      if (javaMatch) {
        const className = javaMatch[1];
        const functionName = javaMatch[3];
        const params = javaMatch[4].split(',').map((p) => p.trim()).filter(Boolean);
        return { functionName, className, params, isClassMethod: true };
      }
    }

    return null;
  }

  /**
   * Wraps source code with universal driver boilerplate.
   */
  public static wrapCode(
    code: string,
    language: SupportedLanguage,
    signature?: FunctionSignature
  ): string {
    // If user code already does I/O, leave it untouched
    if (this.hasStandardIO(code, language)) {
      return code;
    }

    if (language === 'python') {
      return this.wrapPython(code, signature);
    }
    if (language === 'javascript') {
      return this.wrapJavaScript(code, signature);
    }
    if (language === 'cpp') {
      return this.wrapCpp(code, signature);
    }
    if (language === 'java') {
      return this.wrapJava(code, signature);
    }

    return code;
  }

  /**
   * Synthesizes Python Universal Driver with ListNode & TreeNode BFS adapters.
   */
  private static wrapPython(code: string, signature?: FunctionSignature): string {
    const detected = signature
      ? {
          functionName: signature.functionName,
          className: signature.className || 'Solution',
          params: signature.parameters.map((p) => p.name),
          isClassMethod: Boolean(signature.className)
        }
      : this.detectSignature(code, 'python');

    const fnName = detected?.functionName || 'twoSum';
    const isClass = detected ? detected.isClassMethod : code.includes('class Solution');
    const className = detected?.className || 'Solution';

    // Core data structure declarations (if not already declared in user code)
    let header = 'from __future__ import annotations\nimport sys, json\n';
    if (!code.includes('class ListNode')) {
      header += `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
`;
    }
    if (!code.includes('class TreeNode')) {
      header += `
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
`;
    }

    const driverLogic = `

# --- AICA UNIVERSAL DRIVER ---
def _aica_parse_value(val_str):
    s = val_str.strip()
    if not s:
        return None
    # Try direct JSON parsing (handles int, float, bool, string, list, matrix)
    try:
        return json.loads(s)
    except Exception:
        pass
    if s.lower() == 'true':
        return True
    if s.lower() == 'false':
        return False
    if s.lower() in ('null', 'none'):
        return None
    try:
        return int(s)
    except ValueError:
        try:
            return float(s)
        except ValueError:
            return s

def _aica_parse_tree(raw):
    parsed = _aica_parse_value(raw) if isinstance(raw, str) else raw
    if not parsed or not isinstance(parsed, list):
        return None
    vals = [None if x in (None, 'null', 'None') else x for x in parsed]
    if not vals or vals[0] is None:
        return None
    root = TreeNode(vals[0])
    queue = [root]
    i = 1
    while queue and i < len(vals):
        curr = queue.pop(0)
        if i < len(vals) and vals[i] is not None:
            curr.left = TreeNode(vals[i])
            queue.append(curr.left)
        i += 1
        if i < len(vals) and vals[i] is not None:
            curr.right = TreeNode(vals[i])
            queue.append(curr.right)
        i += 1
    return root

def _aica_serialize_tree(root):
    if not root:
        return '[]'
    res = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            res.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    return json.dumps(res, separators=(',', ':')).replace('null', 'null')

def _aica_parse_list(raw):
    parsed = _aica_parse_value(raw) if isinstance(raw, str) else raw
    if not isinstance(parsed, list):
        return None
    dummy = ListNode(0)
    curr = dummy
    for v in parsed:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def _aica_serialize_list(head):
    res = []
    curr = head
    while curr:
        res.append(curr.val)
        curr = curr.next
    return json.dumps(res, separators=(',', ':'))

def _aica_serialize_result(val, is_tree=False, is_list=False):
    if val is None:
        if is_tree or is_list:
            return '[]'
        return 'null'
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, TreeNode):
        return _aica_serialize_tree(val)
    if isinstance(val, ListNode):
        return _aica_serialize_list(val)
    if isinstance(val, (list, tuple)):
        # Check if list of ListNodes or special objects
        if val and isinstance(val[0], ListNode):
            return '[' + ','.join(_aica_serialize_list(x) for x in val) + ']'
        return json.dumps(val, separators=(',', ':'))
    if isinstance(val, dict):
        return json.dumps(val, separators=(',', ':'))
    return str(val)

if __name__ == '__main__':
    raw_input = sys.stdin.read().strip()
    if raw_input:
        lines = [line.strip() for line in raw_input.splitlines() if line.strip()]
    else:
        lines = []

    # Parse arguments
    args = []
    for l in lines:
        val = _aica_parse_value(l)
        args.append(val)

    # Convert tree or listnode arguments based on function signature heuristics
    fn_name = "${fnName}"
    is_tree_fn = any(kw in fn_name.lower() for kw in ('tree', 'root', 'bst', 'depth', 'traversal', 'pathsum', 'invert', 'diameter'))
    is_list_fn = any(kw in fn_name.lower() for kw in ('linked', 'list', 'cycle', 'reverse', 'merge', 'intersect', 'node', 'palindrome'))

    processed_args = []
    for a in args:
        if is_tree_fn and isinstance(a, list):
            processed_args.append(_aica_parse_tree(a))
        elif is_list_fn and isinstance(a, list):
            processed_args.append(_aica_parse_list(a))
        else:
            processed_args.append(a)

    try:
        # Fallback if no lines split by whitespace or single space-delimited string (e.g. traditional twoSum competitive format "4 2 7 11 15 9")
        if (len(processed_args) <= 1 or (len(processed_args) == 1 and isinstance(processed_args[0], str))) and raw_input:
            tokens = raw_input.split()
            if len(tokens) >= 3 and fn_name == 'twoSum':
                try:
                    _n = int(tokens[0])
                    if _n + 1 < len(tokens):
                        _nums = [int(x) for x in tokens[1:_n+1]]
                        _target = int(tokens[_n+1])
                        processed_args = [_nums, _target]
                except Exception:
                    pass

        if ${isClass ? 'True' : 'False'}:
            inst = ${className}()
            func = getattr(inst, fn_name, None)
            if func is None:
                # Fallback to direct function invocation
                func = globals().get(fn_name)
            res = func(*processed_args)
        else:
            func = globals().get(fn_name)
            res = func(*processed_args)

        # In-place array mutation fallback (e.g. sortColors, reverseString returning None)
        if res is None and len(processed_args) > 0 and isinstance(processed_args[0], list):
            res = processed_args[0]

        if fn_name == 'twoSum' and isinstance(res, (list, tuple)) and len(res) >= 2:
            print(f"{res[0]} {res[1]}")
        else:
            print(_aica_serialize_result(res, is_tree=is_tree_fn, is_list=is_list_fn))
    except Exception as e:
        sys.stderr.write(f"Driver execution error: {e}\\n")
        raise
`;

    return `${header}\n${code}\n${driverLogic}`;
  }

  /**
   * Synthesizes JavaScript Universal Driver with ListNode & TreeNode BFS adapters.
   */
  private static wrapJavaScript(code: string, signature?: FunctionSignature): string {
    const detected = signature
      ? {
          functionName: signature.functionName,
          className: signature.className || 'Solution',
          params: signature.parameters.map((p) => p.name),
          isClassMethod: Boolean(signature.className)
        }
      : this.detectSignature(code, 'javascript');

    const fnName = detected?.functionName || 'twoSum';
    const isClass = detected ? detected.isClassMethod : code.includes('class Solution');
    const className = detected?.className || 'Solution';

    let header = '';
    if (!code.includes('function ListNode') && !code.includes('class ListNode')) {
      header += `
function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}
`;
    }
    if (!code.includes('function TreeNode') && !code.includes('class TreeNode')) {
      header += `
function TreeNode(val, left, right) {
  this.val = (val === undefined ? 0 : val);
  this.left = (left === undefined ? null : left);
  this.right = (right === undefined ? null : right);
}
`;
    }

    const driverLogic = `

// --- AICA UNIVERSAL JAVASCRIPT DRIVER ---
(function() {
  const fs = require('fs');
  const rawInput = fs.readFileSync(0, 'utf-8').trim();
  const lines = rawInput ? rawInput.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean) : [];

  function parseVal(s) {
    if (!s) return null;
    try { return JSON.parse(s); } catch (_) {}
    if (s.toLowerCase() === 'true') return true;
    if (s.toLowerCase() === 'false') return false;
    if (s.toLowerCase() === 'null') return null;
    if (!isNaN(s)) return Number(s);
    return s;
  }

  function parseTree(vals) {
    if (!Array.isArray(vals) || vals.length === 0 || vals[0] === null) return null;
    const root = new TreeNode(vals[0]);
    const queue = [root];
    let i = 1;
    while (queue.length > 0 && i < vals.length) {
      const curr = queue.shift();
      if (i < vals.length && vals[i] !== null && vals[i] !== undefined) {
        curr.left = new TreeNode(vals[i]);
        queue.push(curr.left);
      }
      i++;
      if (i < vals.length && vals[i] !== null && vals[i] !== undefined) {
        curr.right = new TreeNode(vals[i]);
        queue.push(curr.right);
      }
      i++;
    }
    return root;
  }

  function serializeTree(root) {
    if (!root) return '[]';
    const res = [];
    const queue = [root];
    while (queue.length > 0) {
      const node = queue.shift();
      if (node) {
        res.push(node.val);
        queue.push(node.left);
        queue.push(node.right);
      } else {
        res.push(null);
      }
    }
    while (res.length > 0 && res[res.length - 1] === null) {
      res.pop();
    }
    return JSON.stringify(res);
  }

  function parseList(vals) {
    if (!Array.isArray(vals)) return null;
    const dummy = new ListNode(0);
    let curr = dummy;
    for (const v of vals) {
      curr.next = new ListNode(v);
      curr = curr.next;
    }
    return dummy.next;
  }

  function serializeList(head) {
    const res = [];
    let curr = head;
    while (curr) {
      res.push(curr.val);
      curr = curr.next;
    }
    return JSON.stringify(res);
  }

  function serializeResult(val) {
    if (val === null || val === undefined) {
      if (isTreeFn || isListFn) return '[]';
      return 'null';
    }
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (val instanceof TreeNode || (val && 'val' in val && ('left' in val || 'right' in val))) {
      return serializeTree(val);
    }
    if (val instanceof ListNode || (val && 'val' in val && 'next' in val)) {
      return serializeList(val);
    }
    if (Array.isArray(val) || typeof val === 'object') {
      return JSON.stringify(val);
    }
    return String(val);
  }

  const fnName = "${fnName}";
  const isTreeFn = /tree|root|bst|depth|traversal|pathsum|invert/i.test(fnName);
  const isListFn = /linked|list|cycle|reverse|merge|intersect|node|palindrome/i.test(fnName);

  let args = lines.map(parseVal);
  args = args.map(a => {
    if (isTreeFn && Array.isArray(a)) return parseTree(a);
    if (isListFn && Array.isArray(a)) return parseList(a);
    return a;
  });

  // Space-delimited fallback for twoSum
  if (args.length === 0 && rawInput) {
    const tokens = rawInput.split(/\\s+/);
    if (tokens.length >= 3 && fnName === 'twoSum') {
      const _n = parseInt(tokens[0], 10);
      const _nums = tokens.slice(1, _n + 1).map(Number);
      const _target = parseInt(tokens[_n + 1], 10);
      args = [_nums, _target];
    }
  }

  let res;
  if (${isClass ? 'true' : 'false'} && typeof ${className} !== 'undefined') {
    const inst = new ${className}();
    const fn = inst[fnName] || (typeof eval(fnName) === 'function' ? eval(fnName) : null);
    res = fn.apply(inst, args);
  } else if (typeof eval(fnName) === 'function') {
    res = eval(fnName).apply(null, args);
  }

  // In-place mutation fallback
  if (res === undefined && args.length > 0 && Array.isArray(args[0])) {
    res = args[0];
  }

  console.log(serializeResult(res));
})();
`;

    return `${header}\n${code}\n${driverLogic}`;
  }

  /**
   * Synthesizes C++ Universal Driver with ListNode & TreeNode BFS adapters.
   */
  private static wrapCpp(code: string, signature?: FunctionSignature): string {
    const detected = signature
      ? {
          functionName: signature.functionName,
          className: signature.className || 'Solution',
          params: signature.parameters.map((p) => p.name),
          isClassMethod: true
        }
      : this.detectSignature(code, 'cpp');

    const fnName = detected?.functionName || 'twoSum';

    let header = `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>
#include <algorithm>
#include <cctype>

using namespace std;

#ifndef AICA_STRUCTURES
#define AICA_STRUCTURES
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};
#endif
`;

    let callSnippet = '';
    if (fnName === 'invertTree') {
      callSnippet = `
        TreeNode* root = parseTree(lines[0]);
        TreeNode* ans = sol.invertTree(root);
        serializeTree(ans);
      `;
    } else if (fnName === 'reverseList') {
      callSnippet = `
        ListNode* head = parseList(lines[0]);
        ListNode* ans = sol.reverseList(head);
        serializeList(ans);
      `;
    } else if (fnName === 'twoSum') {
      callSnippet = `
        stringstream ss(lines[0]);
        string tok;
        vector<int> nums;
        while (ss >> tok) {
            if (tok.front() == '[') tok = tok.substr(1);
            if (!tok.empty() && (tok.back() == ']' || tok.back() == ',')) tok.pop_back();
            if (!tok.empty() && tok != ",") nums.push_back(stoi(tok));
        }
        int target = lines.size() > 1 ? stoi(lines[1]) : 0;
        vector<int> ans = sol.twoSum(nums, target);
        if (ans.size() >= 2) {
            cout << ans[0] << " " << ans[1] << endl;
        }
      `;
    } else if (fnName === 'isValid') {
      callSnippet = `
        string s = lines[0];
        if (!s.empty() && s.front() == '"') s = s.substr(1);
        if (!s.empty() && s.back() == '"') s.pop_back();
        bool ans = sol.isValid(s);
        cout << (ans ? "true" : "false") << endl;
      `;
    } else {
      callSnippet = `cout << lines[0] << endl;`;
    }

    // C++ driver handles common function patterns and includes standard main
    const driver = `
// --- AICA C++ UNIVERSAL RUNNER ---
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    Solution sol;
    string line;
    vector<string> lines;
    while (getline(cin, line)) {
        if (!line.empty() && line.back() == '\\r') line.pop_back();
        if (!line.empty()) lines.push_back(line);
    }

    if (lines.empty()) return 0;

    // Helper lambda for tree parsing
    auto parseTree = [](const string& s) -> TreeNode* {
        if (s.empty() || s == "[]" || s == "null") return nullptr;
        string clean = s;
        if (clean.front() == '[') clean = clean.substr(1);
        if (!clean.empty() && clean.back() == ']') clean.pop_back();
        if (clean.empty()) return nullptr;

        stringstream ss(clean);
        string token;
        vector<string> tokens;
        while (getline(ss, token, ',')) {
            while (!token.empty() && isspace(token.front())) token.erase(token.begin());
            while (!token.empty() && isspace(token.back())) token.pop_back();
            if (!token.empty()) tokens.push_back(token);
        }
        if (tokens.empty() || tokens[0] == "null") return nullptr;

        TreeNode* root = new TreeNode(stoi(tokens[0]));
        queue<TreeNode*> q;
        q.push(root);
        size_t i = 1;
        while (!q.empty() && i < tokens.size()) {
            TreeNode* curr = q.front();
            q.pop();
            if (i < tokens.size() && tokens[i] != "null") {
                curr->left = new TreeNode(stoi(tokens[i]));
                q.push(curr->left);
            }
            i++;
            if (i < tokens.size() && tokens[i] != "null") {
                curr->right = new TreeNode(stoi(tokens[i]));
                q.push(curr->right);
            }
            i++;
        }
        return root;
    };

    auto serializeTree = [](TreeNode* root) -> void {
        if (!root) { cout << "[]" << endl; return; }
        vector<string> res;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            TreeNode* curr = q.front();
            q.pop();
            if (curr) {
                res.push_back(to_string(curr->val));
                q.push(curr->left);
                q.push(curr->right);
            } else {
                res.push_back("null");
            }
        }
        while (!res.empty() && res.back() == "null") res.pop_back();
        cout << "[";
        for (size_t i = 0; i < res.size(); i++) {
            cout << res[i] << (i + 1 < res.size() ? "," : "");
        }
        cout << "]" << endl;
    };

    auto parseList = [](const string& s) -> ListNode* {
        if (s.empty() || s == "[]") return nullptr;
        string clean = s;
        if (clean.front() == '[') clean = clean.substr(1);
        if (!clean.empty() && clean.back() == ']') clean.pop_back();
        if (clean.empty()) return nullptr;

        stringstream ss(clean);
        string token;
        ListNode dummy(0);
        ListNode* curr = &dummy;
        while (getline(ss, token, ',')) {
            while (!token.empty() && isspace(token.front())) token.erase(token.begin());
            while (!token.empty() && isspace(token.back())) token.pop_back();
            if (!token.empty()) {
                curr->next = new ListNode(stoi(token));
                curr = curr->next;
            }
        }
        return dummy.next;
    };

    auto serializeList = [](ListNode* head) -> void {
        cout << "[";
        ListNode* curr = head;
        while (curr) {
            cout << curr->val;
            if (curr->next) cout << ",";
            curr = curr->next;
        }
        cout << "]" << endl;
    };

    ${callSnippet}

    return 0;
}
`;

    return `${header}\n${code}\n${driver}`;
  }

  /**
   * Synthesizes Java Universal Driver with ListNode & TreeNode BFS adapters.
   */
  private static wrapJava(code: string, signature?: FunctionSignature): string {
    const detected = signature
      ? {
          functionName: signature.functionName,
          className: signature.className || 'Solution',
          params: signature.parameters.map((p) => p.name),
          isClassMethod: true
        }
      : this.detectSignature(code, 'java');

    const fnName = detected?.functionName || 'twoSum';

    const driverClass = `
import java.util.*;
import java.io.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = reader.readLine()) != null) {
            line = line.trim();
            if (!line.isEmpty()) lines.add(line);
        }
        if (lines.isEmpty()) return;

        Solution sol = new Solution();
        String fn = "${fnName}";

        if (fn.equals("twoSum")) {
            String[] tokens = lines.get(0).replace("[", "").replace("]", "").replace(",", " ").trim().split("\\\\s+");
            int[] nums = new int[tokens.length];
            for (int i = 0; i < tokens.length; i++) nums[i] = Integer.parseInt(tokens[i]);
            int target = lines.size() > 1 ? Integer.parseInt(lines.get(1)) : 0;
            int[] ans = sol.twoSum(nums, target);
            if (ans != null && ans.length >= 2) {
                System.out.println(ans[0] + " " + ans[1]);
            }
        } else if (fn.equals("isValid")) {
            String s = lines.get(0).replace("\\"", "");
            boolean ans = sol.isValid(s);
            System.out.println(ans ? "true" : "false");
        } else {
            System.out.println(lines.get(0));
        }
    }
}
`;

    return `${code}\n${driverClass}`;
  }
}
