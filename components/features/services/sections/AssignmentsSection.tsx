import React, { useState } from 'react';
import { Users, AlertCircle, Plus, X } from 'lucide-react';
import { getRoles } from '../../../../services/rolesData';

interface Assignment {
  roleId: string;
  person: string;
}

interface AssignmentsSectionProps {
  assignments: Assignment[];
  onChange: (assignments: Assignment[]) => void;
}

export const AssignmentsSection: React.FC<AssignmentsSectionProps> = ({
  assignments,
  onChange
}) => {
  const configuredRoles = getRoles();
  const [newRoleName, setNewRoleName] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  // Estado para inputs de añadir personas - un objeto con índice como key
  const [personInputs, setPersonInputs] = useState<{[key: number]: string}>({});

  const getMembers = () => {
    const saved = localStorage.getItem('serviceMembers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  };

  const members = getMembers();

  const addAssignment = (roleId?: string, person?: string) => {
    const newAssignment = {
      roleId: roleId || newRoleName.toLowerCase().replace(/\s+/g, '-'),
      person: person || ''
    };
    onChange([...assignments, newAssignment]);
    setNewRoleName('');
    setNewPersonName('');
  };

  const addQuickAssignment = () => {
    if (newRoleName.trim()) {
      const roleId = newRoleName.toLowerCase().replace(/\s+/g, '-');
      addAssignment(roleId, newPersonName.trim());
    }
  };

  const updateAssignment = (index: number, field: 'roleId' | 'person', value: string) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeAssignment = (index: number) => {
    onChange(assignments.filter((_, i) => i !== index));
  };

  // Añadir persona a una asignación existente
  const addPersonToAssignment = (index: number, newPerson: string) => {
    const assignment = assignments[index];
    const currentPeople = assignment.person ? assignment.person.split(',').map(p => p.trim()) : [];
    
    // Si newPerson contiene comas, separar
    const newPeople = newPerson.split(',').map(p => p.trim()).filter(p => p && !currentPeople.includes(p));
    
    if (newPeople.length > 0) {
      const updated = [...currentPeople, ...newPeople].join(', ');
      updateAssignment(index, 'person', updated);
      // Limpiar input
      setPersonInputs({...personInputs, [index]: ''});
    }
  };

  // Eliminar una persona específica de una asignación
  const removePersonFromAssignment = (index: number, personToRemove: string) => {
    const assignment = assignments[index];
    const currentPeople = assignment.person.split(',').map(p => p.trim());
    const updated = currentPeople.filter(p => p !== personToRemove).join(', ');
    updateAssignment(index, 'person', updated);
  };

  const allPeople = assignments.flatMap(a => 
    a.person ? a.person.split(',').map(p => p.trim()).filter(Boolean) : []
  );
  const duplicates = allPeople.filter((item, idx) => allPeople.indexOf(item) !== idx);
  const hasConflicts = duplicates.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Users size={20} />
          Asignaciones de Voluntarios
        </h3>
        {hasConflicts && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
            <AlertCircle size={16} />
            <span>Conflicto: persona asignada múltiples veces</span>
          </div>
        )}
      </div>

      {/* Añadir Nueva Asignación */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Plus size={16} />
          Añadir Nueva Asignación
        </h4>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Rol / Función
            </label>
            <input
              type="text"
              list="roles-list"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addQuickAssignment()}
              placeholder="Ej: Sonido, Ujier, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <datalist id="roles-list">
              {configuredRoles.map(role => (
                <option key={role.id} value={role.label} />
              ))}
            </datalist>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Persona(s) (Opcional)
            </label>
            <input
              type="text"
              list="members-list"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addQuickAssignment()}
              placeholder="Nombre o nombres separados por comas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <datalist id="members-list">
              {members.map((member: string) => (
                <option key={member} value={member} />
              ))}
            </datalist>
          </div>
        </div>

        <button
          onClick={addQuickAssignment}
          disabled={!newRoleName.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Añadir Asignación
        </button>
        
        <p className="text-xs text-gray-600 mt-2">
          💡 Puedes escribir múltiples nombres separados por comas (Ej: "Juan, María, Pedro")
        </p>
      </div>

      {/* Lista de Asignaciones Actuales */}
      {assignments.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <Users size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay asignaciones todavía.</p>
          <p className="text-xs">Usa el formulario arriba para añadir la primera asignación.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Asignaciones Actuales ({assignments.length})</h4>
          
          {assignments.map((assignment, index) => {
            const configuredRole = configuredRoles.find(r => r.id === assignment.roleId);
            const roleLabel = configuredRole?.label || assignment.roleId;
            const people = assignment.person ? assignment.person.split(',').map(p => p.trim()).filter(Boolean) : [];
            const inputValue = personInputs[index] || '';

            return (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
                    <input
                      type="text"
                      list="roles-list"
                      value={roleLabel}
                      onChange={(e) => {
                        const newRoleId = e.target.value.toLowerCase().replace(/\s+/g, '-');
                        updateAssignment(index, 'roleId', newRoleId);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                    />
                  </div>
                  <button
                    onClick={() => removeAssignment(index)}
                    className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Eliminar asignación completa"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Chips de personas asignadas */}
                {people.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Personas Asignadas:</label>
                    <div className="flex flex-wrap gap-2">
                      {people.map((person, pIdx) => {
                        const isDuplicate = duplicates.includes(person);
                        return (
                          <span
                            key={pIdx}
                            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${
                              isDuplicate 
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {person}
                            <button
                              onClick={() => removePersonFromAssignment(index, person)}
                              className="hover:bg-white/50 rounded-full p-0.5"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Añadir más personas */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Añadir persona(s):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      list="members-list"
                      value={inputValue}
                      onChange={(e) => setPersonInputs({...personInputs, [index]: e.target.value})}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && inputValue.trim()) {
                          addPersonToAssignment(index, inputValue);
                        }
                      }}
                      placeholder="Nombre o nombres separados por comas"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => {
                        if (inputValue.trim()) {
                          addPersonToAssignment(index, inputValue);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plantillas Rápidas (Roles Configurados) */}
      {configuredRoles.length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Plantillas Rápidas</h4>
          <div className="flex flex-wrap gap-2">
            {configuredRoles.map(role => {
              const count = assignments.filter(a => a.roleId === role.id).length;
              return (
                <button
                  key={role.id}
                  onClick={() => addAssignment(role.id)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  {role.label}
                  {count > 0 && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{count}</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Haz clic para añadir rápidamente desde los roles configurados
          </p>
        </div>
      )}
    </div>
  );
};
