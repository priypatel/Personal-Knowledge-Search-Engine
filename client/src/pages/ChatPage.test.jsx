import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatPage from './ChatPage.jsx';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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
  localStorage.clear();
  lastSidebarChats = [];
  jest.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatPage', () => {
  test('renders without crashing', () => {
    render(<ChatPage />);
    expect(screen.getByTestId('chat-page')).toBeInTheDocument();
  });

  test('renders Sidebar component', () => {
    render(<ChatPage />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  test('renders Chat component', () => {
    render(<ChatPage />);
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  test('upload success creates a new chat', () => {
    render(<ChatPage />);
    fireEvent.click(screen.getByTestId('upload-success-btn'));
    expect(lastSidebarChats.length).toBeGreaterThan(0);
    expect(lastSidebarChats[0].documentId).toBe(1);
  });

  test('Ctrl+N triggers new chat creation', () => {
    render(<ChatPage />);
    act(() => {
      fireEvent.keyDown(document, { key: 'n', ctrlKey: true });
    });
    expect(lastSidebarChats.length).toBeGreaterThan(0);
    expect(lastSidebarChats[0].title).toBe('New Chat');
  });

  test('/ key does not throw and input remains in DOM', () => {
    render(<ChatPage />);
    const input = screen.getByTestId('message-input');
    act(() => {
      fireEvent.keyDown(document, { key: '/' });
    });
    expect(input).toBeInTheDocument();
  });

  test('Toast appears on upload error', () => {
    render(<ChatPage />);
    fireEvent.click(screen.getByTestId('upload-error-btn'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByTestId('toast')).toHaveTextContent('Upload failed');
  });

  test('Toast auto-dismisses after 5 seconds', () => {
    jest.useFakeTimers();
    render(<ChatPage />);

    fireEvent.click(screen.getByTestId('upload-error-btn'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5001);
    });

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  test('Toast dismisses on × click', () => {
    render(<ChatPage />);
    fireEvent.click(screen.getByTestId('upload-error-btn'));
    fireEvent.click(screen.getByTestId('toast-dismiss'));
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });
});
