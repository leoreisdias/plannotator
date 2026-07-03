import React from 'react';
import type { Block } from '../../types';
import { InlineMarkdown } from '../InlineMarkdown';
import { renderProseBody } from './proseBody';

const VISUAL_DIRECTIVE_KINDS = new Set([
  'callout',
  'file-map',
  'checklist',
  'open-questions',
  'diagram',
  'annotated-diff',
  'code-walkthrough',
]);

const TITLES: Record<string, string> = {
  callout: 'Callout',
  'file-map': 'File Map',
  checklist: 'Checklist',
  'open-questions': 'Open Questions',
  diagram: 'Diagram',
  'annotated-diff': 'Annotated Diff',
  'code-walkthrough': 'Code Walkthrough',
};

interface VisualDirectiveBlockProps {
  block: Block;
  onOpenLinkedDoc?: (path: string) => void;
  onOpenCodeFile?: (path: string) => void;
  imageBaseDir?: string;
  onImageClick?: (src: string, alt: string) => void;
  onToggleCheckbox?: (blockId: string, checked: boolean) => void;
  checkboxOverrides?: Map<string, boolean>;
  githubRepo?: string;
  onNavigateAnchor?: (hash: string) => void;
}

interface FileMapItem {
  status: string;
  path: string;
  description: string;
}

export function isVisualDirectiveKind(kind: string | undefined): boolean {
  return kind ? VISUAL_DIRECTIVE_KINDS.has(kind) : false;
}

export const VisualDirectiveBlock: React.FC<VisualDirectiveBlockProps> = ({
  block,
  onOpenLinkedDoc,
  onOpenCodeFile,
  imageBaseDir,
  onImageClick,
  onToggleCheckbox,
  checkboxOverrides,
  githubRepo,
  onNavigateAnchor,
}) => {
  const kind = block.directiveKind || 'callout';
  const inline = (text: string) => (
    <InlineMarkdown
      imageBaseDir={imageBaseDir}
      onImageClick={onImageClick}
      text={text}
      onOpenLinkedDoc={onOpenLinkedDoc}
      onOpenCodeFile={onOpenCodeFile}
      githubRepo={githubRepo}
      onNavigateAnchor={onNavigateAnchor}
    />
  );

  return (
    <section
      className="my-5 overflow-hidden rounded-md border border-border/70 bg-card/70 shadow-sm"
      data-block-id={block.id}
      data-block-type="visual-directive"
      data-visual-block={kind}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {TITLES[kind] ?? kind}
        </div>
      </div>
      <div className="px-4 py-3">
        {renderVisualBody(kind, block, inline, {
          imageBaseDir,
          onImageClick,
          onOpenLinkedDoc,
          onOpenCodeFile,
          onToggleCheckbox,
          checkboxOverrides,
          githubRepo,
          onNavigateAnchor,
        })}
      </div>
    </section>
  );
};

function renderVisualBody(
  kind: string,
  block: Block,
  inline: (text: string) => React.ReactNode,
  options: Omit<Parameters<typeof renderProseBody>[0], 'body'> & {
    onToggleCheckbox?: (blockId: string, checked: boolean) => void;
    checkboxOverrides?: Map<string, boolean>;
  },
): React.ReactNode {
  switch (kind) {
    case 'file-map':
      return <FileMap body={block.content} inline={inline} />;
    case 'checklist':
      return (
        <Checklist
          blockId={block.id}
          body={block.content}
          inline={inline}
          onToggleCheckbox={options.onToggleCheckbox}
          checkboxOverrides={options.checkboxOverrides}
        />
      );
    case 'open-questions':
      return <OpenQuestions body={block.content} inline={inline} />;
    case 'diagram':
      return <Diagram block={block} />;
    case 'annotated-diff':
      return <AnnotatedDiff body={block.content} />;
    case 'code-walkthrough':
      return <CodeWalkthrough body={block.content} inline={inline} />;
    case 'callout':
    default:
      return renderProseBody({
        body: block.content,
        paragraphClassName: 'text-[15px] leading-relaxed text-foreground/90',
        listClassName: 'text-[15px] leading-relaxed text-foreground/90',
        ...options,
      });
  }
}

