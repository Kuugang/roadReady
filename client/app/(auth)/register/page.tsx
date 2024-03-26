import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function Register() {
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Sign up as</CardTitle>
        {/* TODO: improve this part */}
        {/* <CardDescription></CardDescription> */}
      </CardHeader>
      <CardContent className="flex flex-col">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={"/register/bank"}
        >
          Bank
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={"/register/lto"}
        >
          LTO
        </Link>
      </CardContent>
    </Card>
  );
}
