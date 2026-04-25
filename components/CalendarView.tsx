"use client";

import { type ComponentProps, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import Calendar from "react-calendar";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarPost {
  id: string;
  content: string;
  contentType: "text" | "carousel" | "video" | "poll";
  scheduledFor: string;
  predictedEngagement: number;
  hashtags: string[];
}

interface CalendarViewProps {
  posts: CalendarPost[];
}

export default function CalendarView({ posts }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const selectedPosts = useMemo(
    () =>
      posts
        .filter((post) => isSameDay(new Date(post.scheduledFor), selectedDate))
        .sort((a, b) => +new Date(a.scheduledFor) - +new Date(b.scheduledFor)),
    [posts, selectedDate],
  );

  const countByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      const key = format(new Date(post.scheduledFor), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [posts]);

  const onDateChange: NonNullable<ComponentProps<typeof Calendar>["onChange"]> = (
    value,
  ) => {
    if (Array.isArray(value)) {
      if (value[0] instanceof Date) {
        setSelectedDate(value[0]);
      }
      return;
    }

    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Publishing Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            onChange={onDateChange}
            value={selectedDate}
            className="react-calendar"
            tileContent={({ date, view }) => {
              if (view !== "month") {
                return null;
              }

              const key = format(date, "yyyy-MM-dd");
              const count = countByDate.get(key) ?? 0;

              if (!count) {
                return null;
              }

              return (
                <div className="mt-1 flex justify-center">
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
                    {count} post{count > 1 ? "s" : ""}
                  </span>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{format(selectedDate, "EEEE, MMMM d")}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPosts.length === 0 ? (
            <p className="text-sm text-slate-400">
              No posts scheduled. This is a strong slot for adding one practical thought-leadership
              post.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedPosts.map((post) => (
                <div key={post.id} className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="muted" className="uppercase">
                      {post.contentType}
                    </Badge>
                    <p className="text-xs text-slate-400">
                      {format(new Date(post.scheduledFor), "h:mm a")}
                    </p>
                  </div>
                  <p className="line-clamp-4 text-sm text-slate-200">{post.content}</p>
                  <p className="mt-3 text-xs text-sky-300">
                    Predicted engagement: {post.predictedEngagement}/100
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
