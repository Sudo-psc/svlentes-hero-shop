import { SendPulseClient } from '../sendpulse';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SendPulseClient', () => {
  let client: SendPulseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SendPulseClient({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });
  });

  describe('Authentication', () => {
    it('should authenticate and cache token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: true,
          data: { message_id: '123', status: 'sent' },
        }),
      });

      await client.sendTextMessage('5511999999999', 'Test message');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      const authCall = mockFetch.mock.calls[0];
      expect(authCall[0]).toContain('/oauth/access_token');
      expect(JSON.parse(authCall[1].body)).toEqual({
        grant_type: 'client_credentials',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
      });
    });

    it('should reuse cached token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: true,
          data: { message_id: '123', status: 'sent' },
        }),
      });

      await client.sendTextMessage('5511999999999', 'Test 1');
      await client.sendTextMessage('5511999999999', 'Test 2');

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendTextMessage', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      });
    });

    it('should send text message successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: true,
          data: { message_id: '123', status: 'sent' },
        }),
      });

      const response = await client.sendTextMessage('5511999999999', 'Hello world');

      expect(response).toEqual({
        result: true,
        data: { message_id: '123', status: 'sent' },
      });

      const sendCall = mockFetch.mock.calls[1];
      expect(sendCall[0]).toContain('/whatsapp/messages/send');
      expect(sendCall[1].headers.Authorization).toBe('Bearer test-token');
      expect(JSON.parse(sendCall[1].body)).toEqual({
        phone: '5511999999999',
        message: {
          type: 'text',
          text: 'Hello world',
        },
      });
    });

    it('should handle send errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          result: false,
          error: { message: 'Invalid phone number', code: 400 },
        }),
      });

      await expect(
        client.sendTextMessage('invalid', 'Test')
      ).rejects.toThrow('Invalid phone number');
    });
  });

  describe('sendTemplateMessage', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      });
    });

    it('should send template message successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: true,
          data: { message_id: '456', status: 'sent' },
        }),
      });

      const response = await client.sendTemplateMessage(
        '5511999999999',
        'welcome_template',
        { name: 'John', plan: 'Premium' }
      );

      expect(response.result).toBe(true);

      const sendCall = mockFetch.mock.calls[1];
      expect(JSON.parse(sendCall[1].body)).toEqual({
        phone: '5511999999999',
        message: {
          type: 'template',
          template_id: 'welcome_template',
          template_variables: { name: 'John', plan: 'Premium' },
        },
      });
    });
  });

  describe('getContactInfo', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      });
    });

    it('should retrieve contact info', async () => {
      const mockContact = {
        phone: '5511999999999',
        name: 'John Doe',
        variables: { status: 'active' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockContact,
      });

      const contact = await client.getContactInfo('5511999999999');

      expect(contact).toEqual(mockContact);
    });

    it('should return null for non-existent contact', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      const contact = await client.getContactInfo('5511999999999');

      expect(contact).toBeNull();
    });
  });

  describe('createOrUpdateContact', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      });
    });

    it('should create or update contact', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: true }),
      });

      await client.createOrUpdateContact({
        phone: '5511999999999',
        name: 'Jane Doe',
        variables: { plan: 'Premium' },
      });

      const createCall = mockFetch.mock.calls[1];
      expect(createCall[0]).toContain('/whatsapp/contacts');
      expect(JSON.parse(createCall[1].body)).toEqual({
        phone: '5511999999999',
        name: 'Jane Doe',
        variables: { plan: 'Premium' },
      });
    });
  });
});