const FileMap: React.FC<{ body: string; inline: (text: string) => React.ReactNode }> = ({ body, inline }) => {
  const items = parseFileMap(body);
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">{inline(body)}</div>;
  }
  return (
    <div className="space-y-2" data-visual-file-map>
      {items.map((item, index) => (
        <div
          key={`${item.path}-${index}`}
          className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-md border border-border/50 bg-background/45 px-3 py-2"
        >
          <span className={`mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded text-[11px] font-semibold ${statusClass(item.status)}`}>
            {item.status}
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[13px] leading-5 text-foreground/90">{inline(item.path)}</div>
            {item.description ? (
              <div className="mt-0.5 text-sm leading-5 text-muted-foreground">{inline(item.description)}</div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const Checklist: React.FC<{
  blockId: string;
  body: string;
  inline: (text: string) => React.ReactNode;
  onToggleCheckbox?: (blockId: string, checked: boolean) => void;
  checkboxOverrides?: Map<string, boolean>;
}> = ({ blockId, body, inline, onToggleCheckbox, checkboxOverrides }) => {
  const items = parseChecklist(body);
  const viewItems = items.map((item, index) => {
    const itemId = `${blockId}:checklist:${index}`;
    const checked = checkboxOverrides?.has(itemId) ? checkboxOverrides.get(itemId) === true : item.checked;
    return { ...item, id: itemId, checked };
  });
  const done = viewItems.filter((item) => item.checked).length;
  return (
    <div className="space-y-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-emerald-500" style={{ width: `${viewItems.length ? (done / viewItems.length) * 100 : 0}%` }} />
      </div>
      <div className="space-y-1.5">
        {viewItems.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            inline={inline}
            onToggleCheckbox={onToggleCheckbox}
          />
        ))}
      </div>
    </div>
  );
};

const ChecklistRow: React.FC<{
  item: { id: string; checked: boolean; text: string };
  inline: (text: string) => React.ReactNode;
  onToggleCheckbox?: (blockId: string, checked: boolean) => void;
}> = ({ item, inline, onToggleCheckbox }) => {
  const markerClass = item.checked
    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
    : 'border-border text-transparent';
  const textClass = item.checked ? 'text-muted-foreground line-through' : 'text-foreground/90';
  const rowClass = 'flex w-full items-start gap-2 rounded-md bg-background/35 px-3 py-2 text-left';
  const marker = (
    <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] ${markerClass}`}>
      ✓
    </span>
  );
  const label = <span className={`text-sm leading-5 ${textClass}`}>{inline(item.text)}</span>;

  if (onToggleCheckbox) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        className={`${rowClass} transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        onClick={() => onToggleCheckbox(item.id, !item.checked)}
      >
        {marker}
        {label}
      </button>
    );
  }

  return (
    <div role="checkbox" aria-checked={item.checked} className={rowClass}>
      {marker}
      {label}
    </div>
  );
};

const OpenQuestions: React.FC<{ body: string; inline: (text: string) => React.ReactNode }> = ({ body, inline }) => {
  const questions = parseListItems(body);
  return (
    <div className="space-y-2">
      {questions.map((question, index) => (
        <div key={index} className="rounded-md border border-amber-500/25 bg-amber-500/8 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Question {index + 1}</div>
          <div className="mt-1 text-sm leading-5 text-foreground/90">{inline(question)}</div>
        </div>
      ))}
    </div>
  );
};

const Diagram: React.FC<{ block: Block }> = ({ block }) => {
  const { language, source } = normalizeDiagramSource(block.content);
  const diagramBlock: Block = {
    ...block,
    type: 'code',
    language,
    content: source,
  };
  const rendered = <LazyDiagramRenderer block={diagramBlock} language={language} />;
  return (
    <div className="rounded-md border border-border/50 bg-background/35" data-diagram-language={language}>
      <div className="border-b border-border/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {language}
      </div>
      {rendered}
    </div>
  );
};

const LazyDiagramRenderer: React.FC<{ block: Block; language: 'mermaid' | 'dot' }> = ({ block, language }) => {
  const [Renderer, setRenderer] = React.useState<React.ComponentType<{ block: Block }> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (language === 'dot') {
        const module = await import('../GraphvizBlock');
        if (!cancelled) setRenderer(() => module.GraphvizBlock);
        return;
      }
      const module = await import('../MermaidBlock');
      if (cancelled) return;
      setRenderer(() => module.MermaidBlock);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  if (Renderer) {
    return (
      <div className="p-3">
        <Renderer block={block} />
      </div>
    );
  }

  return (
    <pre className="overflow-x-auto p-3 text-[13px] leading-5 text-foreground/90">
      <code>{block.content}</code>
    </pre>
  );
};

const AnnotatedDiff: React.FC<{ body: string }> = ({ body }) => {
  const lines = stripFence(body).split('\n').filter((line) => line.length > 0);
  return (
    <pre className="overflow-x-auto rounded-md border border-border/50 bg-background/70 p-0 text-[13px] leading-5">
      <code className="block">
        {lines.map((line, index) => (
          <span key={index} className={`block px-3 py-0.5 ${diffLineClass(line)}`}>
            {line}
          </span>
        ))}
      </code>
    </pre>
  );
};

const CodeWalkthrough: React.FC<{ body: string; inline: (text: string) => React.ReactNode }> = ({ body, inline }) => {
  const steps = parseListItems(body);
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md bg-background/35 px-3 py-2">
          <span className="flex h-6 min-w-6 items-center justify-center rounded bg-primary/15 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <div className="pt-0.5 text-sm leading-5 text-foreground/90">{inline(step)}</div>
        </div>
      ))}
    </div>
  );
};

