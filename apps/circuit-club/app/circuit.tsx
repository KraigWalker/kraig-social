import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { Link, useLocation } from "react-router";

type MediaKind = "photo" | "video";

type ProfileMedia = {
  id: string;
  kind: MediaKind;
  url: string;
};

type Profile = {
  id: string;
  handle: string;
  age: number;
  pronouns: string;
  distance: string;
  cell: string;
  x: number;
  y: number;
  status: string;
  tags: string[];
  trust: number;
  response: string;
  media: ProfileMedia[];
};

type Message = {
  id: string;
  profileId: string;
  direction: "sent" | "received";
  body: string;
  at: string;
};

type Report = {
  id: string;
  profileId: string;
  reason: string;
  detail: string;
  action: string;
};

type OwnProfile = {
  handle: string;
  pronouns: string;
  status: string;
  tags: string;
  media: ProfileMedia[];
};

type LocationProof = {
  cell: string;
  ring: number;
  updatedAt: string;
};

const storageKeys = {
  ownProfile: "circuit-club:own-profile",
  favourites: "circuit-club:favourites",
  messages: "circuit-club:messages",
  reports: "circuit-club:reports",
  locationProof: "circuit-club:location-proof",
};

const defaultOwnProfile: OwnProfile = {
  handle: "you.local",
  pronouns: "he / him",
  status: "Looking for coffee, chat, and safer scene tech.",
  tags: "consent-first, community, encrypted",
  media: [],
};

export const profiles: Profile[] = [
  {
    id: "mika",
    handle: "Mika",
    age: 31,
    pronouns: "he / him",
    distance: "same cell",
    cell: "CC-9Q8-NE",
    x: 50,
    y: 30,
    status: "After-work lift, late food, no blank profiles.",
    tags: ["verified", "coffee", "trans inclusive"],
    trust: 94,
    response: "Usually replies after 19:00",
    media: [{ id: "mika-photo", kind: "photo", url: "linear-gradient(135deg, #f05d5e, #ffd166)" }],
  },
  {
    id: "drew",
    handle: "Drew",
    age: 28,
    pronouns: "he / they",
    distance: "nearby cell",
    cell: "CC-9Q8-E",
    x: 72,
    y: 44,
    status: "Into sober nights, film clubs, and mutual aid.",
    tags: ["favourited by friends", "sober", "film"],
    trust: 89,
    response: "Open to new chats",
    media: [{ id: "drew-photo", kind: "photo", url: "linear-gradient(135deg, #06d6a0, #118ab2)" }],
  },
  {
    id: "sol",
    handle: "Sol",
    age: 35,
    pronouns: "he / him",
    distance: "2 cells",
    cell: "CC-9Q8-SW",
    x: 31,
    y: 56,
    status: "Pool, house music, and calm direct messages.",
    tags: ["event host", "music", "clear boundaries"],
    trust: 97,
    response: "Fast replies",
    media: [{ id: "sol-photo", kind: "photo", url: "linear-gradient(135deg, #8338ec, #ffbe0b)" }],
  },
  {
    id: "ash",
    handle: "Ash",
    age: 42,
    pronouns: "he / him",
    distance: "3 cells",
    cell: "CC-9Q9-N",
    x: 61,
    y: 72,
    status: "Board games, safer cruising policy, and local venue policy.",
    tags: ["mentor", "board games", "policy"],
    trust: 91,
    response: "Replies selectively",
    media: [{ id: "ash-photo", kind: "photo", url: "linear-gradient(135deg, #2ec4b6, #e71d36)" }],
  },
  {
    id: "noor",
    handle: "Noor",
    age: 26,
    pronouns: "he / him",
    distance: "4 cells",
    cell: "CC-9Q9-S",
    x: 43,
    y: 43,
    status: "Gym, galleries, and direct consent-first chat.",
    tags: ["new", "gym", "gallery"],
    trust: 86,
    response: "New profile",
    media: [{ id: "noor-photo", kind: "photo", url: "linear-gradient(135deg, #68b0ff, #ff6f61)" }],
  },
  {
    id: "leo",
    handle: "Leo",
    age: 39,
    pronouns: "he / him",
    distance: "nearby cell",
    cell: "CC-9Q8-W",
    x: 58,
    y: 58,
    status: "Run club, queer history, no pressure.",
    tags: ["run club", "history", "low key"],
    trust: 93,
    response: "Usually replies mornings",
    media: [{ id: "leo-photo", kind: "photo", url: "linear-gradient(135deg, #ffd166, #118ab2)" }],
  },
];

