// import { Project, SyntaxKind } from "ts-morph";

// export class ASTAnalysisService {
//     /**
//      * Analyze code using Abstract Syntax Tree (AST) for high precision
//      */
//     analyzeContent(filePath: string, content: string): any[] {
//         const issues: any[] = [];

//         // Only run AST on TS/JS files
//         if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
//             return [];
//         }

//         try {
//             const project = new Project({ useInMemoryFileSystem: true });
//             const sourceFile = project.createSourceFile(filePath, content);

//             // 1. Check for Console Logs (Best Practice)
//             sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
//                 const text = call.getText();
//                 if (text.startsWith("console.log")) {
//                     issues.push({
//                         severity: "LOW",
//                         category: "BEST_PRACTICE",
//                         lineNumber: call.getStartLineNumber(),
//                         message: "Avoid using 'console.log' in production code. Use a logger instead.",
//                         code: text,
//                         suggestion: { diff: "", explanation: "Remove or replace with a proper logging service." }
//                     });
//                 }
//             });

//             // 2. Check for "any" type (Type Safety)
//             sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword).forEach(node => {
//                 issues.push({
//                     severity: "MEDIUM",
//                     category: "MAINTAINABILITY",
//                     lineNumber: node.getStartLineNumber(),
//                     message: "Avoid explicit 'any' type. It disables type checking.",
//                     code: node.getParent()?.getText() || "any",
//                     suggestion: { diff: "unknown", explanation: "Use 'unknown' or a specific type interface." }
//                 });
//             });

//             // 3. Check for Hardcoded Secrets (Security) - AST Enhanced
//             sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach(literal => {
//                 const text = literal.getLiteralText();
//                 if (text.length > 20 && /[0-9a-zA-Z]{20,}/.test(text)) {
//                     // Primitive heuristic: long alphanumeric strings might be keys
//                     // Refine: Check if variable name contains "key", "secret", "token"
//                     const parent = literal.getParent();
//                     if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
//                         const varName = parent.getText(); // get the full declaration
//                         if (/secret|key|token|password/i.test(varName)) {
//                             issues.push({
//                                 severity: "CRITICAL",
//                                 category: "SECURITY",
//                                 lineNumber: literal.getStartLineNumber(),
//                                 message: "Possible hardcoded secret detected.",
//                                 code: text.substring(0, 10) + "...",
//                             });
//                         }
//                     }
//                 }
//             });

//         } catch (error) {
//             console.error("AST Analysis Failed:", error);
//             // Fallback gracefully (return empty array or log warning)
//         }

//         return issues;
//     }
// }
