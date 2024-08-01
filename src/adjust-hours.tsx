import { useState } from 'react';
import { ActionPanel, Form, Action, LocalStorage, showToast, Toast } from '@raycast/api';

function getTodayDate(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of the day
  return now;
}

function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0]; // Ensure the time is set to midnight to avoid timezone issues
}

export default function Command() {
  const [date, setDate] = useState<Date | null>(getTodayDate());
  const [hours, setHours] = useState<string>('');

  const handleSubmit = async (values: { date: Date; hours: string }) => {
    const dateKey = formatDateString(values.date); // Normalize date
    const adjustedHours = parseFloat(values.hours);

    if (isNaN(adjustedHours)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid input",
        message: "Please enter a valid number of hours"
      });
      return;
    }

    await LocalStorage.setItem(`adjustedHours_${dateKey}`, adjustedHours);
    setDate(getTodayDate());
    setHours('');
    await showToast({
      style: Toast.Style.Success,
      title: "Hours Updated",
      message: `Hours for ${dateKey} set to ${adjustedHours} hours`
    });
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Adjust Hours" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.DatePicker
        id="date"
        title="Date"
        type={Form.DatePicker.Type.Date} // This ensures only the date component is shown
        value={date}
        onChange={(newDate) => {
          if (newDate) {
            newDate.setHours(0, 0, 0, 0); // Ensure the new date is normalized to start of the day
            setDate(newDate);
          }
        }}
      />
      <Form.TextField
        id="hours"
        title="Hours Worked"
        placeholder="Enter hours worked (e.g., 8)"
        value={hours}
        onChange={setHours}
      />
    </Form>
  );
}
