import React, { forwardRef } from 'react';
import { Brain, Heart, GraduationCap, Trophy, Target, Sparkles, MapPin, Building, Compass } from 'lucide-react';
import { resolveAvatarUrl } from '../utils/avatarUtils';

const DEEP = '#04302E';
const TEAL = '#09A3A3';
const PURPLE = '#6D5AE0';
const GOLD = '#E8B04B';

const LinkedInShareCard = forwardRef(({ user, dynamicCareers, personalityCode, dynamicRIASEC }, ref) => {
  const rawName = user?.name || 'Student';
  const fullName = rawName.includes('@') ? rawName.split('@')[0] : rawName;
  const hobbies = user?.hobbies || 'Reading, Technology'; 
  const interests = user?.interests || 'Problem Solving, Innovation'; 
  
  // Extract top traits based on personality code
  const topTraits = dynamicRIASEC 
    ? [...dynamicRIASEC].sort((a, b) => b.score - a.score).slice(0, 3).map(d => d.label)
    : ['Organized', 'Detail Oriented', 'Structured'];

  return (
    <div
      ref={ref}
      style={{
        width: '640px',
        background: '#FFFFFF',
        color: DEEP,
        fontFamily: "'Inter', sans-serif",
        borderRadius: '24px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(4,48,46,0.15)',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {/* Header Band */}
      <div style={{
        background: `linear-gradient(90deg, ${DEEP} 0%, #0a4f4c 100%)`,
        padding: '30px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${TEAL}, ${PURPLE})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: '800',
            fontFamily: "'Sora', sans-serif",
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            border: '2px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}>
            {(user?.profilePhoto || user?.avatar) ? (
              <img src={resolveAvatarUrl(user?.avatar || user?.profilePhoto) || user?.profilePhoto || user?.avatar} crossOrigin="anonymous" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              fullName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '26px', fontWeight: '800', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.5px' }}>
              {fullName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                Career Readiness Report
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <Sparkles size={20} color={GOLD} />
            <span style={{ fontSize: '22px', fontWeight: '800', fontFamily: "'Sora', sans-serif", color: 'white' }}>SkillSense</span>
          </div>
          <span style={{ fontSize: '10px', fontWeight: '700', color: TEAL, letterSpacing: '1px', textTransform: 'uppercase' }}>
            AI Powered Assessment
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div style={{ padding: '40px' }}>
        
        {/* Top Stats Strip */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          <div style={{ flex: 1, background: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${PURPLE}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={24} color={PURPLE} />
            </div>
            <div>
              <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Personality</p>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', fontFamily: "'Sora', sans-serif", color: PURPLE }}>{personalityCode}</p>
            </div>
          </div>

          <div style={{ flex: 1, background: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={24} color={TEAL} />
            </div>
            <div>
              <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aptitude Match</p>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', fontFamily: "'Sora', sans-serif", color: DEEP }}>96%</p>
            </div>
          </div>
        </div>

        {/* Traits */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700', color: DEEP, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Key Strengths
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {topTraits.map((trait, idx) => (
              <div key={idx} style={{
                background: 'white',
                border: `1px solid ${TEAL}40`,
                padding: '8px 16px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: '600',
                color: TEAL,
                boxShadow: '0 2px 4px rgba(9,163,163,0.05)'
              }}>
                {trait}
              </div>
            ))}
          </div>
        </div>

        {/* Top Careers Grid */}
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '700', color: DEEP, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Top Recommended Careers
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {(dynamicCareers || []).slice(0, 6).map((career, idx) => (
              <div key={idx} style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                padding: '16px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '8px', 
                  background: `${idx % 2 === 0 ? TEAL : PURPLE}15`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: idx % 2 === 0 ? TEAL : PURPLE,
                  fontWeight: '700', fontSize: '12px'
                }}>
                  {idx + 1}
                </div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', lineHeight: '1.4', color: DEEP, flex: 1 }}>
                  {career.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#F8FAFC', padding: '24px 40px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#64748B' }}>
          Find your perfect career path at <strong style={{ color: TEAL }}>careerguide.aisense.co.in</strong>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>🚀</span>
          <span style={{ fontSize: '12px', fontWeight: '800', color: DEEP, letterSpacing: '1px' }}>
            VERA AI
          </span>
        </div>
      </div>
    </div>
  );
});

export default LinkedInShareCard;
