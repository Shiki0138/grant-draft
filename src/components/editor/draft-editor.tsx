"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import { Button } from "@/components/ui/button";

interface DraftSection {
  heading: string;
  body: string;
}

interface DraftContent {
  sections: DraftSection[];
}

interface DraftEditorProps {
  content: DraftContent;
  onChange: (content: DraftContent) => void;
  onSave: (content: DraftContent) => void;
}

const SectionEditor = ({ 
  section, 
  onUpdate
}: { 
  section: DraftSection; 
  onUpdate: (text: string) => void;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({
        limit: 1000,
      }),
    ],
    content: section.body,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  const characterCount = editor?.storage.characterCount.characters() || 0;
  const isOverLimit = characterCount > 1000;

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold mb-4">{section.heading}</h3>
      
      <div className={`border rounded-md p-4 ${isOverLimit ? 'border-red-500' : 'border-gray-300'}`}>
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
      
      <div className={`mt-2 text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
        {characterCount} / 1000 文字
        {isOverLimit && " - 文字数制限を超えています"}
      </div>
    </div>
  );
};

export default function DraftEditor({ content, onChange, onSave }: DraftEditorProps) {
  const updateSection = (index: number, text: string) => {
    const newSections = [...content.sections];
    newSections[index] = { ...newSections[index], body: text };
    onChange({ sections: newSections });
  };

  const handleSave = () => {
    onSave(content);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">申請書セクション</h2>
        <Button onClick={handleSave} variant="outline" size="sm">
          保存 (Cmd+S)
        </Button>
      </div>

      {content.sections.map((section, index) => (
        <SectionEditor
          key={index}
          section={section}
          onUpdate={(text) => updateSection(index, text)}
        />
      ))}

      <style jsx global>{`
        .ProseMirror {
          min-height: 150px;
          outline: none;
        }
        
        .ProseMirror p {
          margin-bottom: 1em;
        }
        
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        
        .ProseMirror li {
          margin-bottom: 0.5em;
        }
      `}</style>
    </div>
  );
}