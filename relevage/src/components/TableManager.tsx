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
            case 'delete':
                setHeaders((prevHeaders) => prevHeaders.filter((header) => header !== headerName));
                setData((prevData) =>
                    prevData.map((row) => {
                        if (headerName) {
                            const { [headerName]: _, ...rest } = row; // Remove the headerName key
                            return rest;
                        }
                        return row; // Return the row unchanged if headerName is null or undefined
                    })
                );
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

    const renderHeaderActions = () => (
        <div style={{ marginTop: '20px' }}>
            <h3>Actions sur les en-têtes :</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {headers.map((header) => (
                    <div key={header} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{header}</span>
                        <button
                            onClick={() => handleHeaderAction('delete', header)}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#FF5733',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Supprimer
                        </button>
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
                            Modifier
                        </button>
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
                    Ajouter un nouvel en-tête
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ textAlign: 'center' }}>Gestionnaire de Tableaux Excel</h1>
            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {sheetNames.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Feuilles disponibles :</h2>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                        <thead>
                            <tr>
                                {headers
                                    .filter((key) => !hiddenColumns.includes(key)) // Filtrer les colonnes masquées
                                    .map((key) => (
                                        <th key={key} style={{ padding: '10px', backgroundColor: '#f2f2f2' }}>
                                            {key}
                                        </th>
                                    ))}
                            </tr>
                        </thead>
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