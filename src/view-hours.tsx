import { List, LocalStorage, Toast, showToast, ActionPanel, Action } from '@raycast/api';
import { useEffect, useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSaturday, isSunday } from 'date-fns';

const DEFAULT_HOURS = 8;

function getMonthDates() {
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);

  return eachDayOfInterval({ start, end });
}

async function getAdjustedHours(date: string) {
  const adjustedHours = await LocalStorage.getItem<number>(`adjustedHours_${date}`);
  return adjustedHours;
}

export default function ViewHours() {
  const [currentHours, setCurrentHours] = useState<number>(0);
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [extraWorkdays, setExtraWorkdays] = useState<{ date: string; hours: number }[]>([]);

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

    calculateHours();
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
    </List>
  );
}

