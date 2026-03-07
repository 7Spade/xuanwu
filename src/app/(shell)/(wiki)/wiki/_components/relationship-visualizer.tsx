/**
 * Module: wiki/_components/relationship-visualizer
 * Purpose: Render a read-only semantic relationship graph with vis-network.
 * Responsibilities: initialize network instance, provide deterministic demo nodes/edges, and clean up resources.
 * Constraints: client-only rendering; no mutation side effects.
 */

"use client";

import { useEffect, useRef } from "react";
import { DataSet } from "vis-data";
import { Network, type Edge, type Node, type Options } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";

const NODES: readonly Node[] = [
  {
    id: "transportation",
    label: "transportation",
    title: "tag::transportation",
    shape: "dot",
    size: 26,
    color: {
      background: "#0f766e",
      border: "#134e4a",
      highlight: { background: "#14b8a6", border: "#0f766e" },
    },
    font: { color: "#ffffff", face: "Segoe UI" },
  },
  {
    id: "utility",
    label: "utility",
    title: "tag::utility",
    shape: "dot",
    size: 20,
    color: {
      background: "#64748b",
      border: "#334155",
      highlight: { background: "#94a3b8", border: "#64748b" },
    },
    font: { color: "#ffffff", face: "Segoe UI" },
  },
  {
    id: "electric-vehicle-charging",
    label: "電動車充電",
    title: "proposal:#104",
    shape: "box",
    color: {
      background: "#fef08a",
      border: "#ca8a04",
      highlight: { background: "#fde047", border: "#a16207" },
    },
    font: { color: "#422006", face: "Segoe UI" },
  },
  {
    id: "d27-gate",
    label: "D27-Gate",
    title: "Layer-3 materialization policy",
    shape: "diamond",
    color: {
      background: "#dbeafe",
      border: "#2563eb",
      highlight: { background: "#bfdbfe", border: "#1d4ed8" },
    },
    font: { color: "#1e3a8a", face: "Segoe UI" },
  },
  {
    id: "task-materialized",
    label: "Task Materialized",
    title: "EXECUTABLE only",
    shape: "box",
    color: {
      background: "#dcfce7",
      border: "#16a34a",
      highlight: { background: "#bbf7d0", border: "#15803d" },
    },
    font: { color: "#14532d", face: "Segoe UI" },
  },
];

const EDGES: readonly Edge[] = [
  {
    from: "electric-vehicle-charging",
    to: "transportation",
    label: "proposed 85%",
    width: 3,
    color: { color: "#0f766e", highlight: "#14b8a6" },
    arrows: "to",
  },
  {
    from: "electric-vehicle-charging",
    to: "utility",
    label: "legacy 5%",
    dashes: true,
    color: { color: "#64748b", highlight: "#94a3b8" },
    arrows: "to",
  },
  {
    from: "transportation",
    to: "d27-gate",
    label: "policy-map",
    color: { color: "#2563eb", highlight: "#1d4ed8" },
    arrows: "to",
  },
  {
    from: "d27-gate",
    to: "task-materialized",
    label: "EXECUTABLE",
    color: { color: "#16a34a", highlight: "#15803d" },
    arrows: "to",
  },
];

const NETWORK_OPTIONS: Options = {
  autoResize: true,
  interaction: {
    hover: true,
    tooltipDelay: 120,
    dragView: true,
    zoomView: true,
  },
  nodes: {
    borderWidth: 1,
    borderWidthSelected: 2,
    margin: 10,
    font: { size: 12 },
  },
  edges: {
    smooth: {
      enabled: true,
      type: "dynamic",
    },
    font: {
      size: 11,
      align: "middle",
      background: "rgba(255,255,255,0.75)",
      strokeWidth: 0,
    },
  },
  physics: {
    stabilization: {
      enabled: true,
      iterations: 120,
      updateInterval: 25,
    },
    barnesHut: {
      gravitationalConstant: -2800,
      springLength: 140,
      springConstant: 0.03,
      damping: 0.11,
      avoidOverlap: 0.2,
    },
  },
};

export function RelationshipVisualizer() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const network = new Network(
      containerRef.current,
      {
        nodes: new DataSet<Node>([...NODES]),
        edges: new DataSet<Edge>([...EDGES]),
      },
      NETWORK_OPTIONS
    );

    return () => {
      network.destroy();
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2">
        <p className="text-sm font-medium">關係視覺化器 (vis-network)</p>
        <p className="text-xs text-muted-foreground">Proposal #104 · semantic routing</p>
      </div>
      <div ref={containerRef} className="h-[340px] w-full" aria-label="semantic relationship graph" />
    </div>
  );
}
