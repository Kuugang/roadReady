"use client";

import React, { useEffect, useState } from "react";
import EditProfile from "../modals/edit-profile";

export default function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <EditProfile />
    </>
  );
}
