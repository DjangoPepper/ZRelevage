import React, { useState, useRef } from 'react';
import { parseExcel, parseSheet } from '../utils/excelParser';

const TableManager: React.FC = () => {
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]); // Nouveaux en-têtes
    const [error, setError] = useState<string | null>(null);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]); // Colonnes masquées

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const { sheetNames } = await parseExcel(file);
            setSheetNames(sheetNames);
            setData([]);
            setError(null);
        } catch (err) {
            setError('Erreur lors de l\'importation du fichier Excel.');
            console.error(err);
        }
    };

    const handleSheetSelect = async (sheetName: string) => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        try {
            const sheetData = await parseSheet(file, sheetName);
            setData(sheetData);
            setHeaders(Object.keys(sheetData[0])); // Récupère les en-têtes
            setHiddenColumns([]); // Réinitialise les colonnes masquées
            setError(null);
        } catch (err) {
            setError(`Erreur lors du chargement de la feuille "${sheetName}".`);
            console.error(err);
        }
    };

    const handleHeaderAction = (action: string, headerName?: string, newHeaderName?: string) => {
        switch (action) {
            case 'hidde':
                if (headerName) {
                    setHiddenColumns((prevHiddenColumns) =>
                        prevHiddenColumns.includes(headerName)
                            ? prevHiddenColumns.filter((col) => col !== headerName) // Unhide column
                            : [...prevHiddenColumns, headerName] // Hide column
                    );
                }
                break;
            case 'modify':
                setHeaders((prevHeaders) =>
                    prevHeaders.map((header) => (header === headerName && newHeaderName ? newHeaderName : header))
                );
                setData((prevData) =>
                    prevData.map((row) => {
                        if (headerName && newHeaderName) {
                            const { [headerName]: value, ...rest } = row; // Destructure to remove the old header
                            return { ...rest, [newHeaderName]: value }; // Add the new header with the value
                        }
                        return row; // Return the row unchanged if headerName or newHeaderName is undefined
                    })
                );
                break;
            case 'add':
                if (newHeaderName) {
                    setHeaders((prevHeaders) => [...prevHeaders, newHeaderName]);
                    setData((prevData) =>
                        prevData.map((row) => ({ ...row, [newHeaderName]: '' }))
                    );
                }
                break;
            default:
                break;
        }
    };

    const handleMoveColumn = (headerName: string, direction: 'left' | 'right') => {
        setHeaders((prevHeaders) => {
            const index = prevHeaders.indexOf(headerName);
            if (index === -1) return prevHeaders;

            const newHeaders = [...prevHeaders];
            const targetIndex = direction === 'left' ? index - 1 : index + 1;

            if (targetIndex >= 0 && targetIndex < newHeaders.length) {
                // Swap the columns
                [newHeaders[index], newHeaders[targetIndex]] = [newHeaders[targetIndex], newHeaders[index]];
            }
            return newHeaders;
        });

        setData((prevData) =>
            prevData.map((row) => {
                const newRow: Record<string, any> = {};
                const keys = Object.keys(row);

                const reorderedKeys = [...keys];
                const index = reorderedKeys.indexOf(headerName);
                const targetIndex = direction === 'left' ? index - 1 : index + 1;

                if (index !== -1 && targetIndex >= 0 && targetIndex < reorderedKeys.length) {
                    // Swap the keys
                    [reorderedKeys[index], reorderedKeys[targetIndex]] = [reorderedKeys[targetIndex], reorderedKeys[index]];
                }

                reorderedKeys.forEach((key) => {
                    newRow[key] = row[key];
                });

                return newRow;
            })
        );
    };

    const handleAddColumn = (clickedHeader: string) => {
        setHeaders((prevHeaders) => {
            const index = prevHeaders.indexOf(clickedHeader);
            if (index === -1) return prevHeaders;

            const newHeaders = [...prevHeaders];
            newHeaders.splice(index, 0, `New Column ${index}`);
            return newHeaders;
        });

        setData((prevData) =>
            prevData.map((row) => {
                const newRow: Record<string, any> = {};
                const keys = Object.keys(row);
                keys.forEach((key, idx) => {
                    if (idx === keys.indexOf(clickedHeader)) {
                        newRow[`New Column ${idx}`] = 0; // Default value
                    }
                    newRow[key] = row[key];
                });
                return newRow;
            })
        );
    };

    const renderHeaderActions = () => (
        <div style={{ marginTop: '20px' }}>
            <h3>Actions sur les en-têtes :</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => {
                                const newHeaderName = prompt('Nom du nouvel en-tête :');
                                if (newHeaderName) handleHeaderAction('add', undefined, newHeaderName);
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: 'green',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            ADdz
                        </button>
                {headers.map((header) => (
                    
                    <div key={header} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {/* <button
                            onClick={() => {
                                const newHeaderName = prompt('Nom du nouvel en-tête :');
                                if (newHeaderName) handleHeaderAction('add', undefined, newHeaderName);
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: 'green',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            ADdz
                        </button> */}
                        <button
                            onClick={() => {
                                const newHeaderName = prompt(`Modifier l'en-tête "${header}" :`, header);
                                if (newHeaderName) handleHeaderAction('modify', header, newHeaderName);
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#007BFF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            MOd
                        </button>
                        <button
                            onClick={() => handleHeaderAction('hidde', header)}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: hiddenColumns.includes(header) ? '#d3d3d3' : '#FF5733',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            {hiddenColumns.includes(header) ? 'View' : 'Hidd'}
                        </button>
                        {/* <button
                            onClick={() => handleMoveColumn(header, 'left')}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#007BFF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                            disabled={headers.indexOf(header) === 0} // Disable if it's the first column
                        >
                            ←
                        </button>
                        <button
                            onClick={() => handleMoveColumn(header, 'right')}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#007BFF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                            disabled={headers.indexOf(header) === headers.length - 1} // Disable if it's the last column
                        >
                            →
                        </button> */}
                        <span>{header}</span>
                    </div>
                ))}
                <button
                    onClick={() => {
                        const newHeaderName = prompt('Nom du nouvel en-tête :');
                        if (newHeaderName) handleHeaderAction('add', undefined, newHeaderName);
                    }}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: 'green',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    ADd
                </button>
            </div>
        </div>
    );

    const renderTableHeaders = () => {
        return headers
            .filter((header) => !hiddenColumns.includes(header))
            .map((header) => (
                <th key={header}>
                    {header}
                    <button onClick={() => {
                            const newHeaderName = prompt(`Modifier l'en-tête "${header}" :`, header);
                            if (newHeaderName) handleHeaderAction('modify', header, newHeaderName);
                        }}
                    >
                        M
                    </button>
                    <button onClick={() => handleAddColumn(header)}>+</button>
                    <button onClick={() => handleMoveColumn(header, 'left')}>L</button>
                    <button onClick={() => handleMoveColumn(header, 'right')}>R</button>
                    {/* <button onClick={() => handleHeaderAction('hidde', header)}>Afficher/Masquer</button> */}
                </th>
            ));
    };

    const renderSheetSelector = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Feuilles disponibles:</span>
            {sheetNames.map((sheetName) => (
                <button
                    key={sheetName}
                    onClick={() => handleSheetSelect(sheetName)}
                    style={{ padding: '5px 10px', cursor: 'pointer' }}
                >
                    {sheetName}
                </button>
            ))}
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            {/* <h1 style={{ textAlign: 'center' }}>Gestionnaire de Tableaux Excel</h1> */}
            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {sheetNames.length > 0 && (
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: 0 }}>Feuilles disponibles :</h2>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                        {sheetNames.map(sheetName => (
                            <button
                                key={sheetName}
                                onClick={() => handleSheetSelect(sheetName)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#007BFF',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {sheetName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {headers.length > 0 && renderHeaderActions()}

            {data.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Données de la feuille sélectionnée :</h2>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', border: '1px solid black' }}>
                        {renderTableHeaders()}
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    {headers
                                        .filter((key) => !hiddenColumns.includes(key)) // Filtrer les colonnes masquées
                                        .map((key, i) => (
                                            <td key={i} style={{ padding: '10px' }}>
                                                {row[key]}
                                            </td>
                                        ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TableManager;