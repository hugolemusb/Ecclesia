import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { getRoles, saveRoles, DEFAULT_ROLES } from '../../../services/rolesData';

export const ServicesSettings: React.FC = () => {
  const [roles, setRoles] = useState(getRoles());
  const [members, setMembers] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [newRole, setNewRole] = useState({ label: '', allowMultiple: false });
  const [newMember, setNewMember] = useState('');
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    const savedMembers = localStorage.getItem('serviceMembers');
    if (savedMembers) {
      try {
        setMembers(JSON.parse(savedMembers));
      } catch {}
    }

    const savedOptions = localStorage.getItem('serviceOptions');
    if (savedOptions) {
      try {
        setOptions(JSON.parse(savedOptions));
      } catch {}
    }
  }, []);

  const addRole = () => {
    if (newRole.label.trim()) {
      const role = {
        id: newRole.label.toLowerCase().replace(/\s+/g, '-'),
        label: newRole.label,
        allowMultiple: newRole.allowMultiple
      };
      const updated = [...roles, role];
      setRoles(updated);
      saveRoles(updated);
      setNewRole({ label: '', allowMultiple: false });
    }
  };

  const removeRole = (id: string) => {
    if (confirm('¿Eliminar este rol?')) {
      const updated = roles.filter(r => r.id !== id);
      setRoles(updated);
      saveRoles(updated);
    }
  };

  const resetRoles = () => {
    if (confirm('¿Restaurar roles predeterminados?')) {
      setRoles(DEFAULT_ROLES);
      saveRoles(DEFAULT_ROLES);
    }
  };

  const addMember = () => {
    if (newMember.trim() && !members.includes(newMember.trim())) {
      const updated = [...members, newMember.trim()].sort();
      setMembers(updated);
      localStorage.setItem('serviceMembers', JSON.stringify(updated));
      setNewMember('');
    }
  };

  const removeMember = (name: string) => {
    if (confirm(`¿Eliminar a ${name}?`)) {
      const updated = members.filter(m => m !== name);
      setMembers(updated);
      localStorage.setItem('serviceMembers', JSON.stringify(updated));
    }
  };

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      const updated = [...options, newOption.trim()].sort();
      setOptions(updated);
      localStorage.setItem('serviceOptions', JSON.stringify(updated));
      setNewOption('');
    }
  };

  const removeOption = (name: string) => {
    if (confirm(`¿Eliminar "${name}"?`)) {
      const updated = options.filter(o => o !== name);
      setOptions(updated);
      localStorage.setItem('serviceOptions', JSON.stringify(updated));
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de Gestión de Servicios</h2>
      </div>

      {/* Roles Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Roles de Asignación</h3>
          <button
            onClick={resetRoles}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Restaurar Predeterminados
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <input
                type="text"
                value={newRole.label}
                onChange={(e) => setNewRole({...newRole, label: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && addRole()}
                placeholder="Nombre del rol (ej: Bienvenida)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRole.allowMultiple}
                  onChange={(e) => setNewRole({...newRole, allowMultiple: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Permitir múltiples</span>
              </label>
              <button
                onClick={addRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                Añadir
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {roles.map(role => (
            <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-semibold text-gray-800">{role.label}</span>
                <span className="text-sm text-gray-500 ml-3">
                  {role.allowMultiple ? '(Múltiple)' : '(Individual)'}
                </span>
              </div>
              <button
                onClick={() => removeRole(role.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Members Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Lista de Miembros (Ministros/Líderes)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Estos nombres aparecen en dropdown de Ministros en pestaña General y Liturgia
        </p>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMember()}
            placeholder="Nombre completo del miembro"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={addMember}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Añadir
          </button>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-8">
            No hay miembros en la lista.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {members.map(member => (
              <div
                key={member}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <span className="text-sm truncate">{member}</span>
                <button
                  onClick={() => removeMember(member)}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-600 mt-4">
          Total: <strong>{members.length}</strong> miembros
        </p>
      </div>

      {/* Options Section - NEW */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Lista de Opciones (Asignaciones)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Nombres disponibles en dropdowns de Asignaciones (Sonido, Multimedia, etc.)
        </p>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addOption()}
            placeholder="Nombre de persona disponible para asignaciones"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={addOption}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Añadir
          </button>
        </div>

        {options.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-8">
            No hay opciones configuradas.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {options.map(option => (
              <div
                key={option}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <span className="text-sm truncate">{option}</span>
                <button
                  onClick={() => removeOption(option)}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-600 mt-4">
          Total: <strong>{options.length}</strong> opciones disponibles
        </p>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          ✅ Los cambios se guardan automáticamente y estarán disponibles al crear/editar servicios.
        </p>
      </div>
    </div>
  );
};
