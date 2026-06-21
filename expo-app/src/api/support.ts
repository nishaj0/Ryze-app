import client from "./client";

export interface SupportTicket {
  id: string;
  type: "BUG" | "HELP" | "EXERCISE_REQUEST";
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export const submitSupportTicket = async (data: {
  type: "BUG" | "HELP" | "EXERCISE_REQUEST";
  title: string;
  description: string;
}): Promise<SupportTicket> => {
  const res = await client.post<{ ticket: SupportTicket }>("/support/tickets", data);
  return res.data.ticket;
};

export const getMyTickets = async (): Promise<SupportTicket[]> => {
  const res = await client.get<{ tickets: SupportTicket[] }>("/support/my-tickets");
  return res.data.tickets;
};
