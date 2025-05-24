import React, { useState, useRef } from 'react';
import { parseExcel, parseSheet } from '../utils/excelParser';

const TableManager: React.FC = () => {
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Utilisation de useRef pour accéder à l'élément input
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const { sheetNames } = await parseExcel(file);
            setSheetNames(sheetNames); // Met à jour les noms des feuilles
            setData([]); // Réinitialise les données
            setError(null);
        } catch (err) {
            setError('Erreur lors de l\'importation du fichier Excel.');
            console.error(err);
        }
    };

    const handleSheetSelect = async (sheetName: string) => {
        // Accéder au fichier via la référence
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        try {
            const sheetData = await parseSheet(file, sheetName);
            setData(sheetData); // Met à jour les données de la feuille sélectionnée
            setError(null);
        } catch (err) {
            setError(`Erreur lors du chargement de la feuille "${sheetName}".`);
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Gestionnaire d'importation</h1>
            {/* Ajout de la référence à l'élément input */}
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
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', border: '1px solid black' }}>
                        <thead>
                            <tr>
                                {Object.keys(data[0]).map(key => (
                                    <th key={key} style={{ padding: '10px', backgroundColor: '#f2f2f2' }}>
                                        {key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    {Object.values(row).map((value, i) => (
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