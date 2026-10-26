import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Eye,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ArticlePreview } from "@/components/editor/ArticlePreview";
import {
  EditorialEvaluationPanel,
  emptyEvaluation,
} from "@/components/editor/EditorialEvaluationPanel";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { CoverImageManager } from "@/components/uploads/CoverImageManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiMessage } from "@/lib/api";
import { isValidOptionalUrl, stripHtml, wordCount } from "@/lib/blog-content";
import { blogService, taxonomyService } from "@/services/blog.service";
import { editorialService } from "@/services/editorial.service";
import type {
  ArticleSeries,
  Blog,
  BlogCategory,
  BlogCoverImage,
  BlogFormPayload,
  BlogStatus,
  BlogTag,
  EditorialEvaluation,
  SourceReference,
} from "@/types/blog";

type SaveState = "saved" | "unsaved" | "saving" | "error";

const emptyArticle: BlogFormPayload = {
  title: "",
  excerpt: "",
  content: "",
  contributorName: "",
  contributorBiography: "",
  categoryId: "",
  tagIds: [],
  contentType: "ARTICLE",
  seriesId: null,
  seoTitle: "",
  seoDescription: "",
  coverImage: null,
  sources: [],
  internalNotes: "",
  suggestedPublicationDate: null,
};

export function ArticleWorkspace({
  articleId,
  initialMode = "edit",
}: {
  articleId?: string;
  initialMode?: "edit" | "review";
}) {
  const navigate = useNavigate();
  const [id, setId] = useState(articleId ?? "");
  const [form, setForm] = useState<BlogFormPayload>(emptyArticle);
  const [status, setStatus] = useState<BlogStatus>("DRAFT");
  const [evaluation, setEvaluation] =
    useState<EditorialEvaluation>(emptyEvaluation);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [series, setSeries] = useState<ArticleSeries[]>([]);
  const [mode, setMode] = useState<"edit" | "preview" | "review">(initialMode);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [busy, setBusy] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [uploading, setUploading] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    Promise.all([
      taxonomyService.categories(),
      taxonomyService.tags(),
      blogService.series(),
    ])
      .then(([nextCategories, nextTags, nextSeries]) => {
        setCategories(nextCategories);
        setTags(nextTags);
        setSeries(nextSeries);
      })
      .catch(() => toast.error("Some article options could not be loaded."));
  }, []);

  useEffect(() => {
    if (!articleId) {
      hydrated.current = true;
      return;
    }
    editorialService
      .getBlog(articleId)
      .then((blog) => {
        const next = formFromBlog(blog);
        setForm(next);
        setStatus(blog.status);
        setEvaluation(blog.editorialReview ?? evaluationFromBlog(blog));
        setSaveState("saved");
        hydrated.current = true;
      })
      .catch((error) =>
        toast.error(apiMessage(error, "Could not load article.")),
      )
      .finally(() => setLoading(false));
  }, [articleId]);

  const dirty = saveState === "unsaved" || saveState === "error";
  const blocker = useBlocker(dirty && !busy);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("This article has unsaved changes. Leave anyway?"))
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (
      !hydrated.current ||
      !id ||
      saveState !== "unsaved" ||
      uploading ||
      busy
    )
      return;
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        await editorialService.autosave(id, cleanPayload(form));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [busy, form, id, saveState, uploading]);

  const update = useCallback((next: Partial<BlogFormPayload>) => {
    setForm((current) => ({ ...current, ...next }));
    setSaveState("unsaved");
  }, []);

  async function saveCoverImage(coverImage: BlogCoverImage | null) {
    setForm((current) => ({ ...current, coverImage }));
    if (!id) {
      setSaveState("unsaved");
      return;
    }

    const wasSaved = saveState === "saved";
    if (wasSaved) setSaveState("saving");
    setBusy("cover");
    try {
      await editorialService.updateCoverImage(id, coverImage);
      if (wasSaved) {
        setSaveState((current) => current === "saving" ? "saved" : current);
      }
    } catch (error) {
      setSaveState("error");
      toast.error(apiMessage(error, "Could not save the thumbnail."));
      throw error;
    } finally {
      setBusy("");
    }
  }
  const warnings = useMemo(
    () => getWarnings(form, evaluation),
    [evaluation, form],
  );

  async function saveDraft() {
    if (uploading)
      return toast.error("Wait for the thumbnail upload to finish.");
    const error = validateDraft(form);
    if (error) return toast.error(error);
    setBusy("save");
    setSaveState("saving");
    try {
      const saved = id
        ? await editorialService.update(id, cleanPayload(form))
        : await editorialService.createDraft(cleanPayload(form));
      if (!id) {
        setId(saved.id);
        window.history.replaceState(
          null,
          "",
          `/editor/articles/${saved.id}/edit`,
        );
      }
      setStatus(saved.status);
      setSaveState("saved");
      toast.success("Draft saved.");
    } catch (error_) {
      setSaveState("error");
      toast.error(apiMessage(error_, "Could not save draft."));
    } finally {
      setBusy("");
    }
  }

  async function saveEvaluation() {
    if (!id) return toast.error("Save the draft before adding an evaluation.");
    if (evaluationWarnings(evaluation).length)
      return toast.error("Complete the editorial evaluation first.");
    setBusy("evaluation");
    try {
      if (["DRAFT", "EDITING", "NEEDS_CORRECTION"].includes(status)) {
        const submitted = await editorialService.submitForQualityReview(id);
        setStatus(submitted.status);
      }
      await editorialService.saveEvaluation(id, evaluation);
      toast.success("Critical evaluation saved.");
    } catch (error) {
      toast.error(apiMessage(error, "Could not save evaluation."));
    } finally {
      setBusy("");
    }
  }

  async function workflow(action: "correction" | "complete" | "admin") {
    if (!id) return toast.error("Save the article first.");
    if (action !== "correction" && evaluationWarnings(evaluation).length)
      return toast.error("Complete the editorial evaluation first.");
    setBusy(action);
    try {
      if (action === "correction") {
        if (evaluation.requiredCorrections.trim().length < 10)
          throw new Error("Describe the required corrections first.");
        await editorialService.requestRevision(
          id,
          evaluation.requiredCorrections,
        );
        setStatus("NEEDS_CORRECTION");
      }
      if (action === "complete")
        await editorialService.markQualityReviewComplete(id);
      if (action === "admin") await editorialService.sendToAdmin(id);
      if (action === "admin") setStatus("READY_FOR_ADMIN");
      toast.success(
        action === "admin"
          ? "Article sent to the admin queue."
          : "Workflow updated.",
      );
      if (action === "admin") navigate("/editor/my-work");
    } catch (error) {
      toast.error(
        error instanceof Error && !("response" in error)
          ? error.message
          : apiMessage(error, "Could not update workflow."),
      );
    } finally {
      setBusy("");
    }
  }

  if (loading)
    return <div className="h-96 animate-pulse rounded-2xl bg-[#fbf7ef]" />;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#a9793d]">
            Editorial workspace
          </p>
          <h1 className="font-serif text-3xl font-semibold">
            {id ? form.title || "Untitled article" : "Create article"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveIndicator state={saveState} />
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode(mode === "preview" ? "edit" : "preview")}
          >
            <Eye className="h-4 w-4" />{" "}
            {mode === "preview" ? "Edit" : "Preview"}
          </Button>
          <Button
            type="button"
            disabled={!!busy || uploading}
            onClick={() => void saveDraft()}
          >
            <Save className="h-4 w-4" />{" "}
            {busy === "save" ? "Saving…" : "Save draft"}
          </Button>
        </div>
      </header>
      {mode === "preview" ? (
        <ArticlePreview article={form} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardContent className="space-y-6 p-4 md:p-6">
              <section className="grid gap-4 md:grid-cols-2">
                <Field label="Title">
                  <Input
                    value={form.title}
                    maxLength={240}
                    onChange={(event) => update({ title: event.target.value })}
                    placeholder="A clear, specific headline"
                  />
                </Field>
                <Field label="Subtitle or excerpt">
                  <Input
                    value={form.excerpt ?? ""}
                    maxLength={300}
                    onChange={(event) =>
                      update({ excerpt: event.target.value })
                    }
                  />
                </Field>
                <Field label="Contributor name">
                  <Input
                    value={form.contributorName ?? ""}
                    onChange={(event) =>
                      update({ contributorName: event.target.value })
                    }
                  />
                </Field>
                <Field label="Content type">
                  <Select
                    value={form.contentType}
                    onChange={(event) =>
                      update({
                        contentType: event.target
                          .value as BlogFormPayload["contentType"],
                      })
                    }
                  >
                    {[
                      "ARTICLE",
                      "OPINION",
                      "INTERVIEW",
                      "FEATURE",
                      "NEWS",
                      "GUIDE",
                    ].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Category">
                  <Select
                    value={form.categoryId ?? ""}
                    onChange={(event) =>
                      update({ categoryId: event.target.value || null })
                    }
                  >
                    <option value="">Select category</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Article series">
                  <Select
                    value={form.seriesId ?? ""}
                    onChange={(event) =>
                      update({ seriesId: event.target.value || null })
                    }
                  >
                    <option value="">No series</option>
                    {series.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Contributor biography">
                    <Textarea
                      value={form.contributorBiography ?? ""}
                      onChange={(event) =>
                        update({ contributorBiography: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Tags">
                    <div className="flex flex-wrap gap-2 rounded-xl border border-[#ded3c4] p-3">
                      {tags.map((tag) => (
                        <label
                          key={tag.id}
                          className="flex items-center gap-2 rounded-full bg-[#f4efe6] px-3 py-2 text-sm"
                        >
                          <Checkbox
                            checked={form.tagIds?.includes(tag.id)}
                            onCheckedChange={(checked) =>
                              update({
                                tagIds: checked
                                  ? [...(form.tagIds ?? []), tag.id]
                                  : (form.tagIds ?? []).filter(
                                      (id_) => id_ !== tag.id,
                                    ),
                              })
                            }
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              </section>
              <section>
                <Label className="mb-2 block">Article content</Label>
                <RichTextEditor
                  value={form.content}
                  onChange={(content) => update({ content })}
                />
              </section>
              <CoverImageManager
                value={form.coverImage}
                title={form.title}
                excerpt={form.excerpt}
                disabled={!!busy}
                onUploadingChange={setUploading}
                onSave={saveCoverImage}
              />
              <SourceEditor
                sources={form.sources ?? []}
                onChange={(sources) => update({ sources })}
              />
              <section className="grid gap-4 md:grid-cols-2">
                <Field label="SEO title">
                  <Input
                    value={form.seoTitle ?? ""}
                    maxLength={70}
                    onChange={(event) =>
                      update({ seoTitle: event.target.value })
                    }
                  />
                </Field>
                <Field label="SEO description">
                  <Textarea
                    value={form.seoDescription ?? ""}
                    maxLength={160}
                    onChange={(event) =>
                      update({ seoDescription: event.target.value })
                    }
                  />
                </Field>
                <Field label="Suggested publication date">
                  <Input
                    type="datetime-local"
                    value={toLocalDate(form.suggestedPublicationDate)}
                    onChange={(event) =>
                      update({
                        suggestedPublicationDate: event.target.value
                          ? new Date(event.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Internal editorial notes">
                    <Textarea
                      value={form.internalNotes ?? ""}
                      className="min-h-28"
                      onChange={(event) =>
                        update({ internalNotes: event.target.value })
                      }
                    />
                  </Field>
                </div>
              </section>
            </CardContent>
          </Card>
          <Card className="h-fit xl:sticky xl:top-20">
            <CardHeader>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "review" ? "default" : "outline"}
                  onClick={() => setMode("review")}
                >
                  <ShieldCheck className="h-4 w-4" /> Review
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "edit" ? "default" : "outline"}
                  onClick={() => setMode("edit")}
                >
                  Warnings
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mode === "review" ? (
                <div className="space-y-4">
                  <EditorialEvaluationPanel
                    value={evaluation}
                    onChange={setEvaluation}
                    warnings={warnings}
                  />
                  <Button
                    className="w-full"
                    disabled={!!busy}
                    onClick={() => void saveEvaluation()}
                  >
                    Save evaluation
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => void workflow("correction")}
                  >
                    Request correction
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => void workflow("complete")}
                  >
                    Mark review complete
                  </Button>
                  <Button
                    className="w-full"
                    disabled={!!busy}
                    onClick={() => void workflow("admin")}
                  >
                    <Send className="h-4 w-4" /> Send to admin
                  </Button>
                </div>
              ) : (
                <WarningList warnings={warnings} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SourceEditor({
  sources,
  onChange,
}: {
  sources: SourceReference[];
  onChange: (sources: SourceReference[]) => void;
}) {
  const add = () =>
    onChange([...sources, { title: "", url: "", publisher: "" }]);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Source references</Label>
          <p className="text-xs text-[#74685f]">
            Add credible links and publisher details used by the article.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-4 w-4" /> Add source
        </Button>
      </div>
      {sources.map((source, index) => (
        <div
          key={source.id ?? index}
          className="grid gap-2 rounded-xl border border-[#ded3c4] p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <Input
            value={source.title}
            placeholder="Source title"
            onChange={(event) =>
              onChange(
                sources.map((item, i) =>
                  i === index ? { ...item, title: event.target.value } : item,
                ),
              )
            }
          />
          <Input
            value={source.publisher ?? ""}
            placeholder="Publisher"
            onChange={(event) =>
              onChange(
                sources.map((item, i) =>
                  i === index
                    ? { ...item, publisher: event.target.value }
                    : item,
                ),
              )
            }
          />
          <Input
            type="url"
            value={source.url ?? ""}
            placeholder="https://…"
            onChange={(event) =>
              onChange(
                sources.map((item, i) =>
                  i === index ? { ...item, url: event.target.value } : item,
                ),
              )
            }
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Remove source"
            onClick={() => onChange(sources.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </section>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
function SaveIndicator({ state }: { state: SaveState }) {
  const labels: Record<SaveState, string> = {
    saved: "All changes saved",
    unsaved: "Unsaved changes",
    saving: "Saving draft…",
    error: "Autosave failed",
  };
  return (
    <span
      aria-live="polite"
      className={`text-xs font-semibold ${state === "error" ? "text-red-700" : state === "saved" ? "text-green-700" : "text-amber-700"}`}
    >
      {labels[state]}
    </span>
  );
}
function WarningList({ warnings }: { warnings: string[] }) {
  return warnings.length ? (
    <div>
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4 text-amber-700" /> Editorial warnings
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#5c4b3d]">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  ) : (
    <p className="text-sm text-green-700">
      The automated content checks are clear.
    </p>
  );
}
function validateDraft(form: BlogFormPayload) {
  if (!form.title.trim()) return "Add a title before saving.";
  if (!stripHtml(form.content).trim())
    return "Add article content before saving.";
  if (!isValidOptionalUrl(form.coverImage?.url))
    return "Thumbnail URL is invalid.";
  const badSource = form.sources?.find(
    (source) => !isValidOptionalUrl(source.url),
  );
  return badSource ? "One or more source URLs are invalid." : "";
}
function cleanPayload(form: BlogFormPayload): BlogFormPayload {
  return {
    ...form,
    title: form.title.trim(),
    excerpt: form.excerpt?.trim(),
    seoTitle: form.seoTitle?.trim(),
    seoDescription: form.seoDescription?.trim(),
    contributorName: form.contributorName?.trim(),
    contributorBiography: form.contributorBiography?.trim(),
    internalNotes: form.internalNotes?.trim(),
    sources: form.sources
      ?.filter((source) => source.title.trim() || source.url?.trim())
      .map((source) => ({
        ...source,
        title: source.title.trim(),
        url: source.url?.trim(),
        publisher: source.publisher?.trim(),
      })),
  };
}
function formFromBlog(blog: Blog): BlogFormPayload {
  const cover =
    blog.coverImage && typeof blog.coverImage === "object"
      ? blog.coverImage
      : blog.coverImage || blog.imageUrl
        ? {
            url: String(blog.coverImage || blog.imageUrl),
            publicId: blog.coverImagePublicId,
            altText: blog.altText ?? blog.coverImageAltText,
            crop: blog.crop ?? blog.coverImageCrop,
          }
        : null;
  return {
    ...emptyArticle,
    title: blog.title,
    excerpt: blog.subtitle ?? blog.excerpt ?? "",
    content: blog.content ?? "",
    contributorName:
      blog.contributor?.name ?? blog.contributorName ?? blog.author?.name ?? "",
    contributorBiography:
      blog.contributor?.biography ?? blog.contributorBiography ?? "",
    categoryId:
      blog.categoryId ??
      (typeof blog.category === "object" ? blog.category?.id : null),
    tagIds: blog.tags?.flatMap((tag) =>
      typeof tag === "object" && tag.id ? [tag.id] : [],
    ),
    contentType: blog.contentType ?? "ARTICLE",
    seriesId: blog.seriesId ?? null,
    seoTitle: blog.seoTitle ?? "",
    seoDescription: blog.seoDescription ?? "",
    coverImage: cover,
    sources: blog.sources ?? [],
    internalNotes: blog.internalNotes ?? "",
    suggestedPublicationDate: blog.suggestedPublicationDate ?? null,
  };
}
function evaluationFromBlog(blog: Blog): EditorialEvaluation {
  return {
    ...emptyEvaluation,
    plagiarismScore: blog.plagiarismScore ?? null,
    factCheckStatus: blog.factCheckComplete ? "PASSED" : "NOT_REVIEWED",
    recommendation: blog.recommendation ?? "",
    internalNotes: blog.internalNotes ?? "",
  };
}
function getWarnings(form: BlogFormPayload, evaluation: EditorialEvaluation) {
  const html = form.content || "";
  const paragraphs = Array.from(
    new DOMParser().parseFromString(html, "text/html").querySelectorAll("p"),
  ).map((node) => node.textContent?.trim() ?? "");
  const warnings: string[] = [];
  if (!form.title.trim()) warnings.push("Missing title.");
  if (wordCount(html) < 300)
    warnings.push("Content is short (fewer than 300 words).");
  if (!/<h[1-3][^>]*>/i.test(html)) warnings.push("No section headings found.");
  if (paragraphs[0]?.split(/\s+/).length < 30)
    warnings.push("Introduction may be missing or too short.");
  if ((paragraphs.at(-1)?.split(/\s+/).length ?? 0) < 25)
    warnings.push("Conclusion may be missing or too short.");
  if (paragraphs.some((paragraph) => paragraph.split(/\s+/).length > 120))
    warnings.push("One or more paragraphs are longer than 120 words.");
  if (!form.sources?.length) warnings.push("No source references added.");
  if (!form.coverImage?.url) warnings.push("Thumbnail is missing.");
  else if (!form.coverImage.altText?.trim())
    warnings.push("Thumbnail alt text is missing.");
  if ((evaluation.plagiarismScore ?? 0) >= 20)
    warnings.push("Plagiarism score is high.");
  if (!form.seoDescription?.trim())
    warnings.push("SEO description is missing.");
  if (evaluationWarnings(evaluation).length)
    warnings.push("Editorial checklist is incomplete.");
  return warnings;
}
function evaluationWarnings(value: EditorialEvaluation) {
  const missing = [];
  if (value.grammarStatus === "NOT_REVIEWED") missing.push("grammar");
  if (value.readabilityScore === null) missing.push("readability");
  if (value.plagiarismScore === null) missing.push("plagiarism");
  if (value.factCheckStatus === "NOT_REVIEWED") missing.push("fact check");
  if (value.sourceVerificationStatus === "NOT_REVIEWED")
    missing.push("sources");
  if (
    !value.headlineQuality ||
    !value.introductionQuality ||
    !value.structureQuality ||
    !value.conclusionQuality ||
    !value.thumbnailQuality
  )
    missing.push("quality ratings");
  if (value.seoReadiness === "NOT_REVIEWED") missing.push("SEO");
  if (!value.copyrightConfirmed) missing.push("copyright");
  if (!value.recommendation) missing.push("recommendation");
  if (value.contentQualityScore === null) missing.push("overall score");
  return missing;
}
function toLocalDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
