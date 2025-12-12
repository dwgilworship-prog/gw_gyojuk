import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Ministry, MinistryTeacher, MinistryStudent, Teacher, Student } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

const ministryFormSchema = z.object({
    name: z.string().min(1, "이름을 입력해주세요"),
    description: z.string().optional(),
});

type MinistryFormData = z.infer<typeof ministryFormSchema>;

export default function Ministries() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
    const [deletingMinistry, setDeletingMinistry] = useState<Ministry | null>(null);

    // Queries
    const { data: ministries, isLoading } = useQuery<Ministry[]>({
        queryKey: ["/api/ministries"],
    });

    const { data: ministryMembers } = useQuery<{ teachers: MinistryTeacher[], students: MinistryStudent[] }>({
        queryKey: ["/api/ministry-members"],
    });

    const { data: teachers } = useQuery<Teacher[]>({
        queryKey: ["/api/teachers"],
    });

    const { data: students } = useQuery<Student[]>({
        queryKey: ["/api/students"],
    });

    const form = useForm<MinistryFormData>({
        resolver: zodResolver(ministryFormSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: MinistryFormData) => {
            const payload = {
                ...data,
                description: data.description || null,
            };
            return await apiRequest("POST", "/api/ministries", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
            toast({ title: "사역부서가 등록되었습니다." });
            handleCloseForm();
        },
        onError: () => {
            toast({ title: "등록 실패", description: "다시 시도해주세요.", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: MinistryFormData }) => {
            const payload = {
                ...data,
                description: data.description || null,
            };
            return await apiRequest("PATCH", `/api/ministries/${id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
            toast({ title: "사역부서 정보가 수정되었습니다." });
            handleCloseForm();
        },
        onError: () => {
            toast({ title: "수정 실패", description: "다시 시도해주세요.", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await apiRequest("DELETE", `/api/ministries/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
            toast({ title: "사역부서가 삭제되었습니다." });
            setDeletingMinistry(null);
        },
        onError: () => {
            toast({ title: "삭제 실패", description: "다시 시도해주세요.", variant: "destructive" });
        },
    });

    // Handlers
    const handleOpenCreate = () => {
        setEditingMinistry(null);
        form.reset({
            name: "",
            description: "",
        });
        setIsFormOpen(true);
    };

    const handleOpenEdit = (ministry: Ministry) => {
        setEditingMinistry(ministry);
        form.reset({
            name: ministry.name,
            description: ministry.description || "",
        });
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingMinistry(null);
        form.reset();
    };

    const onSubmit = (data: MinistryFormData) => {
        if (editingMinistry) {
            updateMutation.mutate({ id: editingMinistry.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const getMemberCount = (ministryId: string) => {
        if (!ministryMembers) return { teachers: 0, students: 0 };
        const teacherCount = ministryMembers.teachers.filter(m => m.ministryId === ministryId).length;
        const studentCount = ministryMembers.students.filter(m => m.ministryId === ministryId).length;
        return { teacherCount, studentCount };
    };

    const filteredMinistries = ministries?.filter(ministry =>
        ministry.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <DashboardLayout title="사역부서 관리">
            <div className="p-4 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="사역부서 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {user?.role === "admin" && (
                        <Button onClick={handleOpenCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            부서 추가
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : filteredMinistries.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredMinistries.map((ministry) => {
                            const counts = getMemberCount(ministry.id);
                            return (
                                <Card key={ministry.id} className="relative group">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl">{ministry.name}</CardTitle>
                                            {user?.role === "admin" && (
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => handleOpenEdit(ministry)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => setDeletingMinistry(ministry)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        {ministry.description && (
                                            <CardDescription>{ministry.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>교사 {counts.teacherCount}명</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>학생 {counts.studentCount}명</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground text-center">
                                {searchQuery ? "검색 결과가 없습니다." : "등록된 사역부서가 없습니다."}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingMinistry ? "사역부서 수정" : "사역부서 추가"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>부서명 *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="예: 찬양팀" {...field} />
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
                                                placeholder="부서에 대한 설명을 입력하세요"
                                                {...field}
                                                className="resize-none"
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
                                >
                                    {createMutation.isPending || updateMutation.isPending ? "저장 중..." : "저장"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingMinistry} onOpenChange={() => setDeletingMinistry(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>사역부서 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            정말 "{deletingMinistry?.name}" 부서를 삭제하시겠습니까?
                            <br />
                            소속된 모든 교사와 학생의 배정 정보가 함께 삭제됩니다.
                            이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingMinistry && deleteMutation.mutate(deletingMinistry.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? "삭제 중..." : "삭제"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
