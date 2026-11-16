import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import styles from "./profile.module.css";
import commonStyles from "../../app.module.css";
import { Field, FieldLabel } from "../../components/field/Field";
import Input from "../../components/input/Input";
import Button from "../../components/button/Button";
import img from "../../assets/profile.png";
import defaultProfilePicture from "../../assets/defaultpfp.png";

export default function Profile() {
  const { api, isAuthenticated, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    apelido: "",
    data_nascimento: "",
    foto: "",
  });
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!isAuthenticated) {
        setError("Não autenticado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await api.me();
        console.log(userData);
        setUser(userData);
        // Initialize form data with user data
        setFormData({
          nome: userData.nome || "",
          sobrenome: userData.sobrenome || "",
          apelido: userData.apelido || "",
          data_nascimento: userData.data_nascimento || "",
          foto: userData.foto || "",
        });
      } catch (err) {
        setError(err.message || "Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [api, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Prepare data for backend (only send fields that changed)
      const payload = {};
      if (formData.nome !== user.nome) payload.nome = formData.nome;
      if (formData.sobrenome !== user.sobrenome)
        payload.sobrenome = formData.sobrenome;
      if (formData.apelido !== user.apelido) payload.apelido = formData.apelido;
      if (formData.data_nascimento !== user.data_nascimento)
        payload.data_nascimento = formData.data_nascimento;
      if (formData.foto !== user.foto) payload.foto = formData.foto;

      // Only send request if there are changes
      if (Object.keys(payload).length === 0) {
        setSaveError("Nenhuma alteração detectada");
        setSaving(false);
        return;
      }

      await api.updateProfile(payload);

      // Refresh user data after successful update
      const updatedUser = await api.me();
      setUser(updatedUser);
      setSaveSuccess(true);
      setIsEditing(false);

      // Reset success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    // Reset form to current user data
    setFormData({
      nome: user.nome || "",
      sobrenome: user.sobrenome || "",
      apelido: user.apelido || "",
      data_nascimento: user.data_nascimento || "",
      foto: user.foto || "",
    });
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(false);
  };

  // Format date for display (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Format date for input (DD/MM/YYYY -> YYYY-MM-DD)
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div
        className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter} ${commonStyles.hScreen}`}
      >
        <p>Carregando perfil...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div
        className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter} ${commonStyles.hScreen}`}
      >
        <div className={styles.errorContainer}>
          <p>{error || "Usuário não encontrado"}</p>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Fazer login novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter}`}
      style={{ width: "100%" }}
    >
      <div
        style={{
          display: "flex",
          gap: 24,
          flexDirection: "column",
          width: "100%",
          maxWidth: 640,
          marginInline: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 className={commonStyles.sectionTitle}>Meu Perfil</h2>
            <p style={{ color: "#94AD96" }}>
              Gerencie suas informações e dados da conta
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" form="profile-form" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
            )}
          </div>
        </div>

        <div style={{ width: "100%" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              marginBottom: 128,
            }}
          >
            <img
              src={img}
              alt=""
              style={{
                width: "100%",
                height: 200,
                objectFit: "cover",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 0,
                transform: "translate(-50%, 50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 1,
                display: "flex",
                gap: 16,
              }}
            >
              <img
                src={
                  user.foto && user.foto !== "imagem"
                    ? user.foto
                    : defaultProfilePicture
                }
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultProfilePicture;
                }}
                alt="Foto de perfil"
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />

              <p style={{ width: 160, textAlign: "center", color: "#90B090" }}>
                {user.data_criacao.replace(
                  /^(\d{4})-(\d{2})-(\d{2}).*/,
                  "Conta criada em $3/$2 de $1",
                )}
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form
            id="profile-form"
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: "100%",
            }}
          >
            {saveSuccess && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  borderRadius: 4,
                  border: "1px solid #c3e6cb",
                }}
              >
                Perfil atualizado com sucesso!
              </div>
            )}
            {saveError && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: "#f8d7da",
                  color: "#721c24",
                  borderRadius: 4,
                  border: "1px solid #f5c6cb",
                }}
              >
                {saveError}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <Field className={commonStyles.wFull}>
                <FieldLabel>Nome</FieldLabel>
                <Input
                  type="text"
                  name="nome"
                  value={isEditing ? formData.nome : user.nome}
                  onChange={isEditing ? handleInputChange : undefined}
                  fullWidth
                  disabled={!isEditing}
                />
              </Field>

              <Field className={commonStyles.wFull}>
                <FieldLabel>Sobrenome</FieldLabel>
                <Input
                  type="text"
                  name="sobrenome"
                  value={isEditing ? formData.sobrenome : user.sobrenome}
                  onChange={isEditing ? handleInputChange : undefined}
                  fullWidth
                  disabled={!isEditing}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                name="email"
                value={user.email}
                fullWidth
                disabled
              />
            </Field>

            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <Field className={commonStyles.wFull}>
                <FieldLabel>Apelido</FieldLabel>
                <Input
                  type="text"
                  name="apelido"
                  value={isEditing ? formData.apelido : user.apelido}
                  onChange={isEditing ? handleInputChange : undefined}
                  fullWidth
                  disabled={!isEditing}
                />
              </Field>

              <Field className={commonStyles.wFull}>
                <FieldLabel>Data de nascimento</FieldLabel>
                <Input
                  type="date"
                  name="data_nascimento"
                  value={
                    isEditing ? formData.data_nascimento : user.data_nascimento
                  }
                  onChange={isEditing ? handleInputChange : undefined}
                  fullWidth
                  disabled={!isEditing}
                />
              </Field>
            </div>

            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <Field className={commonStyles.wFull}>
                <FieldLabel>Foto de Perfil (URL)</FieldLabel>
                <Input
                  type="url"
                  name="foto"
                  value={isEditing ? formData.foto : user.foto}
                  onChange={isEditing ? handleInputChange : undefined}
                  fullWidth
                  disabled={!isEditing}
                  placeholder="https://exemplo.com/foto.jpg"
                />
              </Field>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
