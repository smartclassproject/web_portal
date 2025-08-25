declare module 'react-big-calendar' {
  import { ComponentType } from 'react';

  export interface Event {
    id: string | number;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
  }

  export interface CalendarProps {
    localizer: any;
    events: Event[];
    startAccessor: string | ((event: Event) => Date);
    endAccessor: string | ((event: Event) => Date);
    style?: React.CSSProperties;
    onSelectEvent?: (event: Event) => void;
    onSelectSlot?: (slotInfo: any) => void;
    selectable?: boolean;
    views?: string[];
    defaultView?: string;
    step?: number;
    timeslots?: number;
    min?: Date;
    max?: Date;
    eventPropGetter?: (event: Event) => { style?: React.CSSProperties };
    slotPropGetter?: (date: Date) => { style?: React.CSSProperties };
  }

  export const Calendar: ComponentType<CalendarProps>;
  export const dateFnsLocalizer: (config: any) => any;
}
