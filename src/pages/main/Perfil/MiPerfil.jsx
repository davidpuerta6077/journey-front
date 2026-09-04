import { useState, useEffect, useCallback } from 'react'
import { User, Camera, Pencil, Check, X } from 'lucide-react'
import { fetchMyProfile } from '../../../services/perfil/fetchMyProfile'
import { uploadMyPhoto } from '../../../services/perfil/uploadMyPhoto'
import { updateMyUsername } from '../../../services/perfil/updateMyUsername'
import { usePermissions } from '../../../services/PermissionsContext'
import config from '../../../config'
import "../../../styles/main/Sync/SyncUsuariosP.css"
import "../../../styles/main/Perfil/MiPerfil.css"

const BASE = config.api_domain.url_base

export default function MiPerfil() {
  const { refetchProfile } = usePermissions()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameDraft, setUsernameDraft] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)

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
      refetchProfile()
    } catch (err) {
      setError(err.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  const startEditUsername = () => {
    setUsernameDraft(profile.username)
    setEditingUsername(true)
    setError('')
  }

  const cancelEditUsername = () => {
    setEditingUsername(false)
    setError('')
  }

  const saveUsername = async () => {
    const trimmed = usernameDraft.trim()
    if (!trimmed) {
      setError('El username no puede estar vacío.')
      return
    }
    if (trimmed === profile.username) {
      setEditingUsername(false)
      return
    }
    setSavingUsername(true)
    setError('')
    try {
      const updated = await updateMyUsername(trimmed)
      setProfile(updated)
      refetchProfile()
      setEditingUsername(false)
    } catch (err) {
      setError(err.message)
    }
    setSavingUsername(false)
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

        {editingUsername ? (
          <div className="perfil-name-edit">
            <input
              className="perfil-name-input"
              value={usernameDraft}
              onChange={e => setUsernameDraft(e.target.value)}
              disabled={savingUsername}
              autoFocus
            />
            <button className="btn-icon" onClick={saveUsername} disabled={savingUsername} title="Guardar">
              <Check size={14} />
            </button>
            <button className="btn-icon" onClick={cancelEditUsername} disabled={savingUsername} title="Cancelar">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="perfil-name">
            {profile.username}
            <button className="btn-icon" onClick={startEditUsername} title="Editar username">
              <Pencil size={13} />
            </button>
          </div>
        )}

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
