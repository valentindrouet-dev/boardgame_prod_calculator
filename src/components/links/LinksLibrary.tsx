import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { useGameStore } from '../../store';

export function LinksLibrary() {
  const { fabricationLinks, addFabricationLink, updateFabricationLink, removeFabricationLink } = useGameStore();

  return (
    <div className="flex flex-col h-full">
      <div className="bg-indigo-800 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Bibliothèque de liens</h2>
          <p className="text-indigo-300 text-xs mt-0.5">Outils, calculateurs, devis usines — commun à tous les projets</p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded transition-colors"
          onClick={() => addFabricationLink()}
        >
          <Plus size={14} />
          Ajouter lien
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {fabricationLinks.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <ExternalLink size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucun lien enregistré</p>
            <p className="text-sm mt-1">Cliquez sur "Ajouter lien" pour sauvegarder vos outils et calculateurs de fabrication.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-100 text-indigo-900 text-xs">
                  <th className="px-4 py-2 text-left w-48">Nom</th>
                  <th className="px-4 py-2 text-left">URL</th>
                  <th className="px-4 py-2 text-left w-64">Notes</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {fabricationLinks.map((link, idx) => (
                  <tr key={link.id} className={`border-b border-gray-100 group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={link.name}
                        placeholder="ex: Calculateur Cartamundi"
                        onChange={e => updateFabricationLink(link.id, { name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-400 font-medium"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={link.url}
                          placeholder="https://..."
                          onChange={e => updateFabricationLink(link.id, { url: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-400 text-blue-600"
                        />
                        {link.url && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:text-indigo-700 shrink-0"
                            title="Ouvrir"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={link.description}
                        placeholder="Notes..."
                        onChange={e => updateFabricationLink(link.id, { description: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-400 text-gray-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFabricationLink(link.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
