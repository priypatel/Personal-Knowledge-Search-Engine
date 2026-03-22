import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Suggestions from './Suggestions.jsx';

jest.mock('../../services/api.js', () => ({
  getSuggestions: jest.fn(),
}));

import { getSuggestions } from '../../services/api.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Suggestions', () => {
  test('renders nothing when no suggestions returned', async () => {
    getSuggestions.mockResolvedValue({ suggestions: [] });

    const { container } = render(
      <Suggestions documentId={1} onSuggestionClick={() => {}} />
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('renders suggestion pills for each suggestion', async () => {
    getSuggestions.mockResolvedValue({
      suggestions: [
        { id: 1, question: 'What is MERN?' },
        { id: 2, question: 'How does React work?' },
      ],
    });

    render(<Suggestions documentId={1} onSuggestionClick={() => {}} />);

    await waitFor(() => {
      const pills = screen.getAllByTestId('suggestion-pill');
      expect(pills).toHaveLength(2);
      expect(pills[0]).toHaveTextContent('What is MERN?');
      expect(pills[1]).toHaveTextContent('How does React work?');
    });
  });

  test('clicking a pill calls onSuggestionClick with question text', async () => {
    const onSuggestionClick = jest.fn();
    getSuggestions.mockResolvedValue({
      suggestions: [{ id: 1, question: 'What is MERN?' }],
    });

    render(<Suggestions documentId={1} onSuggestionClick={onSuggestionClick} />);

    await waitFor(() => screen.getByTestId('suggestion-pill'));
    fireEvent.click(screen.getByTestId('suggestion-pill'));

    expect(onSuggestionClick).toHaveBeenCalledWith('What is MERN?');
  });

  test('fetches from correct API endpoint with documentId', async () => {
    getSuggestions.mockResolvedValue({ suggestions: [] });

    render(<Suggestions documentId={42} onSuggestionClick={() => {}} />);

    await waitFor(() => {
      expect(getSuggestions).toHaveBeenCalledWith(42);
    });
  });

  test('renders nothing when documentId is not provided', () => {
    const { container } = render(
      <Suggestions onSuggestionClick={() => {}} />
    );
    expect(container.firstChild).toBeNull();
    expect(getSuggestions).not.toHaveBeenCalled();
  });
});
