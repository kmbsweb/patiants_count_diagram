'use client';

import { FormEvent, useMemo, useState } from 'react';
import { MondoTree, MondoEntry } from '../components/MondoTree';
import mondoData from '../data/mondoData.json';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const data = mondoData as MondoEntry[];

function findNodePath(items: MondoEntry[], query: string, ancestors: string[] = []): { node: MondoEntry; path: string[] } | null {
  const normalized = query.trim().toLowerCase();
  for (const item of items) {
    const nameMatch = item.name.toLowerCase().includes(normalized) || item.nameJa?.toLowerCase().includes(normalized);
    const idMatch = item.id.toLowerCase() === normalized;
    if (nameMatch || idMatch) {
      return { node: item, path: ancestors };
    }
    if (item.children) {
      const childResult = findNodePath(item.children, query, [...ancestors, item.id]);
      if (childResult) {
        return childResult;
      }
    }
  }
  return null;
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState<string | undefined>(undefined);
  const [autoExpandIds, setAutoExpandIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('疾患名またはMondoIDで検索してください。');

  const totalPatients = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      setStatusMessage('検索文字列を入力してください。');
      return;
    }
    const result = findNodePath(data, searchTerm);
    if (result) {
      setSearchTarget(result.node.id);
      setAutoExpandIds([...result.path, result.node.id]);
      setStatusMessage(`${result.node.name} を表示しました。`);
    } else {
      setSearchTarget(undefined);
      setAutoExpandIds([]);
      setStatusMessage('該当する疾患が見つかりませんでした。');
    }
  };

  return (
    <main className="min-h-screen px-6 py-8 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-soft">
        <header className="mb-10 grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-end">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.24em] text-slate-500">Pharma analytics prototype</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">疾患階層デコンポジションツリー</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Mondo Disease Ontology に基づき、疾患分類をドリルダウンしながら各階層の患者数シェアを直感的に確認できます。
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Estimated total patient count</div>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{formatNumber(totalPatients)}</p>
            <p className="mt-3 text-sm text-slate-600">主要領域の概算値を集計したプロトタイプデータです。</p>
          </div>
        </header>

        <section className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">疾患検索</h2>
                <p className="text-sm text-slate-600">疾患名またはMondoIDで検索し、ツリーを自動展開します。</p>
              </div>
            </div>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <Input
                aria-label="Search diseases"
                placeholder="例: Diabetes mellitus や MONDO:0010001"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Button type="submit">検索</Button>
            </form>
            <p className="mt-4 text-sm text-slate-600">{statusMessage}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">常用検索例</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>MONDO:0010001 - Diabetes mellitus</li>
              <li>MONDO:0005070 - Endocrine metabolic disease</li>
              <li>Asthma</li>
              <li>Chronic pancreatitis</li>
            </ul>
          </div>
        </section>

        <section>
          <MondoTree
            data={data}
            autoExpandIds={autoExpandIds}
            highlightedNodeId={searchTarget}
          />
        </section>
      </div>
    </main>
  );
}
