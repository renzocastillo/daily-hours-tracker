import { List, LocalStorage, Toast, showToast, ActionPanel, Action } from '@raycast/api';
import { useEffect, useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSaturday, isSunday, subMonths } from 'date-fns';

const DEFAULT_HOURS = 8;

function getMonthDates(monthOffset = 0) {
  const today = new Date();
  const targetMonth = subMonths(today, monthOffset);
  const start = startOfMonth(targetMonth);
  const end = endOfMonth(targetMonth);

  return eachDayOfInterval({ start, end });
}

async function getAdjustedHours(date: string) {
  const adjustedHours = await LocalStorage.getItem<number>(`adjustedHours_${date}`);
  return adjustedHours;
}

export default function ViewHours() {
  const [currentHours, setCurrentHours] = useState<number>(0);
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [previousMonthHours, setPreviousMonthHours] = useState<number>(0);
  const [extraWorkdays, setExtraWorkdays] = useState<{ date: string; hours: number }[]>([]);
  const [previousMonthExtraWorkdays, setPreviousMonthExtraWorkdays] = useState<{ date: string; hours: number }[]>([]);

  useEffect(() => {
    const calculateHours = async () => {
      try {
        const defaultHours = (await LocalStorage.getItem<number>('defaultHours')) || DEFAULT_HOURS;
        const monthDates = getMonthDates();
        const today = new Date();

        let totalHours = 0;
        let accumulatedHours = 0;
        const extraDays: { date: string; hours: number }[] = [];

        for (const day of monthDates) {
          const dateKey = format(day, 'yyyy-MM-dd');
          const adjustedHours = await getAdjustedHours(dateKey);

          const hoursWorked = adjustedHours !== undefined ? adjustedHours : (isSaturday(day) || isSunday(day) ? 0 : defaultHours);

          if (day <= today) {
            totalHours += hoursWorked;
          }

          accumulatedHours += hoursWorked;

          // Identify extra time worked on both workdays and weekends
          if (hoursWorked > defaultHours || ((isSaturday(day) || isSunday(day)) && hoursWorked > 0)) {
            extraDays.push({ date: day.toISOString(), hours: hoursWorked });
          }
        }

        setCurrentHours(totalHours);
        setEstimatedHours(accumulatedHours);
        setExtraWorkdays(extraDays);

        console.log(`Hours worked until today: ${totalHours}`);
        console.log(`Estimated hours for the month: ${accumulatedHours}`);
        console.log(`Extra workdays: ${extraDays.map(day => day.date).join(', ')}`);
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to calculate hours",
          message: (error as Error).message
        });
      }
    };

    const calculatePreviousMonthHours = async () => {
      try {
        const defaultHours = (await LocalStorage.getItem<number>('defaultHours')) || DEFAULT_HOURS;
        const previousMonthDates = getMonthDates(1);

        let totalHours = 0;
        const extraDays: { date: string; hours: number }[] = [];

        for (const day of previousMonthDates) {
          const dateKey = format(day, 'yyyy-MM-dd');
          const adjustedHours = await getAdjustedHours(dateKey);

          const hoursWorked = adjustedHours !== undefined ? adjustedHours : (isSaturday(day) || isSunday(day) ? 0 : defaultHours);

          totalHours += hoursWorked;

          // Identify extra time worked on both workdays and weekends
          if (hoursWorked > defaultHours || ((isSaturday(day) || isSunday(day)) && hoursWorked > 0)) {
            extraDays.push({ date: day.toISOString(), hours: hoursWorked });
          }
        }

        setPreviousMonthHours(totalHours);
        setPreviousMonthExtraWorkdays(extraDays);

        console.log(`Previous month's hours: ${totalHours}`);
        console.log(`Previous month's extra workdays: ${extraDays.map(day => day.date).join(', ')}`);
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to calculate previous month's hours",
          message: (error as Error).message
        });
      }
    };

    calculateHours();
    calculatePreviousMonthHours();
  }, []);

  return (
    <List>
      <List.Section title="Summary">
        <List.Item
          title="Hours Worked So Far"
          subtitle={currentHours.toString()}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Worked Hours"
                content={`Hours Worked So Far: ${currentHours}`}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Estimated Monthly Hours"
          subtitle={estimatedHours.toString()}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Estimated Hours"
                content={`Estimated Monthly Hours: ${estimatedHours}`}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Previous Month's Hours"
          subtitle={previousMonthHours.toString()}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Previous Month's Hours"
                content={`Previous Month's Hours: ${previousMonthHours}`}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Extra Workdays">
        {extraWorkdays.length > 0 ? (
          extraWorkdays.map(day => (
            <List.Item
              key={day.date}
              title={format(new Date(day.date), "iiii, dd MMMM yyyy")}
              subtitle={`${day.hours} hours`}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Workday Hours"
                    content={`${format(new Date(day.date), "iiii, dd MMMM yyyy")}: ${day.hours} hours`}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                </ActionPanel>
              }
            />
          ))
        ) : (
          <List.Item title="No extra workdays" />
        )}
      </List.Section>

      <List.Section title="Previous Month's Extra Workdays">
        {previousMonthExtraWorkdays.length > 0 ? (
          previousMonthExtraWorkdays.map(day => (
            <List.Item
              key={day.date}
              title={format(new Date(day.date), "iiii, dd MMMM yyyy")}
              subtitle={`${day.hours} hours`}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Workday Hours"
                    content={`${format(new Date(day.date), "iiii, dd MMMM yyyy")}: ${day.hours} hours`}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                </ActionPanel>
              }
            />
          ))
        ) : (
          <List.Item title="No extra workdays" />
        )}
      </List.Section>
    </List>
  );
}