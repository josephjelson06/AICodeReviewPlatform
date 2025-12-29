// "use client";

// import { useQuery } from "@tanstack/react-query";
// import ReactFlow, {
//     Background,
//     Controls,
//     Node,
//     Edge,
//     useNodesState,
//     useEdgesState,
//     MarkerType
// } from "reactflow";
// import "reactflow/dist/style.css";
// import dagre from "dagre";
// import { useEffect, useMemo } from "react";
// import { Loader2 } from "lucide-react";

// interface ArchitectureViewerProps {
//     projectId: string;
// }

// const nodeWidth = 172;
// const nodeHeight = 36;

// const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
//     const dagreGraph = new dagre.graphlib.Graph();
//     dagreGraph.setDefaultEdgeLabel(() => ({}));

//     dagreGraph.setGraph({ rankdir: 'TB' });

//     nodes.forEach((node) => {
//         dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
//     });

//     edges.forEach((edge) => {
//         dagreGraph.setEdge(edge.source, edge.target);
//     });

//     dagre.layout(dagreGraph);

//     nodes.forEach((node) => {
//         const nodeWithPosition = dagreGraph.node(node.id);
//         node.targetPosition = 'top';
//         node.sourcePosition = 'bottom';
//         node.position = {
//             x: nodeWithPosition.x - nodeWidth / 2,
//             y: nodeWithPosition.y - nodeHeight / 2,
//         };
//     });

//     return { nodes, edges };
// };

// export function ArchitectureViewer({ projectId }: ArchitectureViewerProps) {
//     const [nodes, setNodes, onNodesChange] = useNodesState([]);
//     const [edges, setEdges, onEdgesChange] = useEdgesState([]);

//     const { data, isLoading, error } = useQuery({
//         queryKey: ["architecture", projectId],
//         queryFn: async () => {
//             const res = await fetch(`/api/projects/${projectId}/structure`);
//             if (!res.ok) throw new Error("Failed to load");
//             return res.json();
//         }
//     });

//     useEffect(() => {
//         if (data && data.nodes && data.edges) {
//             const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
//                 data.nodes.map((n: any) => ({
//                     ...n,
//                     style: {
//                         background: 'rgba(255, 255, 255, 0.05)',
//                         border: '1px solid rgba(255, 255, 255, 0.1)',
//                         color: 'white',
//                         borderRadius: '0.5rem',
//                         backdropFilter: 'blur(10px)',
//                         padding: '10px',
//                         fontSize: '12px'
//                     }
//                 })),
//                 data.edges.map((e: any) => ({
//                     ...e,
//                     animated: true,
//                     style: { stroke: '#a855f7' }, // Purple edges
//                     markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
//                 }))
//             );

//             setNodes(layoutedNodes);
//             setEdges(layoutedEdges);
//         }
//     }, [data, setNodes, setEdges]);

//     if (isLoading) {
//         return (
//             <div className="flex h-[400px] w-full items-center justify-center text-gray-400">
//                 <Loader2 className="h-8 w-8 animate-spin" />
//                 <span className="ml-2">Building Blueprint...</span>
//             </div>
//         );
//     }

//     if (error || !data) {
//         return (
//             <div className="flex h-[400px] w-full items-center justify-center text-red-400">
//                 Failed to load architecture.
//             </div>
//         );
//     }

//     return (
//         <div className="h-[600px] w-full rounded-2xl border border-white/10 bg-black/20 overflow-hidden backdrop-blur-sm">
//             <ReactFlow
//                 nodes={nodes}
//                 edges={edges}
//                 onNodesChange={onNodesChange}
//                 onEdgesChange={onEdgesChange}
//                 fitView
//             >
//                 <Background color="#444" gap={16} size={1} />
//                 <Controls className="bg-white/10 text-black border-none fill-white" />
//             </ReactFlow>
//         </div>
//     );
// }
