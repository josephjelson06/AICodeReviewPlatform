// interface DependencyIssue {
//     severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
//     category: "DEPENDENCY";
//     lineNumber: number;
//     message: string;
//     code: string;
// }

// export class DependencyAnalysisService {

//     analyzePackageJson(content: string): DependencyIssue[] {
//         const issues: DependencyIssue[] = [];
//         let pkg;
//         try {
//             pkg = JSON.parse(content);
//         } catch (e) {
//             return []; // Invalid JSON
//         }

//         const lines = content.split('\n');

//         const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

//         for (const [name, version] of Object.entries(dependencies)) {
//             // Find line number for this dependency
//             const lineNumber = lines.findIndex(l => l.includes(`"${name}"`)) + 1;
//             const depString = `"${name}": "${version}"`;

//             // 1. Check for malicious/deprecated packages
//             if (name === "express" && (version as string).startsWith("^3")) {
//                 issues.push({
//                     severity: "HIGH",
//                     category: "DEPENDENCY",
//                     lineNumber,
//                     message: "Express v3 is deprecated and insecure. Upgrade to v5.",
//                     code: depString
//                 });
//             }

//             if (name === "lodash" && (version as string).startsWith("^3")) {
//                 issues.push({
//                     severity: "MEDIUM",
//                     category: "DEPENDENCY",
//                     lineNumber,
//                     message: "Old Lodash version detected. Potential prototype pollution.",
//                     code: depString
//                 });
//             }

//             // 2. Check for "latest" or wildcard (bad practice)
//             if ((version as string) === "*" || (version as string) === "latest") {
//                 issues.push({
//                     severity: "LOW",
//                     category: "DEPENDENCY",
//                     lineNumber,
//                     message: "Avoid using wildcard version logic. Pin your dependencies.",
//                     code: depString
//                 });
//             }

//             // 3. Known Vulnerable Packages (MVP list)
//             const VULNERABLE_PACKAGES = ["request", "axios@0.21.0", "moment"];
//             if (VULNERABLE_PACKAGES.includes(name)) {
//                 issues.push({
//                     severity: "MEDIUM",
//                     category: "DEPENDENCY",
//                     lineNumber,
//                     message: `Package '${name}' is known to have issues or is deprecated.`,
//                     code: depString
//                 });
//             }
//         }

//         return issues;
//     }
// }
