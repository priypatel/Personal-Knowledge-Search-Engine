import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Chat from './Chat.jsx';

jest.mock('../../services/api.js', () => ({
  sendChat: jest.fn(),
  getSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
}));

jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  SendHorizontal: () => <svg data-testid="send-icon" />,
}));

import { sendChat } from '../../services/api.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Chat', () => {
  test('renders landing view when no messages', () => {
    render(<Chat />);
    expect(screen.getByTestId('landing-view')).toBeInTheDocument();
  });

  test('renders search bar (message-input textarea)', () => {
    render(<Chat />);
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  test('typing in input updates its value', () => {
    render(<Chat />);
    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input.value).toBe('Hello');
  });

  test('pressing Enter calls sendChat API', async () => {
    sendChat.mockResolvedValue({ answer: 'Test answer', sources: [] });

    render(<Chat />);
    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'What is MERN?' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith('What is MERN?', null);
    });
  });

  test('user message appears immediately before API responds', async () => {
    let resolveChat;
    sendChat.mockReturnValue(new Promise((res) => { resolveChat = res; }));

    render(<Chat />);
    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'My question' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(screen.getByTestId('user-message')).toHaveTextContent('My question');

    await act(async () => {
      resolveChat({ answer: 'Done', sources: [] });
    });
  });

  test('search status is shown while loading', async () => {
    let resolveChat;
    sendChat.mockReturnValue(new Promise((res) => { resolveChat = res; }));

    render(<Chat />);
    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'Something' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(screen.getByTestId('search-status')).toBeInTheDocument();

    await act(async () => {
      resolveChat({ answer: 'Done', sources: [] });
    });
  });

  test('AI response renders after API resolves', async () => {
    sendChat.mockResolvedValue({ answer: 'MERN stands for MongoDB, Express, React, Node.', sources: [] });

    render(<Chat />);
    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'What is MERN?' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(screen.getByTestId('ai-response')).toHaveTextContent('MERN stands for');
    });
  });

  test('citation pills render with document names', async () => {
    sendChat.mockResolvedValue({
      answer: 'The answer.',
      sources: [
        { chunkId: 1, documentId: 1, documentName: 'notes.pdf', content: 'text', similarity: 0.9 },
      ],
    });

    render(<Chat />);
    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'Tell me' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      const pills = screen.getAllByTestId('citation-pill');
      expect(pills[0]).toHaveTextContent('notes.pdf');
    });
  });

  test('send button is disabled when input is empty', () => {
    render(<Chat />);
    const btn = screen.getByTestId('send-button');
    expect(btn).toBeDisabled();
  });
});
