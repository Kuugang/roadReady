"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";

//for test
import { createClient } from "@supabase/supabase-js";
const supabase = createClient("supabase url", "public key");

const formSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default function Login() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  async function handleGoogleAuth() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) {
        throw new Error(error.message);
      }

      {
        /* TODO: after google auth should post request api route "/google/auth/buyer" or "/google/auth/dealer" depending on user type should also pass access_token from google auth in cookie header*/
      }

      {
        /* para ni maka decide ko whether to create a new row or login lang and maka return kog cookie for auth*/
      }

      {
        /* to be revised pa ang routes cause wa ko kasabot sa ilang users*/
      }
    } catch (error) {
      console.error("Error authenticating with Google via Supabase:", error);
    }
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jakebajo@gmail.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Login</Button>

            <Separator />

            {/* TODO: add a google button here */}
            <Button onClick={handleGoogleAuth} type="button">
              Google button here
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter>
        <p>
          Don&apos;t have an account yet?
          <Button variant={"link"} className="px-2">
            Register now
          </Button>{" "}
        </p>
      </CardFooter>
    </Card>
  );
}
