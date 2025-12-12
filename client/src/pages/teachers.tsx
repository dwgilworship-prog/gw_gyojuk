import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, UserCog, Search, Pencil, Trash2, Phone, Calendar, Crown, Cake } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Teacher, Mokjang, MokjangTeacher, Student, User, Ministry, MinistryTeacher } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

const teacherFormSchema = z.object({
  email: z.string().optional(),
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().optional(),
  birth: z.string().optional(),
  startedAt: z.string().optional(),
  status: z.enum(["active", "rest", "resigned"]).default("active"),
  ministryIds: z.array(z.string()).optional(),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "활동", variant: "default" },
  rest: { label: "휴식", variant: "secondary" },
  resigned: { label: "사임", variant: "outline" },
};

export default function Teachers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: mokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  const { data: mokjangTeachers } = useQuery<MokjangTeacher[]>({
    queryKey: ["/api/mokjang-teachers"],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: ministries } = useQuery<Ministry[]>({
    queryKey: ["/api/ministries"],
  });

  const { data: ministryMembers } = useQuery<{ teachers: MinistryTeacher[] }>({
    queryKey: ["/api/ministry-members"],
  });

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      birth: "",
      startedAt: "",
      status: "active",
      ministryIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      const payload = {
        email: data.email,
        name: data.name,
        phone: data.phone || null,
        birth: data.birth || null,
        startedAt: data.startedAt || null,
        status: data.status || "active",
      };
      const res = await apiRequest("POST", "/api/teachers", payload);
      const teacher = await res.json();

      // Assign to ministries
      if (data.ministryIds && data.ministryIds.length > 0) {
        await Promise.all(data.ministryIds.map(ministryId =>
          apiRequest("POST", `/api/ministries/${ministryId}/teachers/${teacher.id}`)
        ));
      }
      return teacher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets"] });
      toast({ title: "교사가 등록되었습니다." });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "등록 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TeacherFormData }) => {
      const payload = {
        name: data.name,
        phone: data.phone || null,
        birth: data.birth || null,
        startedAt: data.startedAt || null,
        status: data.status || "active",
      };
      const res = await apiRequest("PATCH", `/api/teachers/${id}`, payload);
      const teacher = await res.json();

      // Update ministries if changed
      if (data.ministryIds) {
        // First remove all existing assignments
        const currentAssignments = ministryMembers?.teachers.filter(mt => mt.teacherId === id) || [];
        await Promise.all(currentAssignments.map(mt =>
          apiRequest("DELETE", `/api/ministries/${mt.ministryId}/teachers/${id}`)
        ));

        // Then add new ones
        await Promise.all(data.ministryIds.map(ministryId =>
          apiRequest("POST", `/api/ministries/${ministryId}/teachers/${id}`)
        ));
      }
      return teacher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministry-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets"] });
      toast({ title: "교사 정보가 수정되었습니다." });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "수정 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets"] });
      toast({ title: "교사가 삭제되었습니다." });
      setDeletingTeacher(null);
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    form.reset({
      email: "",
      name: "",
      phone: "",
      birth: "",
      startedAt: "",
      status: "active",
      ministryIds: [],
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.reset({
      email: "",
      name: teacher.name,
      phone: teacher.phone || "",
      birth: teacher.birth || "",
      startedAt: teacher.startedAt || "",
      status: teacher.status || "active",
      ministryIds: ministryMembers?.teachers
        ?.filter(mt => mt.teacherId === teacher.id)
        .map(mt => mt.ministryId) || [],
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTeacher(null);
    form.reset();
  };

  const onSubmit = (data: TeacherFormData) => {
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data });
    } else {
      if (!data.email || !data.email.includes("@")) {
        form.setError("email", { message: "올바른 이메일 형식을 입력해주세요" });
        return;
      }
      createMutation.mutate(data);
    }
  };

  const getTeacherRole = (teacher: Teacher) => {
    if (!users) return "teacher";
    const u = users.find(u => u.id === teacher.userId);
    return u?.role || "teacher";
  };

  const getMokjangsForTeacher = (teacherId: string) => {
    if (!mokjangTeachers || !mokjangs) return [];
    const mtList = mokjangTeachers.filter(mt => mt.teacherId === teacherId);
    return mtList
      .map(mt => mokjangs.find(m => m.id === mt.mokjangId)?.name)
      .filter(Boolean);
  };

  const getStudentCountForTeacher = (teacherId: string) => {
    if (!mokjangTeachers || !students) return 0;
    const mokjangIds = mokjangTeachers
      .filter(mt => mt.teacherId === teacherId)
      .map(mt => mt.mokjangId);
    return students.filter(s => s.mokjangId && mokjangIds.includes(s.mokjangId)).length;
  };

  const getTeacherMinistries = (teacherId: string) => {
    if (!ministryMembers || !ministries) return [];
    const assignedIds = ministryMembers.teachers
      .filter(mt => mt.teacherId === teacherId)
      .map(mt => mt.ministryId);
    return ministries.filter(m => assignedIds.includes(m.id)).map(m => m.name);
  };

  const maskPhone = (phone: string | null) => {
    if (!phone) return "-";
    const parts = phone.split("-");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-**`;
    }
    return phone.substring(0, phone.length - 2) + "**";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  };

  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];

    return teachers.filter((teacher) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const role = getTeacherRole(teacher);
      const matchesRole = roleFilter === "all" || role === roleFilter;
      const matchesStatus = statusFilter === "all" || teacher.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [teachers, searchQuery, roleFilter, statusFilter, users]);

  return (
    <DashboardLayout title="교사 관리">
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-teacher"
              />
            </div>
            {user?.role === "admin" && (
              <Button onClick={handleOpenCreate} data-testid="button-add-teacher">
                <Plus className="h-4 w-4 mr-2" />
                교사 추가
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[120px]" data-testid="filter-role">
                <SelectValue placeholder="전체역할" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체역할</SelectItem>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="teacher">교사</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]" data-testid="filter-teacher-status">
                <SelectValue placeholder="전체상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체상태</SelectItem>
                <SelectItem value="active">활동</SelectItem>
                <SelectItem value="rest">휴식</SelectItem>
                <SelectItem value="resigned">사임</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredTeachers && filteredTeachers.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead className="hidden md:table-cell">연락처</TableHead>
                      <TableHead>사역부서</TableHead>
                      <TableHead>담당 목장</TableHead>
                      <TableHead className="hidden lg:table-cell">담당학생</TableHead>
                      <TableHead>상태</TableHead>
                      {user?.role === "admin" && <TableHead className="w-24">관리</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => {
                      const role = getTeacherRole(teacher);
                      const assignedMokjangs = getMokjangsForTeacher(teacher.id);
                      const studentCount = getStudentCountForTeacher(teacher.id);

                      return (
                        <TableRow
                          key={teacher.id}
                          className="cursor-pointer"
                          onClick={() => setViewingTeacher(teacher)}
                          data-testid={`row-teacher-${teacher.id}`}
                        >
                          <TableCell className="font-medium" data-testid={`text-teacher-name-${teacher.id}`}>
                            {teacher.name}
                          </TableCell>
                          <TableCell>
                            {role === "admin" ? (
                              <div className="flex items-center gap-1">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                <span>관리자</span>
                              </div>
                            ) : (
                              <span>교사</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {maskPhone(teacher.phone)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getTeacherMinistries(teacher.id).map((name, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {assignedMokjangs.length > 0 ? assignedMokjangs.join(", ") : "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {studentCount > 0 ? `${studentCount}명` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusLabels[teacher.status || "active"].variant}>
                              {statusLabels[teacher.status || "active"].label}
                            </Badge>
                          </TableCell>
                          {user?.role === "admin" && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleOpenEdit(teacher)}
                                  data-testid={`button-edit-teacher-${teacher.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeletingTeacher(teacher)}
                                  data-testid={`button-delete-teacher-${teacher.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCog className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "검색 결과가 없습니다."
                  : "등록된 교사가 없습니다."}
              </p>
              {!searchQuery && roleFilter === "all" && statusFilter === "all" && user?.role === "admin" && (
                <p className="text-sm text-muted-foreground text-center">
                  교사 추가 버튼을 눌러 첫 교사를 등록해보세요.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? "교사 정보 수정" : "교사 추가"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!editingTeacher && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일 *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="teacher@example.com"
                          {...field}
                          data-testid="input-teacher-email"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        기본 비밀번호: shepherd1234
                      </p>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름 *</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} data-testid="input-teacher-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input placeholder="010-0000-0000" {...field} data-testid="input-teacher-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>생년월일</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-teacher-birth" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사역 시작일</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-teacher-started" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상태</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-teacher-status">
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">활동</SelectItem>
                          <SelectItem value="rest">휴식</SelectItem>
                          <SelectItem value="resigned">사임</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>사역부서</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-md p-3">
                  {ministries?.map(ministry => (
                    <FormField
                      key={ministry.id}
                      control={form.control}
                      name="ministryIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={ministry.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(ministry.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), ministry.id])
                                    : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== ministry.id
                                      )
                                    )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {ministry.name}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-teacher"
                >
                  {createMutation.isPending || updateMutation.isPending ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTeacher} onOpenChange={() => setDeletingTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>교사 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 "{deletingTeacher?.name}" 교사를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTeacher && deleteMutation.mutate(deletingTeacher.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-teacher"
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingTeacher} onOpenChange={() => setViewingTeacher(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-teacher-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              교사 정보
            </DialogTitle>
          </DialogHeader>
          {viewingTeacher && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{viewingTeacher.name}</h2>
                  {getTeacherRole(viewingTeacher) === "admin" && (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <Badge variant={statusLabels[viewingTeacher.status || "active"].variant}>
                  {statusLabels[viewingTeacher.status || "active"].label}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                {viewingTeacher.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{viewingTeacher.phone}</span>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`tel:${viewingTeacher.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
                {viewingTeacher.birth && (
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-pink-500" />
                    <span>{formatDate(viewingTeacher.birth)} 생일</span>
                  </div>
                )}
                {viewingTeacher.startedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(viewingTeacher.startedAt)} 시작</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">담당 목장</h3>
                <div className="flex flex-wrap gap-2">
                  {getMokjangsForTeacher(viewingTeacher.id).length > 0 ? (
                    getMokjangsForTeacher(viewingTeacher.id).map((name, idx) => (
                      <Badge key={idx} variant="secondary">{name}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">담당 목장 없음</span>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">담당 학생 수</span>
                  <span className="font-medium">{getStudentCountForTeacher(viewingTeacher.id)}명</span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                {user?.role === "admin" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewingTeacher(null);
                      handleOpenEdit(viewingTeacher);
                    }}
                    data-testid="button-edit-from-detail"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                )}
                <Button onClick={() => setViewingTeacher(null)}>
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
