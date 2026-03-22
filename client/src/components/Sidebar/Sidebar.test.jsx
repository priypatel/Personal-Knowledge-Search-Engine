import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar.jsx';

jest.mock('lucide-react', () => ({
  Plus: () => <svg data-testid="plus-icon" />,
  LogOut: () => <svg data-testid="logout-icon" />,
}));

jest.mock('../shared/Badge.jsx', () => ({
  __esModule: true,
  default: ({ type, children }) => (
    <span data-testid="file-badge" data-type={type}>{children}</span>
  ),
}));

const mockOnChatSelect = jest.fn();
const mockOnNewChat = jest.fn();

const todayIso = new Date().toISOString();

const sampleChats = [
  {
    id: '1',
    title: 'First Chat',
    createdAt: todayIso,
    documentId: null,
    documentName: null,
    messages: [],
  },
  {
    id: '2',
    title: 'Second Chat',
    createdAt: todayIso,
    documentId: 1,
    documentName: 'report.pdf',
    messages: [],
  },
];

const sampleDocuments = [
  { id: 1, name: 'report.pdf',  fileType: 'pdf' },
  { id: 2, name: 'notes.txt',   fileType: 'txt' },
  { id: 3, name: 'manual.docx', fileType: 'docx' },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Sidebar', () => {
  test('shows empty chats message when no chats', () => {
    render(
      <Sidebar
        chats={[]}
        documents={[]}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );
    expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
  });

  test('shows empty documents message when no documents', () => {
    render(
      <Sidebar
        chats={[]}
        documents={[]}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );
    expect(screen.getByText(/No documents uploaded yet/i)).toBeInTheDocument();
  });

  test('renders chat items in correct date group (TODAY)', () => {
    render(
      <Sidebar
        chats={sampleChats}
        documents={[]}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );
    expect(screen.getByTestId('date-group-label')).toHaveTextContent('TODAY');
    const items = screen.getAllByTestId('chat-history-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('First Chat');
    expect(items[1]).toHaveTextContent('Second Chat');
  });

  test('active chat item has data-active=true, others do not', () => {
    render(
      <Sidebar
        chats={sampleChats}
        activeChat={sampleChats[0]}
        documents={[]}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );
    const items = screen.getAllByTestId('chat-history-item');
    expect(items[0]).toHaveAttribute('data-active', 'true');
    expect(items[1]).toHaveAttribute('data-active', 'false');
  });

  test('clicking chat item calls onChatSelect with that chat', () => {
    render(
      <Sidebar
        chats={sampleChats}
        documents={[]}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );
    fireEvent.click(screen.getAllByTestId('chat-history-item')[0]);
    expect(mockOnChatSelect).toHaveBeenCalledWith(sampleChats[0]);
  });

  test('clicking new chat button calls onNewChat', () => {
    render(
      <Sidebar
        chats={[]}
        documents={[]}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );
    fireEvent.click(screen.getByTestId('new-chat-button'));
    expect(mockOnNewChat).toHaveBeenCalledTimes(1);
  });

  test('document items render with correct file type badge', () => {
    render(
      <Sidebar
        chats={[]}
        documents={sampleDocuments}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );
    const items = screen.getAllByTestId('document-list-item');
    expect(items).toHaveLength(3);

    const badges = screen.getAllByTestId('file-badge');
    expect(badges[0]).toHaveTextContent('PDF');
    expect(badges[1]).toHaveTextContent('TXT');
    expect(badges[2]).toHaveTextContent('DOCX');
  });

  test('renders user profile and logout button when user provided', () => {
    const mockLogout = jest.fn();
    render(
      <Sidebar
        chats={[]}
        documents={[]}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        user={{ id: 1, displayName: 'Priy Patel', email: 'priy@test.com' }}
        onLogout={mockLogout}
      />
    );
    expect(screen.getByText('Priy Patel')).toBeInTheDocument();
    expect(screen.getByText('priy@test.com')).toBeInTheDocument();
    // Opens confirmation dialog
    fireEvent.click(screen.getByTestId('logout-button'));
    expect(screen.getByTestId('logout-confirm-overlay')).toBeInTheDocument();
    // Confirming calls onLogout
    fireEvent.click(screen.getByTestId('logout-confirm'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('returns null when isOpen is false', () => {
    render(
      <Sidebar
        chats={sampleChats}
        documents={sampleDocuments}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={false}
      />
    );
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });
});
