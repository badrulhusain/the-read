import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { EditorialEvaluation, QualityRating, ReviewStatus } from '@/types/blog';

export const emptyEvaluation: EditorialEvaluation = {
  grammarStatus: 'NOT_REVIEWED', readabilityScore: null, plagiarismScore: null,
  factCheckStatus: 'NOT_REVIEWED', sourceVerificationStatus: 'NOT_REVIEWED',
  headlineQuality: '', introductionQuality: '', structureQuality: '', conclusionQuality: '',
  seoReadiness: 'NOT_REVIEWED', thumbnailQuality: '', copyrightConfirmed: false,
  requiredCorrections: '', recommendation: '', contentQualityScore: null, internalNotes: '', finalChecklist: {},
};

export function EditorialEvaluationPanel({ value, onChange, warnings = [], disabled = false }: { value: EditorialEvaluation; onChange: (value: EditorialEvaluation) => void; warnings?: string[]; disabled?: boolean }) {
  const set = <K extends keyof EditorialEvaluation>(key: K, next: EditorialEvaluation[K]) => onChange({ ...value, [key]: next });
  return (
    <aside className="space-y-5" aria-label="Critical editorial evaluation">
      <div><h2 className="font-serif text-2xl font-semibold">Critical evaluation</h2><p className="mt-1 text-sm leading-6 text-[#74685f]">Complete this record before sending the article to an administrator.</p></div>
      {warnings.length ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-3"><p className="flex items-center gap-2 text-sm font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" /> Content warnings</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : <p className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800"><CheckCircle2 className="h-4 w-4" /> No automated warnings</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <StatusField label="Grammar status" value={value.grammarStatus} onChange={(next) => set('grammarStatus', next)} disabled={disabled} />
        <ScoreField label="Readability score" value={value.readabilityScore} onChange={(next) => set('readabilityScore', next)} disabled={disabled} />
        <ScoreField label="Plagiarism score" value={value.plagiarismScore} onChange={(next) => set('plagiarismScore', next)} disabled={disabled} />
        <StatusField label="Fact-check status" value={value.factCheckStatus} onChange={(next) => set('factCheckStatus', next)} disabled={disabled} />
        <StatusField label="Source verification" value={value.sourceVerificationStatus} onChange={(next) => set('sourceVerificationStatus', next)} disabled={disabled} />
        <RatingField label="Headline quality" value={value.headlineQuality} onChange={(next) => set('headlineQuality', next)} disabled={disabled} />
        <RatingField label="Introduction quality" value={value.introductionQuality} onChange={(next) => set('introductionQuality', next)} disabled={disabled} />
        <RatingField label="Content structure" value={value.structureQuality} onChange={(next) => set('structureQuality', next)} disabled={disabled} />
        <RatingField label="Conclusion quality" value={value.conclusionQuality} onChange={(next) => set('conclusionQuality', next)} disabled={disabled} />
        <StatusField label="SEO readiness" value={value.seoReadiness} onChange={(next) => set('seoReadiness', next)} disabled={disabled} />
        <RatingField label="Thumbnail quality" value={value.thumbnailQuality} onChange={(next) => set('thumbnailQuality', next)} disabled={disabled} />
        <ScoreField label="Overall quality score" value={value.contentQualityScore} onChange={(next) => set('contentQualityScore', next)} disabled={disabled} />
      </div>
      <label className="flex items-start gap-3 text-sm leading-6"><Checkbox checked={value.copyrightConfirmed} disabled={disabled} onCheckedChange={(checked) => set('copyrightConfirmed', checked === true)} /><span>Copyright and image rights confirmed</span></label>
      <Select value={value.recommendation} disabled={disabled} onChange={(event) => set('recommendation', event.target.value as EditorialEvaluation['recommendation'])}><option value="">Editor recommendation</option><option value="APPROVE">Ready for admin</option><option value="RETURN">Request correction</option><option value="REJECT">Reject</option></Select>
      <Textarea value={value.requiredCorrections} disabled={disabled} onChange={(event) => set('requiredCorrections', event.target.value)} placeholder="Required corrections" className="min-h-24" />
      <Textarea value={value.internalNotes ?? ''} disabled={disabled} onChange={(event) => set('internalNotes', event.target.value)} placeholder="Internal editorial notes" className="min-h-24" />
    </aside>
  );
}

function StatusField({ label, value, onChange, disabled }: { label: string; value: ReviewStatus; onChange: (value: ReviewStatus) => void; disabled: boolean }) { return <label className="space-y-1 text-xs font-semibold text-[#5c4b3d]"><span>{label}</span><Select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as ReviewStatus)}><option value="NOT_REVIEWED">Not reviewed</option><option value="IN_PROGRESS">In progress</option><option value="PASSED">Passed</option><option value="NEEDS_WORK">Needs work</option></Select></label>; }
function RatingField({ label, value, onChange, disabled }: { label: string; value: QualityRating | ''; onChange: (value: QualityRating | '') => void; disabled: boolean }) { return <label className="space-y-1 text-xs font-semibold text-[#5c4b3d]"><span>{label}</span><Select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as QualityRating | '')}><option value="">Not rated</option><option value="POOR">Poor</option><option value="FAIR">Fair</option><option value="GOOD">Good</option><option value="EXCELLENT">Excellent</option></Select></label>; }
function ScoreField({ label, value, onChange, disabled }: { label: string; value: number | null; onChange: (value: number | null) => void; disabled: boolean }) { return <label className="space-y-1 text-xs font-semibold text-[#5c4b3d]"><span>{label}</span><Input type="number" min="0" max="100" value={value ?? ''} disabled={disabled} onChange={(event) => onChange(event.target.value === '' ? null : Math.min(100, Math.max(0, Number(event.target.value))))} /></label>; }
