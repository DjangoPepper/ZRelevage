//rechercheok
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
    const [columnSortOrder, setColumnSortOrder] = useState<{ [key: string]: 'asc' | 'desc' | 'original' }>({}); // Ordre de tri des colonnes
    const [isSorting, setIsSorting] = useState(false); // État de tri

    const [showSheets, setShowSheets] = useState<boolean>(true); // Afficher/Masquer les feuilles disponibles
    const [showColumnActions, setShowColumnActions] = useState<boolean>(true); // Afficher/Masquer les actions sur les colonnes
    const [isModalOpen, setIsModalOpen] = useState(false); // État pour la visibilité du modal
    const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false); // État pour la visibilité du modal spécial

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [selectedColumnValue, setSelectedColumnValue] = useState<string | null>(null);
    const [modifiedValue, setModifiedValue] = useState<{ char: string; checked: boolean }[] | null>(null);

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

            // Ajoute une colonne `OriginalOrdre` pour conserver l'ordre original
            const dataWithOriginalOrder = sheetData.map((row, index) => ({
                ...row,
                OriginalOrdre: index,
            }));

            setData(dataWithOriginalOrder);
            setHeaders([...Object.keys(sheetData[0]), 'OriginalOrdre']); // Ajoute `OriginalOrdre` aux en-têtes
            setHiddenColumns((prev) => [...prev, 'OriginalOrdre']); // Masque la colonne `OriginalOrdre`
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
        const currentOrder = columnSortOrder[header] || 'original';
        const newOrder = currentOrder === 'original' ? 'asc' : currentOrder === 'asc' ? 'desc' : 'original';

        setColumnSortOrder((prev) => ({ ...prev, [header]: newOrder }));

        if (newOrder === 'original') {
            // Restaure l'ordre original en utilisant `OriginalOrdre`
            const originalOrderData = [...data].sort((a, b) => a.OriginalOrdre - b.OriginalOrdre);
            setData(originalOrderData);
        } else {
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
        }
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

    const calculateMinMax = (header: string) => {
        const values = data.map((row) => parseFloat(row[header])).filter((value) => !isNaN(value));
        const min = Math.min(...values);
        const max = Math.max(...values);
        return { min, max };
    };

    const interpolateColor = (color1: string, color2: string, ratio: number): string => {
        const hexToRgb = (hex: string) => {
            const bigint = parseInt(hex.replace('#', ''), 16);
            return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255,
            };
        };

        const rgbToHex = (r: number, g: number, b: number) =>
            `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);

        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

        return rgbToHex(r, g, b);
    };

    const generateUniqueGray = (header: string): { backgroundColor: string; textColor: string } => {
        let hash = 0;
        for (let i = 0; i < header.length; i++) {
            hash = header.charCodeAt(i) + ((hash << 5) - hash);
        }
        const grayValue = Math.abs(hash % 200) + 30; // Génère une valeur entre 30 et 230
        const backgroundColor = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;

        // Détermine si le gris est sombre (luminosité < 128)
        const textColor = grayValue < 128 ? '#fff' : '#000';

        return { backgroundColor, textColor };
    };

    const openSpecialModal = (header: string) => {
        const columnValues = data
            .map((row) => row[header])
            .filter(
                (value) =>
                    (typeof value === 'string' && /^[a-zA-Z0-9]+$/.test(value)) || // Vérifie si c'est une chaîne alphanumérique
                    (typeof value === 'number' && Number.isInteger(value)) // Vérifie si c'est un entier
            );

        if (columnValues.length > 0) {
            const randomValue = columnValues[Math.floor(Math.random() * columnValues.length)];
            setSelectedColumnValue(String(randomValue)); // Convertit en chaîne si c'est un entier
            setModifiedValue(String(randomValue).split('').map((char) => ({ char, checked: false }))); // Ajoute un état pour chaque caractère
            setIsSpecialModalOpen(true);
        } else {
            alert('Les valeurs de cette colonne ne sont ni alphanumériques ni des entiers.');
        }
    };

    const SpecialModal: React.FC<{ isOpen: boolean; onClose: () => void; value: string | null }> = ({
        isOpen,
        onClose,
        value,
    }) => {
        if (!isOpen || !value || !modifiedValue) return null;

        const handleToggleCheckbox = (index: number) => {
            setModifiedValue((prev) =>
                prev
                    ? prev.map((item, i) =>
                          i === index ? { ...item, checked: !item.checked } : item
                      )
                    : null
            );
        };

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
                        width: '400px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap', // Empêche le retour à la ligne
                        overflow: 'hidden', // Empêche le débordement
                        textOverflow: 'ellipsis', // Ajoute des points de suspension si le texte dépasse
                    }}
                >
                    <h3>Espaces à cocher</h3>
                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {modifiedValue.map((item, index) => (
                            <span
                                key={index}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '20px', // Agrandit les caractères
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {item.char}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => handleToggleCheckbox(index)}
                                    style={{
                                        width: '12px', // Réduit la largeur de la checkbox
                                        height: '12px', // Réduit la hauteur de la checkbox
                                        cursor: 'pointer',
                                    }}
                                />
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px',
                            backgroundColor: '#007BFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                        }}
                    >
                        Fermer
                    </button>
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
                        {headers
                            .filter((header) => header !== 'OriginalOrdre') // Exclut la colonne `OriginalOrdre`
                            .map((header, index) => {
                                const { backgroundColor, textColor } = generateUniqueGray(header);
                                return (
                                    <div
                                        key={header}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            backgroundColor,
                                            color: textColor, // Applique la couleur du texte
                                            padding: '5px',
                                            border: '1px solid #ddd',
                                            borderRadius: '3px',
                                        }}
                                    >
                                        <div
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => openModal(null, header, header)} // Ouvre le modal pour modifier le nom de la colonne
                                        >
                                            {header}
                                        </div>
                                        <button
                                            onClick={() => toggleColumnVisibility(header)}
                                            style={{
                                                padding: '5px',
                                                backgroundColor: '#007BFF',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                            }}
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
                                            <input
                                                type="color"
                                                onChange={(e) => {
                                                    const newOppositeColor = e.target.value;
                                                    setOppositeColors((prev) => ({ ...prev, [header]: newOppositeColor }));
                                                }}
                                                value={oppositeColors[header]}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )}
                                        {/* Nouveau bouton `_` */}
                                        <button
                                            onClick={() => openSpecialModal(header)}
                                            style={{
                                                padding: '5px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            _
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {data.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h2 style={{ margin: 0 }}>Données de la feuille :</h2>
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase();
                                if (searchTerm === '') {
                                    // Réinitialise les données si le champ de recherche est vide
                                    const file = fileInputRef.current?.files?.[0];
                                    if (file && selectedSheet) {
                                        handleSheetSelect(selectedSheet); // Recharge les données de la feuille sélectionnée
                                    }
                                } else {
                                    const filteredData = data.filter((row) =>
                                        headers.some((header) => String(row[header]).toLowerCase().includes(searchTerm))
                                    );
                                    setData(filteredData);
                                }
                            }}
                            style={{
                                padding: '5px',
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                width: '200px',
                            }}
                        />
                    </div>
                    <table
                        style={{
                            borderCollapse: 'collapse',
                            width: '100%',
                            tableLayout: 'fixed', // Force une largeur fixe pour les colonnes
                        }}
                    >
                        <thead>
                            <tr>
                                {headers.map(
                                    (header, index) =>
                                        !hiddenColumns.includes(header) && (
                                            <th
                                                key={header}
                                                style={{
                                                    border: '1px solid #ddd',
                                                    padding: '8px',
                                                    textAlign: 'left',
                                                    backgroundColor: columnColors[header] || 'transparent',
                                                    color: columnColors[header] ? '#fff' : '#000',
                                                    width: `${100 / headers.length}%`, // Divise la largeur de manière égale entre les colonnes
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {header}
                                                    {!showColumnActions && ( // Affiche le bouton de tri uniquement si `showColumnActions` est false
                                                        <button
                                                            onClick={() => toggleColumnSortOrder(header)}
                                                            style={{
                                                                padding: '5px',
                                                                backgroundColor: '#007BFF',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '3px',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {columnSortOrder[header] === 'asc'
                                                                ? '↓' // Tri croissant
                                                                : columnSortOrder[header] === 'desc'
                                                                ? '↑' // Tri décroissant
                                                                : '↔'} {/* État original */}
                                                        </button>
                                                    )}
                                                    {showColumnActions && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    // Permute la colonne active avec celle de gauche
                                                                    if (index > 0) {
                                                                        const newHeaders = [...headers];
                                                                        [newHeaders[index], newHeaders[index - 1]] = [
                                                                            newHeaders[index - 1],
                                                                            newHeaders[index],
                                                                        ];

                                                                        const updatedData = data.map((row) => {
                                                                            const newRow = { ...row };
                                                                            [newRow[headers[index]], newRow[headers[index - 1]]] = [
                                                                                newRow[headers[index - 1]],
                                                                                newRow[headers[index]],
                                                                            ];
                                                                            return newRow;
                                                                        });

                                                                        setHeaders(newHeaders);
                                                                        setData(updatedData);
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '5px',
                                                                    backgroundColor: '#ffc107',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '3px',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                ←
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    // Ajoute une colonne à droite de la colonne active
                                                                    const newHeaders = [...headers];
                                                                    const newColumnName = `Nouvelle colonne ${newHeaders.length + 1}`;
                                                                    newHeaders.splice(index + 1, 0, newColumnName);

                                                                    const updatedData = data.map((row) => ({
                                                                        ...row,
                                                                        [newColumnName]: '', // Ajoute une colonne vide
                                                                    }));

                                                                    setHeaders(newHeaders);
                                                                    setData(updatedData);
                                                                }}
                                                                style={{
                                                                    padding: '5px',
                                                                    backgroundColor: '#28a745',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '3px',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    // Permute la colonne active avec celle de droite
                                                                    if (index < headers.length - 1) {
                                                                        const newHeaders = [...headers];
                                                                        [newHeaders[index], newHeaders[index + 1]] = [
                                                                            newHeaders[index + 1],
                                                                            newHeaders[index],
                                                                        ];

                                                                        const updatedData = data.map((row) => {
                                                                            const newRow = { ...row };
                                                                            [newRow[headers[index]], newRow[headers[index + 1]]] = [
                                                                                newRow[headers[index + 1]],
                                                                                newRow[headers[index]],
                                                                            ];
                                                                            return newRow;
                                                                        });

                                                                        setHeaders(newHeaders);
                                                                        setData(updatedData);
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '5px',
                                                                    backgroundColor: '#007bff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '3px',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                →
                                                            </button>
                                                        </>
                                                    )}
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
                                                        textAlign: 'left',
                                                        width: `${100 / headers.length}%`, // Assure une largeur égale pour les cellules
                                                        background: (() => {
                                                            if (oppositeColors[header] && columnColors[header]) {
                                                                const { min, max } = calculateMinMax(header);
                                                                const value = parseFloat(row[header]);
                                                                if (!isNaN(value) && max !== min) {
                                                                    const ratio = (value - min) / (max - min);
                                                                    return interpolateColor(columnColors[header], oppositeColors[header], ratio);
                                                                }
                                                            }
                                                            return 'transparent';
                                                        })(),
                                                    }}
                                                    onClick={() => openModal(rowIndex, header, row[header] || '')}
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
            <SpecialModal
                isOpen={isSpecialModalOpen}
                onClose={() => setIsSpecialModalOpen(false)}
                value={selectedColumnValue}
            />
        </div>
    );
};

export default TableManager;