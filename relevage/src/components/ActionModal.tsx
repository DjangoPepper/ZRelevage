import React, { useState } from 'react';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    activeColumnIndex: number | null;
    data: any[]; // Les données de la table
    headers: string[]; // Les en-têtes des colonnes
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onSave, activeColumnIndex, data, headers }) => {
    const [localActionEnabled, setLocalActionEnabled] = useState(false);

    if (!isOpen) return null;

    // Récupère la première valeur de la colonne en cours
    const firstValue =
        activeColumnIndex !== null && data.length > 0
            ? data[0][headers[activeColumnIndex]]
            : null;

    // Vérifie si la valeur est un entier ou une suite alphanumérique
    const isAlphaNumeric = (value: any) =>
        typeof value === 'string' && /^[a-zA-Z0-9]+$/.test(value);

    const isInteger = (value: any) => Number.isInteger(Number(value));

    const shouldDisplayFirstValue = isAlphaNumeric(firstValue) || isInteger(firstValue);

    // Décompose la valeur en caractères
    const characters = shouldDisplayFirstValue ? String(firstValue).split('') : [];

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
                <h3>Configurer l'action</h3>
                <p>Index de la colonne en cours : {activeColumnIndex !== null ? activeColumnIndex : 'Aucune'}</p>

                {/* Affiche la première valeur de la colonne si elle est valide */}
                {shouldDisplayFirstValue && (
                    <>
                        <p>Exemple visuel : {firstValue}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                            {characters.map((char, index) => (
                                <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input type="checkbox" />
                                    {char}
                                </label>
                            ))}
                        </div>
                    </>
                )}

                <label style={{ display: 'block', marginBottom: '10px' }}>
                    <input
                        type="checkbox"
                        checked={localActionEnabled}
                        onChange={(e) => setLocalActionEnabled(e.target.checked)}
                    />
                    Activer l'opération
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={onClose} style={{ padding: '10px', backgroundColor: '#ccc', border: 'none' }}>
                        Annuler
                    </button>
                    <button
                        onClick={() => {
                            if (localActionEnabled) {
                                onSave(); // Appelle la logique d'ajout de colonne
                            }
                            onClose(); // Ferme le modal
                        }}
                        style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none' }}
                    >
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;