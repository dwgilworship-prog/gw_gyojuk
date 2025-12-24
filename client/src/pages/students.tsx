import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Plus, Users, Search, Pencil, Trash2, Phone, User, Droplet, Calendar,
  GraduationCap, Home, ChevronUp, ChevronDown, ChevronsUpDown,
  LayoutGrid, LayoutList, ChevronLeft, ChevronRight, MoreVertical
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Student, Mokjang, Teacher, MokjangTeacher, Ministry, MinistryStudent } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface LongAbsenceStudent {
  student: Student;
  weeksAbsent: number;
  lastAttendanceDate: string | null;
}

const studentFormSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  birth: z.string().optional(),
  phone: z.string().optional(),
  parentPhone: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
  mokjangId: z.string().optional(),
  ministryIds: z.array(z.string()).optional(),
  gender: z.enum(["M", "F"]).optional(),
  baptism: z.enum(["none", "infant", "baptized", "confirmed"]).optional(),
  status: z.enum(["ACTIVE", "REST", "GRADUATED"]).default("ACTIVE"),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline"; color: string }> = {
  ACTIVE: { label: "재적", variant: "default", color: "text-green-500" },
  REST: { label: "휴식", variant: "secondary", color: "text-yellow-500" },
  GRADUATED: { label: "졸업", variant: "outline", color: "text-muted-foreground" },
};

const genderLabels: Record<string, string> = {
  M: "남",
  F: "여",
};

const baptismLabels: Record<string, string> = {
  none: "미세례",
  infant: "유아세례",
  baptized: "세례",
  confirmed: "입교",
};

const gradeOptions = ["중1", "중2", "중3", "고1", "고2", "고3"];

type SortField = "name" | "grade" | "status";
type SortOrder = "asc" | "desc";

