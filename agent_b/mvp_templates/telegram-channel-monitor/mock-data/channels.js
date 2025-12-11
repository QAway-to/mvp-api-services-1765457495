export default [
  {
    id: 1,
    channel_id: '@example_channel',
    name: 'Example Channel',
    is_active: true,
    last_check_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    last_processed_message_id: 12345,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

