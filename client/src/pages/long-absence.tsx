import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Phone, MessageSquare, MapPin, Clock, User, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Student, Mokjang, Teacher, LongAbsenceContact } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";

interface LongAbsenceStudent {
  student: Student;
  weeksAbsent: number;
  lastAttendanceDate: string | null;
}

const contactFormSchema = z.object({
  contactMethod: z.enum(["phone", "visit", "message"]),
  content: z.string().min(1, "내용을 입력해주세요"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const contactMethodLabels: Record<string, { label: string; icon: typeof Phone }> = {
  phone: { label: "전화", icon: Phone },
  visit: { label: "방문", icon: MapPin },
  message: { label: "문자", icon: MessageSquare },
};

export default function LongAbsence() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<LongAbsenceStudent | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      contactMethod: "phone",
      content: "",
    },
  });

  const { data: longAbsenceStudents, isLoading: isLoadingStudents } = useQuery<LongAbsenceStudent[]>({
    queryKey: ["/api/long-absence-students"],
  });

  const { data: mokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: contactHistory, isLoading: isLoadingHistory } = useQuery<LongAbsenceContact[]>({
    queryKey: ["/api/long-absence-contacts", selectedStudent?.student.id],
    enabled: !!selectedStudent && historyDialogOpen,
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const teacher = teachers?.find(t => t.userId === user?.id);
      const payload = {
        studentId: selectedStudent?.student.id,
        contactDate: format(new Date(), "yyyy-MM-dd"),
        contactMethod: data.contactMethod,
        content: data.content,
        contactedBy: teacher?.id || null,
      };
      return apiRequest("/api/long-absence-contacts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({ title: "심방 기록이 저장되었습니다" });
      setContactDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/long-absence-contacts", selectedStudent?.student.id] });
    },
    onError: () => {
      toast({ title: "저장에 실패했습니다", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return apiRequest(`/api/students/${studentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "REST" }),
      });
    },
    onSuccess: () => {
      toast({ title: "학생이 휴식 상태로 변경되었습니다" });
      queryClient.invalidateQueries({ queryKey: ["/api/long-absence-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
    onError: () => {
      toast({ title: "상태 변경에 실패했습니다", variant: "destructive" });
    },
  });

  const getMokjangName = (mokjangId: string | null) => {
    if (!mokjangId) return "미배정";
    const mokjang = mokjangs?.find(m => m.id === mokjangId);
    return mokjang?.name || "알 수 없음";
  };

  const getTeacherName = (teacherId: string | null | undefined) => {
    if (!teacherId) return "";
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher?.name || "";
  };

  const fourWeeksPlus = longAbsenceStudents?.filter(s => s.weeksAbsent >= 4) || [];
  const twoToThreeWeeks = longAbsenceStudents?.filter(s => s.weeksAbsent >= 2 && s.weeksAbsent < 4) || [];

  const handleContactRecord = (student: LongAbsenceStudent) => {
    setSelectedStudent(student);
    setContactDialogOpen(true);
  };

  const handleViewHistory = (student: LongAbsenceStudent) => {
    setSelectedStudent(student);
    setHistoryDialogOpen(true);
  };

  const handleRestStatus = (studentId: string) => {
    updateStatusMutation.mutate(studentId);
  };

  const onSubmitContact = (data: ContactFormData) => {
    createContactMutation.mutate(data);
  };

  const StudentCard = ({ item }: { item: LongAbsenceStudent }) => (
    <Card className="hover-elevate" data-testid={`card-long-absence-${item.student.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium" data-testid={`text-student-name-${item.student.id}`}>
                  {item.student.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {getMokjangName(item.student.mokjangId)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                {item.student.grade && <span>{item.student.grade}</span>}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.weeksAbsent === 999 ? "출석 기록 없음" : `${item.weeksAbsent}주 결석`}
                </span>
              </div>
              {item.lastAttendanceDate && (
                <div className="text-xs text-muted-foreground mt-1">
                  마지막 출석: {format(new Date(item.lastAttendanceDate), "M월 d일", { locale: ko })}
                </div>
              )}
              {item.student.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Phone className="w-3 h-3" />
                  {item.student.phone}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleContactRecord(item)}
              data-testid={`button-contact-record-${item.student.id}`}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              심방 기록
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleRestStatus(item.student.id)}
              data-testid={`button-rest-status-${item.student.id}`}
            >
              <User className="w-4 h-4 mr-1" />
              휴식 전환
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleViewHistory(item)}
              data-testid={`button-view-history-${item.student.id}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="장기결석자 관리">
      <div className="p-4 md:p-6 space-y-6">
        {isLoadingStudents ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <>
            {fourWeeksPlus.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <h2 className="font-semibold text-lg" data-testid="section-4weeks">
                    4주 이상 ({fourWeeksPlus.length}명)
                  </h2>
                </div>
                <div className="grid gap-3">
                  {fourWeeksPlus.map(item => (
                    <StudentCard key={item.student.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {twoToThreeWeeks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <h2 className="font-semibold text-lg" data-testid="section-2weeks">
                    2주 이상 ({twoToThreeWeeks.length}명)
                  </h2>
                </div>
                <div className="grid gap-3">
                  {twoToThreeWeeks.map(item => (
                    <StudentCard key={item.student.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {fourWeeksPlus.length === 0 && twoToThreeWeeks.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-long-absence">
                    장기결석자가 없습니다
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              심방 기록 - {selectedStudent?.student.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitContact)} className="space-y-4">
              <FormField
                control={form.control}
                name="contactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락 방법</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-contact-method">
                          <SelectValue placeholder="연락 방법 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="phone" data-testid="select-method-phone">전화</SelectItem>
                        <SelectItem value="visit" data-testid="select-method-visit">방문</SelectItem>
                        <SelectItem value="message" data-testid="select-method-message">문자</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>내용</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="심방 내용을 입력하세요..."
                        className="min-h-[100px]"
                        data-testid="textarea-contact-content"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setContactDialogOpen(false)}
                  data-testid="button-cancel-contact"
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={createContactMutation.isPending}
                  data-testid="button-save-contact"
                >
                  {createContactMutation.isPending ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>심방 기록 - {selectedStudent?.student.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {isLoadingHistory ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : contactHistory && contactHistory.length > 0 ? (
              contactHistory.map((contact) => {
                const MethodIcon = contactMethodLabels[contact.contactMethod || "phone"]?.icon || Phone;
                return (
                  <Card key={contact.id} data-testid={`card-contact-history-${contact.id}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <MethodIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">
                              {contactMethodLabels[contact.contactMethod || "phone"]?.label}
                            </span>
                            <span className="text-muted-foreground">
                              {format(new Date(contact.contactDate), "yyyy.M.d", { locale: ko })}
                            </span>
                            {contact.contactedBy && (
                              <span className="text-muted-foreground">
                                ({getTeacherName(contact.contactedBy)})
                              </span>
                            )}
                          </div>
                          <p className="text-sm mt-1">{contact.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-4" data-testid="text-no-history">
                심방 기록이 없습니다
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
