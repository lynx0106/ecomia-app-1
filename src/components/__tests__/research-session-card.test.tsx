import React from 'react';
import { render } from '@testing-library/react';
import ResearchSessionCard from '../research/ResearchSessionCard';

// Mock the action modules
jest.mock('@/app/actions/product-candidates', () => ({
  listProductCandidates: jest.fn().mockResolvedValue({ candidates: [] }),
}));

jest.mock('@/app/actions/product-suppliers', () => ({
  listProductSuppliers: jest.fn().mockResolvedValue({ suppliers: [] }),
}));

jest.mock('@/app/actions/research-sessions', () => ({
  updateResearchSession: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/components/ui/ToastProvider', () => ({
  useToast: jest.fn(() => ({ toast: jest.fn() })),
}));

const mockSession = {
  id: 'session-1',
  goal: 'Vender productos de belleza',
  status: 'researching',
  notes: 'Mercado en crecimiento',
  selected_candidate_id: null,
  created_at: '2026-02-10T10:00:00Z',
  updated_at: '2026-02-10T10:00:00Z',
};

describe('ResearchSessionCard', () => {
  test('renders component without errors', () => {
    const { container } = render(<ResearchSessionCard session={mockSession} readOnly={true} />);
    expect(container).toBeTruthy();
  });

  test('renders in both readonly and editable modes', () => {
    const { rerender } = render(<ResearchSessionCard session={mockSession} readOnly={true} />);
    expect(document.body).toBeTruthy();
    
    rerender(<ResearchSessionCard session={mockSession} readOnly={false} />);
    expect(document.body).toBeTruthy();
  });
});
