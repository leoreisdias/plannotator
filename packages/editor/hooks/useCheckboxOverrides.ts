/**
 * Checkbox Overrides Hook
 *
 * Manages interactive checkbox toggling in the plan viewer. Each toggle creates
 * a COMMENT annotation capturing the action and section context; toggling back
 * to the original state removes the override and deletes the annotation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Annotation, AnnotationType, Block } from '@plannotator/ui/types';

interface CheckboxToggleTarget {
  overrideId: string;
  annotationBlockId: string;
  originalChecked: boolean;
  content: string;
  startLine: number;
  endOffset: number;
  blockIndex: number;
}

export interface UseCheckboxOverridesOptions {
  blocks: Block[];
  annotations: Annotation[];
  addAnnotation: (ann: Annotation) => void;
  removeAnnotation: (id: string) => void;
}

export interface UseCheckboxOverridesReturn {
  /** Visual override state passed to the Viewer as `checkboxOverrides` */
  overrides: Map<string, boolean>;
  /** Toggle handler passed to the Viewer as `onToggleCheckbox` */
  toggle: (blockId: string, checked: boolean) => void;
  /** Revert an override when a checkbox annotation is deleted from the panel */
  revertOverride: (blockId: string) => void;
}

export function useCheckboxOverrides({
  blocks,
  annotations,
  addAnnotation,
  removeAnnotation,
}: UseCheckboxOverridesOptions): UseCheckboxOverridesReturn {
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());

  // Refs so callbacks don't need annotations/blocks in their dep arrays
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;

  // Clean up stale overrides when blocks change (e.g. markdown reloaded)
  useEffect(() => {
    if (overrides.size === 0) return;
    const overrideIds = collectCheckboxOverrideIds(blocks);
    const stale = [...overrides.keys()].filter(id => !overrideIds.has(id));
    if (stale.length > 0) {
      setOverrides(prev => {
        const next = new Map(prev);
        stale.forEach(id => next.delete(id));
        return next;
      });
    }
  }, [blocks]);

  const toggle = useCallback((blockId: string, checked: boolean) => {
    const blocks = blocksRef.current;
    const annotations = annotationsRef.current;
    const target = resolveCheckboxToggleTarget(blocks, blockId);
    const isRevertingToOriginal = target && checked === target.originalChecked;

    if (isRevertingToOriginal) {
      // Undo: remove the override and delete ALL checkbox annotations for this block
      setOverrides(prev => {
        const next = new Map(prev);
        next.delete(blockId);
        return next;
      });
      const toDelete = annotations.filter(a => isCheckboxAnnotationForOverride(a, blockId));
      toDelete.forEach(a => removeAnnotation(a.id));
    } else {
      // Toggle: remove any existing checkbox annotations for this block first (prevents duplicates from rapid clicks)
      const existing = annotations.filter(a => isCheckboxAnnotationForOverride(a, blockId));
      existing.forEach(a => removeAnnotation(a.id));

      setOverrides(prev => {
        const next = new Map(prev);
        next.set(blockId, checked);
        return next;
      });
      if (target) {
        // Find the nearest heading above this block for section context
        let sectionHeading = '';
        for (let i = target.blockIndex - 1; i >= 0; i--) {
          if (blocks[i].type === 'heading') {
            sectionHeading = blocks[i].content;
            break;
          }
        }

        const action = checked ? 'Mark as completed' : 'Mark as not completed';
        const context = sectionHeading ? ` (under "${sectionHeading}")` : ` (line ${target.startLine})`;
        const ann: Annotation = {
          id: `ann-checkbox-${blockId}-${Date.now()}`,
          blockId: target.annotationBlockId,
          startOffset: 0,
          endOffset: target.endOffset,
          type: AnnotationType.COMMENT,
          text: `${action}${context}: ${target.content}`,
          originalText: target.content,
          createdA: Date.now(),
          checkboxOverrideId: target.overrideId,
        };
        addAnnotation(ann);
      }
    }
  }, [addAnnotation, removeAnnotation]);

  const revertOverride = useCallback((blockId: string) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.delete(blockId);
      return next;
    });
  }, []);

  return { overrides, toggle, revertOverride };
}

export function collectCheckboxOverrideIds(blocks: Block[]): Set<string> {
  const ids = new Set<string>();
  for (const block of blocks) {
    if (block.checked !== undefined) ids.add(block.id);
    if (block.type === 'directive' && block.directiveKind === 'checklist') {
      parseVisualChecklistItems(block).forEach((_, index) => ids.add(visualChecklistOverrideId(block.id, index)));
    }
  }
  return ids;
}

export function resolveCheckboxToggleTarget(blocks: Block[], overrideId: string): CheckboxToggleTarget | null {
  const directIndex = blocks.findIndex((block) => block.id === overrideId);
  if (directIndex >= 0) {
    const block = blocks[directIndex];
    if (block.checked === undefined) return null;
    return {
      overrideId,
      annotationBlockId: block.id,
      originalChecked: block.checked,
      content: block.content,
      startLine: block.startLine,
      endOffset: block.content.length,
      blockIndex: directIndex,
    };
  }

  const visual = parseVisualChecklistOverrideId(overrideId);
  if (!visual) return null;
  const parentIndex = blocks.findIndex((block) => block.id === visual.blockId);
  if (parentIndex < 0) return null;
  const parent = blocks[parentIndex];
  if (parent.type !== 'directive' || parent.directiveKind !== 'checklist') return null;
  const item = parseVisualChecklistItems(parent)[visual.index];
  if (!item) return null;
  return {
    overrideId,
    annotationBlockId: parent.id,
    originalChecked: item.checked,
    content: item.text,
    startLine: parent.startLine + item.lineOffset,
    endOffset: item.text.length,
    blockIndex: parentIndex,
  };
}

export function isCheckboxAnnotationForOverride(annotation: Annotation, overrideId: string): boolean {
  if (!annotation.id.startsWith('ann-checkbox-')) return false;
  return annotation.checkboxOverrideId === overrideId || annotation.blockId === overrideId;
}

function visualChecklistOverrideId(blockId: string, index: number): string {
  return `${blockId}:checklist:${index}`;
}

function parseVisualChecklistOverrideId(overrideId: string): { blockId: string; index: number } | null {
  const marker = ':checklist:';
  const markerIndex = overrideId.lastIndexOf(marker);
  if (markerIndex < 0) return null;
  const blockId = overrideId.slice(0, markerIndex);
  const index = Number.parseInt(overrideId.slice(markerIndex + marker.length), 10);
  if (!blockId || !Number.isFinite(index) || index < 0) return null;
  return { blockId, index };
}

function parseVisualChecklistItems(block: Block): { checked: boolean; text: string; lineOffset: number }[] {
  const items: { checked: boolean; text: string; lineOffset: number }[] = [];
  block.content.split('\n').forEach((line, lineOffset) => {
    const match = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (match) {
      items.push({
        checked: match[1].toLowerCase() === 'x',
        text: match[2].trim(),
        lineOffset,
      });
      return;
    }
    const fallback = line.trim().replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
    if (fallback) {
      items.push({ checked: false, text: fallback, lineOffset });
    }
  });
  return items;
}
