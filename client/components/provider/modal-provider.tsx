"use client";

import React, { useEffect, useState } from "react";
import EditProfile from "@/components/modals/edit-profile";
import OTP from "@/components/modals/otp";
import { useModalStore } from "@/store/modals";

export default function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false);
  const { isOpen, type } = useModalStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen) return null;

  let modal = null;

  if (type == "editProfile") modal = <EditProfile />;
  if (type == "otp") modal = <OTP />;

  return modal;
}
