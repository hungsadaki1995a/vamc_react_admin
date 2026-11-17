import { Extension, type CommandProps } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphIndent: {
      increaseIndent: () => ReturnType;
      decreaseIndent: () => ReturnType;
      setIndent: (indent: number | null) => ReturnType;
      unsetIndent: () => ReturnType;
    };
  }
}

type ParagraphIndentOptions = {
  types: string[];
  step: number;
  max: number;
};

function clampIndent(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

function parseIndent(raw: string | null | undefined) {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export const ParagraphIndent = Extension.create<ParagraphIndentOptions>({
  name: 'paragraphIndent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      step: 24,
      max: 120,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: null,
            parseHTML: (element) => parseIndent(element.style.marginLeft),
            renderHTML: (attributes) => {
              const indent = typeof attributes.indent === 'number' ? attributes.indent : null;
              if (!indent || indent <= 0) {
                return {};
              }
              return {
                style: `margin-left: ${indent}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const applyIndent = (indent: number | null) => ({ editor, commands }: CommandProps) => {
      for (const type of this.options.types) {
        if (!editor.isActive(type)) {
          continue;
        }
        if (indent == null || indent <= 0) {
          return commands.updateAttributes(type, { indent: null });
        }
        return commands.updateAttributes(type, { indent });
      }
      return false;
    };

    const mutateIndent = (delta: number) => ({ editor, commands }: CommandProps) => {
      for (const type of this.options.types) {
        if (!editor.isActive(type)) {
          continue;
        }
        const current = Number(editor.getAttributes(type).indent ?? 0);
        const next = clampIndent(current + delta, this.options.max);
        return commands.updateAttributes(type, { indent: next > 0 ? next : null });
      }
      return false;
    };

    return {
      increaseIndent: () => mutateIndent(this.options.step),
      decreaseIndent: () => mutateIndent(-this.options.step),
      setIndent: (indent) => applyIndent(indent == null ? null : clampIndent(indent, this.options.max)),
      unsetIndent: () => applyIndent(null),
    };
  },
});

export default ParagraphIndent;
