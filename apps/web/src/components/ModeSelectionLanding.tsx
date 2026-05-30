interface ModeSelectionLandingProps {
  onSelectMode: (mode: 'long_term' | 'quick') => void
}

export function ModeSelectionLanding({ onSelectMode }: ModeSelectionLandingProps) {
  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1>🍔 EatOrNot</h1>
        <p>你的智能饮食决策助手</p>
      </div>

      <div className="landing-cards">
        <div className="landing-card" onClick={() => onSelectMode('long_term')}>
          <div className="landing-card-icon">📊</div>
          <h2>长期管理我的饮食</h2>
          <p>建立个人档案，追踪体重、预算、营养目标</p>
          <ul>
            <li>设定减脂/增肌/维持目标</li>
            <li>追踪每日热量和预算</li>
            <li>记录用餐历史</li>
            <li>个性化推荐</li>
          </ul>
          <button className="btn-landing">开始建档</button>
        </div>

        <div className="landing-card" onClick={() => onSelectMode('quick')}>
          <div className="landing-card-icon">⚡</div>
          <h2>就这顿帮我选一下</h2>
          <p>快速选择，无需注册，30秒搞定</p>
          <ul>
            <li>告诉我你的预算和心情</li>
            <li>3个方案即刻呈现</li>
            <li>无需建档</li>
            <li>快速下单</li>
          </ul>
          <button className="btn-landing btn-quick">快速选择</button>
        </div>
      </div>
    </div>
  )
}
