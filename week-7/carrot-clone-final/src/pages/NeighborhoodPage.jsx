import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { updateMyNeighborhood } from "../lib/api";
import { useSession } from "../lib/session";
import { setSavedNeighborhood } from "../lib/neighborhoodStorage";
import { PATHS } from "../routes/paths";

function pickNeighborhoodFromAddress(address) {
  if (!address) return "";

  const candidates = [
    address.suburb,
    address.neighbourhood,
    address.city_district,
    address.residential,
    address.village,
    address.town,
    address.city,
    address.municipality,
  ];

  const pick = candidates.find((value) => typeof value === "string" && value.trim());
  if (pick) return pick.trim();

  const fallback = [address.county, address.state].filter(Boolean).join(" ");
  return fallback.trim();
}

export default function NeighborhoodPage() {
  const { user, profile, loading, refreshProfile } = useSession();
  const navigate = useNavigate();
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);

  useEffect(() => {
    setNeighborhood(profile?.neighborhood || "");
  }, [profile?.neighborhood]);

  if (!loading && !user) return <Navigate to={PATHS.login} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await updateMyNeighborhood(neighborhood);
      setSavedNeighborhood(neighborhood);
      await refreshProfile();
      navigate(PATHS.home, { replace: true });
    } catch (err) {
      setSavedNeighborhood(neighborhood);
      try {
        await refreshProfile();
      } catch {
        // keep local fallback
      }
      setNotice("서버 동기화는 잠시 실패했지만, 동네는 브라우저에 저장했어요.");
      if (!String(err?.message || "").includes("PGRST002")) {
        setError(err.message);
      }
      navigate(PATHS.home, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function fillFromCurrentLocation() {
    setError("");
    setNotice("");

    if (!navigator.geolocation) {
      setError("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }

    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ko`
          );

          if (!response.ok) {
            throw new Error("현재 위치를 동네로 변환하지 못했습니다.");
          }

          const data = await response.json();
          const nextNeighborhood = pickNeighborhoodFromAddress(data.address) || data.name || "";

          if (!nextNeighborhood) {
            throw new Error("현재 위치에서 동네 정보를 찾지 못했습니다.");
          }

          setNeighborhood(nextNeighborhood);
          setSavedNeighborhood(nextNeighborhood);
          setNotice("현재 위치를 동네 입력칸에 반영했어요. 필요하면 직접 수정할 수 있어요.");
        } catch (err) {
          setError(err.message || "현재 위치를 불러오지 못했습니다.");
        } finally {
          setGeoBusy(false);
        }
      },
      () => {
        setError("위치 권한이 거부되었거나 현재 위치를 가져오지 못했습니다.");
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  return (
    <section className="auth-card">
      <h2>동네 입력</h2>
      <p className="small">예: 역삼동, 성수동, 잠실동</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          내 동네
          <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="동네를 직접 입력" required />
        </label>
        <button type="button" className="ghost-btn full-width" onClick={fillFromCurrentLocation} disabled={geoBusy}>
          {geoBusy ? "위치 확인 중..." : "현재 위치로 자동 입력"}
        </button>
        {notice && <p className="success">{notice}</p>}
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </section>
  );
}
