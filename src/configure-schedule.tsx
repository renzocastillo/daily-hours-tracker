import { useState, useEffect } from 'react';
import { ActionPanel, Form, Action, LocalStorage, showToast, Toast } from '@raycast/api';

const DEFAULT_HOURS = 8;

export default function Command() {
  const [hours, setHours] = useState<number>(DEFAULT_HOURS);

  useEffect(() => {
    const loadHours = async () => {
      try {
        const storedHours = await LocalStorage.getItem<number>('defaultHours');
        setHours(storedHours ?? DEFAULT_HOURS);
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to load hours",
          message: (error as Error).message
        });
      }
    };

    loadHours();
  }, []);

  const handleSubmit = async (values: { hours: string }) => {
    const newHours = parseInt(values.hours, 10);
    if (isNaN(newHours) || newHours <= 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid input",
        message: "Please enter a valid number of hours"
      });
      return;
    }
    await LocalStorage.setItem('defaultHours', newHours);
    setHours(newHours);
    await showToast({
      style: Toast.Style.Success,
      title: "Default hours updated",
      message: `Default work hours set to ${newHours} hours`
    });
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Set Default Hours" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="hours"
        title="Default Work Hours"
        defaultValue={hours.toString()}
        placeholder="Enter default work hours (e.g., 8)"
      />
    </Form>
  );
}
