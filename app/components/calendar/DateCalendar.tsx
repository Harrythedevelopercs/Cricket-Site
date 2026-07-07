'use client';

import { useState, useMemo } from 'react';
import { format, addMonths, addYears, parseISO, isSameDay } from 'date-fns';
import Image from 'next/image';

interface MatchItem {
  id: string;
  title: string;
  t1Name: string;
  t2Name: string;
  t1t2NativeFlag: boolean;
  groundsName: string;
  date: string; // e.g. "2025-04-19T07:00:00+00:00"
  t1Logo?: { url?: string; alt?: string | null; title?: string }[];
  t2Logo?: { url?: string; alt?: string | null; title?: string }[];
}

interface MatchesData {
  entries: MatchItem[];
}

interface DateCalendarProps {
  matches?: MatchesData | null;
}

const cmsBaseUrl =
  process.env.NEXT_PUBLIC_CMS_URL || 'https://cms-ccc.ddev.site/';

const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  const baseUrl = cmsBaseUrl.endsWith('/') ? cmsBaseUrl : `${cmsBaseUrl}/`;
  return `${baseUrl}${cleanUrl}`;
};

export default function DateCalendar({ matches: rawMatches }: DateCalendarProps) {
  const matchEntries = useMemo(() => {
    if (!rawMatches || !rawMatches.entries) return [];
    return rawMatches.entries;
  }, [rawMatches]);


  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build a dictionary of matches indexed by date
  const matchesByDate = useMemo(() => {
    const map: Record<string, MatchItem> = {};


    for (const match of matchEntries) {
      if (!match || !match.date) {
        continue;
      }
      try {
        const matchDate = parseISO(match.date);
        const dateKey = format(matchDate, 'yyyy-MM-dd');

        if (!map[dateKey]) {
          // Only take the first match for that date
          map[dateKey] = match;
        }
      } catch (error) {
        console.error('Error parsing date for match:', match.id, error);
      }
    }

    return map;
  }, [matchEntries]);

  const getMatchForDate = (date: Date): MatchItem | null => {
    const dayKey = format(date, 'yyyy-MM-dd');
    return matchesByDate[dayKey] ?? null;
  };

  // Generate all the days in the current visible month (plus extra days at edges).
  // Defined inside useMemo so the hook's dependency list stays honest (lint-clean).
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const startDay = new Date(firstDayOfMonth);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    const endDay = new Date(lastDayOfMonth);
    const daysToAdd = 6 - endDay.getDay();
    endDay.setDate(endDay.getDate() + daysToAdd);

    const days = [];
    // Prefer-const fix: variable never re-bound, only date object mutated
    const currentDay = new Date(startDay);
    while (currentDay <= endDay) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const today = new Date();

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  // Removed the unused `currentDay` memo block here to fix the no-unused-vars error

  return (
    <section className="calendar_container base_paddings">
      <div className="calendar_parent center_aligned">
        <div className="calendar_holder">
          <div className="custom-calendar">
            {/* Calendar Header */}
            <div className="calendar-header">
              <button
                onClick={() => setCurrentMonth((prev) => addYears(prev, -1))}
                className="nav-button"
              >
                «
              </button>
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
                className="nav-button"
              >
                ‹
              </button>
              <div className="current-month">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="nav-button"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentMonth((prev) => addYears(prev, 1))}
                className="nav-button"
              >
                »
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {/* Day labels (Sun-Sat) */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="day-label">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const matchForThisDay = getMatchForDate(day);

                if (matchForThisDay) {
                }

                let vsTeamName: string | null = null;
                let vsTeamLogo: string | null = null;

                if (matchForThisDay) {
                  // If t1t2NativeFlag is TRUE: t1 is Vs and t2 is native
                  // If t1t2NativeFlag is FALSE: t1 is native and t2 is vs
                  if (matchForThisDay.t1t2NativeFlag) {
                    vsTeamName = matchForThisDay.t1Name;
                    vsTeamLogo = matchForThisDay.t1Logo?.[0]?.url || null;
                  } else {
                    vsTeamName = matchForThisDay.t2Name;
                    vsTeamLogo = matchForThisDay.t2Logo?.[0]?.url || null;
                  }
                }

                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isSelected =
                  selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                const hasMatch = Boolean(matchForThisDay);

                return (
                  <div
                    key={index}
                    className={`calendar-day 
                      ${hasMatch ? 'game-date' : ''} 
                      ${isToday ? 'today' : ''} 
                      ${!isCurrentMonth ? 'other-month' : ''}
                      ${isSelected ? 'selected' : ''}
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="day-number">{day.getDate()}</div>
                    {vsTeamName && vsTeamLogo && (
                      <div className="calendar-day-opponent">
                        <p className="roboto-condensed-bold p1 mr-[10%] hidden lg:block">
                          VS
                        </p>
                        <Image
                          src={getFullImageUrl(vsTeamLogo)}
                          alt={`VS ${vsTeamName}`}
                          width={32}
                          height={32}
                          className="rounded-full w-[100%] lg:w-[35%] h-auto"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 
            Match details section for selected date
            (Commented out in your code. Uncomment if needed.)
          */}
        </div>
      </div>
    </section>
  );
}
