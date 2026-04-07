import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { colors, spacing, radius } from "@/theme";

dayjs.locale("es");

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface MiniCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  markedDates?: Set<string>; // dates with dots (have appointments)
}

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  markedDates,
}: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() =>
    dayjs(selectedDate).startOf("month")
  );

  const today = dayjs().format("YYYY-MM-DD");

  const prevMonth = () => setViewMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setViewMonth((m) => m.add(1, "month"));

  // Build calendar grid
  const startOfMonth = viewMonth.startOf("month");
  const endOfMonth = viewMonth.endOf("month");
  const daysInMonth = endOfMonth.date();

  // Monday = 0 ... Sunday = 6 (ISO weekday)
  const startDay = (startOfMonth.day() + 6) % 7; // shift Sunday=0 to Monday-based
  const totalCells = Math.ceil((daysInMonth + startDay) / 7) * 7;

  const cells: (Dayjs | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startDay || i >= startDay + daysInMonth) {
      cells.push(null);
    } else {
      cells.push(viewMonth.date(i - startDay + 1));
    }
  }

  const weeks: (Dayjs | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const monthLabel = viewMonth.format("MMMM YYYY");

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.monthRow}>
        <Pressable onPress={prevMonth} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => {
            const todayMonth = dayjs().startOf("month");
            setViewMonth(todayMonth);
            onSelectDate(dayjs().format("YYYY-MM-DD"));
          }}
        >
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </Pressable>
        <Pressable onPress={nextMonth} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekdayText}>
            {d}
          </Text>
        ))}
      </View>

      {/* Days grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={di} style={styles.dayCell} />;
            }

            const dateStr = day.format("YYYY-MM-DD");
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            const hasAppointment = markedDates?.has(dateStr);

            return (
              <Pressable
                key={di}
                onPress={() => onSelectDate(dateStr)}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {day.date()}
                </Text>
                {hasAppointment && !isSelected && (
                  <View style={styles.dot} />
                )}
                {hasAppointment && isSelected && (
                  <View style={styles.dotSelected} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Month nav
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navBtn: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textTransform: "capitalize",
  },

  // Weekday headers
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // Day cells
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: radius.full,
    gap: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    backgroundColor: colors.surfaceSoft,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "400",
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: "700",
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: "700",
  },

  // Dots (has appointments)
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
  },
  dotSelected: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.white,
  },
});
