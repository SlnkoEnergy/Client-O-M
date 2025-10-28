"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTicketDetail } from "@/services/home/TrackStatus";

/* ---------- helpers ---------- */
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

const badgeClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "bg-slate-600";
  if (s === "in progress") return "bg-amber-600";
  if (s === "completed") return "bg-emerald-600";
  if (s === "cancelled") return "bg-rose-600";
  return "bg-slate-500";
};

export default function TrackStatusField() {
  const [ticketNo, setTicketNo] = useState("");
  const [ticketData, setTicketData] = useState([]); // store array from backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!ticketNo.trim()) {
        setError("Please enter your Ticket Number.");
        return;
      }

      // Your service should return { message, data: [...] }
      const res = await getTicketDetail(ticketNo.trim());

      // Normalize in case getTicketDetail already returns { message, data } or just data
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setTicketData(list);
    } catch (error) {
      setError(
        error?.response?.data?.message || "Failed to fetch ticket details."
      );
      setTicketData([]);
    } finally {
      setLoading(false);
    }
  };

  const ticket = ticketData?.[0]; // show first match (adjust if you expect multiple)

  const history = Array.isArray(ticket?.status_history)
    ? [...ticket.status_history].sort(
        (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)
      )
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef5ff] to-white flex">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 rounded-2xl">
          <CardHeader className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
            <CardTitle className="text-xl sm:text-2xl">
              Enter Your Ticket No. or Phone No.
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 lg:px-8 pb-4">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="ticket" className="text-sm sm:text-base">
                    Ticket No.
                  </Label>
                  <Input
                    id="ticket"
                    type="text"
                    placeholder="Ticket-XX-XXX"
                    value={ticketNo}
                    onChange={(e) => setTicketNo(e.target.value)}
                    required
                    className="h-10 sm:h-11"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs sm:text-sm font-medium">
                  {error}
                </p>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 pb-6">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto sm:self-end"
            >
              {loading ? "Searching..." : "Search"}
            </Button>

            {/* --- Ticket Summary --- */}
            {ticket && (
              <div className="mt-1 w-full bg-gray-50 border rounded-xl p-4 sm:p-5 lg:p-6 text-left">
                <h2 className="font-semibold text-base sm:text-lg text-gray-800">
                  Ticket Details
                </h2>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <p>
                    <strong>Ticket ID:</strong> {ticket?.ticket_id || "N/A"}
                  </p>

                  <p className="flex items-center gap-2">
                    <strong>Status:</strong>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${badgeClass(
                        ticket?.current_status?.status
                      )}`}
                    >
                      {ticket?.current_status?.status || "N/A"}
                    </span>
                  </p>

                  <p className="sm:col-span-2">
                    <strong>Remarks:</strong>{" "}
                    {ticket?.current_status?.remarks || "N/A"}
                  </p>

                  <p className="sm:col-span-2">
                    <strong>Last Updated:</strong>{" "}
                    {fmtDateTime(ticket?.current_status?.updatedAt)}
                  </p>
                </div>

                {/* --- Status Timeline (vertical) --- */}
                <div className="mt-6">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-3">
                    Status Timeline
                  </h3>

                  {history.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      No status history available.
                    </p>
                  ) : (
                    <ol className="relative border-s border-slate-200 pl-5 sm:pl-6">
                      {history.map((item, idx) => (
                        <li key={idx} className="mb-5 sm:mb-6 ms-2">
                          {/* dot */}
                          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-white" />
                          {/* line */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${badgeClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                              {item.remarks && (
                                <span className="text-[13px] sm:text-sm text-slate-800 font-medium leading-snug">
                                  {item.remarks}
                                </span>
                              )}
                            </div>
                            <time className="text-[11px] sm:text-xs text-slate-500">
                              {fmtDateTime(item.updatedAt)}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
