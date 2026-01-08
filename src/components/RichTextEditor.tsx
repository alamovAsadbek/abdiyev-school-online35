import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Subscript as SubscriptIcon, 
  Superscript as SuperscriptIcon,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Quote,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Subscript,
      Superscript,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-primary/20 text-primary'
      )}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn('rounded-lg border border-border bg-background', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-muted/30">
        <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Orqaga qaytarish"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Oldinga qaytarish"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Sarlavha 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Sarlavha 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Qalin"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Kursiv"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Chemistry-specific: Subscript & Superscript */}
        <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive('subscript')}
            title="Pastki indeks (H₂O uchun)"
          >
            <SubscriptIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive('superscript')}
            title="Yuqori daraja (x² uchun)"
          >
            <SuperscriptIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Nuqtali ro'yxat"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Raqamli ro'yxat"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Iqtibos"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Gorizontal chiziq"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent editor={editor} />
        {!editor.getText() && placeholder && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Chemistry help text */}
      <div className="border-t border-border px-3 py-2 bg-muted/20">
        <p className="text-xs text-muted-foreground">
          💡 Kimyoviy formulalar uchun: <span className="font-medium">H₂O</span> yozish uchun "H" yozing, 
          keyin <SubscriptIcon className="inline h-3 w-3" /> tugmasini bosib "2" yozing, 
          yana <SubscriptIcon className="inline h-3 w-3" /> bosing va "O" yozing
        </p>
      </div>
    </div>
  );
}
