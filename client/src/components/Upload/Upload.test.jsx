import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Upload from './Upload';

// Mock api.js — Babel hoisting works in the client (uses babel-jest transform)
jest.mock('../../services/api.js', () => ({
  uploadDocument: jest.fn(),
}));

import { uploadDocument } from '../../services/api.js';

function makeFile(name, type, size = 1024) {
  const content = 'x'.repeat(size);
  return new File([content], name, { type });
}

function renderUpload(onUploadSuccess = jest.fn()) {
  return render(<Upload onUploadSuccess={onUploadSuccess} />);
}

beforeEach(() => {
  uploadDocument.mockReset();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Upload component', () => {
  test('renders upload zone', () => {
    renderUpload();
    expect(screen.getByTestId('upload-zone')).toBeInTheDocument();
  });

  test('renders browse files button', () => {
    renderUpload();
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  test('shows error for unsupported file type', async () => {
    renderUpload();
    const input = screen.getByTestId('file-input');
    const file = makeFile('virus.exe', 'application/octet-stream');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveTextContent(/not supported/i);
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('shows error for file larger than 10MB', async () => {
    renderUpload();
    const input = screen.getByTestId('file-input');
    const bigFile = makeFile('big.txt', 'text/plain', 11 * 1024 * 1024);

    await act(async () => {
      fireEvent.change(input, { target: { files: [bigFile] } });
    });

    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveTextContent(/10mb/i);
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('shows uploading state while request is in flight', async () => {
    // uploadDocument never resolves during this test
    uploadDocument.mockReturnValue(new Promise(() => {}));

    renderUpload();
    const input = screen.getByTestId('file-input');
    const file = makeFile('notes.txt', 'text/plain');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(screen.getByTestId('status-indicator')).toHaveTextContent(/uploading/i);
  });

  test('shows ready state after successful upload', async () => {
    uploadDocument.mockResolvedValue({
      documentId: 1,
      name: 'notes.txt',
      status: 'ready',
      chunkCount: 3,
      suggestions: ['Q1?', 'Q2?', 'Q3?'],
    });

    renderUpload();
    const input = screen.getByTestId('file-input');
    const file = makeFile('notes.txt', 'text/plain');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await Promise.resolve(); // flush microtasks
    });

    await waitFor(() => {
      expect(screen.getByTestId('status-indicator')).toHaveTextContent(/ready/i);
    });
  });

  test('shows error state when upload fails', async () => {
    uploadDocument.mockRejectedValue(new Error('Server error'));

    renderUpload();
    const input = screen.getByTestId('file-input');
    const file = makeFile('notes.txt', 'text/plain');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await Promise.resolve();
    });

    await waitFor(() => {
      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toBeInTheDocument();
    });

    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('retry button resets component to idle state', async () => {
    renderUpload();
    const input = screen.getByTestId('file-input');
    const file = makeFile('bad.exe', 'application/octet-stream');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    const retryBtn = screen.getByTestId('retry-button');
    await act(async () => {
      fireEvent.click(retryBtn);
    });

    // Back to idle — browse button visible, no retry button
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
  });

  test('calls onUploadSuccess with response data on successful upload', async () => {
    const mockResponse = {
      documentId: 42,
      name: 'report.txt',
      status: 'ready',
      chunkCount: 5,
      suggestions: ['A?', 'B?', 'C?'],
    };
    uploadDocument.mockResolvedValue(mockResponse);

    const onSuccess = jest.fn();
    render(<Upload onUploadSuccess={onSuccess} />);

    const input = screen.getByTestId('file-input');
    const file = makeFile('report.txt', 'text/plain');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });
  });
});
