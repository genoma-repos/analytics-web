import type { JSX, MouseEventHandler, ReactNode } from 'react';

type FilterButtonProps = {
  children: ReactNode;
  active: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export const FilterButton = ({ children, active, onClick }: FilterButtonProps): JSX.Element => (
  <button onClick={onClick} className={`ui-filter-button ${active ? 'ui-filter-button-active' : ''}`}>
    {children}
  </button>
);