const hexes = [
  { id: "CC-9Q8-NW", x: 33, y: 20, count: 1 },
  { id: "CC-9Q8-NE", x: 50, y: 20, count: 4 },
  { id: "CC-9Q8-E", x: 67, y: 35, count: 3 },
  { id: "CC-9Q8-SE", x: 67, y: 65, count: 2 },
  { id: "CC-9Q8-SW", x: 50, y: 80, count: 5 },
  { id: "CC-9Q8-W", x: 33, y: 65, count: 2 },
  { id: "CC-9Q9-N", x: 50, y: 50, count: 7 },
];

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const item = window.localStorage.getItem(key);
  if (!item) {
    return fallback;
  }

  try {
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function storeValue<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function nowLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function coarseCellFromCoordinates(latitude: number, longitude: number) {
  const latBucket = Math.floor((latitude + 90) * 8);
  const lonBucket = Math.floor((longitude + 180) * 8);
  const seed = (latBucket * 73856093) ^ (lonBucket * 19349663);
  const suffix = Math.abs(seed).toString(36).toUpperCase().slice(0, 5).padStart(5, "0");

  return `CC-${suffix}`;
}

function mediaStyle(media?: ProfileMedia) {
  void media;
  return undefined;
}

function useCircuitState() {
  const [ownProfile, setOwnProfile] = useState(() => loadStored(storageKeys.ownProfile, defaultOwnProfile));
  const [favourites, setFavourites] = useState<string[]>(() => loadStored(storageKeys.favourites, []));
  const [messages, setMessages] = useState<Message[]>(() => loadStored(storageKeys.messages, []));
  const [reports, setReports] = useState<Report[]>(() => loadStored(storageKeys.reports, []));
  const [locationProof, setLocationProof] = useState<LocationProof>(() =>
    loadStored(storageKeys.locationProof, {
      cell: "CC-DEMO",
      ring: 1,
      updatedAt: "demo mode",
    }),
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/circuit-club/sw.js").catch(() => undefined);
    }
  }, []);

  function updateOwnProfile(nextProfile: OwnProfile) {
    setOwnProfile(nextProfile);
    storeValue(storageKeys.ownProfile, nextProfile);
  }

  function toggleFavourite(profileId: string) {
    const nextFavourites = favourites.includes(profileId)
      ? favourites.filter((id) => id !== profileId)
      : [...favourites, profileId];
    setFavourites(nextFavourites);
    storeValue(storageKeys.favourites, nextFavourites);
  }

  function addMessage(profileId: string, body: string) {
    const nextMessages = [
      ...messages,
      {
        id: crypto.randomUUID(),
        profileId,
        direction: "sent" as const,
        body,
        at: nowLabel(),
      },
      {
        id: crypto.randomUUID(),
        profileId,
        direction: "received" as const,
        body: "Encrypted delivery receipt stored locally for this demo.",
        at: nowLabel(),
      },
    ];
    setMessages(nextMessages);
    storeValue(storageKeys.messages, nextMessages);
  }

  function addReport(report: Omit<Report, "id" | "action">) {
    const nextReports = [
      {
        ...report,
        id: crypto.randomUUID(),
        action: "Queued for rotating peer review",
      },
      ...reports,
    ];
    setReports(nextReports);
    storeValue(storageKeys.reports, nextReports);
  }

  function updateLocationProof(proof: LocationProof) {
    setLocationProof(proof);
    storeValue(storageKeys.locationProof, proof);
  }

  return {
    ownProfile,
    updateOwnProfile,
    favourites,
    toggleFavourite,
    messages,
    addMessage,
    reports,
    addReport,
    locationProof,
    updateLocationProof,
  };
}

