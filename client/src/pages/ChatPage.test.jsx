import { render, screen } from '@testing-library/react';
import ChatPage from './ChatPage.jsx';

jest.mock('../components/Chat/Chat.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="chat-component">Chat</div>,
}));

jest.mock('../components/Upload/Upload.jsx', () => ({
  __esModule: true,
  default: ({ onUploadSuccess }) => (
    <div data-testid="upload-component">
      <button onClick={() => onUploadSuccess({ documentId: 1 })}>Upload</button>
    </div>
  ),
}));

describe('ChatPage', () => {
  test('renders without crashing', () => {
    render(<ChatPage />);
    expect(screen.getByTestId('chat-page')).toBeInTheDocument();
  });

  test('contains Chat component', () => {
    render(<ChatPage />);
    expect(screen.getByTestId('chat-component')).toBeInTheDocument();
  });

  test('contains Upload component', () => {
    render(<ChatPage />);
    expect(screen.getByTestId('upload-component')).toBeInTheDocument();
  });
});
