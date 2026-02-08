import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionCard, InfoListCard } from './section-card';

describe('SectionCard', () => {
  it('renders with title only', () => {
    render(<SectionCard title="Test Title">Content</SectionCard>);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with title and description', () => {
    render(
      <SectionCard title="Test Title" description="Test Description">
        Content
      </SectionCard>,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<SectionCard title="Test Title">Content</SectionCard>);

    expect(screen.queryByRole('paragraph', { hidden: true })).not.toBeInTheDocument();
  });

  it('applies custom className to Card', () => {
    render(
      <SectionCard title="Test Title" className="custom-class">
        Content
      </SectionCard>,
    );

    const titleElement = screen.getByText('Test Title');
    const card = titleElement.closest('[class*="custom-class"]');
    expect(card).toHaveClass('custom-class');
  });

  it('renders children correctly', () => {
    render(
      <SectionCard title="Test Title">
        <div data-testid="child-element">Child Content</div>
      </SectionCard>,
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('applies pt-6 spacing to CardContent', () => {
    render(
      <SectionCard title="Test Title">
        <div data-testid="content">Content</div>
      </SectionCard>,
    );

    // Check that content area has the pt-6 class
    const content = screen.getByTestId('content');
    const cardContent = content.parentElement;
    expect(cardContent?.className).toContain('pt-6');
  });
});

describe('InfoListCard', () => {
  const items = ['Item 1', 'Item 2', 'Item 3'];

  it('renders unordered list by default', () => {
    render(<InfoListCard title="Test List" items={items} />);

    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();

    const listElement = screen.getByRole('list');
    expect(listElement.tagName).toBe('UL');

    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('renders ordered list when ordered=true', () => {
    render(<InfoListCard title="Test List" items={items} ordered={true} />);

    const listElement = screen.getByRole('list');
    expect(listElement.tagName).toBe('OL');
  });

  it('renders with description', () => {
    render(<InfoListCard title="Test List" description="List description" items={items} />);

    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.getByText('List description')).toBeInTheDocument();
  });

  it('applies correct list classes for unordered list', () => {
    render(<InfoListCard title="Test List" items={items} />);

    const listElement = screen.getByRole('list');
    expect(listElement).toHaveClass('list-disc');
    expect(listElement).toHaveClass('list-inside');
    expect(listElement).toHaveClass('space-y-2');
    expect(listElement).toHaveClass('text-sm');
    expect(listElement).toHaveClass('text-muted-foreground');
  });

  it('applies correct list classes for ordered list', () => {
    render(<InfoListCard title="Test List" items={items} ordered={true} />);

    const listElement = screen.getByRole('list');
    expect(listElement).toHaveClass('list-decimal');
    expect(listElement).toHaveClass('list-inside');
    expect(listElement).toHaveClass('space-y-2');
  });

  it('renders all list items', () => {
    render(<InfoListCard title="Test List" items={items} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);

    listItems.forEach((item, index) => {
      expect(item).toHaveTextContent(items[index]);
    });
  });

  it('handles empty items array', () => {
    render(<InfoListCard title="Empty List" items={[]} />);

    expect(screen.getByText('Empty List')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('applies custom className', () => {
    render(<InfoListCard title="Test List" items={items} className="custom-list-class" />);

    const titleElement = screen.getByText('Test List');
    const card = titleElement.closest('[class*="custom-list-class"]');
    expect(card).toHaveClass('custom-list-class');
  });

  it('renders items with special characters', () => {
    const specialItems = ['Item with "quotes"', "Item with 'apostrophes'", 'Item with <brackets>'];

    render(<InfoListCard title="Special Items" items={specialItems} />);

    specialItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('uses SectionCard as base component', () => {
    render(<InfoListCard title="Test List" items={items} />);

    // Verify it has the structure of a SectionCard (CardHeader with CardTitle)
    expect(screen.getByText('Test List')).toBeInTheDocument();

    // Verify CardContent has pt-6 from SectionCard
    const listElement = screen.getByRole('list');
    const contentDiv = listElement.parentElement;
    expect(contentDiv).toHaveClass('pt-6');
  });

  it('handles long item text', () => {
    const longItems = ['This is a very long item text that should still render correctly without any issues'];

    render(<InfoListCard title="Long Items" items={longItems} />);

    expect(screen.getByText(longItems[0])).toBeInTheDocument();
  });

  it('maintains item order', () => {
    const orderedItems = ['First', 'Second', 'Third', 'Fourth'];

    render(<InfoListCard title="Ordered Items" items={orderedItems} ordered={true} />);

    const listItems = screen.getAllByRole('listitem');
    orderedItems.forEach((item, index) => {
      expect(listItems[index]).toHaveTextContent(item);
    });
  });
});
