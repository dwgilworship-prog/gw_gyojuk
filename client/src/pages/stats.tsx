import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Download, Users, UserCog, ClipboardList, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { Student, Teacher, Mokjang } from "@shared/schema";

interface AttendanceLogWithStudent {
  id: string;
  studentId: string;
  date: string;
  status: string;
  student?: {
    name: string;
    grade: string | null;
  };
}

export default function Stats() {
  const { toast } = useToast();
  const [downloadingStudents, setDownloadingStudents] = useState(false);
  const [downloadingTeachers, setDownloadingTeachers] = useState(false);
  const [downloadingAttendance, setDownloadingAttendance] = useState(false);
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [attendanceStartDate, setAttendanceStartDate] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [attendanceEndDate, setAttendanceEndDate] = useState(now.toISOString().slice(0, 10));

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: mokjangs } = useQuery<Mokjang[]>({
    queryKey: ["/api/mokjangs"],
  });

  const getMokjangName = (mokjangId: string | null) => {
    if (!mokjangId) return "미배정";
    return mokjangs?.find(m => m.id === mokjangId)?.name || "미배정";
  };

  const getMokjangTeacher = (mokjangId: string | null) => {
    if (!mokjangId) return "-";
    const mokjang = mokjangs?.find(m => m.id === mokjangId);
    if (!mokjang?.teacherId) return "-";
    return teachers?.find(t => t.id === mokjang.teacherId)?.name || "-";
  };

  const handleDownloadStudents = async () => {
    if (!students) return;
    setDownloadingStudents(true);
    try {
      const data = students.map(s => ({
        "이름": s.name,
        "학년": s.grade || "",
        "성별": s.gender === "M" ? "남" : s.gender === "F" ? "여" : "",
        "생년월일": s.birth || "",
        "학교": s.school || "",
        "연락처": s.phone || "",
        "보호자명": s.parentName || "",
        "보호자연락처": s.parentPhone || "",
        "목장": getMokjangName(s.mokjangId),
        "담당교사": getMokjangTeacher(s.mokjangId),
        "세례여부": s.baptism === "infant" ? "유아세례" : 
                   s.baptism === "baptized" ? "세례" :
                   s.baptism === "confirmed" ? "입교" : "없음",
        "등록일": s.createdAt ? format(new Date(s.createdAt), "yyyy-MM-dd") : "",
        "상태": s.status === "ACTIVE" ? "활동중" : 
               s.status === "REST" ? "휴식" : "졸업",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "학생명단");
      
      const colWidths = [
        { wch: 10 }, { wch: 8 }, { wch: 5 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 12 }, { wch: 8 }
      ];
      ws["!cols"] = colWidths;
      
      XLSX.writeFile(wb, `학생명단_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "다운로드 완료", description: "학생명단 엑셀 파일이 다운로드되었습니다." });
    } catch (error) {
      toast({ title: "다운로드 실패", description: "엑셀 파일 생성에 실패했습니다.", variant: "destructive" });
    } finally {
      setDownloadingStudents(false);
    }
  };

  const handleDownloadTeachers = async () => {
    if (!teachers) return;
    setDownloadingTeachers(true);
    try {
      const mokjangList = mokjangs || [];
      const data = teachers.map(t => {
        const assignedMokjangs = mokjangList.filter(m => m.teacherId === t.id).map(m => m.name).join(", ");
        return {
          "이름": t.name,
          "연락처": t.phone || "",
          "담당목장": assignedMokjangs || "없음",
          "시작일": t.startedAt || "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "교사명단");
      
      const colWidths = [{ wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 12 }];
      ws["!cols"] = colWidths;
      
      XLSX.writeFile(wb, `교사명단_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "다운로드 완료", description: "교사명단 엑셀 파일이 다운로드되었습니다." });
    } catch (error) {
      toast({ title: "다운로드 실패", description: "엑셀 파일 생성에 실패했습니다.", variant: "destructive" });
    } finally {
      setDownloadingTeachers(false);
    }
  };

  const handleDownloadAttendance = async () => {
    if (!students || !attendanceStartDate || !attendanceEndDate) return;
    setDownloadingAttendance(true);
    try {
      const response = await fetch(`/api/attendance?startDate=${attendanceStartDate}&endDate=${attendanceEndDate}`);
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const logs: AttendanceLogWithStudent[] = await response.json();

      const studentMap = new Map(students.map(s => [s.id, s]));
      
      const data = logs.map(log => {
        const student = studentMap.get(log.studentId);
        return {
          "날짜": log.date,
          "학생이름": student?.name || "알 수 없음",
          "학년": student?.grade || "",
          "목장": getMokjangName(student?.mokjangId || null),
          "출석상태": log.status === "ATTENDED" ? "출석" :
                     log.status === "LATE" ? "지각" : "결석",
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "출석데이터");
      
      const colWidths = [{ wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 8 }];
      ws["!cols"] = colWidths;
      
      XLSX.writeFile(wb, `출석데이터_${attendanceStartDate}_${attendanceEndDate}.xlsx`);
      toast({ title: "다운로드 완료", description: "출석데이터 엑셀 파일이 다운로드되었습니다." });
    } catch (error) {
      toast({ title: "다운로드 실패", description: "엑셀 파일 생성에 실패했습니다.", variant: "destructive" });
    } finally {
      setDownloadingAttendance(false);
    }
  };

  return (
    <DashboardLayout title="통계/리포트">
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              통계/리포트
            </CardTitle>
            <CardDescription>
              교적부, 교사명단, 출석 데이터를 엑셀로 다운로드할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    학생명단 (교적부)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    전체 학생 정보를 다운로드합니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleDownloadStudents} 
                    disabled={downloadingStudents || !students}
                    className="w-full"
                    data-testid="button-download-students"
                  >
                    {downloadingStudents ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    다운로드
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    교사명단
                  </CardTitle>
                  <CardDescription className="text-xs">
                    전체 교사 정보를 다운로드합니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleDownloadTeachers} 
                    disabled={downloadingTeachers || !teachers}
                    className="w-full"
                    data-testid="button-download-teachers"
                  >
                    {downloadingTeachers ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    다운로드
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    출석 데이터
                  </CardTitle>
                  <CardDescription className="text-xs">
                    선택한 기간의 출석 데이터를 다운로드합니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">시작일</Label>
                      <Input 
                        type="date" 
                        value={attendanceStartDate}
                        onChange={(e) => setAttendanceStartDate(e.target.value)}
                        data-testid="input-attendance-start-date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">종료일</Label>
                      <Input 
                        type="date" 
                        value={attendanceEndDate}
                        onChange={(e) => setAttendanceEndDate(e.target.value)}
                        data-testid="input-attendance-end-date"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleDownloadAttendance} 
                    disabled={downloadingAttendance || !students || !attendanceStartDate || !attendanceEndDate}
                    className="w-full"
                    data-testid="button-download-attendance"
                  >
                    {downloadingAttendance ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    다운로드
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
