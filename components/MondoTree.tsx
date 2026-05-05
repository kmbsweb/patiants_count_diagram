'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type MondoEntry = {
  id: string;
  name: string;
  nameJa?: string;
  count: number;
  children?: MondoEntry[];
};

type MondoTreeProps = {
  data: MondoEntry[];
  autoExpandIds?: string[];
  highlightedNodeId?: string;
  onSelect?: (nodeId: string) => void;
};

const columnLabels = ['Major category', 'Mid category', 'Minor category', 'Sub category'];

type ConnectorLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function findNodeById(items: MondoEntry[], id: string): MondoEntry | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const child = findNodeById(item.children, id);
      if (child) return child;
    }
  }
  return undefined;
}

function buildColumns(data: MondoEntry[], path: string[]) {
  const columns: MondoEntry[][] = [data];
  let current = data;
  for (const id of path) {
    const node = findNodeById(current, id);
    if (!node || !node.children) break;
    columns.push(node.children);
    current = node.children;
  }
  return columns;
}

function hasChildren(node: MondoEntry) {
  return Boolean(node.children && node.children.length > 0);
}

export function MondoTree({ data, autoExpandIds = [], highlightedNodeId, onSelect }: MondoTreeProps) {
  const [expandedPath, setExpandedPath] = useState<string[]>(autoExpandIds);
  const [selectedId, setSelectedId] = useState<string | undefined>(highlightedNodeId);
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([]);
  const [zoom, setZoom] = useState(1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setExpandedPath([...autoExpandIds]);
    if (highlightedNodeId) {
      setSelectedId(highlightedNodeId);
    }
  }, [autoExpandIds.join(','), highlightedNodeId]);

  const columns = useMemo(() => buildColumns(data, expandedPath), [data, expandedPath]);

  useEffect(() => {
    const updateLines = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) {
        setConnectorLines([]);
        return;
      }

      const wrapperRect = wrapper.getBoundingClientRect();
      const nextLines: ConnectorLine[] = [];

      for (let index = 0; index < columns.length - 1; index += 1) {
        const parentId = expandedPath[index];
        if (!parentId) continue;
        const parentElem = cardRefs.current[parentId];
        if (!parentElem) continue;

        const parentRect = parentElem.getBoundingClientRect();
        const parentX = parentRect.right - wrapperRect.left;
        const parentY = parentRect.top + parentRect.height / 2 - wrapperRect.top;

        columns[index + 1].forEach((child) => {
          const childElem = cardRefs.current[child.id];
          if (!childElem) return;
          const childRect = childElem.getBoundingClientRect();
          const childX = childRect.left - wrapperRect.left;
          const childY = childRect.top + childRect.height / 2 - wrapperRect.top;
          nextLines.push({ x1: parentX, y1: parentY, x2: childX, y2: childY });
        });
      }

      setConnectorLines(nextLines);
    };

    updateLines();

    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [columns, expandedPath]);

  const handleClick = (node: MondoEntry, columnIndex: number) => {
    if (onSelect) onSelect(node.id);
    setSelectedId(node.id);
    if (hasChildren(node)) {
      setExpandedPath((prev) => [...prev.slice(0, columnIndex), node.id]);
    } else {
      setExpandedPath((prev) => [...prev.slice(0, columnIndex)]);
    }
  };

  const handleCollapse = (columnIndex: number) => {
    setExpandedPath((prev) => prev.slice(0, columnIndex));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.5));
  const handleFitView = () => setZoom(1);

  return (
    <div className="h-[780px] rounded-[32px] border border-slate-200 bg-white/90 p-4 shadow-soft">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Disease decomposition tree</h2>
          <p className="text-sm text-slate-500">クリックで階層を一段階展開し、右方向へ詳細化します。</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Zoom Out
          </button>
          <span className="text-xs text-slate-500">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Zoom In
          </button>
          <button
            type="button"
            onClick={handleFitView}
            className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Fit View
          </button>
        </div>
      </div>

      <div className="h-[700px] overflow-x-auto rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
        <div ref={wrapperRef} className="relative min-w-[1320px]">
          <svg className="absolute inset-0 h-full w-full" pointerEvents="none">
            {connectorLines.map((line, index) => (
              <path
                key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}-${index}`}
                d={`M${line.x1},${line.y1} C${line.x1 + 56},${line.y1} ${line.x2 - 56},${line.y2} ${line.x2},${line.y2}`}
                stroke="#0f172a"
                strokeWidth="2"
                strokeOpacity="0.16"
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </svg>

          <div
            className="relative flex gap-6 origin-top-left"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {columns.map((nodes, columnIndex) => (
              <div key={columnIndex} className="min-w-[320px] flex-shrink-0 rounded-[28px] border border-slate-200 bg-slate-100/90 p-4 shadow-sm">
                <div className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {columnLabels[columnIndex] ?? `Level ${columnIndex + 1}`}
                </div>
                <div className="space-y-5">
                  {nodes.map((node) => {
                    const isSelected = node.id === selectedId;
                    const isExpanded = expandedPath[columnIndex] === node.id;
                    const share = columnIndex === 0 ? 1 : (() => {
                      const parentId = expandedPath[columnIndex - 1];
                      const parent = parentId ? findNodeById(data, parentId) : undefined;
                      return parent ? Math.min(1, node.count / parent.count) : 1;
                    })();

                    return (
                      <motion.div
                        key={node.id}
                        ref={(el) => {
                          if (el) {
                            cardRefs.current[node.id] = el;
                          }
                        }}
                        layout
                        className={`relative overflow-hidden rounded-3xl border bg-white p-4 shadow-soft transition ${isSelected ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                              {columnIndex === 0 ? 'TOP CATEGORY' : 'DISEASE NODE'}
                            </div>
                            <h3 className="mt-3 text-base font-semibold text-slate-950 leading-snug">{node.name}</h3>
                            {node.nameJa ? <p className="mt-1 text-sm text-slate-500">{node.nameJa}</p> : null}
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                            {node.id}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>Patient estimate</span>
                            <span className="font-semibold text-slate-900">{formatNumber(node.count)}</span>
                          </div>
                          <div className="rounded-full bg-slate-100 p-1">
                            <div
                              className="h-2 rounded-full bg-sky-500 transition-all duration-300"
                              style={{ width: `${Math.max(12, share * 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Parent share</span>
                            <span>{Math.round(share * 100)}%</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          {hasChildren(node) ? (
                            <button
                              type="button"
                              onClick={() => handleClick(node, columnIndex)}
                              className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                              展開
                            </button>
                          ) : (
                            <div className="text-xs text-slate-400">No children</div>
                          )}

                          {isExpanded && node.children && node.children.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleCollapse(columnIndex)}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              閉じる
                            </button>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
