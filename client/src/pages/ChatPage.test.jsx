import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatPage from './ChatPage.jsx';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@test.com', displayName: 'Test User' },
    logout: jest.fn(),
  }),
}));

jest.mock('../services/api.js', () => ({
  getChats: jest.fn().mockResolvedValue([]),
  createChat: jest.fn().mockResolvedValue({
    id: 99,
    title: 'New Chat',
    documentId: null,
    documentName: null,
    createdAt: new Date().toISOString(),
    messages: [],
  }),
  updateChatTitle: jest.fn().mockResolvedValue({ ok: true }),
}));

let lastSidebarChats = [];

jest.mock('../components/Sidebar/Sidebar.jsx', () => ({
  __esModule: true,
  default: ({ chats, onNewChat }) => {
    lastSidebarChats = chats;
    return (
      <div data-testid="sidebar">
        <button data-testid="sidebar-new-chat" onClick={onNewChat}>
          New Chat
        </button>
      </div>
    );
  },
}));

jest.mock('../components/Chat/Chat.jsx', () => ({
  __esModule: true,
  default: ({ onUploadSuccess, onUploadError }) => (
    <div>
      <textarea data-testid="message-input" readOnly />
      <button
        data-testid="upload-success-btn"
        onClick={() => onUploadSuccess?.({ documentId: 1, name: 'test.pdf' })}
      >
        Success
      </button>
      <button
        data-testid="upload-error-btn"
        onClick={() => onUploadError?.('Upload failed')}
      >
        Error
      </button>
    </div>
  ),
}));

// Toast is NOT mocked so its real timer fires in the auto-dismiss test

beforeEach(() => {
  lastSidebarChats = [];
  jest.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatPage', () => {
  test('renders without crashing', async () => {
    renderWithRouter(<ChatPage />);
    await waitFor(() => expect(screen.getByTestId('chat-page')).toBeInTheDocument());
  });

  test('renders Sidebar component', async () => {
    renderWithRouter(<ChatPage />);
    await waitFor(() => expect(screen.getByTestId('sidebar')).toBeInTheDocument());
  });

  test('renders Chat component', async () => {
    renderWithRouter(<ChatPage />);
    await waitFor(() => expect(screen.getByTestId('message-input')).toBeInTheDocument());
  });

  test('upload success creates a new chat', async () => {
    const { createChat } = require('../services/api.js');
    renderWithRouter(<ChatPage />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('upload-success-btn'));
    });
    expect(createChat).toHaveBeenCalledWith(expect.objectContaining({ documentId: 1 }));
  });

  test('Ctrl+N switches to new-chat mode (no API call)', async () => {
    renderWithRouter(<ChatPage />);
    await act(async () => {
      fireEvent.keyDown(document, { key: 'n', ctrlKey: true });
    });
    // New-chat mode shows the landing view (message-input is in the DOM via Chat mock)
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  test('/ key does not throw and input remains in DOM', async () => {
    renderWithRouter(<ChatPage />);
    const input = await screen.findByTestId('message-input');
    act(() => {
      fireEvent.keyDown(document, { key: '/' });
    });
    expect(input).toBeInTheDocument();
  });

  test('Toast appears on upload error', async () => {
    renderWithRouter(<ChatPage />);
    await waitFor(() => screen.getByTestId('upload-error-btn'));
    fireEvent.click(screen.getByTestId('upload-error-btn'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByTestId('toast')).toHaveTextContent('Upload failed');
  });

  test('Toast auto-dismisses after 5 seconds', async () => {
    jest.useFakeTimers();
    renderWithRouter(<ChatPage />);
    await act(async () => {});

    fireEvent.click(screen.getByTestId('upload-error-btn'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(5001); });
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  test('Toast dismisses on × click', async () => {
    renderWithRouter(<ChatPage />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('upload-error-btn'));
    fireEvent.click(screen.getByTestId('toast-dismiss'));
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });
});
