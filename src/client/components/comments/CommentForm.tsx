import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/lib/api';
import { commentService } from '@/services/comment.service';
import type { BlogComment } from '@/types/blog';
import type { AuthUser } from '@/types/auth';

interface CommentFormProps {
  slug: string;
  user: AuthUser | null;
  onCreated: (comment: BlogComment) => void;
}

const maxLength = 1000;

export function CommentForm({ slug, user, onCreated }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed) return toast.error('Comment cannot be empty.');
    if (trimmed.length > maxLength) return toast.error(`Comment must be ${maxLength} characters or less.`);

    setSubmitting(true);
    try {
      const comment = await commentService.createBlogComment(slug, { content: trimmed });
      onCreated(comment);
      setContent('');
      toast.success('Comment posted.');
    } catch (error) {
      toast.error(apiMessage(error, 'Could not post comment.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-[#ded3c4] bg-[#fffaf1] p-4 text-sm text-[#74685f]">
        <Link to="/login" className="font-semibold text-[#7b2d32] hover:underline">Log in</Link> to join the conversation.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#ded3c4] bg-[#fffaf1] p-4">
      <Textarea
        value={content}
        maxLength={maxLength}
        disabled={submitting}
        placeholder="Share your thoughts..."
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#a19184]">{content.trim().length}/{maxLength}</span>
        <Button type="button" disabled={submitting || !content.trim()} onClick={() => void submit()}>
          <Send className="h-4 w-4" /> {submitting ? 'Posting...' : 'Post comment'}
        </Button>
      </div>
    </div>
  );
}
