import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, FileText, CalendarIcon, Pencil, Eye } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Mokjang, Report, Teacher, MokjangTeacher } from "@shared/schema";

const reportFormSchema = z.object({
  mokjangId: z.string().min(1, "목장을 선택해주세요"),
  date: z.string().min(1, "날짜를 선택해주세요"),
  content: z.string().optional(),
  prayerRequest: z.string().optional(),
  suggestions: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportFormSchema>;

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [selectedMokjangId, setSelectedMokjangId] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { data: mokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: myTeacher } = useQuery<Teacher | null>({
    queryKey: ["/api/teachers", "me"],
    queryFn: async () => {
      if (user?.role !== "teacher" || !teachers) return null;
      return teachers.find((t) => t.userId === user.id) || null;
    },
    enabled: user?.role === "teacher" && !!teachers,
  });

  const { data: myMokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/teachers", myTeacher?.id, "mokjangs"],
    queryFn: async () => {
      if (!myTeacher) return [];
      const res = await fetch(`/api/teachers/${myTeacher.id}/mokjangs`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!myTeacher,
  });

  const availableMokjangs = user?.role === "admin" ? mokjangs : myMokjangs;

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports", { mokjangId: selectedMokjangId }],
    queryFn: async () => {
      if (!selectedMokjangId) return [];
      const res = await fetch(`/api/reports?mokjangId=${selectedMokjangId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedMokjangId,
  });

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      mokjangId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      content: "",
      prayerRequest: "",
      suggestions: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const payload = {
        mokjangId: data.mokjangId,
        teacherId: user?.role === "admin" ? teachers?.[0]?.id : myTeacher?.id,
        date: data.date,
        content: data.content || null,
        prayerRequest: data.prayerRequest || null,
        suggestions: data.suggestions || null,
      };
      return await apiRequest("POST", "/api/reports", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "보고서가 작성되었습니다." });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "작성 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReportFormData }) => {
      const payload = {
        content: data.content || null,
        prayerRequest: data.prayerRequest || null,
        suggestions: data.suggestions || null,
      };
      return await apiRequest("PATCH", `/api/reports/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "보고서가 수정되었습니다." });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "수정 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingReport(null);
    form.reset({
      mokjangId: selectedMokjangId || availableMokjangs?.[0]?.id || "",
      date: format(new Date(), "yyyy-MM-dd"),
      content: "",
      prayerRequest: "",
      suggestions: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (report: Report) => {
    setEditingReport(report);
    form.reset({
      mokjangId: report.mokjangId,
      date: report.date,
      content: report.content || "",
      prayerRequest: report.prayerRequest || "",
      suggestions: report.suggestions || "",
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReport(null);
    form.reset();
  };

  const onSubmit = (data: ReportFormData) => {
    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getMokjangName = (mokjangId: string) => {
    return mokjangs?.find((m) => m.id === mokjangId)?.name || "알 수 없음";
  };

  const getTeacherName = (teacherId: string) => {
    return teachers?.find((t) => t.id === teacherId)?.name || "알 수 없음";
  };

  useEffect(() => {
    if (availableMokjangs && availableMokjangs.length > 0 && !selectedMokjangId) {
      setSelectedMokjangId(availableMokjangs[0].id);
    }
  }, [availableMokjangs, selectedMokjangId]);

  return (
    <DashboardLayout title="보고서">
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Select value={selectedMokjangId} onValueChange={setSelectedMokjangId}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-mokjang-reports">
              <SelectValue placeholder="목장 선택" />
            </SelectTrigger>
            <SelectContent>
              {availableMokjangs?.map((mokjang) => (
                <SelectItem key={mokjang.id} value={mokjang.id}>
                  {mokjang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleOpenCreate} data-testid="button-add-report">
            <Plus className="h-4 w-4 mr-2" />
            보고서 작성
          </Button>
        </div>

        {!selectedMokjangId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                보고서를 조회할 목장을 선택해주세요.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} data-testid={`card-report-${report.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(report.date), "yyyy년 M월 d일", { locale: ko })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        작성자: {getTeacherName(report.teacherId)}
                      </p>
                      {report.content && (
                        <p className="text-sm mt-2 line-clamp-2">{report.content}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setViewingReport(report)}
                        data-testid={`button-view-report-${report.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(report)}
                        data-testid={`button-edit-report-${report.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                작성된 보고서가 없습니다.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                보고서 작성 버튼을 눌러 첫 보고서를 작성해보세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReport ? "보고서 수정" : "보고서 작성"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!editingReport && (
                <>
                  <FormField
                    control={form.control}
                    name="mokjangId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>목장 *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="input-report-mokjang">
                              <SelectValue placeholder="목장 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableMokjangs?.map((mokjang) => (
                              <SelectItem key={mokjang.id} value={mokjang.id}>
                                {mokjang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>날짜 *</FormLabel>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                data-testid="input-report-date"
                              >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {format(new Date(field.value), "yyyy년 M월 d일", { locale: ko })}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={new Date(field.value)}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(format(date, "yyyy-MM-dd"));
                                  setIsCalendarOpen(false);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모임 내용</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="이번 주 모임에서 있었던 일을 작성해주세요..."
                        rows={4}
                        {...field}
                        data-testid="input-report-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prayerRequest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기도 제목</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="학생들의 기도 제목을 작성해주세요..."
                        rows={3}
                        {...field}
                        data-testid="input-report-prayer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suggestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>건의 사항</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="건의 사항이나 필요한 지원을 작성해주세요..."
                        rows={2}
                        {...field}
                        data-testid="input-report-suggestions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-report"
                >
                  {createMutation.isPending || updateMutation.isPending ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingReport && format(new Date(viewingReport.date), "yyyy년 M월 d일", { locale: ko })} 보고서
            </DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">목장</p>
                <p>{getMokjangName(viewingReport.mokjangId)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">작성자</p>
                <p>{getTeacherName(viewingReport.teacherId)}</p>
              </div>
              {viewingReport.content && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">모임 내용</p>
                  <p className="whitespace-pre-wrap">{viewingReport.content}</p>
                </div>
              )}
              {viewingReport.prayerRequest && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">기도 제목</p>
                  <p className="whitespace-pre-wrap">{viewingReport.prayerRequest}</p>
                </div>
              )}
              {viewingReport.suggestions && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">건의 사항</p>
                  <p className="whitespace-pre-wrap">{viewingReport.suggestions}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
