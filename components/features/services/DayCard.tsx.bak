import React from 'react';
import { useDrop } from 'react-dnd';
import { getHolidayForDate } from '../../../services/holidaysData';
import { format, isToday } from 'date-fns';
import { ServiceProgram, ServiceTemplate } from '../../../types/services';

interface DayCardProps {
  day: Date;
  dayPrograms: ServiceProgram[];
  onDrop: (template: ServiceTemplate, date: Date) => void;
  onClick: () => void;
}

export const DayCard: React.FC<DayCardProps> = ({ day, dayPrograms, onDrop, onClick }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'SERVICE_TEMPLATE',
    drop: (item: ServiceTemplate) => {
      onDrop(item, day);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isCurrentDay = isToday(day);

  return (
    <button
      ref={drop}
      onClick={onClick}
      className={`aspect-square border-2 rounded-lg p-2 transition-all ${
        isOver && canDrop
          ? 'border-blue-600 bg-blue-100 scale-105'
          : isCurrentDay
          ? 'border-blue-600 bg-blue-50 hover:shadow-md'
          : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className={`text-sm font-bold mb-1 ${
          isCurrentDay ? 'text-blue-600' : 'text-gray-700'
        }`}>
          {format(day, 'd')}
        </div>
        
        {dayPrograms.length > 0 && (
          <div className="flex-1 flex flex-col gap-1 mt-1">
            {dayPrograms.slice(0, 2).map(program => (
              <div
                key={program.id}
                className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded truncate"
                title={program.title}
              >
                {program.time} {program.title}
              </div>
            ))}
            {dayPrograms.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{dayPrograms.length - 2} más
              </div>
            )}
          </div>
        )}

        {dayPrograms.length > 0 && (
          <div className="mt-auto pt-1">
            <span className="text-xs font-bold text-blue-600">
              {dayPrograms.length} servicio{dayPrograms.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};
