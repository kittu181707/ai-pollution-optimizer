import { useEffect, useState } from 'react';
import { api } from '../api';
import { getUserId } from '../utils';
import { Leaf, Users } from 'lucide-react';
import type { AcceptedPlan } from '../types';

export function ImpactScreen() {
  const [personalPlans, setPersonalPlans] = useState<AcceptedPlan[]>([]);
  const [community, setCommunity] = useState({ totalPlans: 0, totalCo2eSaved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const userId = await getUserId();
        const [histRes, commRes] = await Promise.all([
          api.history(userId),
          api.communityImpact(),
        ]);
        setPersonalPlans(histRes.plans);
        setCommunity(commRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const verifiedPlans = personalPlans.filter((plan) => plan.workflow.dataMode !== 'demo');
  const myCo2e = verifiedPlans.reduce((sum, p) => {
    return sum + (p.metrics?.estimatedCo2eChangeKg ? Math.max(0, -p.metrics.estimatedCo2eChangeKg) : 0);
  }, 0);

  const myExposure = verifiedPlans.reduce((sum, p) => {
    const orig = p.metrics?.originalExposureIndex || 0;
    const opt = p.metrics?.optimizedExposureIndex || 0;
    return sum + Math.max(0, orig - opt);
  }, 0);

  if (loading) return <div className="screen narrow">Loading impact...</div>;

  return (
    <div className="screen narrow with-nav">
      <div className="screen-title">
        <p className="eyebrow">YOUR IMPACT</p>
        <h1>Making a difference</h1>
        <p>Estimated changes in modeled exposure and CO₂e; demonstration plans are excluded from impact.</p>
      </div>

      <section className="impact-section">
        <h2><Leaf size={20} color="var(--green)" /> Personal Impact</h2>
        <div className="metric-grid">
          <div>
            <span>Plans Accepted</span>
            <strong>{personalPlans.length}</strong>
          </div>
          <div>
            <span>Estimated CO₂e Saved</span>
            <strong>{myCo2e.toFixed(1)} kg</strong>
          </div>
          <div>
            <span>Exposure Reduced (Score)</span>
            <strong>{myExposure.toFixed(0)}</strong>
          </div>
        </div>
      </section>

      <section className="impact-section" style={{ marginTop: '40px' }}>
        <h2><Users size={20} color="var(--green)" /> Community Impact</h2>
        <div className="metric-grid">
          <div>
            <span>Total Plans Accepted</span>
            <strong>{community.totalPlans}</strong>
          </div>
          <div>
            <span>Total Estimated CO₂e Saved</span>
            <strong>{community.totalCo2eSaved.toFixed(1)} kg</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
