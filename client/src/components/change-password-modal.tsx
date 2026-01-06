import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordModal() {
  const { user, changePasswordMutation } = useAuth();
  const [open, setOpen] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(
      { newPassword: data.newPassword },
      {
        onSuccess: () => {
          setToastMessage("비밀번호가 변경되었어요");
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
            // fade-out 애니메이션(300ms) 후 컴포넌트 unmount
            setTimeout(() => setIsClosing(true), 300);
          }, 2500);
        },
      }
    );
  };

  // 토스트 애니메이션이 완료될 때까지 컴포넌트 유지
  if (isClosing || (!user?.mustChangePassword && !showToast)) {
    return null;
  }

  return (
    <>
      <Dialog open={open && !showToast} onOpenChange={() => {}} modal>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center">비밀번호 변경 필요</DialogTitle>
            <DialogDescription className="text-center">
              초기 비밀번호로 로그인하셨습니다.<br />
              보안을 위해 새로운 비밀번호를 설정해주세요.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>새 비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="최소 6자 이상"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호 확인</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="비밀번호 재입력"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                비밀번호 변경
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div
        className="toast-message"
        style={{
          opacity: showToast ? 1 : 0,
          transform: showToast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(16px)',
          pointerEvents: showToast ? 'auto' : 'none',
        }}
      >
        {toastMessage}
      </div>
    </>
  );
}
