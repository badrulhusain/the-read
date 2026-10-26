import { useParams } from 'react-router-dom';
import { ArticleWorkspace } from '@/components/editor/ArticleWorkspace';
export default function ArticleReviewPage() { const { id = '' } = useParams(); return <ArticleWorkspace articleId={id} initialMode="review" />; }
