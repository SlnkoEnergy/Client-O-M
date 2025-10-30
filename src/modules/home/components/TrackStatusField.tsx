"use client";
import { useEffect, useMemo, useState } from "react";
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
const fmtDateTime = (d?: string | Date) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "N/A";

const badgeClass = (status?: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "bg-slate-600";
  if (s === "in progress") return "bg-amber-600";
  if (s === "completed") return "bg-emerald-600";
  if (s === "cancelled") return "bg-rose-600";
  return "bg-slate-500";
};

type HistoryItem = {
  status?: string;
  remarks?: string;
  updatedAt?: string;
};

type TicketItem = {
  _id: string;
  ticket_id?: string;
  project_id?: { _id: string; name?: string };
  material?: { _id: string; name?: string };
  number?: number | string;
  short_description?: string;
  description?: string;
  documents?: Array<{ attachment_url?: string; _id?: string }>;
  status_history?: HistoryItem[];
  current_status?: { status?: string; remarks?: string; updatedAt?: string };
  createdAt?: string;
  updatedAt?: string;
};

export default function TrackStatusField() {
  const [ticketNo, setTicketNo] = useState("");
  const [ticketData, setTicketData] = useState<TicketItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Derived: currently selected ticket (when there are multiple results)
  const ticket = useMemo(
    () =>
      selectedIdx != null && ticketData[selectedIdx]
        ? ticketData[selectedIdx]
        : ticketData[0],
    [selectedIdx, ticketData]
  );

  // If exactly one result arrives, open details automatically
  useEffect(() => {
    if (ticketData.length === 1) setSelectedIdx(0);
    if (ticketData.length > 1) setSelectedIdx(null);
  }, [ticketData]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSelectedIdx(null);

    try {
      const raw = String(ticketNo || "").trim();
      if (!raw) {
        setError("Please enter your Ticket Number or Phone Number.");
        return;
      }

      const res = await getTicketDetail(raw);
      const list: TicketItem[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      setTicketData(list);
      if (list.length === 0) setError("No matching tickets found.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch ticket details.");
      setTicketData([]);
    } finally {
      setLoading(false);
    }
  };

  const history: HistoryItem[] = useMemo(() => {
    const items = Array.isArray(ticket?.status_history)
      ? [...ticket!.status_history]
      : [];
    // Sort by updatedAt ascending; tolerate missing timestamps
    items.sort((a, b) => {
      const da = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const db = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return da - db;
    });
    return items;
  }, [ticket]);

  // Resolve a "current status" string
  const currentStatus =
    ticket?.current_status?.status ??
    (history.length ? history[history.length - 1]?.status : undefined) ??
    "N/A";

  const formatStatus = (s = "") =>
    s
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  /* ---------- compact card renderer for search results ---------- */
  const ResultsGrid = () => (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ticketData.map((t, idx) => (
        <Card
          key={t._id || idx}
          className="border rounded-xl hover:shadow-md transition cursor-pointer"
          onClick={() => setSelectedIdx(idx)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-500">Ticket ID</div>
                <div className="font-semibold truncate">{t.ticket_id || "N/A"}</div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${badgeClass(
                  t.current_status?.status
                )}`}
                title={formatStatus(t.current_status?.status) || "N/A"}
              >
                {formatStatus(t.current_status?.status) || "N/A"}
              </span>
            </div>

            <div className="mt-3 text-sm space-y-1">
              <div className="flex gap-2">
                <span className="text-slate-500 min-w-20">Project:</span>
                <span className="font-medium truncate">
                  {t.project_id?.name || "N/A"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 min-w-20">Material:</span>
                <span className="truncate">{t.material?.name || "N/A"}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-4 pb-4">
            <Button className="w-full" variant="secondary" onClick={() => setSelectedIdx(idx)}>
              View details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

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
                    TicketNo./Phone
                  </Label>
                  <Input
                    id="ticket"
                    type="text"
                    placeholder="e.g., TXX000 or 999999999"
                    value={ticketNo}
                    onChange={(e) => setTicketNo(e.target.value)}
                    required
                    className="h-10 sm:h-11"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto h-11"
                  >
                    {loading ? "Searching..." : "Search"}
                  </Button>

                  {ticketData.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"                 // was "ghost" → better contrast
                      className="w-full sm:w-auto h-11"
                      onClick={() => {
                        setTicketData([]);
                        setSelectedIdx(null);
                        setError("");
                        setTicketNo("");               // also clear the input
                      }}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs sm:text-sm font-medium">{error}</p>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-4 px-4 sm:px-6 lg:px-8 pb-6">
            {/* --- Multiple results -> show compact cards --- */}
            {ticketData.length > 1 && selectedIdx == null && <ResultsGrid />}

            {/* --- Single selection/details view --- */}
            {ticketData.length > 0 && (ticketData.length === 1 || selectedIdx != null) && ticket && (
              <>
                {ticketData.length > 1 && (
                  <div className="w-full flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setSelectedIdx(null)}>
                      ← Back to results
                    </Button>
                  </div>
                )}

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
                          currentStatus
                        )}`}
                      >
                        {formatStatus(currentStatus)}
                      </span>
                    </p>

                    <p>
                      <strong>Project:</strong> {ticket?.project_id?.name || "N/A"}
                    </p>
                    <p>
                      <strong>Material:</strong> {ticket?.material?.name || "N/A"}
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
                            {/* row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${badgeClass(
                                    item.status
                                  )}`}
                                >
                                  {formatStatus(item.status) || "N/A"}
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
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
