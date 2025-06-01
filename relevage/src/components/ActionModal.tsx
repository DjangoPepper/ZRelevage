import React, { useState } from 'react';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    activeColumnIndex: number | null;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onSave, activeColumnIndex }) => {
    const [localActionEnabled, setLocalActionEnabled] = useState(false);

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
                <h3>Configurer l'action</h3>
                <p>Index de la colonne en cours : {activeColumnIndex !== null ? activeColumnIndex : 'Aucune'}</p>
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