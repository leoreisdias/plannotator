import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SparklesIcon } from '@plannotator/ui/components/SparklesIcon';

interface ExpandedCommentDialogProps {
  title: string;
  commentText: string;
  setCommentText: (text: string) => void;
  isEditing: boolean;
  canSubmit: boolean;
  aiAvailable?: boolean;
  onAskAI?: (question: string) => void;
  onSubmit: () => void;
  onCollapse: () => void;
  onCancel: () => void;
}

export const ExpandedCommentDialog: React.FC<ExpandedCommentDialogProps> = ({
  title,
  commentText,
  setCommentText,
  isEditing,
  canSubmit,
  aiAvailable = false,
  onAskAI,
  onSubmit,
  onCollapse,
  onCancel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const askAIEnabled = aiAvailable && !!onAskAI && commentText.trim().length > 0;
  const submitLabel = isEditing ? 'Update' : 'Add Comment';

  useEffect(() => {
    const id = window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const handleAskAI = () => {
    if (!askAIEnabled) return;
    onAskAI?.(commentText.trim());
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCollapse} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-popover border border-border rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-xs text-muted-foreground truncate">{title}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCollapse}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Collapse"
              aria-label="Collapse expanded comment"
            >
              <CollapseIcon />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Close"
              aria-label="Close expanded comment"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 min-h-0 flex-1">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Leave feedback..."
            className="w-full min-h-72 max-h-[56vh] bg-muted text-sm leading-relaxed placeholder:text-muted-foreground resize-y focus:outline-none rounded-lg border-0 px-3 py-2"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                onCollapse();
                return;
              }

              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border/50">
          <div>
            {aiAvailable && (
              <button
                type="button"
                onClick={handleAskAI}
                disabled={!askAIEnabled}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={askAIEnabled ? 'Ask AI this question' : 'Type a question to ask AI'}
              >
                <SparklesIcon className="w-3 h-3" />
                Ask AI
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCollapse}
              className="review-toolbar-btn"
            >
              Collapse
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="review-toolbar-btn primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const CollapseIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
