import React, { useState, useMemo } from 'react';
import { Calendar, User, FileText, Download, Copy, Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ServiceProgram } from '../../../../types/services';
import { generatePDF } from '../exports/PDFExporter';

interface ServicesHistoryProps {
  programs: ServiceProgram[];
  onViewProgram: (program: ServiceProgram) => void;
  onDuplicateProgram: (program: ServiceProgram) => void;
}

export const ServicesHistory: React.FC<ServicesHistoryProps> = ({
  programs,
  onViewProgram,
  onDuplicateProgram
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const filteredPrograms = useMemo(() => {
    let filtered = programs;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.minister && p.minister.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortOrder === 'asc' ? diff : -diff;
      } else {
        const diff = a.title.localeCompare(b.title);
        return sortOrder === 'asc' ? diff : -diff;
      }
    });

    return filtered;
  }, [programs, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const handleDownloadPDF = async (program: ServiceProgram) => {
    const tempDiv = document.createElement('div');
    document.body.appendChild(tempDiv);
    tempDiv.innerHTML = `<div style="padding:20px;"><h1>${program.title}</h1><p>Fecha: ${format(program.date, "dd/MM/yyyy")}</p></div>`;
    await generatePDF(program, tempDiv);
    document.body.removeChild(tempDiv);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Histórico de Servicios</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Todos los tipos</option>
            <option value="culto-dominical-am">Culto Dominical AM</option>
            <option value="culto-dominical-pm">Culto Dominical PM</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as 'date' | 'title');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="date-desc">Más recientes</option>
            <option value="date-asc">Más antiguos</option>
            <option value="title-asc">Título A-Z</option>
            <option value="title-desc">Título Z-A</option>
          </select>
        </div>

        <p className="mt-3 text-sm text-gray-600">
          {filteredPrograms.length} de {programs.length} servicios
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredPrograms.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <FileText size={48} className="opacity-50" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Título</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Ministro</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrograms.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Calendar size={16} className="inline mr-2" />
                    {format(program.date, "dd MMM yyyy", { locale: es })} {program.time}
                  </td>
                  <td className="px-6 py-4 font-medium">{program.title}</td>
                  <td className="px-6 py-4">
                    <User size={14} className="inline mr-2" />
                    {program.minister || <span className="italic text-gray-400">Sin asignar</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[program.status]}`}>
                      {statusLabels[program.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onViewProgram(program)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Ver">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onDuplicateProgram(program)} className="p-2 text-green-600 hover:bg-green-50 rounded ml-2" title="Duplicar">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleDownloadPDF(program)} className="p-2 text-purple-600 hover:bg-purple-50 rounded ml-2" title="PDF">
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
