import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Maximize2,
  Minimize2,
  RemoveFormatting,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { readingTime, wordCount } from '@/lib/blog-content';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder = 'Write the full blog content...', disabled }: RichTextEditorProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      LinkExtension.configure({
        autolink: true,
        openOnClick: false,
        protocols: ['http', 'https', 'mailto'],
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prose-read min-h-[340px] w-full max-w-none rounded-b-xl bg-[#fffaf1] px-4 py-4 font-serif text-lg leading-8 text-[#231b17] focus:outline-none',
      },
    },
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.getHTML()),
    immediatelyRender: false,
  });

  if (editor && value !== editor.getHTML() && !editor.isFocused) {
    editor.commands.setContent(value || '', { emitUpdate: false });
  }

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter link URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const normalized = normalizeLink(url);
    if (!normalized) {
      window.alert('Enter a valid http, https, or mailto link.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
  }, [editor]);

  const text = editor?.getText() ?? '';

  return (
    <div className={cn('overflow-hidden rounded-xl border border-[#ded3c4] bg-[#fbf7ef] shadow-sm', fullscreen && 'fixed inset-0 z-50 flex flex-col rounded-none bg-[#fffaf1]')}>
      <div className="flex flex-wrap gap-1 border-b border-[#ded3c4] bg-[#f4efe6] p-2">
        <ToolButton label="Heading 1" active={editor?.isActive('heading', { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 /></ToolButton>
        <ToolButton label="Heading 2" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 /></ToolButton>
        <ToolButton label="Heading 3" active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 /></ToolButton>
        <Divider />
        <ToolButton label="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold /></ToolButton>
        <ToolButton label="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic /></ToolButton>
        <ToolButton label="Underline" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon /></ToolButton>
        <ToolButton label="Link" active={editor?.isActive('link')} onClick={setLink}><LinkIcon /></ToolButton>
        <Divider />
        <ToolButton label="Bullet list" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List /></ToolButton>
        <ToolButton label="Ordered list" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered /></ToolButton>
        <ToolButton label="Blockquote" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote /></ToolButton>
        <ToolButton label="Code block" active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Code /></ToolButton>
        <ToolButton label="Horizontal rule" onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus /></ToolButton>
        <Divider />
        <ToolButton label="Align left" active={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain().focus().setTextAlign('left').run()}><AlignLeft /></ToolButton>
        <ToolButton label="Align center" active={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()}><AlignCenter /></ToolButton>
        <ToolButton label="Align right" active={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain().focus().setTextAlign('right').run()}><AlignRight /></ToolButton>
        <Divider />
        <ToolButton label="Undo" onClick={() => editor?.chain().focus().undo().run()}><Undo2 /></ToolButton>
        <ToolButton label="Redo" onClick={() => editor?.chain().focus().redo().run()}><Redo2 /></ToolButton>
        <ToolButton label="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting /></ToolButton>
        <ToolButton label={fullscreen ? 'Exit fullscreen' : 'Fullscreen writing mode'} onClick={() => setFullscreen((current) => !current)}>{fullscreen ? <Minimize2 /> : <Maximize2 />}</ToolButton>
      </div>
      <div className={cn(fullscreen && 'min-h-0 flex-1 overflow-y-auto [&_.ProseMirror]:min-h-full')}><EditorContent editor={editor} /></div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ded3c4] bg-[#f4efe6] px-4 py-2 text-xs font-medium text-[#74685f]">
        <span>{wordCount(text)} words</span>
        <span>{readingTime(text)}</span>
      </div>
    </div>
  );
}

function normalizeLink(value: string) {
  const candidate = value.trim();
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(candidate)) return `mailto:${candidate}`;
  try {
    const url = new URL(candidate);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5c4b3d] transition hover:bg-[#eee6da] hover:text-[#7b2d32] [&_svg]:h-4 [&_svg]:w-4',
        active && 'bg-[#7b2d32] text-[#fffaf1] hover:bg-[#7b2d32] hover:text-[#fffaf1]',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 hidden w-px bg-[#ded3c4] sm:block" aria-hidden="true" />;
}
