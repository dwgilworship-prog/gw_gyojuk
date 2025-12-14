import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, User, Users } from "lucide-react";
import type { Student, Mokjang, Ministry, MinistryStudent } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipientSelectorProps {
    onSelectionChange: (selectedIds: string[], targetType: 'student' | 'parent' | 'both', recipients: any[]) => void;
}

export function RecipientSelector({ onSelectionChange }: RecipientSelectorProps) {
    const [targetType, setTargetType] = useState<'student' | 'parent' | 'both'>('parent');
    const [searchQuery, setSearchQuery] = useState("");
    const [gradeFilter, setGradeFilter] = useState("all");
    const [mokjangFilter, setMokjangFilter] = useState("all");
    const [ministryFilter, setMinistryFilter] = useState("all");
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    // Queries
    const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
        queryKey: ["/api/students"],
    });

    const { data: mokjangs } = useQuery<Mokjang[]>({
        queryKey: ["/api/mokjangs"],
    });

    const { data: ministries } = useQuery<Ministry[]>({
        queryKey: ["/api/ministries"],
    });

    const { data: ministryMembers } = useQuery<{ students: MinistryStudent[] }>({
        queryKey: ["/api/ministry-members"],
    });

    // Filter Logic
    const filteredStudents = useMemo(() => {
        if (!students) return [];
        return students.filter((student) => {
            // Status check (active only for now as per requirement "enrolled only" usually implies active)
            if (student.status !== "ACTIVE") return false;

            // Search
            if (searchQuery && !student.name.includes(searchQuery)) return false;

            // Grade
            if (gradeFilter !== "all" && student.grade !== gradeFilter) return false;

            // Mokjang
            if (mokjangFilter !== "all" && student.mokjangId !== mokjangFilter) return false;

            // Ministry
            if (ministryFilter !== "all") {
                const studentMinistries = ministryMembers?.students
                    ?.filter(ms => ms.studentId === student.id)
                    .map(ms => ms.ministryId) || [];
                if (!studentMinistries.includes(ministryFilter)) return false;
            }

            return true;
        });
    }, [students, searchQuery, gradeFilter, mokjangFilter, ministryFilter, ministryMembers]);

    // When targetType changes, reset all selections
    useEffect(() => {
        setSelectedStudentIds(new Set());
    }, [targetType]);

    // Selection Logic
    const handleSelectAll = () => {
        if (selectedStudentIds.size === filteredStudents.length) {
            setSelectedStudentIds(new Set());
        } else {
            const newSet = new Set<string>();
            filteredStudents.forEach(s => {
                if (isSelectable(s)) {
                    newSet.add(s.id);
                }
            });
            setSelectedStudentIds(newSet);
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedStudentIds(newSet);
    };

    const isSelectable = (student: Student) => {
        if (targetType === 'student') return !!student.phone;
        if (targetType === 'parent') return !!student.parentPhone;
        if (targetType === 'both') return !!student.phone || !!student.parentPhone;
        return false;
    };

    // Notify parent of changes
    useEffect(() => {
        if (!students) return;

        const selectedList = students.filter(s => selectedStudentIds.has(s.id));

        // Generate valid recipients list based on target type
        const recipients = selectedList.flatMap(s => {
            const list = [];
            if ((targetType === 'student' || targetType === 'both') && s.phone) {
                list.push({ studentId: s.id, name: s.name, phone: s.phone, type: 'student' });
            }
            if ((targetType === 'parent' || targetType === 'both') && s.parentPhone) {
                // Avoid duplicate if parent phone is same as student phone (rare but possible)
                if (targetType === 'both' && s.phone === s.parentPhone) {
                    // Skip if same
                } else {
                    list.push({ studentId: s.id, name: `${s.name} 보호자`, phone: s.parentPhone, type: 'parent' });
                }
            }
            return list;
        });

        onSelectionChange(Array.from(selectedStudentIds), targetType, recipients);
    }, [selectedStudentIds, targetType, students]);

    // Helper for Mokjang Name
    const getMokjangName = (id: string | null) => {
        if (!id || !mokjangs) return "-";
        return mokjangs.find(m => m.id === id)?.name || "-";
    };

    if (isLoadingStudents) {
        return <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    📋 수신자 선택
                    <span className="text-sm font-normal text-muted-foreground ml-auto">
                        선택된 학생: {selectedStudentIds.size}명
                    </span>
                </h2>

                {/* Target Type Selection */}
                <div className="flex items-center space-x-4 p-3 bg-muted/40 rounded-lg">
                    <span className="text-sm font-medium">수신 대상:</span>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="targetType"
                                value="student"
                                checked={targetType === 'student'}
                                onChange={() => setTargetType('student')}
                                className="accent-primary"
                            />
                            <span className="text-sm">학생 본인</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="targetType"
                                value="parent"
                                checked={targetType === 'parent'}
                                onChange={() => setTargetType('parent')}
                                className="accent-primary"
                            />
                            <span className="text-sm">보호자</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="targetType"
                                value="both"
                                checked={targetType === 'both'}
                                onChange={() => setTargetType('both')}
                                className="accent-primary"
                            />
                            <span className="text-sm">둘 다</span>
                        </label>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                    >
                        {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0 ? "전체 해제" : "전체 선택"}
                    </Button>

                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue placeholder="학년" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전 학년</SelectItem>
                            <SelectItem value="중1">중1</SelectItem>
                            <SelectItem value="중2">중2</SelectItem>
                            <SelectItem value="중3">중3</SelectItem>
                            <SelectItem value="고1">고1</SelectItem>
                            <SelectItem value="고2">고2</SelectItem>
                            <SelectItem value="고3">고3</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={mokjangFilter} onValueChange={setMokjangFilter}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder="목장" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 목장</SelectItem>
                            {mokjangs?.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={ministryFilter} onValueChange={setMinistryFilter}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder="사역부서" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 부서</SelectItem>
                            {ministries?.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="이름 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]"></TableHead>
                            <TableHead>이름</TableHead>
                            <TableHead>학년</TableHead>
                            <TableHead>목장</TableHead>
                            <TableHead>학생 연락처</TableHead>
                            <TableHead>보호자 연락처</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    검색 결과가 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student) => {
                                const selectable = isSelectable(student);
                                return (
                                    <TableRow key={student.id} className={!selectable ? "opacity-50 bg-muted/20" : ""}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedStudentIds.has(student.id)}
                                                onCheckedChange={() => handleSelectOne(student.id)}
                                                disabled={!selectable}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.grade}</TableCell>
                                        <TableCell>{getMokjangName(student.mokjangId)}</TableCell>
                                        <TableCell className="text-xs">{student.phone || "-"}</TableCell>
                                        <TableCell className="text-xs">{student.parentPhone || "-"}</TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