export default function Students() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [mokjangFilter, setMokjangFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ministryFilter, setMinistryFilter] = useState<string>("all");
  const [absenceFilter, setAbsenceFilter] = useState<string>("all");

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: mokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: mokjangTeachers } = useQuery<MokjangTeacher[]>({
    queryKey: ["/api/mokjang-teachers"],
  });

  // 교사일 경우 자기 목장 정보 조회
  const myTeacher = teachers?.find(t => t.userId === user?.id);
  const myMokjangIds = mokjangTeachers
    ?.filter(mt => mt.teacherId === myTeacher?.id)
    .map(mt => mt.mokjangId) || [];

  const { data: ministries } = useQuery<Ministry[]>({
    queryKey: ["/api/ministries"],
  });

  const { data: ministryMembers } = useQuery<{ students: MinistryStudent[] }>({
    queryKey: ["/api/ministry-members"],
  });

  // 장기결석자 조회 (admin만)
  const { data: longAbsenceStudents } = useQuery<LongAbsenceStudent[]>({
    queryKey: ["/api/long-absence-students"],
    enabled: user?.role === "admin",
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      birth: "",
      phone: "",
      parentPhone: "",
      school: "",
      grade: "",
      mokjangId: "none",
      gender: undefined,
      baptism: "none",
      status: "ACTIVE",
      ministryIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const payload = {
        ...data,
        birth: data.birth || null,
        phone: data.phone || null,
        parentPhone: data.parentPhone || null,
        school: data.school || null,
        grade: data.grade || null,
        mokjangId: data.mokjangId && data.mokjangId !== "none" ? data.mokjangId : null,
        gender: data.gender || null,
        baptism: data.baptism || "none",
      };
      const res = await apiRequest("POST", "/api/students", payload);
      const student = await res.json();

      // Assign to ministries
      if (data.ministryIds && data.ministryIds.length > 0) {
        await Promise.all(data.ministryIds.map(ministryId =>
          apiRequest("POST", `/api/ministries/${ministryId}/students/${student.id}`)
        ));
      }
      return student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministry-members"] });
      toast({ title: "학생이 등록되었습니다." });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "등록 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StudentFormData }) => {
      const payload = {
        ...data,
        birth: data.birth || null,
        phone: data.phone || null,
        parentPhone: data.parentPhone || null,
        school: data.school || null,
        grade: data.grade || null,
        mokjangId: data.mokjangId && data.mokjangId !== "none" ? data.mokjangId : null,
        gender: data.gender || null,
        baptism: data.baptism || "none",
      };

      const res = await apiRequest("PATCH", `/api/students/${id}`, payload);
      const student = await res.json();

      // Update ministries if changed
      if (data.ministryIds) {
        // First remove all existing assignments
        const currentAssignments = ministryMembers?.students.filter(ms => ms.studentId === id) || [];
        await Promise.all(currentAssignments.map(ms =>
          apiRequest("DELETE", `/api/ministries/${ms.ministryId}/students/${id}`)
        ));

        // Then add new ones
        await Promise.all(data.ministryIds.map(ministryId =>
          apiRequest("POST", `/api/ministries/${ministryId}/students/${id}`)
        ));
      }
      return student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministry-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets"] });
      toast({ title: "학생 정보가 수정되었습니다." });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "수정 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministry-members"] });
      toast({ title: "학생이 삭제되었습니다." });
      setDeletingStudent(null);
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<StudentFormData> }) => {
      const promises = ids.map(id => apiRequest("PATCH", `/api/students/${id}`, data));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets"] });
      toast({ title: "선택된 학생들이 수정되었습니다." });
      setSelectedIds(new Set());
    },
    onError: () => {
      toast({ title: "일괄 수정 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => apiRequest("DELETE", `/api/students/${id}`));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-widgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministry-members"] });
      toast({ title: "선택된 학생들이 삭제되었습니다." });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    },
    onError: () => {
      toast({ title: "일괄 삭제 실패", description: "다시 시도해주세요.", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingStudent(null);
    form.reset({
      name: "",
      birth: "",
      phone: "",
      parentPhone: "",
      school: "",
      grade: "",
      mokjangId: "none",
      gender: undefined,
      baptism: "none",
      status: "ACTIVE",
      ministryIds: [],
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      name: student.name,
      birth: student.birth || "",
      phone: student.phone || "",
      parentPhone: student.parentPhone || "",
      school: student.school || "",
      grade: student.grade || "",
      mokjangId: student.mokjangId || "none",
      gender: student.gender || undefined,
      baptism: student.baptism || "none",
      status: student.status,
      ministryIds: ministryMembers?.students
        ?.filter(ms => ms.studentId === student.id)
        .map(ms => ms.ministryId) || [],
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
    form.reset();
  };

  const onSubmit = (data: StudentFormData) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getMokjangName = (mokjangId: string | null) => {
    if (!mokjangId) return null;
    return mokjangs?.find((m) => m.id === mokjangId)?.name;
  };

  const getTeacherForMokjang = (mokjangId: string | null) => {
    if (!mokjangId || !mokjangTeachers || !teachers) return null;
    const mt = mokjangTeachers.find((mt) => mt.mokjangId === mokjangId);
    if (!mt) return null;
    return teachers.find((t) => t.id === mt.teacherId)?.name;
  };

  const getStudentMinistries = (studentId: string) => {
    if (!ministryMembers || !ministries) return [];
    const assignedIds = ministryMembers.students
      .filter(ms => ms.studentId === studentId)
      .map(ms => ms.ministryId);
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // 장기결석자 학생 ID Set 만들기
  const longAbsenceMap = useMemo(() => {
    const map = new Map<string, number>();
    longAbsenceStudents?.forEach(item => {
      map.set(item.student.id, item.weeksAbsent);
    });
    return map;
  }, [longAbsenceStudents]);

  const filteredAndSortedStudents = useMemo(() => {
    if (!students) return [];

    let result = students.filter((student) => {
      // 교사일 경우 자기 목장 학생만 표시
      if (user?.role === "teacher" && myMokjangIds.length > 0) {
        if (!student.mokjangId || !myMokjangIds.includes(student.mokjangId)) {
          return false;
        }
      }

      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.school?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter;
      const matchesMokjang =
        mokjangFilter === "all" ||
        (mokjangFilter === "unassigned" ? !student.mokjangId : student.mokjangId === mokjangFilter);
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;

      const studentMinistries = ministryMembers?.students
        ?.filter(ms => ms.studentId === student.id)
        .map(ms => ms.ministryId) || [];
      const matchesMinistry = ministryFilter === "all" || studentMinistries.includes(ministryFilter);

      // 장기결석 필터
      let matchesAbsence = true;
      if (absenceFilter !== "all") {
        const weeksAbsent = longAbsenceMap.get(student.id);
        if (absenceFilter === "2weeks") {
          matchesAbsence = weeksAbsent !== undefined && weeksAbsent >= 2;
        } else if (absenceFilter === "4weeks") {
          matchesAbsence = weeksAbsent !== undefined && weeksAbsent >= 4;
        }
      }

      return matchesSearch && matchesGrade && matchesMokjang && matchesStatus && matchesMinistry && matchesAbsence;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name, "ko");
          break;
        case "grade":
          comparison = (a.grade || "").localeCompare(b.grade || "", "ko");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [students, searchQuery, gradeFilter, mokjangFilter, statusFilter, ministryFilter, absenceFilter, ministryMembers, longAbsenceMap, sortField, sortOrder, user?.role, myMokjangIds]);

  const totalPages = Math.ceil(filteredAndSortedStudents.length / pageSize);
  const paginatedStudents = filteredAndSortedStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedIds.has(s.id));
  const isSomeSelected = selectedIds.size > 0;

  const handleBulkMokjangAssign = (mokjangId: string) => {
    const ids = Array.from(selectedIds);
    bulkUpdateMutation.mutate({
      ids,
      data: { mokjangId: mokjangId === "none" ? null : mokjangId }
    });
  };

  const handleBulkStatusChange = (status: string) => {
    const ids = Array.from(selectedIds);
    bulkUpdateMutation.mutate({
      ids,
      data: { status: status as "ACTIVE" | "REST" | "GRADUATED" }
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    bulkDeleteMutation.mutate(ids);
  };

  return (
    <DashboardLayout title="학생 관리">
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, 학교 검색..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
                data-testid="input-search-student"
              />
            </div>
            <Button onClick={handleOpenCreate} data-testid="button-add-student">
              <Plus className="h-4 w-4 mr-2" />
              학생 추가
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[120px]" data-testid="filter-grade">
                <SelectValue placeholder="전체학년" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체학년</SelectItem>
                {gradeOptions.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mokjangFilter} onValueChange={(v) => { setMokjangFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[120px]" data-testid="filter-mokjang">
                <SelectValue placeholder="전체목장" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체목장</SelectItem>
                <SelectItem value="unassigned">미배정</SelectItem>
                {mokjangs?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[120px]" data-testid="filter-status">
                <SelectValue placeholder="전체상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체상태</SelectItem>
                <SelectItem value="ACTIVE">재적</SelectItem>
                <SelectItem value="REST">휴식</SelectItem>
                <SelectItem value="GRADUATED">졸업</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ministryFilter} onValueChange={(v) => { setMinistryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[120px]" data-testid="filter-ministry">
                <SelectValue placeholder="전체부서" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체부서</SelectItem>
                {ministries?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {user?.role === "admin" && (
              <Select value={absenceFilter} onValueChange={(v) => { setAbsenceFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[120px]" data-testid="filter-absence">
                  <SelectValue placeholder="전체출석" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체출석</SelectItem>
                  <SelectItem value="2weeks">2주↑ 결석</SelectItem>
                  <SelectItem value="4weeks">4주↑ 결석</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="ml-auto hidden md:flex items-center gap-1">
              <Button
                size="icon"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "card" ? "default" : "ghost"}
                onClick={() => setViewMode("card")}
                data-testid="button-view-card"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
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
        ) : filteredAndSortedStudents.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className={`hidden md:block ${viewMode === "card" ? "md:hidden" : ""}`}>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              data-testid="checkbox-select-all"
                            />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleSort("name")}
                            data-testid="sort-name"
                          >
                            <div className="flex items-center gap-1">
                              이름 {getSortIcon("name")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleSort("grade")}
                            data-testid="sort-grade"
                          >
                            <div className="flex items-center gap-1">
                              학년 {getSortIcon("grade")}
                            </div>
                          </TableHead>
                          <TableHead>학교</TableHead>
                          <TableHead>목장</TableHead>
                          <TableHead className="hidden lg:table-cell">사역</TableHead>
                          <TableHead className="hidden lg:table-cell">담당교사</TableHead>
                          <TableHead className="hidden md:table-cell">연락처</TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleSort("status")}
                            data-testid="sort-status"
                          >
                            <div className="flex items-center gap-1">
                              상태 {getSortIcon("status")}
                            </div>
                          </TableHead>
                          <TableHead className="w-20">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedStudents.map((student) => (
                          <TableRow
                            key={student.id}
                            className="cursor-pointer"
                            data-testid={`row-student-${student.id}`}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(student.id)}
                                onCheckedChange={(checked) => handleSelectOne(student.id, !!checked)}
                                data-testid={`checkbox-student-${student.id}`}
                              />
                            </TableCell>
                            <TableCell
                              className="font-medium"
                              onClick={() => setViewingStudent(student)}
                              data-testid={`text-student-name-${student.id}`}
                            >
                              {student.name}
                            </TableCell>
                            <TableCell onClick={() => setViewingStudent(student)}>
                              {student.grade || "-"}
                            </TableCell>
                            <TableCell onClick={() => setViewingStudent(student)}>
                              {student.school || "-"}
                            </TableCell>
                            <TableCell onClick={() => setViewingStudent(student)}>
                              {getMokjangName(student.mokjangId) || "-"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell" onClick={() => setViewingStudent(student)}>
                              <div className="flex flex-wrap gap-1">
                                {getStudentMinistries(student.id).map((name, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell" onClick={() => setViewingStudent(student)}>
                              {getTeacherForMokjang(student.mokjangId) || "-"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                <span>{maskPhone(student.phone)}</span>
                                {student.phone && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`button-call-student-${student.id}`}
                                  >
                                    <a href={`tel:${student.phone}`}>
                                      <Phone className="h-3 w-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell onClick={() => setViewingStudent(student)}>
                              <Badge variant={statusLabels[student.status].variant}>
                                {statusLabels[student.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleOpenEdit(student)}
                                  data-testid={`button-edit-student-${student.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {user?.role === "admin" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setDeletingStudent(student)}
                                    data-testid={`button-delete-student-${student.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile/Card View */}
            <div className={`grid gap-3 md:grid-cols-2 lg:grid-cols-3 ${viewMode === "table" ? "md:hidden" : ""}`}>
              {paginatedStudents.map((student) => (
                <Card key={student.id} data-testid={`card-student-${student.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedIds.has(student.id)}
                          onCheckedChange={(checked) => handleSelectOne(student.id, !!checked)}
                          className="mt-1"
                        />
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => setViewingStudent(student)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate text-base" data-testid={`text-student-name-${student.id}`}>
                              {student.name}
                            </h3>
                            <Badge variant={statusLabels[student.status].variant} className="text-xs flex-shrink-0">
                              {statusLabels[student.status].label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {student.school && student.grade && (
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-3 w-3" />
                                <span className="truncate">{student.school} {student.grade}</span>
                              </div>
                            )}
                            {getMokjangName(student.mokjangId) && (
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                <span className="truncate">{getMokjangName(student.mokjangId)}</span>
                              </div>
                            )}
                            {getStudentMinistries(student.id).length > 0 && (
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                <span className="truncate">{getStudentMinistries(student.id).join(", ")}</span>
                              </div>
                            )}
                            {student.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{maskPhone(student.phone)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {student.phone && (
                              <DropdownMenuItem asChild>
                                <a href={`tel:${student.phone}`} className="flex items-center w-full">
                                  <Phone className="h-4 w-4 mr-2" />
                                  전화걸기
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleOpenEdit(student)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            {user?.role === "admin" && (
                              <DropdownMenuItem onClick={() => setDeletingStudent(student)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {isSomeSelected && (
              <Card className="sticky bottom-20 md:bottom-4 z-10 border-primary">
                <CardContent className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{selectedIds.size}명 선택됨</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" data-testid="button-bulk-mokjang">
                            목장 배정
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleBulkMokjangAssign("none")}>
                            미배정
                          </DropdownMenuItem>
                          {mokjangs?.map(m => (
                            <DropdownMenuItem key={m.id} onClick={() => handleBulkMokjangAssign(m.id)}>
                              {m.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" data-testid="button-bulk-status">
                            상태 변경
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleBulkStatusChange("ACTIVE")}>
                            재적
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkStatusChange("REST")}>
                            휴식
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkStatusChange("GRADUATED")}>
                            졸업
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {user?.role === "admin" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setBulkDeleteOpen(true)}
                          data-testid="button-bulk-delete"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}



            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>총 {filteredAndSortedStudents.length}명</span>
                <span>|</span>
                <span>페이지당</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[70px]" data-testid="select-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery || gradeFilter !== "all" || mokjangFilter !== "all" || statusFilter !== "all" || absenceFilter !== "all"
                  ? "검색 결과가 없습니다."
                  : "등록된 학생이 없습니다."}
              </p>
              {!searchQuery && gradeFilter === "all" && mokjangFilter === "all" && statusFilter === "all" && absenceFilter === "all" && (
                <p className="text-sm text-muted-foreground text-center">
                  학생 추가 버튼을 눌러 첫 학생을 등록해보세요.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "학생 정보 수정" : "학생 추가"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름 *</FormLabel>
                      <FormControl>
                        <Input placeholder="홍길동" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>생년월일</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                        <Input placeholder="010-0000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>보호자 연락처</FormLabel>
                      <FormControl>
                        <Input placeholder="010-0000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>학교</FormLabel>
                      <FormControl>
                        <Input placeholder="학교 입력" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>학년</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="학년 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gradeOptions.map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mokjangId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>목장</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="목장 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">미배정</SelectItem>
                          {mokjangs?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          <SelectTrigger>
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">재적</SelectItem>
                          <SelectItem value="REST">휴식</SelectItem>
                          <SelectItem value="GRADUATED">졸업</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>성별</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="성별 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">남</SelectItem>
                          <SelectItem value="F">여</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baptism"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>세례 구분</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="세례 구분 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">미세례</SelectItem>
                          <SelectItem value="infant">유아세례</SelectItem>
                          <SelectItem value="baptized">세례</SelectItem>
                          <SelectItem value="confirmed">입교</SelectItem>
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
                >
                  {createMutation.isPending || updateMutation.isPending ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingStudent} onOpenChange={() => setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>학생 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 "{deletingStudent?.name}" 학생을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingStudent && deleteMutation.mutate(deletingStudent.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-student"
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>학생 일괄 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 선택된 {selectedIds.size}명의 학생을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleteMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingStudent} onOpenChange={() => setViewingStudent(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-student-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              교적 카드
            </DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{viewingStudent.name}</h2>
                <Badge variant={statusLabels[viewingStudent.status].variant}>
                  {statusLabels[viewingStudent.status].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  {viewingStudent.gender && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">성별:</span>
                      <span>{genderLabels[viewingStudent.gender]}</span>
                    </div>
                  )}
                  {viewingStudent.birth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">생년월일:</span>
                      <span>{viewingStudent.birth}</span>
                    </div>
                  )}
                  {viewingStudent.baptism && (
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">세례:</span>
                      <span>{baptismLabels[viewingStudent.baptism]}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {viewingStudent.school && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">학교:</span>
                      <span>{viewingStudent.school}</span>
                    </div>
                  )}
                  {viewingStudent.grade && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">학년:</span>
                      <span>{viewingStudent.grade}</span>
                    </div>
                  )}
                  {getMokjangName(viewingStudent.mokjangId) && (
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">목장:</span>
                      <span>{getMokjangName(viewingStudent.mokjangId)}</span>
                    </div>
                  )}
                  {getStudentMinistries(viewingStudent.id).length > 0 && (
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground whitespace-nowrap">사역:</span>
                      <div className="flex flex-wrap gap-1">
                        {getStudentMinistries(viewingStudent.id).map((name, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">연락처</h3>
                <div className="space-y-2 text-sm">
                  {viewingStudent.phone && (
                    <div className="flex items-center justify-between">
                      <span>본인: {viewingStudent.phone}</span>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`tel:${viewingStudent.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                  {viewingStudent.parentPhone && (
                    <div className="flex items-center justify-between">
                      <span>부모: {viewingStudent.parentPhone}</span>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`tel:${viewingStudent.parentPhone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingStudent(null);
                    handleOpenEdit(viewingStudent);
                  }}
                  data-testid="button-edit-from-detail"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  수정
                </Button>
                <Button onClick={() => setViewingStudent(null)}>
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
