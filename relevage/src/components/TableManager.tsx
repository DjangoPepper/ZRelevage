import React, { useState, useRef, useEffect } from 'react';
import { parseExcel, parseSheet } from '../utils/excelParser';

const TableManager: React.FC = () => {
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>(''); // Nom du fichier sans extension
    const [selectedSheet, setSelectedSheet] = useState<string>(''); // Feuille sélectionnée
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]); // Colonnes masquées
    const [columnColors, setColumnColors] = useState<{ [key: string]: string }>({}); // Couleurs des colonnes
    const [columnSortOrder, setColumnSortOrder] = useState<{ [key: string]: 'asc' | 'desc' }>({}); // Ordre de tri des colonnes
    const [isSorting, setIsSorting] = useState(false); // État de tri

    const [showSheets, setShowSheets] = useState<boolean>(true); // Afficher/Masquer les feuilles disponibles
    const [showColumnActions, setShowColumnActions] = useState<boolean>(true); // Afficher/Masquer les actions sur les colonnes
    const [isModalOpen, setIsModalOpen] = useState(false); // État pour la visibilité du modal

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Fonction pour extraire le nom du fichier sans extension
    const extractFileName = (file: File): string => {
        const name = file.name;
        return name.substring(0, name.lastIndexOf('.')) || name;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const { sheetNames } = await parseExcel(file);
            setSheetNames(sheetNames);
            setData([]);
            setError(null);
            setFileName(extractFileName(file)); // Met à jour le nom du fichier
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
            setSelectedSheet(sheetName); // Met à jour la feuille sélectionnée
            setShowSheets(false); // Masque les feuilles disponibles
        } catch (err) {
            setError('Erreur lors de la sélection de la feuille.');
            console.error(err);
        }
    };

    const handleColumnNameChange = (index: number, newName: string) => {
        const oldName = headers[index];
        const newHeaders = [...headers];
        newHeaders[index] = newName;

        // Met à jour les clés des objets dans `data`
        const updatedData = data.map((row) => {
            const updatedRow = { ...row };
            updatedRow[newName] = updatedRow[oldName];
            delete updatedRow[oldName];
            return updatedRow;
        });

        // Met à jour les couleurs des colonnes
        setColumnColors((prev) => {
            const { [oldName]: oldColor, ...rest } = prev;
            return { ...rest, [newName]: oldColor };
        });

        setOppositeColors((prev) => {
            const { [oldName]: oldOppositeColor, ...rest } = prev;
            return { ...rest, [newName]: oldOppositeColor };
        });

        setHeaders(newHeaders);
        setData(updatedData);
    };

    const toggleColumnVisibility = (header: string) => {
        setHiddenColumns((prev) =>
            prev.includes(header) ? prev.filter((col) => col !== header) : [...prev, header]
        );
    };

    const toggleColumnSortOrder = (header: string) => {
        const currentOrder = columnSortOrder[header] || 'asc';
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

        setColumnSortOrder((prev) => ({ ...prev, [header]: newOrder }));

        const sortedData = [...data].sort((a, b) => {
            const valueA = a[header] || '';
            const valueB = b[header] || '';

            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return newOrder === 'asc' ? valueA - valueB : valueB - valueA;
            } else {
                return newOrder === 'asc'
                    ? String(valueA).localeCompare(String(valueB))
                    : String(valueB).localeCompare(String(valueA));
            }
        });

        setData(sortedData);
    };

    // Met à jour le titre de la page dynamiquement
    useEffect(() => {
        if (fileName && selectedSheet) {
            document.title = `${fileName} - ${selectedSheet}`;
        } else if (fileName) {
            document.title = fileName;
        } else {
            document.title = 'Table Manager';
        }
    }, [fileName, selectedSheet]);

    // Fonction pour calculer la couleur opposée
    const getOppositeColor = (color: string): string => {
        const hex = color.replace('#', '');
        const r = 255 - parseInt(hex.substring(0, 2), 16);
        const g = 255 - parseInt(hex.substring(2, 4), 16);
        const b = 255 - parseInt(hex.substring(4, 6), 16);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    };

    // Ajoutez un état pour stocker les couleurs opposées
    const [oppositeColors, setOppositeColors] = useState<{ [key: string]: string }>({});
    const [editingCell, setEditingCell] = useState<{ rowIndex: number | null; header: string; value: string } | null>(null); // Cellule en cours d'édition

    const openModal = (rowIndex: number | null, header: string, value: string) => {
        setEditingCell({ rowIndex, header, value });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingCell(null);
        setIsModalOpen(false);
    };

    const saveCellEdit = (newValue: string) => {
        if (editingCell) {
            const { rowIndex, header } = editingCell;

            if (rowIndex === null) {
                // Mise à jour du nom de la colonne
                const index = headers.indexOf(header);
                handleColumnNameChange(index, newValue);
            } else {
                // Mise à jour des données
                const updatedData = [...data];
                updatedData[rowIndex][header] = newValue;
                setData(updatedData);
            }

            closeModal();
        }
    };

    const Modal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (newValue: string) => void; value: string }> = ({
        isOpen,
        onClose,
        onSave,
        value,
    }) => {
        const [inputValue, setInputValue] = useState(value);

        if (!isOpen) return null;

        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '5px',
                        width: '300px',
                        textAlign: 'center',
                    }}
                >
                    <h3>Modifier la cellule</h3>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button onClick={onClose} style={{ padding: '10px', backgroundColor: '#ccc', border: 'none' }}>
                            Annuler
                        </button>
                        <button
                            onClick={() => onSave(inputValue)}
                            // style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none' }}
                        >
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    style={{ padding: '5px' }}
                />
                {selectedSheet && (
                    <button
                        onClick={() => setShowSheets((prev) => !prev)}

                    >
                        {showSheets ? 'Masquer les feuilles' : 'Afficher les feuilles'}
                    </button>
                )}
                {selectedSheet && (
                    <button
                        onClick={() => setShowColumnActions((prev) => !prev)}

                    >
                        {showColumnActions ? 'Masquer les actions' : 'Afficher les actions'}
                    </button>
                )}
            </div>

            {showSheets && sheetNames.length > 0 && (
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: 0 }}>Feuilles disponibles :</h2>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                        {sheetNames.map((sheetName) => (
                            <button
                                key={sheetName}
                                onClick={() => handleSheetSelect(sheetName)}

                            >
                                {sheetName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showColumnActions && headers.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ margin: 0 }}>Colonnes :</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {headers.map((header, index) => (
                            <div key={header} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                    style={{ cursor: 'pointer', padding: '5px', border: '1px solid #ddd' }}
                                    onClick={() => openModal(null, header, header)} // Ouvre le modal pour modifier le nom de la colonne
                                >
                                    {header}
                                </div>
                                <button
                                    onClick={() => toggleColumnVisibility(header)}
                                    // style={{
                                    //     padding: '5px 10px',
                                    //     backgroundColor: '#007BFF',
                                    //     color: 'white',
                                    //     border: 'none',
                                    //     borderRadius: '3px',
                                    //     cursor: 'pointer',
                                    // }}
                                >
                                    {hiddenColumns.includes(header) ? 'Afficher' : 'Masquer'}
                                </button>
                                <input
                                    type="color"
                                    onChange={(e) => {
                                        const newColor = e.target.value;
                                        setColumnColors((prev) => ({ ...prev, [header]: newColor }));
                                        setOppositeColors((prev) => ({ ...prev, [header]: getOppositeColor(newColor) }));
                                    }}
                                    value={columnColors[header] || '#ffffff'}
                                />
                                {oppositeColors[header] && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input
                                            type="color"
                                            onChange={(e) => {
                                                const newOppositeColor = e.target.value;
                                                setOppositeColors((prev) => ({ ...prev, [header]: newOppositeColor }));
                                            }}
                                            value={oppositeColors[header]}
                                            style={{ cursor: 'pointer' }}
                                        />
{/*                                         <button
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: oppositeColors[header],
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => alert(`Couleur opposée : ${oppositeColors[header]}`)}
                                        >
                                            Couleur opposée
                                        </button> */}
                                        &nbsp;&nbsp;
                                        {/* {oppositeColors[header]} */}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Données de la feuille sélectionnée :</h2>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead>
                            <tr>
                                {headers.map(
                                    (header) =>
                                        !hiddenColumns.includes(header) && (
                                            <th
                                                key={header}
                                                style={{
                                                    border: '1px solid #ddd',
                                                    padding: '8px',
                                                    textAlign: 'left',
                                                    backgroundColor: columnColors[header] || 'transparent', // Applique la couleur principale comme fond
                                                    color: columnColors[header] ? '#fff' : '#000', // Texte blanc si une couleur est définie, sinon noir
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {header}
                                                    <button
/*                                                         onClick={() => toggleColumnSortOrder(header)}
                                                        style={{
                                                            padding: '5px',
                                                            backgroundColor: '#007BFF',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer',
                                                        }} */
                                                    >
                                                        {columnSortOrder[header] === 'asc' ? '↓' : '↑'}
                                                    </button>
                                                    <input
                                                        type="color"
                                                        onChange={(e) =>
                                                            setColumnColors((prev) => ({ ...prev, [header]: e.target.value }))
                                                        }
                                                        value={columnColors[header] || '#ffffff'}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </div>
                                            </th>
                                        )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {headers.map(
                                        (header) =>
                                            !hiddenColumns.includes(header) && (
                                                <td
                                                    key={header}
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        padding: '8px',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => openModal(rowIndex, header, row[header] || '')} // Ouvre le modal
                                                >
                                                    {row[header]}
                                                </td>
                                            )
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {isSorting && <p>Tri en cours...</p>}
                </div>
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={saveCellEdit}
                value={editingCell?.value || ''}
            />
        </div>
    );
};

export default TableManager;