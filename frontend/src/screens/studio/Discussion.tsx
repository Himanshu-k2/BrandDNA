import { useState } from 'react';
import { Link2, Send } from 'lucide-react';
import { MonoAvatar } from '@/components/mono/Brand';
import { FloatingTextArea } from '@/components/mono/FloatingField';
import { Button, Card, ICON, Pill } from '@/components/mono/ui';
import type { Comment } from '@/data/demo';

export function Discussion({ comments, onPost }: { comments: Comment[]; onPost: (body: string) => void }) {
  const [body, setBody] = useState('');
  return (
    <Card className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-subheading font-semibold text-ink">Review discussion</h2>
        <p className="text-body text-graphite">Threaded feedback is attached to the audit trail for this submission.</p>
      </div>
      <ol className="flex flex-col gap-6">
        {comments.map((comment, index) => (
          <li key={comment.id} className="flex gap-3">
            <MonoAvatar initials={comment.initials} tone={index % 2 ? 'silver' : 'graphite'} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-ui font-semibold text-ink">{comment.author}</span>
                <span className="text-caption text-graphite">{comment.role}</span>
                <span className="text-caption text-mid">· {comment.time}</span>
              </p>
              {comment.anchor && (
                <Pill variant="outline" icon={Link2} caps={false} className="w-max">
                  {comment.anchor}
                </Pill>
              )}
              <p className="text-body text-graphite">{comment.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <form
        className="flex flex-col gap-3 border-t border-silver pt-6"
        onSubmit={event => {
          event.preventDefault();
          if (!body.trim()) return;
          onPost(body.trim());
          setBody('');
        }}
      >
        <FloatingTextArea label="Add a comment" value={body} onChange={event => setBody(event.target.value)} hint="Reply to the thread or @mention a reviewer." />
        <div className="flex justify-end">
          <Button type="submit" disabled={!body.trim()}>
            <Send className="size-4" {...ICON} /> Post comment
          </Button>
        </div>
      </form>
    </Card>
  );
}
