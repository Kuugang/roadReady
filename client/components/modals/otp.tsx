import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useModalStore } from "@/store/modals";

import React from "react";

export default function OTP() {
  const { onClose } = useModalStore();

  return (
    <Dialog onOpenChange={onClose} defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter OTP</DialogTitle>
          <DialogDescription>
            A code has been sent to the email (email herer)
          </DialogDescription>
          <InputOTP maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
