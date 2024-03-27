import React from "react";

export type Notification = {
  id: string;
  isRead: boolean;
  status: "pending" | "processing" | "success" | "failed";
  message: string;
  createdAt: Date;
};

const notifications: Notification[] = [
  {
    id: "728ed52f",
    isRead: false,
    status: "pending",
    message:
      "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
    createdAt: new Date(),
  },
  {
    id: "728ed52f",
    isRead: false,
    status: "pending",
    message:
      "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
    createdAt: new Date(),
  },
  {
    id: "728ed52f",
    isRead: false,
    status: "pending",
    message:
      "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
    createdAt: new Date(),
  },
  {
    id: "728ed52f",
    isRead: false,
    status: "pending",
    message:
      "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
    createdAt: new Date(),
  },
];

export default function Notification() {
  return <div>Notification</div>;
}
