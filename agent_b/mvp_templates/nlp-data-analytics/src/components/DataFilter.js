import { useState } from 'react';

const OPERATORS = {
  string: [
    { value: 'equals', label: 'Равно' },
    { value: 'notEquals', label: 'Не равно' },
    { value: 'contains', label: 'Содержит' },
    { value: 'notContains', label: 'Не содержит' },
    { value: 'startsWith', label: 'Начинается с' },
    { value: 'endsWith', label: 'Заканчивается на' },
    { value: 'isEmpty', label: 'Пусто' }
  ],
  number: [
    { value: 'equals', label: 'Равно' },
    { value: 'notEquals', label: 'Не равно' },
    { value: 'greater', label: 'Больше' },
    { value: 'greaterOrEqual', label: 'Больше или равно' },
    { value: 'less', label: 'Меньше' },
    { value: 'lessOrEqual', label: 'Меньше или равно' },
    { value: 'between', label: 'Между' },
    { value: 'isNull', label: 'Пусто' }
  ]
};

export default function DataFilter({ columns, columnTypes, onFilter, onClear }) {
  const [filters, setFilters] = useState([]);

  const addFilter = () => {
    setFilters([...filters, {
      id: Date.now(),
      column: columns[0] || '',
      operator: 'equals',
      value: '',
      logic: 'AND'
    }]);
  };

  const removeFilter = (id) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id, field, value) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const applyFilters = () => {
    if (filters.length === 0) {
      onClear();
      return;
    }
    onFilter(filters);
  };

  const getOperatorsForColumn = (column) => {
    const type = columnTypes[column] || 'string';
    return OPERATORS[type] || OPERATORS.string;
  };

  return (
    <div style={{
      padding: 0
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>Фильтрация данных</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={addFilter}
            style={{
              padding: '6px 12px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid #6366f1',
              borderRadius: 6,
              color: '#f8fafc',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
          >
            + Добавить фильтр
          </button>
          {filters.length > 0 && (
            <>
              <button
                onClick={applyFilters}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
              >
                ✓ Применить
              </button>
              <button
                onClick={() => {
                  setFilters([]);
                  onClear();
                }}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: 6,
                  color: '#f8fafc',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              >
                ✕ Очистить
              </button>
            </>
          )}
        </div>
      </div>

      {filters.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
          Нажмите "Добавить фильтр" для начала фильтрации данных
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filters.map((filter, idx) => {
            const operators = getOperatorsForColumn(filter.column);
            const needsValue = !['isEmpty', 'isNull'].includes(filter.operator);
            const isBetween = filter.operator === 'between';

            return (
              <div
                key={filter.id}
                style={{
                  padding: 10,
                  background: '#11162a',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                {idx > 0 && (
                  <select
                    value={filter.logic}
                    onChange={(e) => updateFilter(filter.id, 'logic', e.target.value)}
                    style={{
                      padding: '6px 10px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: '#f8fafc',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="AND">И</option>
                    <option value="OR">ИЛИ</option>
                  </select>
                )}

                <select
                  value={filter.column}
                  onChange={(e) => {
                    const newColumn = e.target.value;
                    const newOperators = getOperatorsForColumn(newColumn);
                    updateFilter(filter.id, 'column', newColumn);
                    if (!newOperators.find(op => op.value === filter.operator)) {
                      updateFilter(filter.id, 'operator', newOperators[0].value);
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    color: '#f8fafc',
                    fontSize: 12,
                    cursor: 'pointer',
                    minWidth: 120
                  }}
                >
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                  style={{
                    padding: '6px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    color: '#f8fafc',
                    fontSize: 12,
                    cursor: 'pointer',
                    minWidth: 140
                  }}
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                {needsValue && (
                  <>
                    {isBetween ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="От"
                          value={Array.isArray(filter.value) ? filter.value[0] : ''}
                          onChange={(e) => {
                            const current = Array.isArray(filter.value) ? filter.value : ['', ''];
                            updateFilter(filter.id, 'value', [e.target.value, current[1]]);
                          }}
                          style={{
                            padding: '6px 10px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 6,
                            color: '#f8fafc',
                            fontSize: 12,
                            width: 80
                          }}
                        />
                        <span style={{ color: '#94a3b8' }}>—</span>
                        <input
                          type="text"
                          placeholder="До"
                          value={Array.isArray(filter.value) ? filter.value[1] : ''}
                          onChange={(e) => {
                            const current = Array.isArray(filter.value) ? filter.value : ['', ''];
                            updateFilter(filter.id, 'value', [current[0], e.target.value]);
                          }}
                          style={{
                            padding: '6px 10px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 6,
                            color: '#f8fafc',
                            fontSize: 12,
                            width: 80
                          }}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Значение"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 6,
                          color: '#f8fafc',
                          fontSize: 12,
                          minWidth: 120
                        }}
                      />
                    )}
                  </>
                )}

                <button
                  onClick={() => removeFilter(filter.id)}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    borderRadius: 6,
                    color: '#f8fafc',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

