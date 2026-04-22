"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Check,
  X,
  FileText,
  Presentation,
  Film,
  FileImage,
  File,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { contributionsApi } from "@/lib/workspace-api";
import type { ContributionProposal } from "@/types/workspaces";
import type { MaterialType } from "@/types/courses";

const MaterialIcon = ({ type }: { type?: MaterialType }) => {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "PDF": return <FileText className={cls + " text-red-500"} />;
    case "SLIDES": return <Presentation className={cls + " text-orange-500"} />;
    case "VIDEO": return <Film className={cls + " text-purple-500"} />;
    case "IMAGE": return <FileImage className={cls + " text-blue-500"} />;
    default: return <File className={cls + " text-muted-foreground"} />;
  }
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface ContributionReviewProps {
  courseId: number;
  userId: number;
}

export function ContributionReview({ courseId, userId }: ContributionReviewProps) {
  const [proposals, setProposals] = useState<ContributionProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    contributionsApi
      .getForCourse(courseId, userId)
      .then(setProposals)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [courseId, userId]);

  const handleReview = async (proposalId: number, status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    try {
      const updated = await contributionsApi.review(proposalId, userId, {
        status,
        reviewMessage: reviewMessage.trim() || undefined,
      });
      setProposals((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setReviewingId(null);
      setReviewMessage("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No contribution proposals yet. Students can propose materials from their workspaces.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {proposals.filter((p) => p.status === "PENDING").length} pending ·{" "}
        {proposals.filter((p) => p.status === "APPROVED").length} approved ·{" "}
        {proposals.filter((p) => p.status === "REJECTED").length} rejected
      </p>
      {proposals.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold block leading-tight">{p.studentName}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(p.createdAt))}
                      </span>
                    </div>
                  </div>
                  <Badge className={`text-[10px] font-medium px-2 py-0.5 ${statusStyles[p.status]}`}>
                    {p.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Source Material</span>
                    <div className="flex items-center gap-2">
                      <MaterialIcon type={p.sourceMaterialType as MaterialType} />
                      <span className="text-sm font-medium truncate max-w-[200px]" title={p.sourceMaterialTitle}>
                        {p.sourceMaterialTitle || "Untitled"}
                      </span>
                      {p.sourceMaterialUrl && (
                        <a
                          href={`http://localhost:8080${p.sourceMaterialUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline"
                        >
                          Preview
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/50 pt-2 md:pt-0 md:pl-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Target Section</span>
                    <p className="text-sm font-medium truncate" title={p.targetSectionTitle}>
                      {p.targetSectionTitle || "Unknown Section"}
                    </p>
                  </div>
                </div>

                {p.message && (
                  <div className="bg-primary/5 p-2 rounded text-xs text-muted-foreground italic border-l-2 border-primary/20">
                    &ldquo;{p.message}&rdquo;
                  </div>
                )}
                
                {p.reviewMessage && (
                  <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground border border-border/40">
                    <span className="font-bold text-foreground">Review feedback:</span> {p.reviewMessage}
                  </div>
                )}
              </div>
            </div>

            {p.status === "PENDING" && (
              <div className="pt-2 border-t border-border/50 space-y-2">
                {reviewingId === p.id ? (
                  <>
                    <Textarea
                      placeholder="Add a message (optional)…"
                      value={reviewMessage}
                      onChange={(e) => setReviewMessage(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(p.id, "APPROVED")}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(p.id, "REJECTED")}
                        disabled={actionLoading}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReviewingId(null);
                          setReviewMessage("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewingId(p.id)}
                  >
                    Review
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