function parseFileMap(body: string): FileMapItem[] {
  return body
    .split('\n')
    .map((line) => {
      const trimmed = line.trim().replace(/^[-*]\s+/, '');
      if (!trimmed) return null;
      const statusMatch = trimmed.match(/^\[([A-Za-z?+-])\]\s+(.*)$/);
      const status = statusMatch?.[1]?.toUpperCase() ?? '•';
      const rest = statusMatch?.[2] ?? trimmed;
      const [pathPart, ...descriptionParts] = rest.split(/\s+-\s+/);
      const path = pathPart.trim();
      if (!path) return null;
      return {
        status,
        path,
        description: descriptionParts.join(' - ').trim(),
      };
    })
    .filter((item): item is FileMapItem => item !== null);
}

function parseChecklist(body: string): { checked: boolean; text: string }[] {
  const items = body
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (!match) return null;
      return { checked: match[1].toLowerCase() === 'x', text: match[2].trim() };
    })
    .filter((item): item is { checked: boolean; text: string } => item !== null);
  return items.length > 0 ? items : parseListItems(body).map((text) => ({ checked: false, text }));
}

function parseListItems(body: string): string[] {
  const items = body
    .split('\n')
    .map((line) => line.trim().replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''))
    .filter(Boolean);
  return items.length > 0 ? items : [body.trim()].filter(Boolean);
}

function normalizeDiagramSource(body: string): { language: 'mermaid' | 'dot'; source: string } {
  const fenced = body.trim().match(/^```([a-zA-Z0-9_-]+)?\n([\s\S]*?)\n```$/);
  const rawLanguage = fenced?.[1]?.toLowerCase();
  const rawSource = fenced?.[2] ?? body.trim();
  const lines = rawSource.split('\n');
  const firstLine = lines[0]?.trim().toLowerCase();
  const hasLeadingLanguage = firstLine === 'mermaid' || firstLine === 'dot' || firstLine === 'graphviz';
  const language = rawLanguage ?? (hasLeadingLanguage ? firstLine : undefined);
  const source = hasLeadingLanguage ? lines.slice(1).join('\n').trim() : rawSource;
  return { language: language === 'dot' || language === 'graphviz' ? 'dot' : 'mermaid', source };
}

function stripFence(body: string): string {
  const fenced = body.trim().match(/^```(?:diff|patch)?\n([\s\S]*?)\n```$/);
  return fenced?.[1] ?? body.trim();
}

function statusClass(status: string): string {
  switch (status) {
    case 'A':
    case '+':
      return 'bg-emerald-500/15 text-emerald-400';
    case 'M':
      return 'bg-sky-500/15 text-sky-400';
    case 'D':
    case '-':
      return 'bg-red-500/15 text-red-400';
    case 'R':
      return 'bg-violet-500/15 text-violet-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function diffLineClass(line: string): string {
  if (line.startsWith('+')) return 'bg-emerald-500/10 text-emerald-300 [.light_&]:bg-emerald-500/12 [.light_&]:text-emerald-800';
  if (line.startsWith('-')) return 'bg-red-500/10 text-red-300 [.light_&]:bg-red-500/12 [.light_&]:text-red-800';
  if (line.startsWith('@@')) return 'bg-sky-500/10 text-sky-300 [.light_&]:bg-sky-500/12 [.light_&]:text-sky-800';
  return 'text-muted-foreground';
}
