export interface OptimizationPromptContext {
  problemTitle: string;
  problemDescription: string;
  constraints: string[];
  language: string;
  code: string;
  executionTimeMs: number;
  memoryKb: number;
}

export function buildOptimizationPrompt(ctx: OptimizationPromptContext): string {
  return `You are a Principal Software Architect and Algorithmic Performance Mentor.
Analyze this ACCEPTED student solution.

Problem: ${ctx.problemTitle}
Problem Description: ${ctx.problemDescription || 'N/A'}
Language: ${ctx.language}
Execution Time: ${ctx.executionTimeMs} ms
Memory: ${ctx.memoryKb} KB

Constraints:
${(ctx.constraints || []).join('\n')}

<untrusted_student_code>
${ctx.code}
</untrusted_student_code>

INSTRUCTIONS:
1. Provide theoretical asymptotic Big-O time and space complexity with concise mathematical explanations.
2. Evaluate code quality:
   - "overallScore": 1 to 100
   - "qualityGrade": "A+" | "A" | "B" | "C" | "NEEDS_REFACTOR"
   - "readabilityScore": Integer 1-10
   - "positivePractices": Positive patterns used
   - "codeSmells": Weak habits or inefficiencies
3. Provide actionable improvements ("improvements"):
   - "category": "PERFORMANCE" | "CLEAN_CODE" | "MEMORY" | "SAFETY"
   - "suggestion": What to improve
   - "codeSnippetBefore": The current code fragment
   - "codeSnippetAfter": The refactored code fragment
4. Provide Multi-Approach Taxonomy ("solutionApproaches"):
   - Break down how this problem can be solved across different paradigms (e.g. Brute Force, Intermediate, Optimal, Bitwise/Math).
   - Set "isUserApproach": true for the approach matching the student's code, and false for others.
   - For each approach include: approachNumber, title, paradigm, isUserApproach, timeComplexity, spaceComplexity, intuition, pros, cons, pseudoCodeOrGuide.
5. Provide a comparison matrix ("comparisonMatrix"):
   - Array of objects with: approach, time, space, suitability.
6. Return ONLY a valid JSON object matching this schema:
{
  "codeSummary": "Brief overview of what the student code does",
  "timeComplexity": "e.g. O(N)",
  "timeComplexityExplanation": "Concise mathematical proof",
  "spaceComplexity": "e.g. O(1)",
  "spaceComplexityExplanation": "Concise memory rationale",
  "readabilityScore": 8,
  "overallScore": 88,
  "qualityGrade": "A",
  "codeSmells": ["string"],
  "positivePractices": ["string"],
  "optimizationSuggestions": [
    {
      "title": "Optimization title",
      "rationale": "Why this improves performance or maintainability",
      "expectedTimeImpact": "e.g. Cuts constant factors",
      "refactoredSnippet": "refactored code snippet"
    }
  ],
  "improvements": [
    {
      "category": "PERFORMANCE",
      "suggestion": "Detailed suggestion",
      "codeSnippetBefore": "original code",
      "codeSnippetAfter": "refactored code"
    }
  ],
  "solutionApproaches": [
    {
      "approachNumber": 1,
      "title": "Brute Force",
      "paradigm": "BRUTE_FORCE",
      "isUserApproach": false,
      "timeComplexity": "O(N^2)",
      "spaceComplexity": "O(1)",
      "intuition": "Check all pairs",
      "pros": ["Simple to implement"],
      "cons": ["Slow for large input"],
      "pseudoCodeOrGuide": "for i in nums: for j in nums: ..."
    },
    {
      "approachNumber": 2,
      "title": "Optimal Hash Map",
      "paradigm": "HASHING",
      "isUserApproach": true,
      "timeComplexity": "O(N)",
      "spaceComplexity": "O(N)",
      "intuition": "Store complements in hash table",
      "pros": ["Linear time lookup"],
      "cons": ["Requires extra memory"],
      "pseudoCodeOrGuide": "seen = {}; for x in nums: ..."
    }
  ],
  "comparisonMatrix": [
    {
      "approach": "Brute Force",
      "time": "O(N^2)",
      "space": "O(1)",
      "suitability": "Small input sizes only"
    },
    {
      "approach": "Optimal Hash Map",
      "time": "O(N)",
      "space": "O(N)",
      "suitability": "Production standard, optimal time"
    }
  ]
}`;
}