export function AppFrame({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navItems = [
    { to: "/discover", label: "Nearby" },
    { to: "/messages", label: "Messages" },
    { to: "/profile", label: "Profile" },
    { to: "/moderation", label: "Safety" },
  ];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="app-frame">
        <aside className="side-rail" aria-label="CircuitClub navigation">
          <Link className="brand" to="/discover" aria-label="CircuitClub nearby">
            <span className="brand-mark" aria-hidden="true">CC</span>
            <span>
              <strong>CircuitClub</strong>
              <small>coarse-grid lab</small>
            </span>
          </Link>
          <nav>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={location.pathname.endsWith(item.to) ? "nav-link nav-link--active" : "nav-link"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="rail-note">
            <strong>Demo posture</strong>
            <span>No third-party domains</span>
            <span>Installable PWA</span>
          </div>
        </aside>
        <main id="main-content" className="view-shell">
          {children}
        </main>
      </div>
    </>
  );
}

export function DiscoverView() {
  const {
    favourites,
    toggleFavourite,
    locationProof,
    updateLocationProof,
  } = useCircuitState();
  const [selectedId, setSelectedId] = useState(profiles[0].id);
  const [locationStatus, setLocationStatus] = useState("Using demo cell until location is requested.");
  const selectedProfile = profiles.find((profile) => profile.id === selectedId) ?? profiles[0];

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not available in this browser.");
      return;
    }

    setLocationStatus("Requesting browser location for local cell derivation.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocationProof({
          cell: coarseCellFromCoordinates(position.coords.latitude, position.coords.longitude),
          ring: Math.max(1, Math.min(4, Math.round(position.coords.accuracy / 150))),
          updatedAt: nowLabel(),
        });
        setLocationStatus("Precise coordinates were discarded after deriving a coarse cell.");
      },
      () => setLocationStatus("Location permission was declined. Demo cells are still available."),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 },
    );
  }

  return (
    <AppFrame>
      <section className="view-header">
        <div>
          <p className="eyebrow">Nearby</p>
          <h1>Profiles by privacy-preserving cells</h1>
        </div>
        <button className="primary-action" type="button" onClick={requestLocation}>
          Use my area
        </button>
      </section>

      <section className="discover-layout" aria-label="Nearby profiles">
        <div className="profile-grid-panel">
          <div className="cell-summary">
            <strong>{locationProof.cell}</strong>
            <span>ring {locationProof.ring}</span>
            <span>{locationProof.updatedAt}</span>
          </div>
          <p className="quiet">{locationStatus}</p>
          <div className="profile-tile-grid">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={selectedId === profile.id ? "profile-tile profile-tile--active" : "profile-tile"}
                onClick={() => setSelectedId(profile.id)}
              >
                <span className="tile-photo" style={mediaStyle(profile.media[0])}>
                  {profile.handle.slice(0, 1)}
                </span>
                <span className="tile-meta">
                  <strong>{profile.handle}, {profile.age}</strong>
                  <small>{profile.distance}</small>
                </span>
              </button>
            ))}
          </div>
          <svg className="mini-hex-map" viewBox="0 0 100 100" role="img" aria-label="Nearby coarse hex cells">
            {hexes.map((hex) => (
              <g key={hex.id}>
                <polygon
                  points={`${hex.x},${hex.y - 15} ${hex.x + 13},${hex.y - 7} ${hex.x + 13},${hex.y + 7} ${hex.x},${hex.y + 15} ${hex.x - 13},${hex.y + 7} ${hex.x - 13},${hex.y - 7}`}
                  className={hex.id === selectedProfile.cell ? "hex-cell hex-cell--active" : "hex-cell"}
                />
                <text x={hex.x} y={hex.y + 1} textAnchor="middle" className="hex-count">
                  {hex.count}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <ProfileDetail
          profile={selectedProfile}
          isFavourite={favourites.includes(selectedProfile.id)}
          onToggleFavourite={() => toggleFavourite(selectedProfile.id)}
        />
      </section>
    </AppFrame>
  );
}

function ProfileDetail({
  profile,
  isFavourite,
  onToggleFavourite,
}: {
  profile: Profile;
  isFavourite: boolean;
  onToggleFavourite: () => void;
}) {
  return (
    <aside className="profile-detail" aria-labelledby="selected-profile-heading">
      <div className="profile-visual" style={mediaStyle(profile.media[0])}>
        <span>{profile.handle.slice(0, 1)}</span>
      </div>
      <p className="eyebrow">{profile.distance} | {profile.cell}</p>
      <h2 id="selected-profile-heading">{profile.handle}, {profile.age}</h2>
      <p className="pronouns">{profile.pronouns}</p>
      <p>{profile.status}</p>
      <div className="tag-row">
        {profile.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="trust-meter">
        <span>Community trust</span>
        <strong>{profile.trust}%</strong>
      </div>
      <div className="detail-actions">
        <Link className="primary-action" to="/messages">
          Message
        </Link>
        <button className="secondary-action" type="button" onClick={onToggleFavourite}>
          {isFavourite ? "Saved" : "Favourite"}
        </button>
      </div>
      <p className="privacy-note">
        Profiles are rendered inside coarse cells with jittered placement. A production version should add H3
        resolution policy, k-anonymity thresholds, delayed refreshes, and anti-triangulation checks.
      </p>
    </aside>
  );
}

export function MessagesView() {
  const { messages, addMessage, favourites } = useCircuitState();
  const firstProfile = profiles.find((profile) => favourites.includes(profile.id)) ?? profiles[0];
  const [selectedId, setSelectedId] = useState(firstProfile.id);
  const [draft, setDraft] = useState("");
  const selectedProfile = profiles.find((profile) => profile.id === selectedId) ?? firstProfile;
  const selectedMessages = messages.filter((message) => message.profileId === selectedProfile.id);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) {
      return;
    }
    addMessage(selectedProfile.id, body);
    setDraft("");
  }

  return (
    <AppFrame>
      <section className="view-header">
        <div>
          <p className="eyebrow">Messages</p>
          <h1>Encrypted chat concept</h1>
        </div>
      </section>
      <section className="messages-layout">
        <aside className="thread-list" aria-label="Conversations">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={selectedId === profile.id ? "thread-item thread-item--active" : "thread-item"}
              onClick={() => setSelectedId(profile.id)}
            >
              <span className="thread-avatar" style={mediaStyle(profile.media[0])}>{profile.handle.slice(0, 1)}</span>
              <span>
                <strong>{profile.handle}</strong>
                <small>{profile.response}</small>
              </span>
            </button>
          ))}
        </aside>
        <article className="chat-panel">
          <header className="chat-header">
            <div>
              <h2>{selectedProfile.handle}</h2>
              <p>{selectedProfile.cell} | {selectedProfile.distance}</p>
            </div>
            <span className="status-pill">E2E design target</span>
          </header>
          <div className="message-stack" aria-live="polite">
            {selectedMessages.length > 0 ? (
              selectedMessages.map((message) => (
                <div key={message.id} className={`message-bubble message-bubble--${message.direction}`}>
                  <p>{message.body}</p>
                  <span>{message.at}</span>
                </div>
              ))
            ) : (
              <p className="quiet">Start a demo message with {selectedProfile.handle}.</p>
            )}
          </div>
          <form className="message-form" onSubmit={sendMessage}>
            <input
              aria-label={`Message ${selectedProfile.handle}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a text message"
            />
            <button type="submit">Send</button>
          </form>
          <p className="privacy-note">
            Production direction: X25519 session setup, Double Ratchet-style forward secrecy, and peer relay fallback
            when direct transport is unavailable.
          </p>
        </article>
      </section>
    </AppFrame>
  );
}

export function ProfileView() {
  const { ownProfile, updateOwnProfile, favourites, toggleFavourite } = useCircuitState();
  const visibleTags = useMemo(
    () =>
      ownProfile.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [ownProfile.tags],
  );
  const favouriteProfiles = profiles.filter((profile) => favourites.includes(profile.id));

  function handleMediaUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    if (files.length === 0) {
      return;
    }

    const nextMedia = files.map((file) => ({
      id: crypto.randomUUID(),
      kind: file.type.startsWith("video/") ? "video" as const : "photo" as const,
      url: URL.createObjectURL(file),
    }));
    updateOwnProfile({ ...ownProfile, media: [...nextMedia, ...ownProfile.media].slice(0, 6) });
  }

  return (
    <AppFrame>
      <section className="view-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Your local profile</h1>
        </div>
      </section>
      <section className="profile-route-layout">
        <article className="tool-panel">
          <form className="profile-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              Handle
              <input value={ownProfile.handle} onChange={(event) => updateOwnProfile({ ...ownProfile, handle: event.target.value })} />
            </label>
            <label>
              Pronouns
              <input value={ownProfile.pronouns} onChange={(event) => updateOwnProfile({ ...ownProfile, pronouns: event.target.value })} />
            </label>
            <label>
              Status
              <textarea value={ownProfile.status} onChange={(event) => updateOwnProfile({ ...ownProfile, status: event.target.value })} />
            </label>
            <label>
              Tags
              <input value={ownProfile.tags} onChange={(event) => updateOwnProfile({ ...ownProfile, tags: event.target.value })} />
            </label>
            <label className="file-input">
              Add photos or videos
              <input type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} />
            </label>
          </form>
        </article>
        <aside className="profile-preview">
          <div className="profile-visual">
            <span>{ownProfile.handle.slice(0, 1).toUpperCase()}</span>
          </div>
          <h2>{ownProfile.handle}</h2>
          <p className="pronouns">{ownProfile.pronouns}</p>
          <p>{ownProfile.status}</p>
          <div className="tag-row">
            {visibleTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </aside>
        <article className="tool-panel favourites-panel">
          <h2>Favourites</h2>
          <div className="favourite-list">
            {favouriteProfiles.length > 0 ? (
              favouriteProfiles.map((profile) => (
                <button key={profile.id} type="button" onClick={() => toggleFavourite(profile.id)}>
                  <span>{profile.handle}</span>
                  <small>Remove</small>
                </button>
              ))
            ) : (
              <p className="quiet">No favourites yet. Save profiles from Nearby.</p>
            )}
          </div>
        </article>
      </section>
    </AppFrame>
  );
}

export function ModerationView() {
  const { reports, addReport } = useCircuitState();
  const [selectedId, setSelectedId] = useState(profiles[0].id);
  const [reportDraft, setReportDraft] = useState({ reason: "Boundary violation", detail: "" });
  const selectedProfile = profiles.find((profile) => profile.id === selectedId) ?? profiles[0];

  function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addReport({
      profileId: selectedProfile.id,
      reason: reportDraft.reason,
      detail: reportDraft.detail.trim() || "No extra detail supplied.",
    });
    setReportDraft({ reason: "Boundary violation", detail: "" });
  }

  return (
    <AppFrame>
      <section className="view-header">
        <div>
          <p className="eyebrow">Safety</p>
          <h1>Community review queue</h1>
        </div>
      </section>
      <section className="moderation-layout">
        <article className="tool-panel">
          <form className="profile-form" onSubmit={submitReport}>
            <label>
              Profile
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.handle}</option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <select value={reportDraft.reason} onChange={(event) => setReportDraft({ ...reportDraft, reason: event.target.value })}>
                <option>Boundary violation</option>
                <option>Spam or scam</option>
                <option>Harassment</option>
                <option>Impersonation</option>
              </select>
            </label>
            <label>
              Context
              <textarea
                value={reportDraft.detail}
                onChange={(event) => setReportDraft({ ...reportDraft, detail: event.target.value })}
                placeholder={`Describe what happened with ${selectedProfile.handle}`}
              />
            </label>
            <button className="primary-action" type="submit">Submit review item</button>
          </form>
        </article>
        <aside className="review-list-panel">
          <h2>Recent review items</h2>
          <div className="review-list">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id}>
                  <strong>{report.reason}</strong>
                  <span>{report.action}</span>
                </div>
              ))
            ) : (
              <p className="quiet">The local review queue is empty.</p>
            )}
          </div>
        </aside>
      </section>
    </AppFrame>
  );
}
