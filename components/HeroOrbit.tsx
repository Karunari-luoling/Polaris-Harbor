import React from 'react';

// 头像作为行星系统的中心，六颗行星沿不同半径、不同周期公转。
// 行星的明暗由 .planet-light 反向补光：无论走到轨道哪一侧，受光面始终朝向中心。
// 土星环拆成远近两层：远侧被星体遮住，近侧覆在星面之上，环才像套在行星上。
// 类名写成完整字面量，Tailwind 的内容扫描才不会把 modifier 样式裁掉。
const PLANETS = [
  { id: 'mercury', className: 'planet-orbit--mercury' },
  { id: 'venus', className: 'planet-orbit--venus' },
  { id: 'earth', className: 'planet-orbit--earth' },
  { id: 'mars', className: 'planet-orbit--mars' },
  { id: 'jupiter', className: 'planet-orbit--jupiter' },
  { id: 'saturn', className: 'planet-orbit--saturn' },
] as const;

interface HeroOrbitProps {
  avatar: string;
  name: string;
}

const HeroOrbit: React.FC<HeroOrbitProps> = ({ avatar, name }) => (
  <div className="orbit-stage">
    <div className="planet-system" aria-hidden="true">
      {PLANETS.map(planet => (
        <div key={planet.id} className={`planet-orbit ${planet.className}`}>
          <span className="planet-track" />
          <div className="planet-node">
            <div className="planet-counter">
              {planet.id === 'saturn' && (
                <>
                  <span className="planet-ring" />
                  <span className="planet-ring planet-ring--front" />
                </>
              )}
              <div className="planet-body">
                <span className="planet-light-frame">
                  <span className="planet-light" />
                </span>
              </div>
              {planet.id === 'earth' && (
                <span className="planet-moon-orbit">
                  <span className="planet-moon" />
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="avatar-core">
      <img className="avatar-face" src={avatar} alt={`${name} 的头像`} />
    </div>
  </div>
);

export default HeroOrbit;
