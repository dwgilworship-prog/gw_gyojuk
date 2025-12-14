import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Search, Pencil, Trash2, Users, UserPlus, X, Phone, GraduationCap, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Mokjang, Teacher, MokjangTeacher, Student } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

const mokjangFormSchema = z.object({
  name: z.string().min(1, "목장 이름을 입력해주세요"),
  description: z.string().optional(),
  targetGrade: z.string().optional(),
  isActive: z.boolean().default(true),
});

type MokjangFormData = z.infer<typeof mokjangFormSchema>;

export default function Mokjangs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMokjang, setEditingMokjang] = useState<Mokjang | null>(null);
  const [deletingMokjang, setDeletingMokjang] = useState<Mokjang | null>(null);
  const [assigningMokjang, setAssigningMokjang] = useState<Mokjang | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [viewingMokjang, setViewingMokjang] = useState<Mokjang | null>(null);

  const { data: mokjangs, isLoading } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: allMokjangTeachers } = useQuery<MokjangTeacher[]>({
    queryKey: ["/api/mokjang-teachers"],
  });

  const { data: mokjangTeachers } = useQuery<MokjangTeacher[]>({
    queryKey: ["/api/mokjangs", assigningMokjang?.id, "teachers"],
    queryFn: async () => {
      if (!assigningMokjang) return [];
      const res = await fetch(`/api/mokjangs/${assigningMokjang.id}/teachers`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!assigningMokjang,
  });

  const form = useForm<MokjangFormData>({
    resolver: zodResolver(mokjangFormSchema),
    defaultValues: {
      name: "",
      description: "",
      targetGrade: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MokjangFormData) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        targetGrade: data.targetGrade || null,
        isActive: data.isActive,
      };
      return await apiRequest("POST", "/api/mokjangs", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mokjangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "목장이 등록되었습니다." });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "등록 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MokjangFormData }) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        targetGrade: data.targetGrade || null,
        isActive: data.isActive,
      };
      return await apiRequest("PATCH", `/api/mokjangs/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mokjangs"] });
      toast({ title: "목장 정보가 수정되었습니다." });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "수정 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/mokjangs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mokjangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "목장이 삭제되었습니다." });
      setDeletingMokjang(null);
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const assignTeacherMutation = useMutation({
    mutationFn: async ({ mokjangId, teacherId }: { mokjangId: string; teacherId: string }) => {
      return await apiRequest("POST", `/api/mokjangs/${mokjangId}/teachers/${teacherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mokjangs", assigningMokjang?.id, "teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mokjangs"] });
      toast({ title: "교사가 배정되었습니다." });
      setSelectedTeacherId("");
    },
    onError: () => {
      toast({ title: "배정 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const removeTeacherMutation = useMutation({
    mutationFn: async ({ mokjangId, teacherId }: { mokjangId: string; teacherId: string }) => {
      return await apiRequest("DELETE", `/api/mokjangs/${mokjangId}/teachers/${teacherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mokjangs", assigningMokjang?.id, "teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mokjangs"] });
      toast({ title: "교사 배정이 해제되었습니다." });
    },
    onError: () => {
      toast({ title: "해제 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingMokjang(null);
    form.reset({
      name: "",
      description: "",
      targetGrade: "",
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (mokjang: Mokjang) => {
    setEditingMokjang(mokjang);
    form.reset({
      name: mokjang.name,
      description: mokjang.description || "",
      targetGrade: mokjang.targetGrade || "",
      isActive: mokjang.isActive,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMokjang(null);
    form.reset();
  };

  const onSubmit = (data: MokjangFormData) => {
    if (editingMokjang) {
      updateMutation.mutate({ id: editingMokjang.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAssignTeacher = () => {
    if (assigningMokjang && selectedTeacherId) {
      assignTeacherMutation.mutate({
        mokjangId: assigningMokjang.id,
        teacherId: selectedTeacherId,
      });
    }
  };

  const filteredMokjangs = mokjangs?.filter((mokjang) =>
    mokjang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mokjang.targetGrade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTeacherName = (teacherId: string) => {
    return teachers?.find((t) => t.id === teacherId)?.name || "알 수 없음";
  };

  const getAssignedTeacherIds = () => {
    return mokjangTeachers?.map((mt) => mt.teacherId) || [];
  };

  const availableTeachers = teachers?.filter(
    (t) => !getAssignedTeacherIds().includes(t.id)
  );

  const getMokjangTeachers = (mokjangId: string) => {
    if (!allMokjangTeachers || !teachers) return [];
    const teacherIds = allMokjangTeachers
      .filter(mt => mt.mokjangId === mokjangId)
      .map(mt => mt.teacherId);
    return teachers.filter(t => teacherIds.includes(t.id));
  };

  const getMokjangStudents = (mokjangId: string) => {
    if (!students) return [];
    return students.filter(s => s.mokjangId === mokjangId);
  };

  return (
    <DashboardLayout title="목장 관리">
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="목장 이름, 대상 학년 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-mokjang"
            />
          </div>
          {user?.role === "admin" && (
            <Button onClick={handleOpenCreate} data-testid="button-add-mokjang">
              <Plus className="h-4 w-4 mr-2" />
              목장 추가
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMokjangs && filteredMokjangs.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredMokjangs.map((mokjang) => (
              <Card
                key={mokjang.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setViewingMokjang(mokjang)}
                data-testid={`card-mokjang-${mokjang.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate" data-testid={`text-mokjang-name-${mokjang.id}`}>
                          {mokjang.name}
                        </h3>
                        <Badge variant={mokjang.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                          {mokjang.isActive ? "활성" : "비활성"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        {mokjang.targetGrade && (
                          <p className="truncate">{mokjang.targetGrade}</p>
                        )}
                        {mokjang.description && (
                          <p className="truncate text-xs">{mokjang.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {user?.role === "admin" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setAssigningMokjang(mokjang)}
                            data-testid={`button-assign-teacher-${mokjang.id}`}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(mokjang)}
                            data-testid={`button-edit-mokjang-${mokjang.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingMokjang(mokjang)}
                            data-testid={`button-delete-mokjang-${mokjang.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery ? "검색 결과가 없습니다." : "등록된 목장이 없습니다."}
              </p>
              {!searchQuery && user?.role === "admin" && (
                <p className="text-sm text-muted-foreground text-center">
                  목장 추가 버튼을 눌러 첫 목장을 등록해보세요.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMokjang ? "목장 정보 수정" : "목장 추가"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>목장 이름 *</FormLabel>
                    <FormControl>
                      <Input placeholder="1목장" {...field} data-testid="input-mokjang-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>대상 학년</FormLabel>
                    <FormControl>
                      <Input placeholder="중1-2" {...field} data-testid="input-mokjang-grade" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="목장에 대한 간단한 설명..." 
                        {...field} 
                        data-testid="input-mokjang-description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>활성 상태</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-mokjang-active"
                      />
                    </FormControl>
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
                  data-testid="button-submit-mokjang"
                >
                  {createMutation.isPending || updateMutation.isPending ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assigningMokjang} onOpenChange={() => setAssigningMokjang(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>교사 배정 - {assigningMokjang?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="flex-1" data-testid="select-teacher-assign">
                  <SelectValue placeholder="교사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAssignTeacher} 
                disabled={!selectedTeacherId || assignTeacherMutation.isPending}
                data-testid="button-confirm-assign"
              >
                배정
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">배정된 교사</p>
              {mokjangTeachers && mokjangTeachers.length > 0 ? (
                <div className="space-y-2">
                  {mokjangTeachers.map((mt) => (
                    <div key={mt.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getTeacherName(mt.teacherId)}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeTeacherMutation.mutate({
                          mokjangId: assigningMokjang!.id,
                          teacherId: mt.teacherId,
                        })}
                        data-testid={`button-remove-teacher-${mt.teacherId}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">배정된 교사가 없습니다.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMokjang} onOpenChange={() => setDeletingMokjang(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>목장 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 "{deletingMokjang?.name}" 목장을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMokjang && deleteMutation.mutate(deletingMokjang.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-mokjang"
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingMokjang} onOpenChange={() => setViewingMokjang(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {viewingMokjang?.name}
            </DialogTitle>
            {viewingMokjang?.description && (
              <p className="text-sm text-muted-foreground">{viewingMokjang.description}</p>
            )}
          </DialogHeader>
          {viewingMokjang && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-sm">
                {viewingMokjang.targetGrade && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{viewingMokjang.targetGrade}</span>
                  </div>
                )}
                <Badge variant={viewingMokjang.isActive ? "default" : "secondary"}>
                  {viewingMokjang.isActive ? "활성" : "비활성"}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  담당 교사 ({getMokjangTeachers(viewingMokjang.id).length}명)
                </h3>
                {getMokjangTeachers(viewingMokjang.id).length > 0 ? (
                  <div className="space-y-2">
                    {getMokjangTeachers(viewingMokjang.id).map((teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                        </div>
                        {teacher.phone && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={`tel:${teacher.phone}`} className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span className="text-xs">{teacher.phone}</span>
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">담당 교사가 없습니다.</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  소속 학생 ({getMokjangStudents(viewingMokjang.id).length}명)
                </h3>
                {getMokjangStudents(viewingMokjang.id).length > 0 ? (
                  <div className="space-y-2">
                    {getMokjangStudents(viewingMokjang.id).map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[student.school, student.grade].filter(Boolean).join(' ') || '-'}
                          </p>
                        </div>
                        {student.phone && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={`tel:${student.phone}`} className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span className="text-xs">{student.phone}</span>
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">소속된 학생이 없습니다.</p>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setViewingMokjang(null)}>
                  닫기
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
