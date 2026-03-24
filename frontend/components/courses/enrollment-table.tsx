"use client";

import { useState } from "react";
import { Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { coursesApi } from "@/lib/courses-api";
import type { CourseEnrollment, EnrollmentStatus } from "@/types/courses";

const StatusBadge = ({ status }: { status: EnrollmentStatus }) => {
  const styles: Record<EnrollmentStatus, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    DROPPED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const icons: Record<EnrollmentStatus, React.ReactNode> = {
    ACTIVE: <CheckCircle2 className="h-3 w-3" />,
    PENDING: <Clock className="h-3 w-3" />,
    DROPPED: <XCircle className="h-3 w-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {icons[status]}
      {status}
    </span>
  );
};

interface EnrollmentTableProps {
  courseId: number;
  instructorId: number;
  enrollments: CourseEnrollment[];
  onUpdated: (updated: CourseEnrollment) => void;
}

export function EnrollmentTable({
  courseId,
  instructorId,
  enrollments,
  onUpdated,
}: EnrollmentTableProps) {
  const [loading, setLoading] = useState<number | null>(null);

  const update = async (enrollmentId: number, status: EnrollmentStatus) => {
    setLoading(enrollmentId);
    try {
      const updated = await coursesApi.updateEnrollmentStatus(enrollmentId, instructorId, status);
      onUpdated(updated);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  };

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
        <Users className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Student</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Enrolled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.studentName}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{e.studentEmail}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(e.enrolledAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <StatusBadge status={e.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {e.status !== "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => update(e.id, "ACTIVE")}
                      disabled={loading === e.id}
                    >
                      Activate
                    </Button>
                  )}
                  {e.status !== "DROPPED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => update(e.id, "DROPPED")}
                      disabled={loading === e.id}
                    >
                      Drop
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
