// import { Project } from "ts-morph";
// import * as path from "path";

// export interface GraphNode {
//     id: string;
//     type?: string;
//     data: { label: string; type?: string };
//     position: { x: number; y: number };
// }

// export interface GraphEdge {
//     id: string;
//     source: string;
//     target: string;
//     animated?: boolean;
// }

// export interface ArchitectureGraph {
//     nodes: GraphNode[];
//     edges: GraphEdge[];
// }

// export class ArchitectureService {
//     /**
//      * Scans a directory and builds a dependency graph
//      */
//     generateGraph(rootPath: string, filePaths: string[]): ArchitectureGraph {
//         const project = new Project({ useInMemoryFileSystem: true });

//         // Add files to ts-morph project
//         filePaths.forEach(filePath => {
//             if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
//                 // Mock content implies we need to read files provided or assume they are accessible
//                 // For this implementation, we assume we are passed file content or simulate it. 
//                 // But typically we should parse the content.
//                 // Since this runs on server, we might need actual file content.
//                 // However, parsing import statements is lightweight.
//             }
//         });

//         // NOTE: Since we don't have all file contents in memory here easily without reading them,
//         // we heavily rely on the fact that we can regex scan imports OR we need the actual content.
//         // Let's assume this service receives a map of { file: content } or we iterate differently.

//         // Simpler approach: We will parse imports from the provided file contents.
//         // But the previous architecture didn't pass full content map.
//         // Let's rely on string-based import parsing for speed if we don't have full file access, 
//         // OR better: The GithubService can fetch the tree, but reading ALL files is expensive.

//         // Wait! We do NOT want to read 1000 files.
//         // STRATEGY: We will only map the files we have ALREADY downloaded or analyze "shallowly".
//         // Actually, for a good diagram, we need the imports.
//         // Let's just Regex scan the imports for now since we don't want to load full AST for the whole repo if possible.
//         // Or assume we process a batch.

//         return { nodes: [], edges: [] };
//     }

//     /**
//      * Generates graph from a list of files with their content
//      */
//     analyzeStructure(files: { path: string, content: string }[]): ArchitectureGraph {
//         const nodes: GraphNode[] = [];
//         const edges: GraphEdge[] = [];
//         const fileSet = new Set(files.map(f => f.path));

//         // 1. Create Nodes
//         files.forEach((file, index) => {
//             nodes.push({
//                 id: file.path,
//                 type: 'custom',
//                 data: {
//                     label: path.basename(file.path),
//                     type: file.path.split('.').pop()
//                 },
//                 position: { x: 0, y: 0 }
//             });
//         });

//         // 2. Create Edges (Polyglot Import Parsing)
//         files.forEach(file => {
//             const ext = path.extname(file.path).toLowerCase();
//             const imports: string[] = [];

//             // Select Regex based on Language
//             if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
//                 const jsImportRegex = /import\s+.*\s+from\s+['"](.+)['"]/g;
//                 const jsRequireRegex = /require\(['"](.+)['"]\)/g;
//                 let match;
//                 while ((match = jsImportRegex.exec(file.content)) !== null) imports.push(match[1]);
//                 while ((match = jsRequireRegex.exec(file.content)) !== null) imports.push(match[1]);
//             }
//             else if (ext === '.py') {
//                 const pyFromImport = /from\s+(\S+)\s+import/g;
//                 const pyImport = /^import\s+(\S+)/gm;
//                 let match;
//                 while ((match = pyFromImport.exec(file.content)) !== null) imports.push(match[1].replace(/\./g, "/"));
//                 while ((match = pyImport.exec(file.content)) !== null) imports.push(match[1].replace(/\./g, "/"));
//             }
//             else if (ext === '.java') {
//                 const javaImport = /import\s+([\w\.]+);/g;
//                 let match;
//                 while ((match = javaImport.exec(file.content)) !== null) {
//                     // Convert com.example.MyClass -> com/example/MyClass
//                     imports.push(match[1].replace(/\./g, "/"));
//                 }
//             }
//             else if (ext === '.go') {
//                 const goImport = /import\s+"(.+)"/g;
//                 let match;
//                 while ((match = goImport.exec(file.content)) !== null) imports.push(match[1]);
//             }
//             else if (ext === '.php') {
//                 const phpUse = /use\s+([\w\\]+);/g;
//                 let match;
//                 while ((match = phpUse.exec(file.content)) !== null) imports.push(match[1].replace(/\\/g, "/"));
//             }

//             // Resolve and Create Edges
//             imports.forEach(importPath => {
//                 let resolvedTarget: string | null = null;

//                 // 1. Exact Match (Best for absolute paths or exact relative)
//                 if (fileSet.has(importPath)) {
//                     resolvedTarget = importPath;
//                 }

//                 // 2. Relative Path Resolution (common in JS/TS/Python)
//                 if (!resolvedTarget) {
//                     try {
//                         const dir = path.dirname(file.path);
//                         // Normalize slashes
//                         const absoluteCandidate = path.join(dir, importPath).replace(/\\/g, "/");

//                         // Try extensions
//                         const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.php'];
//                         for (const e of extensions) {
//                             const candidate = absoluteCandidate + e;
//                             if (fileSet.has(candidate)) {
//                                 resolvedTarget = candidate;
//                                 break;
//                             }
//                             // Try index files for JS/TS
//                             if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
//                                 const indexCandidate = absoluteCandidate + "/index" + e;
//                                 if (fileSet.has(indexCandidate)) {
//                                     resolvedTarget = indexCandidate;
//                                     break;
//                                 }
//                             }
//                         }
//                     } catch (e) {
//                         // ignore
//                     }
//                 }

//                 // 3. Fuzzy Match for Java/Python (Import might be 'utils', file is 'src/utils.py')
//                 if (!resolvedTarget) {
//                     // If import is "com/example/MyClass", look for "MyClass.java" anywhere? 
//                     // Or match suffix.
//                     // For now, let's look for exact suffix match if it's long enough
//                     if (importPath.length > 5) { // avoid matching 'utils' to everything
//                         const found = files.find(f => f.path.endsWith(importPath) || f.path.endsWith(importPath + ext));
//                         if (found) resolvedTarget = found.path;
//                     }
//                 }

//                 if (resolvedTarget && resolvedTarget !== file.path) {
//                     edges.push({
//                         id: `${file.path}-${resolvedTarget}`,
//                         source: file.path,
//                         target: resolvedTarget,
//                         animated: true
//                     });
//                 }
//             });
//         });

//         return { nodes, edges };
//     }
// }
