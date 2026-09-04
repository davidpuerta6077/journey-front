import { useState, useEffect, useCallback } from 'react'
import { User, Camera } from 'lucide-react'
import { fetchMyProfile } from '../../../services/perfil/fetchMyProfile'
import { uploadMyPhoto } from '../../../services/perfil/uploadMyPhoto'
import config from '../../../config'
import "../../../styles/main/Sync/SyncUsuariosP.css"
import "../../../styles/main/Perfil/MiPerfil.css"

const BASE = config.api_domain.url_base

export default function MiPerfil() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      setProfile(await fetchMyProfile())
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const updated = await uploadMyPhoto(file)
      setProfile(updated)
    } catch (err) {
      setError(err.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  if (loading) {
    return (
      <div className="sync-page">
        <div className="loading-box"><span className="loader"></span>Cargando perfil...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="sync-page">
        <div className="sync-page-header"><h2>Mi Perfil</h2></div>
        <p>{error || 'No se encontró tu perfil de plataforma.'}</p>
      </div>
    )
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Mi Perfil</h2>
      </div>

      <div className="perfil-card">
        <div className="perfil-avatar-wrapper">
          {profile.photo_url
            ? <img className="perfil-avatar" src={`${BASE}${profile.photo_url}`} alt={profile.username} />
            : <div className="perfil-avatar-placeholder"><User size={40} /></div>}
          <label className="perfil-avatar-edit" title="Cambiar foto">
            <Camera size={14} />
            <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} />
          </label>
        </div>
        <div className="perfil-name">{profile.username}</div>
        {uploading && <span className="badge badge-pending">Subiendo foto...</span>}
        {error && <div className="modal-error">{error}</div>}

        <div className="perfil-fields">
          <div className="perfil-field">
            <label>Correo institucional</label>
            <span>{profile.email}</span>
          </div>
          <div className="perfil-field">
            <label>Rol</label>
            <span>{profile.role_name || '-'}</span>
          </div>
          <div className="perfil-field">
            <label>Estado</label>
            <span className={`badge ${profile.estado ? 'badge-synced' : 'badge-pending'}`}>
              {profile.estado ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="perfil-field">
            <label>Último acceso</label>
            <span>{profile.last_login ? String(profile.last_login).split('T')[0] : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
