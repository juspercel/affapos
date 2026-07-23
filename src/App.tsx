import { useEffect, useState } from "react";
import {
  ChevronDown,
  Edit3,
  ExternalLink,
  Folder,
  Link as LinkIcon,
  Plus,
  Save,
  Star,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

type BettingLink = {
  id: string;
  name: string;
  label: string;
  url: string;
  highlight: string;
};

type PageItem =
  | (BettingLink & { type: "link" })
  | {
      id: string;
      type: "group";
      name: string;
      links: BettingLink[];
    };

const storageKey = "apostas-legalizadas-links";
const profileStorageKey = "apostas-legalizadas-profile";
const adminSessionKey = "apostas-legalizadas-admin-session";

const defaultProfile = {
  name: "Apostas Legalizadas BR",
  photoUrl: "",
};

const defaultItems: PageItem[] = [
  {
    type: "link",
    id: "casa-01",
    name: "Casa Parceira 01",
    label: "Bonus de boas-vindas",
    url: "https://exemplo.com/parceiro-01",
    highlight: "Mais acessada",
  },
  {
    type: "link",
    id: "casa-02",
    name: "Casa Parceira 02",
    label: "Odds competitivas",
    url: "https://exemplo.com/parceiro-02",
    highlight: "",
  },
  {
    type: "link",
    id: "casa-03",
    name: "Casa Parceira 03",
    label: "Apostas ao vivo",
    url: "https://exemplo.com/parceiro-03",
    highlight: "",
  },
];

function createBlankLink(): BettingLink & { type: "link" } {
  return {
    type: "link",
    id: crypto.randomUUID(),
    name: "Nova casa",
    label: "Bonus ou oferta",
    url: "https://",
    highlight: "",
  };
}

function createGroupLink(): BettingLink {
  return {
    id: crypto.randomUUID(),
    name: "Casa do grupo",
    label: "Bonus ou oferta",
    url: "https://",
    highlight: "",
  };
}

function createBlankGroup(): PageItem {
  return {
    id: crypto.randomUUID(),
    type: "group",
    name: "Novo grupo",
    links: [createGroupLink()],
  };
}

function readStoredProfile() {
  try {
    const raw = localStorage.getItem(profileStorageKey);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

function normalizeStoredItems(value: unknown): PageItem[] {
  if (!Array.isArray(value) || value.length === 0) return defaultItems;

  return value.map((item) => {
    if (item && typeof item === "object" && "type" in item && item.type === "group") {
      const group = item as PageItem & { type: "group" };
      return {
        id: group.id || crypto.randomUUID(),
        type: "group",
        name: group.name || "Grupo",
        links: Array.isArray(group.links)
          ? group.links.map((link) => ({
              id: link.id || crypto.randomUUID(),
              name: link.name || "Casa sem nome",
              label: link.label || "Bonus ou oferta",
              url: link.url || "https://",
              highlight: link.highlight || "",
            }))
          : [],
      };
    }

    const link = item as Partial<BettingLink>;
    return {
      type: "link",
      id: link.id || crypto.randomUUID(),
      name: link.name || "Casa sem nome",
      label: link.label || "Bonus ou oferta",
      url: link.url || "https://",
      highlight: link.highlight || "",
    };
  });
}

function readStoredItems() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultItems;
    return normalizeStoredItems(JSON.parse(raw));
  } catch {
    return defaultItems;
  }
}

function getSiteIconUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(parsedUrl.origin)}&sz=128`;
  } catch {
    return "";
  }
}

function getProfileImageUrl(value: string) {
  if (value.startsWith("data:")) return value;
  if (!value.trim()) return "";

  try {
    const parsedUrl = new URL(value);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "instagram.com") {
      const username = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return username ? `https://unavatar.io/instagram/${encodeURIComponent(username)}` : "";
    }

    return value;
  } catch {
    const username = value.replace(/^@/, "").trim();
    return username ? `https://unavatar.io/instagram/${encodeURIComponent(username)}` : "";
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

async function renderPdfFirstPage(file: File) {
  const [pdfjsLib, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.mjs?url"),
  ]);

  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Nao foi possivel preparar a imagem do PDF.");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}

export default function App() {
  const [profile, setProfile] = useState(readStoredProfile);
  const [items, setItems] = useState<PageItem[]>(readStoredItems);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(adminSessionKey) === "true");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [fileError, setFileError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const isAdminRoute = new URLSearchParams(window.location.search).get("admin") === "1";
  const profileImageUrl = getProfileImageUrl(profile.photoUrl);

  useEffect(() => {
    localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const updateLink = (id: string, field: keyof BettingLink, value: string) => {
    setItems((current) =>
      current.map((item) => (item.type === "link" && item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const updateGroupName = (id: string, name: string) => {
    setItems((current) => current.map((item) => (item.type === "group" && item.id === id ? { ...item, name } : item)));
  };

  const updateGroupLink = (groupId: string, linkId: string, field: keyof BettingLink, value: string) => {
    setItems((current) =>
      current.map((item) =>
        item.type === "group" && item.id === groupId
          ? {
              ...item,
              links: item.links.map((link) => (link.id === linkId ? { ...link, [field]: value } : link)),
            }
          : item,
      ),
    );
  };

  const addLink = () => {
    setItems((current) => [...current, createBlankLink()]);
    setIsEditing(true);
  };

  const addGroup = () => {
    const group = createBlankGroup();
    setItems((current) => [...current, group]);
    setOpenGroups((current) => [...current, group.id]);
    setIsEditing(true);
  };

  const removeLink = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const addLinkToGroup = (groupId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.type === "group"
          ? item.id === groupId
            ? { ...item, links: [...item.links, createGroupLink()] }
            : item
          : item,
      ),
    );
  };

  const removeLinkFromGroup = (groupId: string, linkId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.type === "group" && item.id === groupId
          ? { ...item, links: item.links.filter((link) => link.id !== linkId) }
          : item,
      ),
    );
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((current) => (current.includes(id) ? current.filter((groupId) => groupId !== id) : [...current, id]));
  };

  const saveLinks = () => {
    localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    localStorage.setItem(storageKey, JSON.stringify(items));
    setSavedMessage("Pagina salva neste navegador.");
    setIsEditing(false);
    window.setTimeout(() => setSavedMessage(""), 2200);
  };

  const enterAdmin = async () => {
    try {
      setAdminError("");
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      if (!response.ok) {
        setAdminError("Email ou senha incorretos.");
        return;
      }

      localStorage.setItem(adminSessionKey, "true");
      setIsAdmin(true);
      setIsEditing(true);
      setAdminPassword("");
    } catch {
      setAdminError("Nao foi possivel entrar agora.");
    }
  };

  const exitAdmin = () => {
    localStorage.removeItem(adminSessionKey);
    setIsAdmin(false);
    setIsEditing(false);
  };

  const handleProfileFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      setFileError("");
      const imageUrl = file.type === "application/pdf" ? await renderPdfFirstPage(file) : await readFileAsDataUrl(file);
      setProfile((current) => ({ ...current, photoUrl: imageUrl }));
    } catch {
      setFileError("Nao consegui usar esse arquivo. Tente uma imagem ou PDF menor.");
    }
  };

  const resetLinks = () => {
    setItems(defaultItems);
    setSavedMessage("Lista restaurada.");
  };

  return (
    <main className="site-shell">
      <section className="profile-panel" aria-labelledby="main-title">
        {isAdminRoute ? (
          <button
            className="edit-toggle"
            type="button"
            onClick={() => (isAdmin ? setIsEditing((current) => !current) : setIsEditing(true))}
          >
            {isAdmin && isEditing ? <X size={17} /> : <Edit3 size={17} />}
            {isAdmin && isEditing ? "Fechar painel" : "Admin"}
          </button>
        ) : null}

        <div className="profile-mark" aria-hidden="true">
          {profileImageUrl ? (
            <img
              alt=""
              src={profileImageUrl}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <Trophy className="profile-fallback" size={28} />
        </div>

        <h1 id="main-title">{profile.name || "Seu nome aqui"}</h1>

        <div className="age-strip" role="note">
          <strong>18+</strong>
          <span>Jogue com responsabilidade. Aposta nao e fonte de renda.</span>
        </div>
      </section>

      {isAdminRoute && isEditing && !isAdmin ? (
        <section className="admin-login" aria-label="Login do administrador">
          <h2>Painel admin</h2>
          <p>Entre com o email e senha configurados na Vercel.</p>
          <div className="admin-login-row">
            <input
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="Email do admin"
            />
            <input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void enterAdmin();
              }}
              placeholder="Senha"
            />
            <button className="icon-action primary" type="button" onClick={() => void enterAdmin()}>
              Entrar
            </button>
          </div>
          {adminError ? <p className="form-error">{adminError}</p> : null}
        </section>
      ) : null}

      {isAdminRoute && isEditing && isAdmin ? (
        <section className="editor-panel" aria-label="Editor de links">
          <div className="editor-head">
            <div>
              <h2>Painel admin</h2>
              <p>Adicione quantas casas quiser e salve nome, bonus, foto e links.</p>
            </div>
            <div className="editor-head-actions">
              <button className="icon-action primary" type="button" onClick={saveLinks}>
                <Save size={17} />
                Salvar
              </button>
              <button className="text-action" type="button" onClick={exitAdmin}>
                Sair
              </button>
            </div>
          </div>

          <fieldset className="profile-editor">
            <legend>Perfil</legend>
            <label>
              Nome que aparece no topo
              <input
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Foto de perfil, Instagram ou imagem
              <input
                inputMode="url"
                value={profile.photoUrl}
                onChange={(event) => setProfile((current) => ({ ...current, photoUrl: event.target.value }))}
                placeholder="https://instagram.com/seuusuario"
              />
            </label>
            <label>
              Enviar imagem ou PDF
              <input
                accept="image/*,.pdf,application/pdf"
                type="file"
                onChange={(event) => void handleProfileFile(event.target.files?.[0])}
              />
            </label>
            {fileError ? <p className="form-error">{fileError}</p> : null}
          </fieldset>

          <div className="editor-list">
            {items.map((item, index) =>
              item.type === "link" ? (
                <fieldset className="link-editor" key={item.id}>
                  <legend>Casa {index + 1}</legend>
                  <label>
                    Nome da casa
                    <input value={item.name} onChange={(event) => updateLink(item.id, "name", event.target.value)} />
                  </label>
                  <label>
                    Bonus
                    <input value={item.label} onChange={(event) => updateLink(item.id, "label", event.target.value)} />
                  </label>
                  <label>
                    Link da casa
                    <input
                      inputMode="url"
                      value={item.url}
                      onChange={(event) => updateLink(item.id, "url", event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                  <label>
                    Selo opcional
                    <input
                      value={item.highlight}
                      onChange={(event) => updateLink(item.id, "highlight", event.target.value)}
                      placeholder="Ex: Mais acessada"
                    />
                  </label>
                  <button className="danger-action" type="button" onClick={() => removeLink(item.id)}>
                    <Trash2 size={16} />
                    Remover esta casa
                  </button>
                </fieldset>
              ) : (
                <fieldset className="group-editor" key={item.id}>
                  <legend>Grupo {index + 1}</legend>
                  <label>
                    Nome do grupo
                    <input value={item.name} onChange={(event) => updateGroupName(item.id, event.target.value)} />
                  </label>
                  <div className="group-editor-list">
                    {item.links.map((link, linkIndex) => (
                      <div className="nested-link-editor" key={link.id}>
                        <strong>Casa {linkIndex + 1} do grupo</strong>
                        <label>
                          Nome da casa
                          <input
                            value={link.name}
                            onChange={(event) => updateGroupLink(item.id, link.id, "name", event.target.value)}
                          />
                        </label>
                        <label>
                          Bonus
                          <input
                            value={link.label}
                            onChange={(event) => updateGroupLink(item.id, link.id, "label", event.target.value)}
                          />
                        </label>
                        <label>
                          Link da casa
                          <input
                            inputMode="url"
                            value={link.url}
                            onChange={(event) => updateGroupLink(item.id, link.id, "url", event.target.value)}
                            placeholder="https://..."
                          />
                        </label>
                        <label>
                          Selo opcional
                          <input
                            value={link.highlight}
                            onChange={(event) => updateGroupLink(item.id, link.id, "highlight", event.target.value)}
                            placeholder="Ex: Melhor bonus"
                          />
                        </label>
                        <button className="danger-action compact" type="button" onClick={() => removeLinkFromGroup(item.id, link.id)}>
                          <Trash2 size={15} />
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="group-actions">
                    <button className="icon-action" type="button" onClick={() => addLinkToGroup(item.id)}>
                      <Plus size={16} />
                      Adicionar casa ao grupo
                    </button>
                    <button className="danger-action" type="button" onClick={() => removeLink(item.id)}>
                      <Trash2 size={16} />
                      Remover grupo
                    </button>
                  </div>
                </fieldset>
              ),
            )}
          </div>

          <div className="editor-actions">
            <button className="icon-action" type="button" onClick={addLink}>
              <Plus size={17} />
              Adicionar casa
            </button>
            <button className="icon-action" type="button" onClick={addGroup}>
              <Folder size={17} />
              Adicionar grupo
            </button>
            <button className="text-action" type="button" onClick={resetLinks}>
              Restaurar exemplos
            </button>
          </div>
        </section>
      ) : null}

      {savedMessage ? <p className="save-message">{savedMessage}</p> : null}

      <section className="links-panel" aria-label="Links de casas de apostas">
        {items.map((item) => {
          if (item.type === "group") {
            const isOpen = openGroups.includes(item.id);
            return (
              <div className="group-card" key={item.id}>
                <button className="bet-link group-toggle" type="button" onClick={() => toggleGroup(item.id)}>
                  <span className="link-icon group-icon" aria-hidden="true">
                    <Folder size={18} />
                  </span>
                  <span className="link-copy">
                    <span className="link-topline">
                      <strong>{item.name || "Grupo sem nome"}</strong>
                      <em>{item.links.length} casas</em>
                    </span>
                    <span className="link-label">Toque para ver as casas</span>
                  </span>
                  <ChevronDown className={isOpen ? "chevron open" : "chevron"} size={18} aria-hidden="true" />
                </button>
                {isOpen ? (
                  <div className="group-links">
                    {item.links.map((link) => {
                      const siteIconUrl = getSiteIconUrl(link.url);
                      return (
                        <a className="bet-link nested-bet-link" href={link.url} key={link.id} rel="noreferrer" target="_blank">
                          <span className="link-icon" aria-hidden="true">
                            {siteIconUrl ? <img alt="" src={siteIconUrl} /> : null}
                            {link.highlight ? <Star className="fallback-icon" size={18} /> : <LinkIcon className="fallback-icon" size={18} />}
                          </span>
                          <span className="link-copy">
                            <span className="link-topline">
                              <strong>{link.name || "Casa sem nome"}</strong>
                              {link.highlight ? <em>{link.highlight}</em> : null}
                            </span>
                            <span className="link-label">{link.label || "Bonus ou oferta"}</span>
                          </span>
                          <ExternalLink className="external-icon" size={18} aria-hidden="true" />
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          const siteIconUrl = getSiteIconUrl(item.url);
          return (
            <a className="bet-link" href={item.url} key={item.id} rel="noreferrer" target="_blank">
              <span className="link-icon" aria-hidden="true">
                {siteIconUrl ? <img alt="" src={siteIconUrl} /> : null}
                {item.highlight ? <Star className="fallback-icon" size={18} /> : <LinkIcon className="fallback-icon" size={18} />}
              </span>
              <span className="link-copy">
                <span className="link-topline">
                  <strong>{item.name || "Casa sem nome"}</strong>
                  {item.highlight ? <em>{item.highlight}</em> : null}
                </span>
                <span className="link-label">{item.label || "Bonus ou oferta"}</span>
              </span>
              <ExternalLink className="external-icon" size={18} aria-hidden="true" />
            </a>
          );
        })}
      </section>

      <section className="info-grid" aria-label="Informacoes importantes">
        <article>
          <h2>Antes de clicar</h2>
          <p>Confira sempre se a operadora esta regularizada no Brasil e leia os termos de bonus, saque e verificacao de conta.</p>
        </article>
        <article>
          <h2>Parcerias</h2>
          <p>Alguns links podem ser afiliados. Isso nao altera seu cadastro e ajuda a manter esta pagina no ar.</p>
        </article>
      </section>

      <footer>
        <p>Conteudo exclusivo para maiores de 18 anos. Jogue com moderacao.</p>
      </footer>
    </main>
  );
}
