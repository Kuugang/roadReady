import { z } from "zod";

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export const formSchema = z.object({
  firstname: z.string().min(2).max(20),
  lastname: z.string().min(2).max(20),
  email: z.string().email(),
  gender: z.nativeEnum(Gender),
  phonenumber: z.string().min(6).max(10),
  password: z.string(),
  address: z.string(),
  bankAddress: z.string(),
  // FIX: i dont know if sakto bani
  employeeId: z.string(),
});
