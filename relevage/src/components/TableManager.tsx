import React, { useState, useRef } from 'react';
import { parseExcel, parseSheet } from '../utils/excelParser';

const TableManager: React.FC = () => {
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
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
            setHiddenColumns([]); // Réinitialise les colonnes masquées
            setError(null);
        } catch (err) {
            setError(`Erreur lors du chargement de la feuille "${sheetName}".`);
            console.error(err);
        }
    };

    const handleColumnToggle = (columnName: string) => {
        setHiddenColumns((prevHiddenColumns) =>
            prevHiddenColumns.includes(columnName)
                ? prevHiddenColumns.filter((col) => col !== columnName) // Réaffiche la colonne
                : [...prevHiddenColumns, columnName] // Masque la colonne
        );
    };

    const handleRemoveFirstLine = () => {
        setData((prevData) => prevData.slice(1)); // Supprime la première ligne
    };

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

            {data.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Données de la feuille sélectionnée :</h2>
                    <div style={{ marginBottom: '20px' }}>
                        <h3>Colonnes :</h3>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {Object.keys(data[0]).map((columnName) => (
                                <button
                                    key={columnName}
                                    onClick={() => handleColumnToggle(columnName)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: hiddenColumns.includes(columnName)
                                            ? '#d3d3d3' // Grisé si masqué
                                            : '#007BFF',
                                        color: hiddenColumns.includes(columnName) ? '#808080' : 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {columnName}
                                </button>
                            ))}
                            {/* Bouton pour supprimer la première ligne */}
                            <button
                                onClick={handleRemoveFirstLine}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#FF5733',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Supprimer la première ligne
                            </button>
                        </div>
                    </div>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', border: '1px solid black' }}>
                        <thead>
                            <tr>
                                {Object.keys(data[0])
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
                                    {Object.entries(row)
                                        .filter(([key]) => !hiddenColumns.includes(key)) // Filtrer les colonnes masquées
                                        .map(([key, value], i) => (
                                            <td key={i} style={{ padding: '10px' }}>
                                                {value}
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